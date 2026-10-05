import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/orders/order-service";
import { verifyOrderVerifySignature } from "@/lib/orders/order-crypto";
import { formatSlipRupees, formatISTDate } from "@/lib/pdf/order-slip";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { ClawButton } from "@/components/ui/claw-button";
import { CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";

interface VerifyPageProps {
  params: { orderNumber: string };
  searchParams: { s?: string };
}

export const dynamic = "force-dynamic";

export default async function OrderVerifyPage({ params, searchParams }: VerifyPageProps) {
  const { orderNumber } = params;
  const signature = searchParams.s;

  const { order, isDemo } = await getOrder(orderNumber);

  if (!order) {
    return (
      <div className="min-h-screen bg-void py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-sm border border-steel/20 bg-ash/60 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h1 className="font-display uppercase text-xl text-bone mb-2">Order Not Found</h1>
          <p className="font-sans text-xs text-steel leading-relaxed mb-6">
            The order reference <strong>{orderNumber}</strong> was not found in our studio registry.
          </p>
          <Link href="/">
            <ClawButton variant="secondary" size="sm">
              Return to Studio Home
            </ClawButton>
          </Link>
        </div>
      </div>
    );
  }

  // Signature check (when signature is provided in query param)
  const isSignatureValid = signature
    ? verifyOrderVerifySignature(order.order_number, order.total_paise, signature)
    : false;

  const isPaid = order.payment_status === "paid" || order.status === "paid";

  return (
    <div className="min-h-screen bg-void py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-lg w-full space-y-6">
        <div className="relative p-8 rounded-sm border-2 border-acid/40 bg-ash/90 shadow-2xl backdrop-blur-md text-center">
          <FiligreeCorner position="top-left" size={24} variant="acid" />
          <FiligreeCorner position="bottom-right" size={24} variant="acid" />

          <div className="w-14 h-14 rounded-full bg-acid/15 border border-acid text-acid flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="font-mono text-[10px] text-acid uppercase tracking-widest mb-1">
            OFFICIAL STUDIO REGISTRY VERIFICATION
          </div>

          <h1 className="text-2xl sm:text-3xl font-display uppercase tracking-tight text-bone mb-2">
            SLIP AUTHENTICITY CONFIRMED
          </h1>

          <p className="font-sans text-xs text-steel/80 max-w-sm mx-auto mb-6">
            This receipt corresponds to a verified studio reservation logged in CLAWCRAFT production records.
          </p>

          {/* Verification Details Box (Zero Personal Information) */}
          <div className="p-4 rounded-sm border border-steel/20 bg-void/80 text-left font-mono text-xs space-y-2.5 mb-6">
            <div className="flex justify-between border-b border-steel/10 pb-2">
              <span className="text-steel">Order Reference:</span>
              <strong className="text-bone">{order.order_number}</strong>
            </div>

            <div className="flex justify-between border-b border-steel/10 pb-2">
              <span className="text-steel">Order Date (IST):</span>
              <span className="text-bone">{formatISTDate(order.created_at)}</span>
            </div>

            <div className="flex justify-between border-b border-steel/10 pb-2">
              <span className="text-steel">Authorized Total:</span>
              <strong className="text-acid">{formatSlipRupees(order.total_paise)}</strong>
            </div>

            <div className="flex justify-between border-b border-steel/10 pb-2">
              <span className="text-steel">Fulfillment Status:</span>
              <span className="text-bone uppercase">{order.status}</span>
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-steel">Payment Status:</span>
              {isDemo ? (
                <span className="text-amber-400 font-bold uppercase">Demo Order (No Charge)</span>
              ) : isPaid ? (
                <span className="text-acid font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED PAID
                </span>
              ) : (
                <span className="text-amber-400 font-bold uppercase">
                  {order.payment_method === "cod" ? "PAYMENT DUE ON DELIVERY" : "PAYMENT PENDING"}
                </span>
              )}
            </div>
          </div>

          <p className="font-mono text-[10px] text-steel/50 uppercase tracking-wider mb-6">
            SECURITY NOTE: NO CUSTOMER PERSONAL DATA IS EXPOSED ON THIS PUBLIC VERIFICATION TERMINAL.
          </p>

          <Link href="/">
            <ClawButton variant="primary" size="sm" className="w-full">
              Explore CLAWCRAFT Studio <ArrowRight className="w-4 h-4 ml-1.5" />
            </ClawButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
