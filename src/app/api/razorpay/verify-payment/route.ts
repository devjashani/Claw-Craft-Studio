import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyPaymentSignature,
  getRazorpayClient,
  recordLastVerifiedPaymentTimestamp,
  isPaymentSimulationAllowed,
} from "@/lib/razorpay";
import {
  sendCustomerOrderConfirmationEmail,
  sendAdminOrderAlertEmail,
} from "@/lib/resend";
import { Order, OrderItem } from "@/types/shop";
import { getDemoOrder, saveDemoOrder } from "@/lib/orders/order-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSiteHost, isProductionSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting per IP and per Order
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anonymous-client";

    const ipLimit = checkRateLimit(`verify-ip-${clientIp}`, 20, 60 * 1000);
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: "Too many payment verification requests. Please wait." },
        { status: 429 }
      );
    }

    // 2. Request Origin verification
    const origin = req.headers.get("origin") || req.headers.get("referer");
    const configuredHost = getSiteHost();
    if (origin && configuredHost && isProductionSite()) {
      try {
        const originUrl = new URL(origin);
        if (
          originUrl.host.toLowerCase() !== configuredHost.toLowerCase() &&
          !originUrl.host.toLowerCase().endsWith(`.${configuredHost.toLowerCase()}`)
        ) {
          console.warn(`[Payment Verify Origin Mismatch] Received origin ${originUrl.host}, expected ${configuredHost}`);
        }
      } catch {
        // ignore parse error
      }
    }

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

    // Per-order verification rate limiting
    const orderLimit = checkRateLimit(`verify-order-${orderId}`, 5, 60 * 1000);
    if (!orderLimit.success) {
      return NextResponse.json(
        { error: "Too many verification attempts for this order. Please refresh status." },
        { status: 429 }
      );
    }

    // 3. Handle Developer Simulation ONLY on Localhost with Explicit Flag
    const hostHeader = req.headers.get("host");
    const simulationAllowed = isPaymentSimulationAllowed(hostHeader);
    const isSimulatedPayment =
      razorpay_payment_id.startsWith("pay_sim_") ||
      razorpay_payment_id.startsWith("pay_test_mock_");

    if (isSimulatedPayment) {
      if (!simulationAllowed) {
        console.error(
          `[Payment Security Alert] Simulated payment attempt rejected in non-simulation environment from ${clientIp}.`
        );
        return NextResponse.json(
          { error: "Payment verification failed: Simulated payments are forbidden." },
          { status: 403 }
        );
      }

      // Handle demo memory store if demo order
      if (orderId.startsWith("demo-") || orderId.startsWith("CC-DEMO-")) {
        const demo = getDemoOrder(orderId);
        if (demo) {
          demo.order.status = "paid";
          demo.order.payment_status = "paid";
          demo.order.paid_at = new Date().toISOString();
          demo.order.razorpay_payment_id = razorpay_payment_id;
          saveDemoOrder(demo.order, demo.items);
          return NextResponse.json({
            verified: true,
            orderId: demo.order.id,
            orderNumber: demo.order.order_number,
            publicToken: demo.order.public_token,
          });
        }
      }
    }

    // 4. CONSTANT-TIME HMAC-SHA256 SIGNATURE VERIFICATION
    if (!isSimulatedPayment) {
      if (!razorpay_order_id || !razorpay_signature) {
        return NextResponse.json(
          { error: "Missing Razorpay order ID or cryptographic signature." },
          { status: 400 }
        );
      }

      const isSignatureValid = verifyPaymentSignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      if (!isSignatureValid) {
        console.error(
          `[Razorpay Signature Verification Failed] Order: ${orderId}, RazorpayOrder: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`
        );
        return NextResponse.json(
          { error: "Payment verification failed: Cryptographic signature mismatch." },
          { status: 400 }
        );
      }
    }

    // 5. Fetch Order from Supabase Database
    const supabase = createAdminClient();
    const { data: dbOrder } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    const order = dbOrder as unknown as Order | null;

    if (!order) {
      console.info("[Payment Verify] Order not found in studio database:", {
        orderId,
        razorpay_order_id,
        razorpay_payment_id,
      });
      return NextResponse.json(
        { verified: false, message: "Order not found", notFound: true },
        { status: 200 }
      );
    }

    // 6. IDEMPOTENCY CHECK: If already marked paid, return success immediately
    if (order.payment_status === "paid" || order.status === "paid") {
      return NextResponse.json({
        verified: true,
        orderId: order.id,
        orderNumber: order.order_number,
        publicToken: order.public_token,
        alreadyPaid: true,
      });
    }

    // Verify order ID correlation
    if (
      !isSimulatedPayment &&
      order.razorpay_order_id &&
      order.razorpay_order_id !== razorpay_order_id
    ) {
      console.error(
        `[Order Correlation Mismatch] DB razorpay_order_id (${order.razorpay_order_id}) does not match payload (${razorpay_order_id})`
      );
      return NextResponse.json(
        { error: "Payment verification failed: Razorpay order mismatch." },
        { status: 400 }
      );
    }

    // 7. SERVER-TO-SERVER RAZORPAY API FETCH & STRICT VALIDATION
    let paymentMethod = order.payment_method || "razorpay";
    let paymentMeta: Record<string, unknown> = {};

    if (!isSimulatedPayment) {
      try {
        const razorpay = getRazorpayClient();
        const paymentEntity: any = await razorpay.payments.fetch(razorpay_payment_id);

        if (!paymentEntity) {
          throw new Error("Razorpay returned null for payment entity.");
        }

        // REQUIRE status: captured
        if (paymentEntity.status !== "captured") {
          console.error(
            `[Payment Status Mismatch] Expected 'captured', got '${paymentEntity.status}' for payment ${razorpay_payment_id}`
          );
          return NextResponse.json(
            {
              error: `Payment is not captured (current status: ${paymentEntity.status}). Please check your payment status.`,
            },
            { status: 400 }
          );
        }

        // REQUIRE amount: equal to our order total in paise
        if (Number(paymentEntity.amount) !== Number(order.total_paise)) {
          console.error(
            `[Payment Amount Mismatch] Expected ${order.total_paise} paise, got ${paymentEntity.amount} paise for payment ${razorpay_payment_id}`
          );
          return NextResponse.json(
            { error: "Payment verification failed: Payment amount does not match order total." },
            { status: 400 }
          );
        }

        // REQUIRE currency: INR
        if (paymentEntity.currency !== "INR") {
          console.error(
            `[Payment Currency Mismatch] Expected 'INR', got '${paymentEntity.currency}' for payment ${razorpay_payment_id}`
          );
          return NextResponse.json(
            { error: "Payment verification failed: Currency mismatch." },
            { status: 400 }
          );
        }

        // REQUIRE matching order_id
        if (razorpay_order_id && paymentEntity.order_id !== razorpay_order_id) {
          console.error(
            `[Payment Order ID Mismatch] Expected ${razorpay_order_id}, got ${paymentEntity.order_id}`
          );
          return NextResponse.json(
            { error: "Payment verification failed: Order ID mismatch." },
            { status: 400 }
          );
        }

        // Extract sanitized non-sensitive metadata (NEVER store full cards or PAN)
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
            vpa: paymentEntity.vpa
              ? paymentEntity.vpa.replace(/(.{2})(.*)(@.*)/, "$1***$3")
              : undefined,
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
      } catch (fetchErr: any) {
        console.error(
          `[Razorpay API Payment Fetch Error] Failed to fetch payment ${razorpay_payment_id}:`,
          fetchErr?.message || fetchErr
        );
        return NextResponse.json(
          {
            error:
              "Could not verify payment with Razorpay servers. Please refresh in a moment.",
          },
          { status: 502 }
        );
      }
    }

    // 8. ONLY THEN MARK ORDER AS PAID
    const nowIso = new Date().toISOString();

    await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        payment_method: paymentMethod,
        payment_meta: paymentMeta,
        paid_at: nowIso,
        razorpay_payment_id,
        razorpay_signature: razorpay_signature || "simulated",
        updated_at: nowIso,
      } as any)
      .eq("id", order.id);

    // Atomically decrement stock via Postgres procedure
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

    // Record verified payment timestamp
    await recordLastVerifiedPaymentTimestamp(nowIso);

    // Fetch order items to send complete emails
    const { data: dbItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    const items = (dbItems as unknown as OrderItem[]) || [];

    // Send Customer and Admin Emails asynchronously
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
      .catch((err) => console.error("[Verify Email Error] Customer confirmation:", err));

    sendAdminOrderAlertEmail({ order, items }).catch((err) =>
      console.error("[Verify Email Error] Admin order alert:", err)
    );

    return NextResponse.json({
      verified: true,
      orderId: order.id,
      orderNumber: order.order_number,
      publicToken: order.public_token,
    });
  } catch (error) {
    console.error("[Payment Verification Server Exception]:", error);
    return NextResponse.json(
      { error: "Payment verification encountered a server error." },
      { status: 500 }
    );
  }
}
