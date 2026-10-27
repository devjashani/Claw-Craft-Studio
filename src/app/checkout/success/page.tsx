"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  ShieldCheck,
  Clock,
  RotateCw,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { getBusinessContact } from "@/lib/contact";

export const dynamic = "force-dynamic";

interface OrderStatusState {
  loading: boolean;
  order: {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total_paise: number;
    public_token?: string;
    isPaid: boolean;
    isPending: boolean;
    isCancelled: boolean;
  } | null;
  error: string | null;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || searchParams.get("orderId");
  const token = searchParams.get("t");
  const contact = getBusinessContact();

  const [state, setState] = useState<OrderStatusState>({
    loading: true,
    order: null,
    error: null,
  });
  const [checking, setChecking] = useState(false);

  const fetchStatus = React.useCallback(async () => {
    if (!orderId) {
      setState({
        loading: false,
        order: null,
        error: "No order identifier found in request.",
      });
      return;
    }

    try {
      setChecking(true);
      const url = token
        ? `/api/orders/${encodeURIComponent(orderId)}?t=${encodeURIComponent(token)}`
        : `/api/orders/${encodeURIComponent(orderId)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.order) {
        setState({
          loading: false,
          order: null,
          error: data.error || "Order record not found.",
        });
      } else {
        setState({
          loading: false,
          order: data.order,
          error: null,
        });
      }
    } catch {
      setState({
        loading: false,
        order: null,
        error: "Could not connect to studio database.",
      });
    } finally {
      setChecking(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (state.loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-acid border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs uppercase tracking-widest text-acid animate-pulse">
            Verifying payment with studio records...
          </p>
        </div>
      </div>
    );
  }

  // If order is not found or error occurred
  if (!state.order || state.error) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <div className="relative max-w-lg w-full bg-ash/90 border border-steel/20 p-8 sm:p-10 rounded text-center space-y-6">
          <FiligreeCorner position="top-left" size={16} />
          <FiligreeCorner position="top-right" size={16} />
          <FiligreeCorner position="bottom-left" size={16} />
          <FiligreeCorner position="bottom-right" size={16} />

          <div className="mx-auto w-16 h-16 rounded-full bg-blood/10 border border-blood/40 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-blood" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-2xl uppercase tracking-wider text-bone">
              Order Not Found
            </h1>
            <p className="text-xs text-muted font-mono leading-relaxed max-w-sm mx-auto">
              {state.error || "We could not find an order corresponding to this reference."}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/shop"
              className="w-full inline-flex items-center justify-center py-3 px-4 bg-acid text-void font-mono font-bold text-xs uppercase tracking-wider rounded"
            >
              Return to Gallery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const order = state.order;
  const isPaid = order.isPaid;
  const isPending = order.isPending;
  const isCancelled = order.isCancelled;

  // View order destination URL
  const viewOrderUrl = order.public_token
    ? `/order/${order.id}?t=${order.public_token}`
    : `/order/${order.id}`;

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="relative max-w-lg w-full bg-ash/90 border border-subtle p-8 sm:p-10 rounded shadow-2xl backdrop-blur-sm text-center space-y-6">
        <FiligreeCorner position="top-left" size={16} />
        <FiligreeCorner position="top-right" size={16} />
        <FiligreeCorner position="bottom-left" size={16} />
        <FiligreeCorner position="bottom-right" size={16} />

        {/* Status Icon */}
        <div
          className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
            isPaid
              ? "bg-acid/10 border border-acid/40 text-acid"
              : isPending
              ? "bg-amber-500/10 border border-amber-500/40 text-amber-400"
              : "bg-blood/10 border border-blood/40 text-blood"
          }`}
        >
          {isPaid ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : isPending ? (
            <Clock className="w-8 h-8" />
          ) : (
            <AlertTriangle className="w-8 h-8" />
          )}
        </div>

        {/* Title & Brand */}
        <div className="space-y-2">
          <span
            className={`text-[11px] font-mono uppercase tracking-widest ${
              isPaid ? "text-acid" : isPending ? "text-amber-400" : "text-blood"
            }`}
          >
            Claw Craft Studio • {isPaid ? "Order Secured" : isPending ? "Payment Pending" : "Payment Incomplete"}
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl uppercase tracking-wider text-bone">
            {isPaid
              ? "Payment Confirmed"
              : isPending
              ? "Payment Pending Verification"
              : "Payment Not Completed"}
          </h1>
          <p className="text-xs text-muted font-mono leading-relaxed max-w-sm mx-auto">
            {isPaid
              ? "Your payment was verified with the studio bank. Our artisan team will begin crafting and inspection for Pan-India dispatch."
              : isPending
              ? "Your reservation has been created, but bank authorization has not been confirmed yet. If you have already paid, please check status below."
              : "The payment attempt was not finalized. You can retry checkout to secure this relic."}
          </p>
        </div>

        {/* Order Identifier Box */}
        <div className="bg-void border border-subtle/80 p-4 rounded text-left space-y-1">
          <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">
            Order Reference Number
          </span>
          <p className="font-mono text-sm text-acid font-bold break-all">
            {order.order_number}
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
          {isPaid && (
            <Link
              href={viewOrderUrl}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-acid text-void hover:bg-bone transition-colors font-mono font-bold text-xs uppercase tracking-wider rounded"
            >
              <span>View Order Details & Receipt</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {isPending && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={fetchStatus}
                disabled={checking}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-acid text-void hover:bg-bone transition-colors font-mono font-bold text-xs uppercase tracking-wider rounded disabled:opacity-50 cursor-pointer"
              >
                <RotateCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
                <span>{checking ? "Checking Bank Records..." : "Check Payment Status Again"}</span>
              </button>

              <Link
                href="/checkout"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-void border border-amber-500/40 text-amber-300 hover:border-amber-400 font-mono text-xs uppercase tracking-wider rounded"
              >
                <span>Retry Checkout / Payment</span>
              </Link>

              {contact.isConfigured && (
                <a
                  href={contact.waLink(`Hi CLAWCRAFT, checking payment status for order ${order.order_number}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-steel hover:text-acid font-mono text-xs transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-acid" />
                  <span>Inquire on WhatsApp ({contact.display})</span>
                </a>
              )}
            </div>
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
