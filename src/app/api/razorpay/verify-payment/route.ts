import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaymentSignature, getRazorpayClient } from "@/lib/razorpay";
import {
  sendCustomerOrderConfirmationEmail,
  sendAdminOrderAlertEmail,
} from "@/lib/resend";
import { Order, OrderItem } from "@/types/shop";
import { getDemoOrder, saveDemoOrder } from "@/lib/orders/order-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!orderId || !razorpay_payment_id) {
      return NextResponse.json(
        { error: "Missing required payment verification details." },
        { status: 400 }
      );
    }

    // 1. Check Demo Order First
    if (orderId.startsWith("demo-") || orderId.startsWith("CC-DEMO-")) {
      const demo = getDemoOrder(orderId);
      if (demo) {
        demo.order.status = "paid";
        demo.order.payment_status = "paid";
        demo.order.paid_at = new Date().toISOString();
        demo.order.razorpay_payment_id = razorpay_payment_id;
        demo.order.razorpay_signature = razorpay_signature || "demo_signature";
        demo.order.payment_meta = {
          method: "card",
          card_network: "Visa",
          card_last4: "4242",
          demo: true,
        };
        saveDemoOrder(demo.order, demo.items);

        return NextResponse.json({
          verified: true,
          orderId: demo.order.id,
          orderNumber: demo.order.order_number,
        });
      }
    }

    // 2. Signature Verification for Real Razorpay Payments
    const isMock =
      process.env.RAZORPAY_KEY_SECRET === "placeholderSecret" ||
      razorpay_payment_id.startsWith("pay_test_mock_");

    let isSignatureValid = false;
    if (isMock) {
      isSignatureValid = true;
    } else {
      isSignatureValid = verifyPaymentSignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });
    }

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "Payment verification failed: Invalid signature." },
        { status: 400 }
      );
    }

    // 3. Fetch Order from Supabase
    const supabase = createAdminClient();
    const { data: dbOrder, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    const order = dbOrder as unknown as Order | null;

    if (!order) {
      return NextResponse.json(
        { error: "Order not found in database records." },
        { status: 404 }
      );
    }

    // Idempotency check: if already marked paid, return success immediately
    if (order.payment_status === "paid" || order.status === "paid") {
      return NextResponse.json({
        verified: true,
        orderId: order.id,
        orderNumber: order.order_number,
        alreadyPaid: true,
      });
    }

    // Retrieve non-sensitive payment metadata from Razorpay API if available
    let paymentMeta: Record<string, unknown> = {};
    let paymentMethod = order.payment_method || "razorpay";

    if (!isMock && !razorpay_payment_id.startsWith("pay_test_")) {
      try {
        const razorpay = getRazorpayClient();
        const paymentEntity: any = await razorpay.payments.fetch(razorpay_payment_id);
        if (paymentEntity) {
          paymentMethod = paymentEntity.method || paymentMethod;
          if (paymentEntity.method === "card" && paymentEntity.card) {
            paymentMeta = {
              method: "card",
              network: paymentEntity.card.network,
              last4: paymentEntity.card.last4,
              type: paymentEntity.card.type,
            };
          } else if (paymentEntity.method === "upi") {
            paymentMeta = {
              method: "upi",
              vpa: paymentEntity.vpa ? paymentEntity.vpa.replace(/(.{2})(.*)(@.*)/, "$1***$3") : undefined,
            };
          } else if (paymentEntity.method === "netbanking") {
            paymentMeta = {
              method: "netbanking",
              bank: paymentEntity.bank,
            };
          } else if (paymentEntity.method === "wallet") {
            paymentMeta = {
              method: "wallet",
              wallet: paymentEntity.wallet,
            };
          }
        }
      } catch (err) {
        console.warn("[Razorpay Fetch Payment Meta]:", err);
      }
    }

    const nowIso = new Date().toISOString();

    // Update Order Status to 'paid' with payment metadata
    await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        payment_method: paymentMethod,
        payment_meta: paymentMeta,
        paid_at: nowIso,
        razorpay_payment_id,
        razorpay_signature,
        updated_at: nowIso,
      } as any)
      .eq("id", order.id);

    // Decrement stock atomically via Postgres procedure
    try {
      await (supabase.rpc as any)("decrement_stock_on_paid_order", {
        target_order_id: order.id,
      });
    } catch (e) {
      console.warn("[Stock Decrement Procedure Notice]:", e);
    }

    // Increment coupon usage count if used
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

    // Fetch order items to send complete emails
    const { data: dbItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    const items = (dbItems as unknown as OrderItem[]) || [];

    // Send Emails asynchronously and record email_sent_at
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
      .catch((err) => console.error("Customer confirmation email error:", err));

    sendAdminOrderAlertEmail({ order, items }).catch((err) =>
      console.error("Admin order alert error:", err)
    );

    return NextResponse.json({
      verified: true,
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (error) {
    console.error("[Payment Verification Error]:", error);
    return NextResponse.json(
      { error: "Payment verification encountered a server error." },
      { status: 500 }
    );
  }
}
