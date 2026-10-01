"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Order } from "@/types/shop";
import { formatINR } from "@/lib/utils";
import {
  Package,
  Search,
  Download,
  Truck,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      statusFilter === "all" || o.status === statusFilter;
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      o.order_number.toLowerCase().includes(query) ||
      o.customer_name.toLowerCase().includes(query) ||
      o.customer_email.toLowerCase().includes(query) ||
      o.customer_phone.includes(query) ||
      o.shipping_city.toLowerCase().includes(query) ||
      o.shipping_state.toLowerCase().includes(query) ||
      (o.tracking_number && o.tracking_number.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;

    const headers = [
      "Order Number",
      "Date",
      "Status",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Address Line 1",
      "Address Line 2",
      "City",
      "State",
      "Pincode",
      "Subtotal (INR)",
      "Discount (INR)",
      "Shipping Fee (INR)",
      "Total (INR)",
      "Payment Method",
      "Razorpay Order ID",
      "Razorpay Payment ID",
      "Courier Name",
      "Tracking Number",
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.order_number}"`,
      `"${new Date(o.created_at).toLocaleString("en-IN")}"`,
      `"${o.status}"`,
      `"${o.customer_name.replace(/"/g, '""')}"`,
      `"${o.customer_email}"`,
      `"${o.customer_phone}"`,
      `"${o.shipping_address_line1.replace(/"/g, '""')}"`,
      `"${(o.shipping_address_line2 || "").replace(/"/g, '""')}"`,
      `"${o.shipping_city}"`,
      `"${o.shipping_state}"`,
      `"${o.shipping_pincode}"`,
      (o.subtotal_paise / 100).toFixed(2),
      (o.discount_paise / 100).toFixed(2),
      (o.shipping_fee_paise / 100).toFixed(2),
      (o.total_paise / 100).toFixed(2),
      `"${o.payment_method}"`,
      `"${o.razorpay_order_id || ""}"`,
      `"${o.razorpay_payment_id || ""}"`,
      `"${o.courier_name || ""}"`,
      `"${o.tracking_number || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `clawcraft-orders-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusColors: Record<string, string> = {
    paid: "bg-acid/10 border-acid text-acid",
    processing: "bg-blue-500/10 border-blue-500 text-blue-400",
    shipped: "bg-amber-500/10 border-amber-500 text-amber-400",
    delivered: "bg-emerald-500/10 border-emerald-500 text-emerald-400",
    pending_payment: "bg-neutral-800 border-neutral-700 text-neutral-400",
    cancelled: "bg-blood/10 border-blood text-blood",
    refunded: "bg-purple-500/10 border-purple-500 text-purple-400",
  };

  const getStatusCount = (st: string) => {
    if (st === "all") return orders.length;
    return orders.filter((o) => o.status === st).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-subtle pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-acid">
            Fulfillment Console
          </span>
          <h1 className="font-heading text-3xl uppercase tracking-wider text-bone mt-1">
            Orders & Shipments
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            Track customer payments, dispatch courier AWBs and monitor package transit.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredOrders.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-ash border border-subtle hover:border-steel text-bone disabled:opacity-50 text-xs font-mono uppercase tracking-wider rounded transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-acid" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer, phone, city, AWB..."
            className="w-full pl-9 pr-3.5 py-2 bg-ash border border-subtle text-xs text-bone placeholder:text-muted focus:border-acid focus:outline-none rounded font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {[
            { id: "all", label: "All" },
            { id: "paid", label: "Paid" },
            { id: "processing", label: "Processing" },
            { id: "shipped", label: "Shipped" },
            { id: "delivered", label: "Delivered" },
            { id: "pending_payment", label: "Pending Payment" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => {
            const count = getStatusCount(tab.id);
            const isSelected = statusFilter === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors whitespace-nowrap flex items-center gap-2 ${
                  isSelected
                    ? "bg-acid text-void font-bold"
                    : "bg-ash border border-subtle text-muted hover:text-bone"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? "bg-void text-acid" : "bg-void text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-ash border border-subtle rounded overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-muted font-mono text-xs">
            Loading order database...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-muted font-mono text-xs">
            No orders found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-subtle bg-void/50 text-[11px] font-mono text-muted uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle/60 text-xs">
                {filteredOrders.map((ord) => {
                  const badgeClass =
                    statusColors[ord.status] || "bg-subtle text-muted";

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-void/40 transition-colors group"
                    >
                      {/* Order Number & Date */}
                      <td className="py-4 px-4 sm:px-6">
                        <div>
                          <p className="font-mono font-bold text-bone text-sm group-hover:text-acid transition-colors">
                            {ord.order_number}
                          </p>
                          <p className="text-[11px] font-mono text-muted mt-0.5">
                            {new Date(ord.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-bold text-bone">{ord.customer_name}</p>
                          <p className="text-[11px] text-muted font-mono">
                            {ord.customer_phone}
                          </p>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="py-4 px-4 font-mono text-muted">
                        <span>
                          {ord.shipping_city}, {ord.shipping_state}
                        </span>
                        <span className="block text-[10px] text-muted/70">
                          PIN: {ord.shipping_pincode}
                        </span>
                      </td>

                      {/* Total & Payment */}
                      <td className="py-4 px-4 font-mono">
                        <p className="font-bold text-bone text-sm">
                          {formatINR(ord.total_paise)}
                        </p>
                        <p className="text-[10px] text-muted uppercase">
                          {ord.payment_method}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block text-[10px] font-mono uppercase px-2.5 py-0.5 border rounded-sm ${badgeClass}`}
                        >
                          {ord.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Courier / AWB */}
                      <td className="py-4 px-4">
                        {ord.courier_name && ord.tracking_number ? (
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-bold text-bone flex items-center gap-1">
                              <Truck className="w-3 h-3 text-acid" />
                              {ord.courier_name}
                            </span>
                            <span className="text-[10px] font-mono text-acid block">
                              {ord.tracking_number}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-muted/60">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-void border border-subtle hover:border-acid text-bone hover:text-acid text-xs font-mono uppercase tracking-wider rounded transition-colors"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
