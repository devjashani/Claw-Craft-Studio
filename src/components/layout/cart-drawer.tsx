"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  CheckCircle2,
  AlertCircle,
  Truck,
  Sparkles,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { formatINR } from "@/lib/utils";
import { ClawButton } from "@/components/ui/claw-button";
import { getProductImageUrl, getProductAltText } from "@/lib/product-media";

export function CartDrawer() {
  const pathname = usePathname();
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    subtotalPaise,
    totalItems,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPaise: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [slashFlash, setSlashFlash] = useState(false);

  const FREE_SHIPPING_THRESHOLD_PAISE = 299900; // Rs 2,999
  const FLAT_SHIPPING_PAISE = 14900; // Rs 149

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeCart();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Trigger slash flash accent on drawer open
      setSlashFlash(true);
      const t = setTimeout(() => setSlashFlash(false), 500);
      return () => clearTimeout(t);
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const count = totalItems();
  const subtotal = subtotalPaise();
  const discount = appliedCoupon ? appliedCoupon.discountPaise : 0;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD_PAISE || subtotal === 0;
  const shippingFee = isFreeShipping ? 0 : FLAT_SHIPPING_PAISE;
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);

  const amountNeededForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_PAISE - subtotal
  );
  const freeShippingProgress = Math.min(
    100,
    (subtotal / FREE_SHIPPING_THRESHOLD_PAISE) * 100
  );

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

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md h-full bg-ash border-l border-steel/20 shadow-2xl flex flex-col z-10 select-none overflow-hidden"
          >
            {/* Slash Flash Animation Overlay */}
            {slashFlash && (
              <motion.div
                initial={{ opacity: 1, x: "-100%" }}
                animate={{ opacity: 0, x: "100%" }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-acid/20 to-transparent skew-x-[-25deg] pointer-events-none z-30"
              />
            )}

            {/* Drawer Header */}
            <div className="p-5 border-b border-steel/20 flex items-center justify-between bg-void/70">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-acid" />
                <h2 className="font-display uppercase text-xl text-bone tracking-wide">
                  Vault Cart ({count})
                </h2>
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart drawer"
                className="p-1.5 rounded-sm text-steel hover:text-bone hover:bg-steel/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress Indicator */}
            {items.length > 0 && (
              <div className="px-5 py-3 bg-void/50 border-b border-steel/10 text-xs font-mono">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-bone">
                    <Truck className="w-3.5 h-3.5 text-acid" />
                    {isFreeShipping ? (
                      <span className="text-acid font-bold">
                        FREE PAN-INDIA DELIVERY UNLOCKED!
                      </span>
                    ) : (
                      <span>
                        Add{" "}
                        <strong className="text-acid">
                          {formatINR(amountNeededForFreeShipping)}
                        </strong>{" "}
                        for FREE Shipping
                      </span>
                    )}
                  </span>
                  <span className="text-steel/70">
                    {Math.round(freeShippingProgress)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-ash rounded-full overflow-hidden border border-steel/20">
                  <div
                    className="h-full bg-acid transition-all duration-300"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-steel">
                  <div className="w-16 h-16 rounded-full border border-dashed border-steel/30 flex items-center justify-center mb-4 text-steel/50">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <p className="font-display uppercase text-xl text-bone mb-2">
                    YOUR VAULT IS EMPTY
                  </p>
                  <p className="text-xs text-steel/70 max-w-xs font-sans mb-6">
                    No handcrafted can sculptures reserved yet. Explore our
                    initial limited drop pieces.
                  </p>
                  <ClawButton variant="primary" size="sm" onClick={closeCart}>
                    <Link href="/shop">Browse Catalog</Link>
                  </ClawButton>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 border border-steel/20 bg-void/50 rounded-sm flex gap-3.5 items-center relative group"
                  >
                    {/* Item Thumbnail */}
                    <div className="relative w-16 h-16 rounded-sm overflow-hidden bg-ash shrink-0 border border-steel/20">
                      <Image
                        src={
                          item.imageUrl && !item.imageUrl.endsWith(".jpg")
                            ? item.imageUrl
                            : getProductImageUrl(item.slug)
                        }
                        alt={getProductAltText(item.slug, item.title)}
                        fill
                        sizes="64px"
                        className="object-cover object-center"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-display uppercase text-sm text-bone truncate">
                        {item.title}
                      </h3>
                      <p className="font-mono text-xs text-acid mt-0.5 font-bold">
                        {formatINR(item.pricePaise)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center border border-steel/30 bg-ash/90 rounded-sm">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="p-1.5 text-steel hover:text-bone transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-xs text-bone px-3 font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            className="p-1.5 text-steel hover:text-bone transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.title} from cart`}
                          className="p-1 text-steel/50 hover:text-blood transition-colors ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer with Coupon & Totals */}
            {items.length > 0 && (
              <div className="p-5 border-t border-steel/20 bg-void/80 space-y-4">
                {/* Coupon Code Input */}
                {appliedCoupon ? (
                  <div className="p-2.5 rounded-sm bg-acid/10 border border-acid/40 flex items-center justify-between text-xs font-mono text-bone">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-acid" />
                      Coupon <strong>{appliedCoupon.code}</strong> Applied (-
                      {formatINR(appliedCoupon.discountPaise)})
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-steel hover:text-blood transition-colors ml-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. CLAW10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-ash border border-steel/30 rounded-sm px-3 py-1.5 text-xs font-mono uppercase text-bone placeholder:text-steel/40 focus:outline-none focus:border-acid"
                    />
                    <ClawButton
                      type="submit"
                      variant="secondary"
                      size="sm"
                      disabled={couponLoading || !couponCode.trim()}
                      className="text-xs"
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

                {/* Subtotal, Discount & Shipping Breakdown */}
                <div className="space-y-1.5 font-mono text-xs text-steel border-t border-steel/10 pt-3">
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
                    <span>Shipping</span>
                    <span>
                      {isFreeShipping ? (
                        <span className="text-acid font-bold">FREE</span>
                      ) : (
                        formatINR(shippingFee)
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-bone pt-2 border-t border-steel/10">
                    <span className="font-display uppercase tracking-wide">
                      Total
                    </span>
                    <span className="text-acid">{formatINR(finalTotal)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Link href="/checkout" onClick={closeCart} className="w-full">
                    <ClawButton variant="primary" size="lg" className="w-full">
                      Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
                    </ClawButton>
                  </Link>

                  <Link href="/cart" onClick={closeCart} className="w-full">
                    <ClawButton
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                    >
                      View Full Cart Page
                    </ClawButton>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
