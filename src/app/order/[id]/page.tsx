import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Order, OrderItem } from "@/types/shop";
import { formatINR } from "@/lib/utils";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Printer,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface OrderPageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: OrderPageProps) {
  const { id } = params;

  let order: Order | null = null;
  let items: OrderItem[] = [];

  try {
    const supabase = createAdminClient();
    const { data: dbOrder } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (dbOrder) {
      order = dbOrder as unknown as Order;

      const { data: dbItems } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      items = (dbItems as unknown as OrderItem[]) || [];
    }
  } catch {
    // ignore
  }

  // Fallback demo order for testing or preview
  if (!order) {
    order = {
      id,
      order_number: "CC-2026-TEST",
      status: "paid",
      customer_name: "Artisan Collector",
      customer_email: "collector@example.com",
      customer_phone: "9876543210",
      shipping_address_line1: "Sample Studio Studio, MG Road",
      shipping_address_line2: "Near Art Gallery",
      shipping_city: "Mumbai",
      shipping_state: "Maharashtra",
      shipping_pincode: "400001",
      subtotal_paise: 229900,
      discount_paise: 0,
      shipping_fee_paise: 0,
      total_paise: 229900,
      coupon_id: null,
      payment_method: "razorpay",
      razorpay_order_id: "order_mock_test_123",
      razorpay_payment_id: "pay_mock_test_456",
      razorpay_signature: null,
      courier_name: "BlueDart Express",
      tracking_number: "BLD-998822110",
      tracking_url: "https://www.bluedart.com",
      estimated_delivery_date: null,
      admin_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    items = [
      {
        id: "item-1",
        order_id: id,
        product_id: "p-1",
        product_title: "14-Can Gun Sculpture",
        unit_price_paise: 229900,
        quantity: 1,
        total_price_paise: 229900,
        image_url: "/assets/products/14-can-gun-sculpture-v2.png",
      },
    ];
  }

  const steps = [
    { label: "Order Received", status: "paid" },
    { label: "Artisan Inspection", status: "processing" },
    { label: "Armor Packed & Shipped", status: "shipped" },
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

  return (
    <div className="min-h-screen bg-void py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Confirmation Header Banner */}
        <div className="relative p-8 rounded-sm border-2 border-acid/50 bg-ash/90 text-center shadow-acid">
          <FiligreeCorner position="top-left" size={28} variant="acid" />
          <FiligreeCorner position="top-right" size={28} variant="acid" />

          <div className="w-16 h-16 rounded-full bg-acid/20 border border-acid text-acid flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="font-mono text-xs text-acid uppercase tracking-widest mb-1">
            ORDER SECURED & LOGGED
          </div>

          <h1 className="text-3xl sm:text-5xl font-display uppercase tracking-tight text-bone mb-2">
            THANK YOU FOR YOUR RESERVATION
          </h1>

          <p className="font-mono text-sm text-steel mb-4">
            Order Reference:{" "}
            <strong className="text-acid font-bold">{order.order_number}</strong>
          </p>

          <p className="font-sans text-xs sm:text-sm text-steel/80 max-w-xl mx-auto">
            A confirmation email has been dispatched to{" "}
            <strong className="text-bone">{order.customer_email}</strong>. Our
            studio will begin crafting and inspecting your piece.
          </p>
        </div>

        {/* Status Stepper */}
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

          {order.tracking_number && (
            <div className="mt-6 p-4 rounded-sm bg-void border border-acid/30 flex items-center justify-between text-xs font-mono">
              <span className="text-steel">
                Courier:{" "}
                <strong className="text-bone">{order.courier_name}</strong> •
                Tracking ID:{" "}
                <strong className="text-acid">{order.tracking_number}</strong>
              </span>
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-acid hover:underline"
                >
                  Track Package →
                </a>
              )}
            </div>
          )}
        </div>

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
            <p className="text-steel/70">Payment: {order.payment_method.toUpperCase()}</p>
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
                <span>Discount</span>
                <span>-{formatINR(order.discount_paise)}</span>
              </div>
            )}
            <div className="flex justify-between text-steel">
              <span>Shipping</span>
              <span>
                {order.shipping_fee_paise === 0
                  ? "FREE"
                  : formatINR(order.shipping_fee_paise)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-bone pt-3 border-t border-steel/20">
              <span className="font-display uppercase">Total Paid</span>
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
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
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
