import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
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
      return NextResponse.json(
        { error: "Missing signature header." },
        { status: 400 }
      );
    }

    // 1. Verify Webhook Signature
    const isValid = verifyWebhookSignature({ rawBody, signature });
    if (!isValid) {
      console.warn("[Razorpay Webhook] Invalid signature rejected.");
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    // Handle payment.captured or order.paid
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const payment = event.payload.payment.entity;
      const rzpOrderId = payment.order_id;
      const rzpPaymentId = payment.id;

      if (rzpOrderId) {
        const supabase = createAdminClient();
        const { data: dbOrder } = await supabase
          .from("orders")
          .select("*")
          .eq("razorpay_order_id", rzpOrderId)
          .single();

        const order = dbOrder as unknown as Order | null;

        if (order) {
          // Idempotency: skip if already marked as paid
          if (order.status !== "paid") {
            await supabase
              .from("orders")
              .update({
                status: "paid",
                razorpay_payment_id: rzpPaymentId,
                updated_at: new Date().toISOString(),
              } as any)
              .eq("id", order.id);

            // Decrement product stock
            try {
              await (supabase.rpc as any)("decrement_stock_on_paid_order", {
                target_order_id: order.id,
              });
            } catch (err) {
              console.warn("[Webhook Stock Decrement]:", err);
            }

            // Fetch items and send emails
            const { data: dbItems } = await supabase
              .from("order_items")
              .select("*")
              .eq("order_id", order.id);

            const items = (dbItems as unknown as OrderItem[]) || [];

            sendCustomerOrderConfirmationEmail({ order, items }).catch((err) =>
              console.error("[Webhook Email Error]:", err)
            );
            sendAdminOrderAlertEmail({ order, items }).catch((err) =>
              console.error("[Webhook Admin Alert Error]:", err)
            );
          }
        }
      }
    }

    // Handle payment failure
    if (eventType === "payment.failed") {
      const payment = event.payload.payment.entity;
      const rzpOrderId = payment.order_id;
      if (rzpOrderId) {
        const supabase = createAdminClient();
        await supabase
          .from("orders")
          .update({
            admin_notes: `Payment failed: ${payment.error_description || "Unknown error"}`,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("razorpay_order_id", rzpOrderId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Razorpay Webhook Error]:", error);
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 }
    );
  }
}
