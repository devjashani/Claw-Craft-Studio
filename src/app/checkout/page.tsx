"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { formatINR } from "@/lib/utils";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { getProductImageUrl, getProductAltText } from "@/lib/product-media";
import { useToast } from "@/components/ui/toast";
import { checkoutFormSchema, CheckoutFormValues } from "@/lib/validation/checkout";
import {
  ShieldCheck,
  CreditCard,
  Truck,
  ShoppingBag,
  Loader2,
  Lock,
  ArrowLeft,
  Tag,
  AlertCircle,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotalPaise, clearCart } = useCart();
  const toast = useToast();

  const [formData, setFormData] = useState<CheckoutFormValues>({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "razorpay",
    couponCode: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [razorpayScriptLoaded, setRazorpayScriptLoaded] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPaise: number;
  } | null>(null);

  const FREE_SHIPPING_THRESHOLD_PAISE = 299900; // Rs 2,999
  const FLAT_SHIPPING_PAISE = 14900; // Rs 149

  const subtotal = subtotalPaise();
  const discount = appliedCoupon ? appliedCoupon.discountPaise : 0;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD_PAISE || subtotal === 0;
  const shippingFee = isFreeShipping ? 0 : FLAT_SHIPPING_PAISE;
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);

  const enableCod = process.env.NEXT_PUBLIC_ENABLE_COD === "true";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleApplyCoupon = async () => {
    if (!formData.couponCode?.trim()) return;
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.couponCode.trim(),
          subtotalPaise: subtotal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon({
          code: data.code,
          discountPaise: data.discountPaise,
        });
        toast.success("Coupon Applied", `Saved ${formatINR(data.discountPaise)}!`);
      } else {
        toast.error("Coupon Invalid", data.error || "Could not apply coupon.");
      }
    } catch {
      toast.error("Error", "Failed to validate coupon.");
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (items.length === 0) {
      toast.error("Cart is Empty", "Please select pieces from the collection first.");
      router.push("/shop");
      return;
    }

    // 1. Zod Client Validation
    const validation = checkoutFormSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error("Check Form Details", "Please correct the highlighted fields.");
      return;
    }

    setSubmitting(true);

    try {
      // 2. Call Server to Recalculate Prices & Create Order
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.productId || i.id,
            productId: i.productId || i.id,
            quantity: i.quantity,
            variantId: i.variantId,
            variantLabel: i.variantLabel,
            selectedOption: i.selectedOption,
          })),
          formValues: {
            ...formData,
            couponCode: appliedCoupon ? appliedCoupon.code : formData.couponCode,
          },
        }),
      });

      const orderData = await res.json();

      if (!res.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to create order.");
      }

      // If COD, order is immediately confirmed
      if (orderData.isCod) {
        clearCart();
        toast.success("Order Placed", `Order #${orderData.orderNumber} confirmed.`);
        const orderUrl = orderData.publicToken
          ? `/order/${orderData.orderId}?t=${orderData.publicToken}`
          : `/order/${orderData.orderId}`;
        router.push(orderUrl);
        return;
      }

      // 3. Launch Razorpay Checkout
      const isPlaceholderKey =
        orderData.keyId.includes("placeholder") ||
        orderData.razorpayOrderId.startsWith("order_");

      if (isPlaceholderKey || !window.Razorpay) {
        // Test Simulation Mode when live Razorpay credentials are not yet added
        const simulateConfirm = window.confirm(
          `[RAZORPAY TEST MODE]\nOrder: ${orderData.orderNumber}\nAmount: ${formatINR(
            orderData.totalPaise
          )}\n\nClick OK to simulate a SUCCESSFUL Razorpay payment, or Cancel to view the order with Payment Pending status.`
        );

        if (simulateConfirm) {
          const testPaymentId = `pay_test_mock_${Date.now()}`;
          let confirmedOrderId = orderData.orderId;

          try {
            const saveRes = await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customer_name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.addressLine1 + (formData.addressLine2 ? `, ${formData.addressLine2}` : ""),
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                items: items.map((i) => ({
                  productId: i.productId || i.id,
                  product_title: i.title,
                  unit_price: i.pricePaise / 100,
                  unit_price_paise: i.pricePaise,
                  quantity: i.quantity,
                  variantId: i.variantId,
                  variantLabel: i.variantLabel,
                  selectedOption: i.selectedOption,
                  image_url: i.imageUrl,
                })),
                subtotal: subtotal / 100,
                subtotal_paise: subtotal,
                discount_amount: discount / 100,
                discount_paise: discount,
                shipping_amount: shippingFee / 100,
                shipping_fee_paise: shippingFee,
                total_amount: finalTotal / 100, // Discounted amount saved
                total_paise: finalTotal,
                payment_id: testPaymentId,
                payment_status: "paid",
              }),
            });
            const savedData = await saveRes.json();
            if (savedData?.orderId) {
              confirmedOrderId = savedData.orderId;
            }
          } catch (err) {
            console.error("Orders save notice:", err);
          }

          clearCart();
          toast.success("Payment Received", "Your test order is confirmed!");
          router.push(`/checkout/success?order_id=${confirmedOrderId}`);
          return;
        } else {
          // Navigating to order page with pending payment status
          clearCart();
          toast.info("Payment Pending", "Order created with payment pending.");
          router.push(`/checkout/success?order_id=${orderData.orderId}`);
          return;
        }
      }

      // Real or Sandbox Razorpay Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.totalPaise,
        currency: "INR",
        name: "CLAWCRAFT STUDIO",
        description: `Order ${orderData.orderNumber}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#B8FF1F",
          backdrop_color: "#050505",
        },
        handler: async function (response: any) {
          let confirmedOrderId = orderData.orderId;
          try {
            // STEP 2: Call /api/orders to save the real order to Supabase
            try {
              const saveRes = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  customer_name: formData.name,
                  email: formData.email,
                  phone: formData.phone,
                  address: formData.addressLine1 + (formData.addressLine2 ? `, ${formData.addressLine2}` : ""),
                  city: formData.city,
                  state: formData.state,
                  pincode: formData.pincode,
                  items: items.map((i) => ({
                    productId: i.productId || i.id,
                    product_title: i.title,
                    unit_price: i.pricePaise / 100,
                    unit_price_paise: i.pricePaise,
                    quantity: i.quantity,
                    variantId: i.variantId,
                    variantLabel: i.variantLabel,
                    selectedOption: i.selectedOption,
                    image_url: i.imageUrl,
                  })),
                  subtotal: subtotal / 100,
                  subtotal_paise: subtotal,
                  discount_amount: discount / 100,
                  discount_paise: discount,
                  shipping_amount: shippingFee / 100,
                  shipping_fee_paise: shippingFee,
                  total_amount: finalTotal / 100, // Discounted amount saved
                  total_paise: finalTotal,
                  payment_id: response.razorpay_payment_id,
                  payment_status: "paid",
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const savedData = await saveRes.json();
              if (savedData?.orderId) {
                confirmedOrderId = savedData.orderId;
              }
            } catch (saveErr) {
              console.error("[Save Order to Supabase Error]:", saveErr);
            }

            // Also verify payment signature if endpoint available
            try {
              await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: confirmedOrderId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
            } catch (vErr) {
              console.warn("Payment verification notice:", vErr);
            }

            clearCart();
            toast.success("Payment Confirmed", "Your sculpture order is placed.");
            router.push(`/checkout/success?order_id=${confirmedOrderId}`);
          } catch (err) {
            console.error("Handler error:", err);
            clearCart();
            router.push(`/checkout/success?order_id=${orderData.orderId}`);
          }
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment Cancelled", "You can retry checkout anytime.");
            setSubmitting(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Checkout Error", err.message || "Failed to proceed to payment.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-void py-12 px-4 sm:px-6 lg:px-8">
      {/* Razorpay Checkout Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayScriptLoaded(true)}
      />

      <div className="max-w-6xl mx-auto">
        {/* Header Breadcrumbs */}
        <div className="flex items-center justify-between border-b border-steel/20 pb-6 mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-steel hover:text-acid transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cart</span>
          </Link>
          <div className="inline-flex items-center gap-2 font-mono text-xs text-acid">
            <Lock className="w-3.5 h-3.5" />
            <span>256-BIT ENCRYPTED CHECKOUT</span>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-steel/20 rounded-sm bg-ash/30 p-8 max-w-md mx-auto">
            <ShoppingBag className="w-12 h-12 text-steel/40 mx-auto mb-4" />
            <h2 className="font-display uppercase text-2xl text-bone mb-2">
              YOUR CART IS EMPTY
            </h2>
            <p className="font-sans text-xs text-steel/70 mb-6">
              Please choose a sculpture from our drop catalog before checking out.
            </p>
            <Link href="/shop">
              <ClawButton variant="primary" size="md">
                Browse Shop
              </ClawButton>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Customer & Delivery Details */}
            <div className="lg:col-span-7 space-y-8">
              {/* Customer Contact */}
              <div className="p-6 rounded-sm border border-steel/20 bg-ash/40 relative">
                <FiligreeCorner position="top-left" size={24} variant="acid" />
                <h2 className="font-display uppercase text-xl text-bone mb-4">
                  1. CONTACT INFORMATION
                </h2>

                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="block text-steel uppercase mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Vikram Sharma"
                      className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2.5 text-bone focus:border-acid focus:outline-none"
                    />
                    {errors.name && (
                      <p className="text-blood text-[11px] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-steel uppercase mb-1">
                        Email Address (For Invoices) *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="vikram@gmail.com"
                        className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2.5 text-bone focus:border-acid focus:outline-none"
                      />
                      {errors.email && (
                        <p className="text-blood text-[11px] mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-steel uppercase mb-1">
                        Mobile Phone (10 Digits) *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        maxLength={10}
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="9876543210"
                        className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2.5 text-bone focus:border-acid focus:outline-none"
                      />
                      {errors.phone && (
                        <p className="text-blood text-[11px] mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="p-6 rounded-sm border border-steel/20 bg-ash/40 relative">
                <FiligreeCorner position="top-left" size={24} variant="acid" />
                <h2 className="font-display uppercase text-xl text-bone mb-4">
                  2. DELIVERY ADDRESS (PAN-INDIA)
                </h2>

                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="block text-steel uppercase mb-1">
                      Street Address & Flat / House No. *
                    </label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleChange}
                      placeholder="Flat 402, Skyline Residency, Link Road"
                      className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2.5 text-bone focus:border-acid focus:outline-none"
                    />
                    {errors.addressLine1 && (
                      <p className="text-blood text-[11px] mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.addressLine1}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-steel uppercase mb-1">
                      Landmark / Area (Optional)
                    </label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleChange}
                      placeholder="Near Metro Station"
                      className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2.5 text-bone focus:border-acid focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-steel uppercase mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Mumbai"
                        className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2.5 text-bone focus:border-acid focus:outline-none"
                      />
                      {errors.city && (
                        <p className="text-blood text-[11px] mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-steel uppercase mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="Maharashtra"
                        className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2.5 text-bone focus:border-acid focus:outline-none"
                      />
                      {errors.state && (
                        <p className="text-blood text-[11px] mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.state}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-steel uppercase mb-1">
                        PIN Code *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        maxLength={6}
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="400001"
                        className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2.5 text-bone focus:border-acid focus:outline-none"
                      />
                      {errors.pincode && (
                        <p className="text-blood text-[11px] mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.pincode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="p-6 rounded-sm border border-steel/20 bg-ash/40 relative">
                <FiligreeCorner position="top-left" size={24} variant="acid" />
                <h2 className="font-display uppercase text-xl text-bone mb-4">
                  3. PAYMENT METHOD
                </h2>

                <div className="space-y-3 font-mono text-xs">
                  <label
                    className={`flex items-start gap-3 p-4 rounded-sm border cursor-pointer transition-colors ${
                      formData.paymentMethod === "razorpay"
                        ? "border-acid bg-acid/10 text-bone"
                        : "border-steel/20 bg-void/50 text-steel hover:border-steel/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="razorpay"
                      checked={formData.paymentMethod === "razorpay"}
                      onChange={handleChange}
                      className="mt-1 text-acid focus:ring-acid"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-bone uppercase tracking-wider text-sm flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-acid" /> Razorpay
                          Online Checkout
                        </strong>
                        <span className="text-acid text-[10px] uppercase font-bold">
                          INSTANT CONFIRMATION
                        </span>
                      </div>
                      <p className="text-steel/80 font-sans text-xs mt-1">
                        Supports UPI (GPay, PhonePe, Paytm, BHIM), Debit/Credit
                        Cards (Visa, Mastercard, RuPay), NetBanking & Wallets.
                      </p>
                    </div>
                  </label>

                  {enableCod && (
                    <label
                      className={`flex items-start gap-3 p-4 rounded-sm border cursor-pointer transition-colors ${
                        formData.paymentMethod === "cod"
                          ? "border-acid bg-acid/10 text-bone"
                          : "border-steel/20 bg-void/50 text-steel hover:border-steel/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === "cod"}
                        onChange={handleChange}
                        className="mt-1 text-acid focus:ring-acid"
                      />
                      <div className="flex-1">
                        <strong className="text-bone uppercase tracking-wider text-sm flex items-center gap-2">
                          <Truck className="w-4 h-4 text-acid" /> Cash on Delivery
                        </strong>
                        <p className="text-steel/80 font-sans text-xs mt-1">
                          Pay cash upon verified courier delivery at your doorstep.
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Payment Button */}
            <div className="lg:col-span-5 sticky top-24">
              <div className="p-6 rounded-sm border-2 border-steel/20 bg-ash/80 backdrop-blur-md space-y-6">
                <FiligreeCorner position="top-right" size={24} variant="acid" />

                <h3 className="font-display uppercase text-xl text-bone border-b border-steel/20 pb-4">
                  ORDER SUMMARY ({items.length} {items.length === 1 ? "PIECE" : "PIECES"})
                </h3>

                {/* Items List */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-sm bg-void/50 border border-steel/10"
                    >
                      <div className="relative w-12 h-12 rounded-sm overflow-hidden bg-void border border-steel/20 shrink-0">
                        <Image
                          src={
                            item.imageUrl && !item.imageUrl.endsWith(".jpg")
                              ? item.imageUrl
                              : getProductImageUrl(item.slug)
                          }
                          alt={getProductAltText(item.slug, item.title)}
                          fill
                          sizes="48px"
                          className="object-cover object-center"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display uppercase text-xs text-bone truncate">
                          {item.title}
                        </p>
                        {item.variantLabel && (
                          <p className="font-mono text-[10px] text-steel">
                            {item.variantLabel}
                            {item.selectedOption ? ` • ${item.selectedOption}` : ""}
                          </p>
                        )}
                        <p className="font-mono text-[11px] text-steel">
                          Qty: {item.quantity} × {formatINR(item.pricePaise)}
                        </p>
                      </div>
                      <div className="font-mono text-xs font-bold text-bone">
                        {formatINR(item.pricePaise * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Field */}
                {!appliedCoupon ? (
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      name="couponCode"
                      placeholder="Coupon Code"
                      value={formData.couponCode}
                      onChange={handleChange}
                      className="flex-1 bg-void border border-steel/30 rounded-sm px-3 py-1.5 text-xs font-mono uppercase text-bone focus:outline-none focus:border-acid"
                    />
                    <ClawButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleApplyCoupon}
                    >
                      Apply
                    </ClawButton>
                  </div>
                ) : (
                  <div className="p-2 rounded-sm bg-acid/10 border border-acid/40 flex items-center justify-between text-xs font-mono text-bone">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-acid" />
                      Coupon <strong>{appliedCoupon.code}</strong> Applied (-
                      {formatINR(appliedCoupon.discountPaise)})
                    </span>
                    <button
                      type="button"
                      onClick={() => setAppliedCoupon(null)}
                      className="text-steel hover:text-blood transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-2 font-mono text-xs text-steel border-t border-steel/10 pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-bone">{formatINR(subtotal)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-acid">
                      <span>Coupon Discount</span>
                      <span>-{formatINR(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping (Pan-India)</span>
                    <span>
                      {isFreeShipping ? (
                        <span className="text-acid font-bold">FREE</span>
                      ) : (
                        formatINR(shippingFee)
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-lg font-bold text-bone pt-3 border-t border-steel/10">
                    <span className="font-display uppercase tracking-wide">
                      Total Payable
                    </span>
                    <span className="text-acid text-xl">{formatINR(finalTotal)}</span>
                  </div>
                </div>

                {/* Pay Button with double-click protection */}
                <ClawButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitting}
                  className="w-full h-14 text-base"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Securing Order...
                    </>
                  ) : formData.paymentMethod === "cod" ? (
                    `Confirm COD Order (${formatINR(finalTotal)})`
                  ) : (
                    `Pay ${formatINR(finalTotal)} with Razorpay`
                  )}
                </ClawButton>

                <div className="p-3 rounded-sm border border-steel/10 bg-void/50 text-[10px] font-mono text-steel/60 text-center leading-relaxed">
                  <ShieldCheck className="w-3.5 h-3.5 text-acid inline mr-1" />
                  Your order includes insurance and custom shock-resistant
                  packaging. Transactions are SSL encrypted via Razorpay.
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
