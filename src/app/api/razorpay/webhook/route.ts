import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  recordLastWebhookTimestamp,
  recordLastVerifiedPaymentTimestamp,
} from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendCustomerOrderConfirmationEmail,
  sendAdminOrderAlertEmail,
} from "@/lib/resend";
import { Order, OrderItem } from "@/types/shop";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      console.warn("[Razorpay Webhook] Received request without x-razorpay-signature header.");
      return NextResponse.json(
        { error: "Missing signature header." },
        { status: 400 }
      );
    }

    // 1. Verify Webhook Signature against Raw Body using Constant-Time Comparison
    const isValid = verifyWebhookSignature({ rawBody, signature });
    if (!isValid) {
      console.error("[Razorpay Webhook] Invalid webhook signature rejected.");
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const nowIso = new Date().toISOString();

    // Record webhook receipt timestamp
    await recordLastWebhookTimestamp(nowIso);

    const supabase = createAdminClient();

    // 2. Handle 'payment.captured' and 'order.paid'
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const rzpOrderId = payment?.order_id || event.payload?.order?.entity?.id;
      const rzpPaymentId = payment?.id;
      const notesOrderId = payment?.notes?.order_id || event.payload?.order?.entity?.notes?.order_id;

      if (rzpOrderId || notesOrderId) {
        // Find order in Supabase
        let query = supabase.from("orders").select("*");
        if (rzpOrderId) {
          query = query.eq("razorpay_order_id", rzpOrderId);
        } else {
          query = query.eq("id", notesOrderId);
        }

        const { data: dbOrder } = await query.maybeSingle();
        const order = dbOrder as unknown as Order | null;

        if (order) {
          // Idempotency: skip if already marked as paid
          if (order.payment_status === "paid" || order.status === "paid") {
            return NextResponse.json({ received: true, alreadyPaid: true });
          }

          // Verify amount if payment entity is present
          if (payment?.amount && Number(payment.amount) !== Number(order.total_paise)) {
            console.error(
              `[Razorpay Webhook Amount Mismatch] Order ${order.id}: expected ${order.total_paise} paise, webhook reported ${payment.amount} paise.`
            );
            return NextResponse.json(
              { error: "Payment amount does not match order total" },
              { status: 400 }
            );
          }

          // Extract non-sensitive payment metadata
          let paymentMeta: Record<string, unknown> = {};
          if (payment) {
            if (payment.method === "card" && payment.card) {
              paymentMeta = {
                method: "card",
                network: payment.card.network,
                last4: payment.card.last4,
                type: payment.card.type,
              };
            } else if (payment.method === "upi") {
              paymentMeta = {
                method: "upi",
                vpa: payment.vpa
                  ? payment.vpa.replace(/(.{2})(.*)(@.*)/, "$1***$3")
                  : undefined,
              };
            } else if (payment.method === "netbanking") {
              paymentMeta = {
                method: "netbanking",
                bank: payment.bank,
              };
            } else if (payment.method === "wallet") {
              paymentMeta = {
                method: "wallet",
                wallet: payment.wallet,
              };
            }
          }

          // Mark order paid even if customer closed browser after paying
          await supabase
            .from("orders")
            .update({
              status: "paid",
              payment_status: "paid",
              payment_method: payment?.method || order.payment_method || "razorpay",
              payment_meta: paymentMeta,
              paid_at: nowIso,
              razorpay_payment_id: rzpPaymentId || order.razorpay_payment_id,
              updated_at: nowIso,
            } as any)
            .eq("id", order.id);

          // Atomically decrement stock
          try {
            await (supabase.rpc as any)("decrement_stock_on_paid_order", {
              target_order_id: order.id,
            });
          } catch (err) {
            console.warn("[Webhook Stock Decrement Notice]:", err);
          }

          // Increment coupon usage
          if (order.coupon_id) {
            try {
              const { data: c } = await supabase
                .from("coupons")
                .select("times_used")
                .eq("id", order.coupon_id)
                .single();
              if (c) {
                await supabase
                  .from("coupons")
                  .update({ times_used: ((c as any).times_used || 0) + 1 } as any)
                  .eq("id", order.coupon_id);
              }
            } catch {
              // ignore
            }
          }

          await recordLastVerifiedPaymentTimestamp(nowIso);

          // Fetch items and send emails
          const { data: dbItems } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", order.id);

          const items = (dbItems as unknown as OrderItem[]) || [];

          sendCustomerOrderConfirmationEmail({ order, items })
            .then(async () => {
              try {
                await supabase
                  .from("orders")
                  .update({ email_sent_at: new Date().toISOString() } as any)
                  .eq("id", order.id);
              } catch {
                // ignore
              }
            })
            .catch((err) => console.error("[Webhook Email Error]:", err));

          sendAdminOrderAlertEmail({ order, items }).catch((err) =>
            console.error("[Webhook Admin Alert Error]:", err)
          );
        }
      }
    }

    // 3. Handle 'payment.failed'
    if (eventType === "payment.failed") {
      const payment = event.payload?.payment?.entity;
      const rzpOrderId = payment?.order_id;
      if (rzpOrderId) {
        const { data: existing } = await supabase
          .from("orders")
          .select("id, status, payment_status")
          .eq("razorpay_order_id", rzpOrderId)
          .maybeSingle();

        // Do not touch orders that are already paid
        if (existing && existing.status !== "paid" && existing.payment_status !== "paid") {
          const sanitizedReason = (
            payment.error_description ||
            payment.error_reason ||
            "Payment attempt declined"
          ).slice(0, 200);

          await supabase
            .from("orders")
            .update({
              status: "pending_payment", // KEEP pending_payment so customer can retry
              payment_status: "failed",
              admin_notes: `Payment failed: ${sanitizedReason}`,
              updated_at: nowIso,
            } as any)
            .eq("id", existing.id);
        }
      }
    }

    // 4. Handle 'refund.processed'
    if (eventType === "refund.processed") {
      const refund = event.payload?.refund?.entity;
      const paymentId = refund?.payment_id;
      if (paymentId) {
        const { data: existing } = await supabase
          .from("orders")
          .select("id, admin_notes")
          .eq("razorpay_payment_id", paymentId)
          .maybeSingle();

        if (existing) {
          const refundAmountInRupees = (refund.amount || 0) / 100;
          const note = `Refund processed: ₹${refundAmountInRupees} (ID: ${refund.id || ""})`;
          const combinedNotes = existing.admin_notes
            ? `${existing.admin_notes} | ${note}`
            : note;

          await supabase
            .from("orders")
            .update({
              status: "refunded",
              payment_status: "refunded",
              admin_notes: combinedNotes,
              updated_at: nowIso,
            } as any)
            .eq("id", existing.id);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Razorpay Webhook Error]:", error);
    return NextResponse.json(
      { error: "Webhook processing encountered an error." },
      { status: 500 }
    );
  }
}
