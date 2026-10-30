import React from "react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { initialProductsFallback } from "@/lib/products";
import { getAdminKPIs } from "@/lib/admin/admin-data";
import { formatINR } from "@/lib/utils";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import {
  IndianRupee,
  Package,
  Truck,
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboardPage() {
  await requireAdmin();
  let recentOrders: any[] = [];
  let lowStockProducts: any[] = [];
  let pendingRequests: any[] = [];

  // Fetch consolidated database aggregates without loading full tables into memory
  const metrics = await getAdminKPIs();

  try {
    const supabase = createAdminClient();
    const [recentOrdersRes, lowStockRes, requestsRes] = await Promise.all([
      // Only fetch 5 recent active (unarchived) orders
      supabase
        .from("orders")
        .select("id, order_number, customer_name, shipping_city, shipping_state, total_paise, payment_method, status, payment_status, delivery_mode, created_at")
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
      // Only fetch active low stock products
      supabase
        .from("products")
        .select("id, title, cans_count, price_paise, stock_count")
        .eq("is_active", true)
        .eq("is_made_to_order", false)
        .lte("stock_count", 3)
        .order("stock_count", { ascending: true })
        .limit(5),
      // Only fetch pending custom requests
      supabase
        .from("custom_requests")
        .select("id, name, concept_description, budget_inr, status, created_at")
        .in("status", ["new", "reviewing", "reviewed", "quoted", "in_discussion"])
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (recentOrdersRes.data) {
      recentOrders = recentOrdersRes.data;
    }
    if (lowStockRes.data) {
      lowStockProducts = lowStockRes.data;
    }
    if (requestsRes.data) {
      pendingRequests = requestsRes.data;
    }
  } catch (err) {
    console.error("[Admin Dashboard] Supabase fetch error:", err);
  }

  // Fallback products if catalog is completely empty in test environment
  if (lowStockProducts.length === 0 && metrics.lowStockCount === 0) {
    // None needed if stock is sufficient
  }

  // Dynamic shipment title and caption based on delivery mode (Jaipur local vs courier)
  const isOnlyLocalPending = metrics.pendingDeliveryCount > 0 && metrics.pendingCourierCount === 0;
  const isMixedPending = metrics.pendingDeliveryCount > 0 && metrics.pendingCourierCount > 0;
  const pendingShipmentsTitle = isOnlyLocalPending
    ? "Pending Delivery"
    : isMixedPending
    ? "Pending Fulfillment"
    : "Pending Shipments";

  const pendingShipmentsCaption = isOnlyLocalPending
    ? "Jaipur local orders awaiting hand-delivery"
    : isMixedPending
    ? `${metrics.pendingCourierCount} courier • ${metrics.pendingDeliveryCount} Jaipur hand-delivery`
    : "Paid / confirmed orders awaiting courier pickup";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-subtle pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-acid">
            Workshop Console
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wider text-bone mt-1">
            Studio Dashboard
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            Pan-India handmade relic production, order fulfillment & inventory tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-acid text-void hover:bg-bone transition-colors text-xs font-mono font-bold uppercase tracking-wider rounded"
          >
            <Plus className="w-4 h-4" />
            <span>New Sculpture</span>
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-ash border border-subtle hover:border-steel text-bone transition-colors text-xs font-mono uppercase tracking-wider rounded"
          >
            <Package className="w-4 h-4 text-acid" />
            <span>View Orders ({metrics.totalOrdersCount})</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="relative bg-ash border border-subtle p-5 rounded">
          <FiligreeCorner position="top-right" size={14} />
          <div className="flex items-center justify-between text-muted text-xs font-mono uppercase">
            <span>Total Gross Revenue</span>
            <IndianRupee className="w-4 h-4 text-acid" />
          </div>
          <div className="mt-3 font-heading text-3xl text-bone">
            {formatINR(metrics.totalRevenuePaise)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-muted">
            <span className="text-acid">●</span>
            <span>Paid online + COD cash collected, minus refunds</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="relative bg-ash border border-subtle p-5 rounded">
          <FiligreeCorner position="top-right" size={14} />
          <div className="flex items-center justify-between text-muted text-xs font-mono uppercase">
            <span>Total Orders</span>
            <Package className="w-4 h-4 text-steel" />
          </div>
          <div className="mt-3 font-heading text-3xl text-bone">
            {metrics.totalOrdersCount}
          </div>
          <div className="mt-2 text-[11px] font-mono text-muted">
            <span>Paid online & active COD placed (excludes unpaid & cancelled)</span>
          </div>
        </div>

        {/* Pending Shipments / Pending Delivery */}
        <div className="relative bg-ash border border-subtle p-5 rounded">
          <FiligreeCorner position="top-right" size={14} />
          <div className="flex items-center justify-between text-muted text-xs font-mono uppercase">
            <span>{pendingShipmentsTitle}</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 font-heading text-3xl text-amber-400">
            {metrics.pendingShipmentsCount}
          </div>
          <div className="mt-2 text-[11px] font-mono text-muted">
            <span>{pendingShipmentsCaption}</span>
          </div>
        </div>

        {/* COD Cash Collected Today */}
        <div className="relative bg-ash border border-subtle p-5 rounded">
          <FiligreeCorner position="top-right" size={14} />
          <div className="flex items-center justify-between text-muted text-xs font-mono uppercase">
            <span>COD Collected Today</span>
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 font-heading text-3xl text-emerald-400">
            {formatINR(metrics.codCollectedTodayPaise)}
          </div>
          <div className="mt-2 text-[11px] font-mono text-muted">
            <span>Cash collected today (IST 00:00–23:59) for local delivery</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="relative bg-ash border border-subtle p-5 rounded">
          <FiligreeCorner position="top-right" size={14} />
          <div className="flex items-center justify-between text-muted text-xs font-mono uppercase">
            <span>Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-blood" />
          </div>
          <div className="mt-3 font-heading text-3xl text-blood">
            {metrics.lowStockCount}
          </div>
          <div className="mt-2 text-[11px] font-mono text-muted">
            <span>Active sculptures with ≤ 3 ready units</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Inventory Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Orders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl uppercase tracking-wider text-bone flex items-center gap-2">
              <Clock className="w-4 h-4 text-acid" />
              <span>Recent Orders</span>
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-mono text-acid hover:underline flex items-center gap-1"
            >
              <span>View All ({metrics.totalOrdersCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-ash border border-subtle rounded overflow-hidden">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-muted text-xs font-mono">
                No active orders registered yet. Real customer payments will appear here automatically.
              </div>
            ) : (
              <div className="divide-y divide-subtle/60">
                {recentOrders.map((ord) => {
                  const statusColors: Record<string, string> = {
                    paid: "bg-acid/10 border-acid text-acid",
                    processing: "bg-blue-500/10 border-blue-500 text-blue-400",
                    shipped: "bg-amber-500/10 border-amber-500 text-amber-400",
                    delivered: "bg-emerald-500/10 border-emerald-500 text-emerald-400",
                    pending_payment: "bg-neutral-800 border-neutral-700 text-neutral-400",
                    pending: "bg-amber-500/10 border-amber-500 text-amber-400",
                    cancelled: "bg-blood/10 border-blood text-blood",
                  };

                  const currentStatus = ord.status || ord.payment_status || "pending";
                  const badgeClass =
                    statusColors[currentStatus] || "bg-subtle text-muted";

                  const orderAmountPaise =
                    typeof ord.total_paise === "number"
                      ? ord.total_paise
                      : Math.round((Number(ord.total_amount) || 0) * 100);

                  const cityName = ord.shipping_city || ord.city || "India";
                  const stateName = ord.shipping_state || ord.state || "";

                  return (
                    <div
                      key={ord.id}
                      className="p-4 sm:px-6 hover:bg-void/40 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-bone text-sm">
                            {ord.order_number || ord.id.slice(0, 10)}
                          </span>
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 border rounded-sm ${badgeClass}`}
                          >
                            {String(currentStatus).replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-muted">
                          {ord.customer_name || "Collector"} • {cityName}
                          {stateName ? `, ${stateName}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <p className="font-mono text-sm text-acid font-bold">
                            {formatINR(orderAmountPaise)}
                          </p>
                          <p className="text-[10px] font-mono text-muted uppercase">
                            {ord.payment_method || "razorpay"}
                          </p>
                        </div>

                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="px-3 py-1.5 bg-void border border-subtle hover:border-acid text-xs font-mono text-bone hover:text-acid transition-colors rounded"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Low Stock & Commission Inquiries */}
        <div className="space-y-6">
          {/* Low Stock Warning */}
          <div className="bg-ash border border-subtle p-5 rounded space-y-4">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <h3 className="font-heading text-base uppercase text-bone flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-blood" />
                <span>Inventory Alert</span>
              </h3>
              <Link
                href="/admin/products"
                className="text-[11px] font-mono text-muted hover:text-bone underline"
              >
                Catalog
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-muted font-mono py-2">
                All sculptures have sufficient stock on hand.
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-void/60 border border-blood/30 rounded flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-bone truncate max-w-[180px]">
                        {p.title}
                      </p>
                      <p className="text-[10px] font-mono text-muted">
                        {p.cans_count} Cans • {formatINR(p.price_paise)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-xs px-2 py-0.5 bg-blood/10 text-blood border border-blood/30 rounded font-bold">
                        {p.stock_count ?? p.stock ?? 0} Left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Commissions */}
          <div className="bg-ash border border-subtle p-5 rounded space-y-4">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <h3 className="font-heading text-base uppercase text-bone flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-acid" />
                <span>Custom Inquiries</span>
              </h3>
              <Link
                href="/admin/custom-requests"
                className="text-[11px] font-mono text-acid hover:underline"
              >
                View ({pendingRequests.length})
              </Link>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="text-xs text-muted font-mono py-2">
                No new commission inquiries waiting.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 2).map((req) => (
                  <div key={req.id} className="p-3 bg-void/60 border border-subtle rounded space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-bone font-bold">{req.name}</span>
                      <span className="text-[10px] text-acid uppercase px-1.5 py-0.5 bg-acid/10 border border-acid/30 rounded">
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted line-clamp-2">
                      {req.concept_description}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-muted">
                      <span>{req.budget_inr || "Budget unspecified"}</span>
                      <Link
                        href="/admin/custom-requests"
                        className="text-acid hover:underline flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
