"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/hooks/use-cart";
import { formatINR } from "@/lib/utils";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { getProductImageUrl, getProductAltText } from "@/lib/product-media";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Truck,
  Tag,
  AlertCircle,
} from "lucide-react";

export default function FullCartPage() {
  const { items, updateQuantity, removeItem, subtotalPaise, totalItems, clearCart } =
    useCart();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPaise: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const FREE_SHIPPING_THRESHOLD_PAISE = 299900; // Rs 2,999
  const FLAT_SHIPPING_PAISE = 14900; // Rs 149

  const count = totalItems();
  const subtotal = subtotalPaise();
  const discount = appliedCoupon ? appliedCoupon.discountPaise : 0;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD_PAISE || subtotal === 0;
  const shippingFee = isFreeShipping ? 0 : FLAT_SHIPPING_PAISE;
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);

  const amountNeeded = Math.max(0, FREE_SHIPPING_THRESHOLD_PAISE - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD_PAISE) * 100);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotalPaise: subtotal,
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon({
          code: data.code,
          discountPaise: data.discountPaise,
        });
        setCouponCode("");
      } else {
        setCouponError(data.error || "Invalid coupon code.");
      }
    } catch {
      setCouponError("Failed to apply coupon. Try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-steel/20 pb-6 mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-2 font-mono text-xs text-acid uppercase tracking-widest">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>SHOPPING CART REVIEW</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-display uppercase tracking-tight text-bone">
              VAULT RESERVATIONS ({count})
            </h1>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-steel hover:text-acid transition-colors self-start sm:self-end"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-steel/20 rounded-sm bg-ash/40 p-8 max-w-lg mx-auto">
            <ShoppingBag className="w-12 h-12 text-steel/40 mx-auto mb-4" />
            <h2 className="font-display uppercase text-2xl text-bone mb-2">
              YOUR CART IS CURRENTLY EMPTY
            </h2>
            <p className="font-sans text-xs text-steel/70 mb-6">
              You haven&apos;t reserved any handcrafted can sculptures yet.
            </p>
            <Link href="/shop">
              <ClawButton variant="primary" size="md">
                Browse Collection
              </ClawButton>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Items Column */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free shipping banner */}
              <div className="p-4 rounded-sm border border-steel/20 bg-ash/50 text-xs font-mono">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-bone font-medium">
                    <Truck className="w-4 h-4 text-acid" />
                    {isFreeShipping ? (
                      <span className="text-acid font-bold">
                        FREE PAN-INDIA DELIVERY UNLOCKED!
                      </span>
                    ) : (
                      <span>
                        Add{" "}
                        <strong className="text-acid">
                          {formatINR(amountNeeded)}
                        </strong>{" "}
                        more to qualify for FREE Shipping
                      </span>
                    )}
                  </span>
                  <span className="text-steel/70">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-void rounded-full overflow-hidden border border-steel/20">
                  <div
                    className="h-full bg-acid transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Items Card List */}
              <div className="border border-steel/20 bg-ash/30 rounded-sm divide-y divide-steel/10">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-sm overflow-hidden bg-void border border-steel/20 shrink-0">
                        <Image
                          src={
                            item.imageUrl && !item.imageUrl.endsWith(".jpg")
                              ? item.imageUrl
                              : getProductImageUrl(item.slug)
                          }
                          alt={getProductAltText(item.slug, item.title)}
                          fill
                          sizes="80px"
                          className="object-cover object-center"
                        />
                      </div>

                      <div>
                        <Link href={`/shop/${item.slug}`}>
                          <h3 className="font-display uppercase text-lg text-bone hover:text-acid transition-colors">
                            {item.title}
                          </h3>
                        </Link>
                        {item.variantLabel && (
                          <p className="font-mono text-xs text-steel mt-0.5">
                            Variant: <span className="text-bone">{item.variantLabel}</span>
                            {item.selectedOption ? ` • Option: ${item.selectedOption}` : ""}
                          </p>
                        )}
                        <p className="font-mono text-sm text-acid font-bold mt-0.5">
                          {formatINR(item.pricePaise)}
                        </p>
                        {item.isMadeToOrder && (
                          <span className="font-mono text-[10px] text-steel/60 uppercase">
                            Made to Order
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-steel/30 bg-void rounded-sm">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="p-2 text-steel hover:text-bone transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-xs font-bold text-bone px-3">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                          className="p-2 text-steel hover:text-bone transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="font-mono text-sm font-bold text-bone min-w-[80px] text-right">
                        {formatINR(item.pricePaise * item.quantity)}
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.title}`}
                        className="p-1.5 text-steel/50 hover:text-blood transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={clearCart}
                  className="font-mono text-xs text-steel/60 hover:text-blood transition-colors"
                >
                  Empty Entire Cart
                </button>
              </div>
            </div>

            {/* Right Summary Column */}
            <div className="lg:col-span-4 sticky top-24">
              <div className="relative p-6 rounded-sm border-2 border-steel/20 bg-ash/80 backdrop-blur-md space-y-6">
                <FiligreeCorner position="top-right" size={24} variant="acid" />

                <h2 className="font-display uppercase text-xl text-bone border-b border-steel/20 pb-4">
                  ORDER SUMMARY
                </h2>

                {/* Coupon Code Input */}
                {appliedCoupon ? (
                  <div className="p-3 rounded-sm bg-acid/10 border border-acid/40 flex items-center justify-between text-xs font-mono text-bone">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-acid" />
                      Coupon <strong>{appliedCoupon.code}</strong> Applied (-
                      {formatINR(appliedCoupon.discountPaise)})
                    </span>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      className="text-steel hover:text-blood transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      className="flex-1 bg-void border border-steel/30 rounded-sm px-3 py-2 text-xs font-mono uppercase text-bone placeholder:text-steel/40 focus:outline-none focus:border-acid"
                    />
                    <ClawButton
                      type="submit"
                      variant="secondary"
                      size="sm"
                      disabled={couponLoading || !couponCode.trim()}
                    >
                      Apply
                    </ClawButton>
                  </form>
                )}

                {couponError && (
                  <p className="text-[11px] font-mono text-blood flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {couponError}
                  </p>
                )}

                {/* Price Calculations */}
                <div className="space-y-2.5 font-mono text-xs text-steel border-t border-steel/10 pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-bone">{formatINR(subtotal)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-acid">
                      <span>Discount</span>
                      <span>-{formatINR(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Estimated Shipping</span>
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
                      Estimated Total
                    </span>
                    <span className="text-acid">{formatINR(finalTotal)}</span>
                  </div>
                </div>

                <Link href="/checkout" className="block w-full">
                  <ClawButton variant="primary" size="lg" className="w-full">
                    Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
                  </ClawButton>
                </Link>

                <p className="font-mono text-[10px] text-steel/50 text-center uppercase tracking-wider">
                  ENCRYPTED CHECKOUT VIA RAZORPAY (UPI / CARDS)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
