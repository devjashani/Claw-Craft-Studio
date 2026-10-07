"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import {
  Package,
  ExternalLink,
  Download,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";

interface OrderSummary {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_paise: number;
  subtotal_paise: number;
  created_at: string;
  customer_name: string;
}

export function OrderHistory() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/account/orders");
        if (!res.ok) {
          throw new Error("Unable to load orders.");
        }
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err: any) {
        setError(err.message || "Failed to load order history.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "paid" || s === "delivered") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono uppercase bg-acid/15 border border-acid/50 text-acid">
          <CheckCircle className="w-3 h-3" />
          <span>{status}</span>
        </span>
      );
    }
    if (s === "shipped") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono uppercase bg-void border border-acid/40 text-bone">
          <Truck className="w-3 h-3 text-acid" />
          <span>Shipped</span>
        </span>
      );
    }
    if (s === "processing") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono uppercase bg-steel/10 border border-steel/30 text-steel">
          <Clock className="w-3 h-3" />
          <span>Processing</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono uppercase bg-void border border-steel/20 text-steel">
        <span>{status || "Pending"}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display uppercase text-lg text-bone font-bold tracking-wider">
          Acquisition Vault
        </h3>
        <p className="font-sans text-xs text-steel">
          Official record of your bespoke handcrafted sculptures and studio commissions.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-ash/50 border border-steel/20 rounded-sm animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-blood/10 border border-blood text-blood text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="p-12 border border-dashed border-steel/30 rounded-sm text-center bg-ash/30 space-y-3">
          <div className="w-12 h-12 bg-steel/10 rounded-full flex items-center justify-center mx-auto text-steel">
            <Package className="w-6 h-6" />
          </div>
          <h4 className="font-display uppercase text-sm text-bone">
            No Studio Acquisitions Yet
          </h4>
          <p className="font-sans text-xs text-steel max-w-sm mx-auto">
            You haven&apos;t placed any orders with this account yet. Discover our limited series creations in the studio gallery.
          </p>
          <div className="pt-2">
            <Link href="/shop">
              <ClawButton variant="primary" size="sm">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Explore Sculptures</span>
                </span>
              </ClawButton>
            </Link>
          </div>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-5 bg-ash/70 border border-steel/25 rounded-sm relative backdrop-blur-sm hover:border-steel/40 transition-all space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between"
            >
              <FiligreeCorner position="top-right" size={14} variant="steel" />

              {/* Order Meta */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-bone">
                    #{order.order_number}
                  </span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-steel">
                  <span>Ordered on {formatDate(order.created_at)}</span>
                  <span>•</span>
                  <span className="text-acid font-bold">
                    {formatINR(order.total_paise)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <Link
                  href={`/order/${order.id}`}
                  className="px-3 py-1.5 bg-void border border-steel/30 hover:border-acid text-steel hover:text-bone text-xs font-mono uppercase rounded transition-colors inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-acid" />
                  <span>View Details</span>
                </Link>

                <a
                  href={`/api/orders/${order.id}/slip`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-void border border-steel/30 hover:border-acid text-steel hover:text-bone text-xs font-mono uppercase rounded transition-colors inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-acid" />
                  <span>Receipt PDF</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
