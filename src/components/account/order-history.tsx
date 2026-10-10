"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { getCustomRequestStatusMeta, formatIST } from "@/lib/custom-requests/constants";
import { CustomerCustomRequestDetail } from "@/lib/custom-requests/service";
import {
  Package,
  ExternalLink,
  Download,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Compass,
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
  const [activeTab, setActiveTab] = useState<"orders" | "custom">("orders");

  // Orders state
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Custom requests state
  const [customRequests, setCustomRequests] = useState<CustomerCustomRequestDetail[]>([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(true);

  // Fetch regular orders
  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoadingOrders(true);
        setOrdersError(null);
        const res = await fetch("/api/account/orders");
        if (!res.ok) {
          throw new Error("Unable to load orders.");
        }
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err: any) {
        setOrdersError(err.message || "Failed to load order history.");
      } finally {
        setLoadingOrders(false);
      }
    }

    fetchOrders();
  }, []);

  // Fetch custom build requests when tab is selected
  useEffect(() => {
    if (activeTab === "custom") {
      const fetchCustomRequests = async () => {
        try {
          setCustomLoading(true);
          setCustomError(null);
          const res = await fetch("/api/account/custom-requests");
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Unable to load custom requests.");
          }

          if (data.verified === false) {
            setIsEmailVerified(false);
            setCustomRequests([]);
          } else {
            setIsEmailVerified(true);
            setCustomRequests(data.requests || []);
          }
        } catch (err: any) {
          setCustomError(err.message || "Failed to retrieve custom requests.");
        } finally {
          setCustomLoading(false);
        }
      };

      fetchCustomRequests();
    }
  }, [activeTab]);

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
      {/* Header and Subtab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-steel/20 pb-4">
        <div>
          <h3 className="font-display uppercase text-lg text-bone font-bold tracking-wider">
            Acquisition Vault
          </h3>
          <p className="font-sans text-xs text-steel">
            Official record of your bespoke handcrafted sculptures and studio commissions.
          </p>
        </div>

        {/* Subtabs Switcher */}
        <div className="inline-flex items-center p-1 bg-void border border-steel/25 rounded">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-3 py-1.5 text-xs font-mono uppercase rounded transition-colors ${
              activeTab === "orders"
                ? "bg-acid text-void font-bold shadow-sm"
                : "text-steel hover:text-bone"
            }`}
          >
            Store Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("custom")}
            className={`px-3 py-1.5 text-xs font-mono uppercase rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "custom"
                ? "bg-acid text-void font-bold shadow-sm"
                : "text-steel hover:text-bone"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Custom Build Requests</span>
          </button>
        </div>
      </div>

      {/* 1. REGULAR STORE ORDERS TAB */}
      {activeTab === "orders" && (
        <>
          {loadingOrders ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-ash/50 border border-steel/20 rounded-sm animate-pulse"
                />
              ))}
            </div>
          ) : ordersError ? (
            <div className="p-4 bg-blood/10 border border-blood text-blood text-xs rounded flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{ordersError}</span>
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
        </>
      )}

      {/* 2. CUSTOM BUILD REQUESTS TAB */}
      {activeTab === "custom" && (
        <>
          {/* Unverified Email Warning Banner */}
          {!isEmailVerified && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-mono text-xs uppercase text-amber-400 font-bold tracking-wider">
                  Email Verification Required
                </span>
                <p className="text-xs text-steel leading-relaxed">
                  Please verify your email address to link and view custom build requests placed with your email.
                  Check your inbox for the confirmation link sent by our authentication servers.
                </p>
              </div>
            </div>
          )}

          {customLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-ash/50 border border-steel/20 rounded-sm animate-pulse"
                />
              ))}
            </div>
          ) : customError ? (
            <div className="p-4 bg-blood/10 border border-blood text-blood text-xs rounded flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{customError}</span>
            </div>
          ) : customRequests.length === 0 ? (
            /* Empty State */
            <div className="p-12 border border-dashed border-steel/30 rounded-sm text-center bg-ash/30 space-y-3">
              <div className="w-12 h-12 bg-acid/10 border border-acid/40 rounded-full flex items-center justify-center mx-auto text-acid">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-display uppercase text-sm text-bone">
                No Custom Requests Yet
              </h4>
              <p className="font-sans text-xs text-steel max-w-sm mx-auto">
                Commission a one-of-a-kind sculpture crafted to your bespoke concept, dimensions, and preferred beverage cans.
              </p>
              <div className="pt-2">
                <Link href="/custom">
                  <ClawButton variant="primary" size="sm">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Commission a Custom Relic</span>
                    </span>
                  </ClawButton>
                </Link>
              </div>
            </div>
          ) : (
            /* Custom Requests Cards */
            <div className="space-y-3">
              {customRequests.map((req) => {
                const meta = getCustomRequestStatusMeta(req.status);
                const conceptSnippet =
                  req.concept_description.length > 80
                    ? `${req.concept_description.slice(0, 80)}...`
                    : req.concept_description;

                return (
                  <div
                    key={req.id}
                    className="p-5 bg-ash/70 border border-steel/25 rounded-sm relative backdrop-blur-sm hover:border-steel/40 transition-all space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between"
                  >
                    <FiligreeCorner position="top-right" size={14} variant="steel" />

                    <div className="space-y-2 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-sm font-bold text-acid tracking-wider">
                          {req.ref_code}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded border ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                      </div>

                      <p className="text-xs text-bone font-sans line-clamp-1 italic">
                        &quot;{conceptSnippet}&quot;
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-steel">
                        <span>Submitted: {formatDate(req.created_at)}</span>
                        <span>•</span>
                        <span>
                          Last Update: {formatDate(req.last_status_change_at || req.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0">
                      <Link
                        href={`/account/custom/${encodeURIComponent(req.ref_code)}`}
                        className="px-3.5 py-2 bg-void border border-steel/30 hover:border-acid text-steel hover:text-acid text-xs font-mono uppercase rounded transition-colors inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>View Request &amp; Timeline</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
