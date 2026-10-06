"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, ArrowRight, Download, ShieldCheck } from "lucide-react";
import { FiligreeCorner } from "@/components/ui/filigree-corner";

export const dynamic = "force-dynamic";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || searchParams.get("orderId") || "Confirmed";

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="relative max-w-lg w-full bg-ash/90 border border-subtle p-8 sm:p-10 rounded shadow-2xl backdrop-blur-sm text-center space-y-6">
        <FiligreeCorner position="top-left" size={16} />
        <FiligreeCorner position="top-right" size={16} />
        <FiligreeCorner position="bottom-left" size={16} />
        <FiligreeCorner position="bottom-right" size={16} />

        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-acid/10 border border-acid/40 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-acid" />
        </div>

        {/* Title & Brand */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-acid">
            Claw Craft Studio • Order Reserved
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl uppercase tracking-wider text-bone">
            Payment Confirmed
          </h1>
          <p className="text-xs text-muted font-mono leading-relaxed max-w-sm mx-auto">
            Your handmade aluminum sculpture relic has been secured. Our artisan team will begin
            crafting and inspection for Pan-India dispatch.
          </p>
        </div>

        {/* Order Identifier Box */}
        <div className="bg-void border border-subtle/80 p-4 rounded text-left space-y-1">
          <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">
            Reference Identifier
          </span>
          <p className="font-mono text-sm text-acid font-bold break-all">
            {orderId}
          </p>
        </div>

        {/* Trust Badges */}
        <div className="pt-2 border-t border-subtle/40 flex items-center justify-center gap-6 text-[11px] font-mono text-muted">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-acid" />
            <span>Encrypted Payment</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-steel" />
            <span>Shock-Proof Packing</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {orderId && orderId !== "Confirmed" && (
            <Link
              href={`/order/${orderId}`}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-acid text-void hover:bg-bone transition-colors font-mono font-bold text-xs uppercase tracking-wider rounded"
            >
              <span>View Order Details & Slip</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            href="/shop"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-ash border border-subtle hover:border-steel text-bone hover:text-acid transition-colors font-mono text-xs uppercase tracking-wider rounded"
          >
            <span>Return to Studio Gallery</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-xs font-mono text-acid animate-pulse">
            Loading order confirmation...
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
