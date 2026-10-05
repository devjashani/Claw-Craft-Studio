import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getOrder, verifyOrderAccess } from "@/lib/orders/order-service";
import { getAdminSession } from "@/lib/auth/admin-auth";
import { formatINR } from "@/lib/utils";
import { formatISTDate } from "@/lib/pdf/order-slip";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { OrderActions } from "@/components/order/order-actions";
import { OrderAccessGate } from "@/components/order/order-access-gate";
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  ArrowRight,
  CreditCard,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface OrderPageProps {
  params: { id: string };
  searchParams: { t?: string };
}

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderPageProps) {
  const { id } = params;
  const token = searchParams?.t;

  // 1. Fetch Order and Items from unified data layer
  const { order, items, isDemo } = await getOrder(id);

  if (!order) {
    notFound();
  }

  order.items = items;
  order.isDemo = isDemo;

  // 2. Check Admin Session & Access Control
  const adminSession = await getAdminSession();
  const isAdmin = Boolean(adminSession);

  const access = verifyOrderAccess(order, token, null, isAdmin);
  if (!access.allowed) {
    return <OrderAccessGate orderIdentifier={order.order_number || id} />;
  }

  const isPaid = order.payment_status === "paid" || order.status === "paid";
  const isPending = order.payment_status === "pending_payment" || order.status === "pending_payment";
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  // Neutral fulfillment steps
  const steps = [
    { label: "Order received", status: "paid" },
    { label: "Preparing", status: "processing" },
    { label: "Shipped", status: "shipped" },
    { label: "Delivered", status: "delivered" },
  ];

  const currentStepIndex =
    order.status === "delivered"
      ? 3
      : order.status === "shipped"
      ? 2
      : order.status === "processing"
      ? 1
      : 0;

  const trackingId = order.tracking_id || order.tracking_number;

  return (
    <div className="min-h-screen bg-void py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Visible Demo Order Banner */}
        {isDemo && (
          <div className="p-3.5 rounded-sm bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>DEMO ORDER</strong> — No payment was taken. This preview order was generated in demo mode.
            </span>
          </div>
        )}

        {/* Confirmation Header Banner */}
        <div
          className={`relative p-8 rounded-sm border-2 text-center shadow-2xl ${
            isCancelled
              ? "border-blood/50 bg-ash/90 shadow-blood"
              : isPending
              ? "border-amber-500/50 bg-ash/90 shadow-amber-500/20"
              : "border-acid/50 bg-ash/90 shadow-acid"
          }`}
        >
          <FiligreeCorner position="top-left" size={28} variant="acid" />
          <FiligreeCorner position="top-right" size={28} variant="acid" />

          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isCancelled
                ? "bg-blood/20 border border-blood text-blood"
                : isPending
                ? "bg-amber-500/20 border border-amber-500 text-amber-400"
                : "bg-acid/20 border border-acid text-acid"
            }`}
          >
            {isCancelled ? (
              <AlertTriangle className="w-8 h-8" />
            ) : isPending ? (
              <Clock className="w-8 h-8" />
            ) : (
              <CheckCircle2 className="w-8 h-8" />
            )}
          </div>

          <div
            className={`font-mono text-xs uppercase tracking-widest mb-1 ${
              isCancelled ? "text-blood" : isPending ? "text-amber-400" : "text-acid"
            }`}
          >
            {isCancelled
              ? "ORDER CANCELLED"
              : isPending
              ? "PAYMENT AUTHORIZATION PENDING"
              : "ORDER SECURED & LOGGED"}
          </div>

          <h1 className="text-3xl sm:text-5xl font-display uppercase tracking-tight text-bone mb-2">
            {isCancelled
              ? "ORDER NOT PROCESSED"
              : isPending
              ? "PAYMENT NOT COMPLETED"
              : "THANK YOU FOR YOUR RESERVATION"}
          </h1>

          <p className="font-mono text-sm text-steel mb-4">
            Order Reference:{" "}
            <strong className="text-acid font-bold">{order.order_number}</strong>
          </p>

          <p className="font-sans text-xs sm:text-sm text-steel/80 max-w-xl mx-auto leading-relaxed">
            {isCancelled ? (
              "This order has been cancelled or refunded. If you have questions, please reach out to our studio support."
            ) : isPending ? (
              "Payment for this reservation was not finalized. You can retry checkout to secure your handcrafted artifact before reservation holds expire."
            ) : order.email_sent_at ? (
              <>
                A confirmation email has been dispatched to{" "}
                <strong className="text-bone">{order.customer_email}</strong>. Our
                studio artisan is preparing your piece.
              </>
            ) : (
              <>
                We will email a confirmation to{" "}
                <strong className="text-bone">{order.customer_email}</strong> once your order is processed.
              </>
            )}
          </p>

          {/* Pending Payment Retry Action */}
          {isPending && (
            <div className="mt-6 flex justify-center">
              <Link href="/checkout">
                <ClawButton variant="primary" size="md">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry Payment / Checkout
                </ClawButton>
              </Link>
            </div>
          )}
        </div>

        {/* Action Bar (Download Receipt PDF & Print) */}
        <div className="p-4 rounded-sm border border-steel/20 bg-ash/50 flex flex-wrap items-center justify-between gap-4">
          <div className="font-mono text-xs text-steel">
            Official studio proof of purchase & transaction summary
          </div>
          <OrderActions order={order} token={token || order.public_token} />
        </div>

        {/* Status Stepper */}
        {!isCancelled && (
          <div className="p-6 rounded-sm border border-steel/20 bg-ash/50">
            <h2 className="font-display uppercase text-lg text-bone mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-acid" /> LIVE FULFILLMENT STATUS
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {steps.map((s, idx) => {
                const isPast = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div
                    key={s.label}
                    className={`p-4 rounded-sm border text-center font-mono text-xs ${
                      isCurrent
                        ? "border-acid bg-acid/10 text-bone shadow-acid"
                        : isPast
                        ? "border-steel/40 bg-void/50 text-steel"
                        : "border-steel/10 bg-void/20 text-steel/40"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full mx-auto mb-2 flex items-center justify-center text-[10px] font-bold ${
                        isPast ? "bg-acid text-void" : "bg-steel/20 text-steel"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="block font-bold">{s.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Courier & Tracking Section */}
            <div className="mt-6 p-4 rounded-sm bg-void border border-steel/20 text-xs font-mono">
              {order.courier_name && trackingId ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-steel">
                    Courier: <strong className="text-bone">{order.courier_name}</strong> • Tracking ID:{" "}
                    <strong className="text-acid">{trackingId}</strong>
                  </span>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-acid hover:underline font-bold"
                    >
                      Track Package →
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-steel/70 text-center">
                  Tracking details will be shared once your order ships.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Payment Verification Panel (Rendered only when Paid) */}
        {isPaid && (
          <div className="p-6 rounded-sm border border-steel/20 bg-ash/40 font-mono text-xs">
            <h3 className="font-display uppercase text-base text-bone mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-acid" /> AUTHORIZED PAYMENT RECORD
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-steel/60 block text-[10px] uppercase">Payment Method</span>
                <span className="text-bone font-bold uppercase">{order.payment_method}</span>
              </div>

              <div>
                <span className="text-steel/60 block text-[10px] uppercase">Amount Paid</span>
                <span className="text-acid font-bold">{formatINR(order.total_paise)}</span>
              </div>

              {order.razorpay_payment_id && (
                <div>
                  <span className="text-steel/60 block text-[10px] uppercase">Payment ID</span>
                  <span className="text-bone truncate block">{order.razorpay_payment_id}</span>
                </div>
              )}

              <div>
                <span className="text-steel/60 block text-[10px] uppercase">Paid Timestamp (IST)</span>
                <span className="text-bone">{formatISTDate(order.paid_at || order.created_at)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Order Details & Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Shipping Address */}
          <div className="p-6 rounded-sm border border-steel/20 bg-ash/40 font-mono text-xs">
            <h3 className="font-display uppercase text-base text-bone mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-acid" /> DELIVERY DESTINATION
            </h3>
            <p className="text-bone font-bold text-sm mb-1">{order.customer_name}</p>
            <p className="text-steel/80 leading-relaxed font-sans">
              {order.shipping_address_line1}
              {order.shipping_address_line2 ? `, ${order.shipping_address_line2}` : ""}
              <br />
              {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}
            </p>
            <p className="text-steel/70 mt-3">Phone: {order.customer_phone}</p>
            <p className="text-steel/70">Email: {order.customer_email}</p>
          </div>

          {/* Price Breakdown */}
          <div className="p-6 rounded-sm border border-steel/20 bg-ash/40 font-mono text-xs space-y-3">
            <h3 className="font-display uppercase text-base text-bone mb-3">
              FINANCIAL SUMMARY
            </h3>
            <div className="flex justify-between text-steel">
              <span>Subtotal</span>
              <span className="text-bone">{formatINR(order.subtotal_paise)}</span>
            </div>
            {order.discount_paise > 0 && (
              <div className="flex justify-between text-acid">
                <span>Coupon Discount</span>
                <span>-{formatINR(order.discount_paise)}</span>
              </div>
            )}
            <div className="flex justify-between text-steel">
              <span>Pan-India Shipping</span>
              <span>
                {order.shipping_fee_paise === 0
                  ? "FREE"
                  : formatINR(order.shipping_fee_paise)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-bone pt-3 border-t border-steel/20">
              <span className="font-display uppercase">Total Amount</span>
              <span className="text-acid">{formatINR(order.total_paise)}</span>
            </div>
          </div>
        </div>

        {/* Ordered Items Table */}
        <div className="border border-steel/20 bg-ash/30 rounded-sm divide-y divide-steel/10 p-6">
          <h3 className="font-display uppercase text-lg text-bone mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-acid" /> RESERVED ARTIFACTS
          </h3>

          {items.map((item) => (
            <div
              key={item.id}
              className="py-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-sm overflow-hidden bg-void border border-steel/20 shrink-0">
                  <Image
                    src={
                      item.image_url
                        ? item.image_url.endsWith(".jpg")
                          ? item.image_url.replace(".jpg", "-v2.png")
                          : item.image_url
                        : "/assets/products/placeholder-can-art.svg"
                    }
                    alt={item.product_title}
                    fill
                    sizes="64px"
                    className="object-cover object-center"
                  />
                </div>
                <div>
                  <h4 className="font-display uppercase text-base text-bone">
                    {item.product_title}
                  </h4>
                  {item.variant_label && (
                    <p className="font-mono text-xs text-steel">
                      Variant: <span className="text-bone">{item.variant_label}</span>
                      {item.selected_option ? ` • Option: ${item.selected_option}` : ""}
                    </p>
                  )}
                  <p className="font-mono text-xs text-steel">
                    Qty: {item.quantity} × {formatINR(item.unit_price_paise)}
                  </p>
                </div>
              </div>

              <div className="font-mono text-sm font-bold text-bone">
                {formatINR(item.total_price_paise)}
              </div>
            </div>
          ))}
        </div>

        {/* Mandatory Safety Notice */}
        <div className="p-4 rounded-sm border border-steel/20 bg-void text-center font-mono text-[11px] text-steel/80">
          <p>
            <strong>MANDATORY NOTICE:</strong> Handcrafted decorative display
            piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for
            children.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 print:hidden">
          <Link href="/shop">
            <ClawButton variant="secondary" size="md">
              Return to Catalog
            </ClawButton>
          </Link>

          <Link href="/track">
            <ClawButton variant="primary" size="md">
              Track Order Anytime <ArrowRight className="w-4 h-4 ml-2" />
            </ClawButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
