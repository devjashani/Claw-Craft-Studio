"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Order, OrderItem } from "@/types/shop";
import { OrderStatus } from "@/types/database.types";
import { formatINR } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { ClawButton } from "@/components/ui/claw-button";
import { PRODUCT_IMAGE_MAP } from "@/lib/product-media";
import {
  ArrowLeft,
  Printer,
  Download,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  CreditCard,
  FileText,
  Save,
  Send,
  ExternalLink,
} from "lucide-react";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for fulfillment & notes
  const [status, setStatus] = useState<OrderStatus>("paid");
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [savingFulfillment, setSavingFulfillment] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        const data = await res.json();
        if (data.order) {
          setOrder(data.order);
          setItems(data.items || []);
          setStatus(data.order.status);
          setCourierName(data.order.courier_name || "");
          setTrackingNumber(data.order.tracking_number || "");
          setTrackingUrl(data.order.tracking_url || "");
          setEstimatedDelivery(data.order.estimated_delivery_date || "");
          setAdminNotes(data.order.admin_notes || "");
        }
      } catch (err) {
        console.error("Error loading order", err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    setStatus(newStatus);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Order status updated to ${newStatus}`, "success");
        if (order) setOrder({ ...order, status: newStatus });
      }
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const handleSaveFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFulfillment(true);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status === "paid" || status === "processing" ? "shipped" : status,
          courier_name: courierName.trim() || null,
          tracking_number: trackingNumber.trim() || null,
          tracking_url: trackingUrl.trim() || null,
          estimated_delivery_date: estimatedDelivery || null,
          notify_customer: notifyCustomer,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update fulfillment");

      showToast(
        notifyCustomer && trackingNumber
          ? "Fulfillment saved & shipping update emailed to customer!"
          : "Fulfillment details updated!",
        "success"
      );

      if (data.order) {
        setOrder(data.order);
        setStatus(data.order.status);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error saving", "error");
    } finally {
      setSavingFulfillment(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: adminNotes.trim() || null }),
      });
      if (res.ok) {
        showToast("Workshop internal notes saved", "success");
      }
    } catch {
      showToast("Failed to save notes", "error");
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted font-mono text-xs">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-heading text-2xl uppercase text-bone">Order Not Found</h1>
        <p className="text-xs text-muted font-mono">
          Unable to locate order with ID {orderId}.
        </p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-ash border border-subtle text-bone text-xs font-mono uppercase rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </Link>
      </div>
    );
  }

  const cleanPhone = order.customer_phone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Hello ${order.customer_name}, this is CLAWCRAFT Studio regarding your order ${order.order_number}.`
  )}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-subtle pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 bg-ash border border-subtle hover:border-steel text-muted hover:text-bone rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl sm:text-3xl uppercase text-bone tracking-wide">
                {order.order_number}
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-acid/10 border border-acid text-acid rounded">
                {order.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-muted font-mono mt-1">
              Placed on {new Date(order.created_at).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`/api/orders/${order.id}/slip?t=${order.public_token || ""}&admin=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-acid text-void font-bold text-xs font-mono rounded hover:bg-bone transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Slip (PDF)</span>
          </a>

          <Link
            href={`/admin/orders/${order.id}/invoice`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-ash border border-subtle hover:border-steel text-xs font-mono text-bone rounded transition-colors"
          >
            <Printer className="w-4 h-4 text-acid" />
            <span>Print Tax Invoice</span>
          </Link>

          <Link
            href={`/track?number=${order.order_number}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-void border border-subtle hover:border-acid text-xs font-mono text-muted hover:text-acid rounded transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Customer Track View</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Items & Fulfillment Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Quick Changer */}
          <div className="relative bg-ash border border-subtle p-5 rounded space-y-3">
            <FiligreeCorner position="top-right" size={12} />
            <h2 className="font-heading text-sm uppercase text-bone">
              Order Fulfillment Stage
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {[
                "pending_payment",
                "paid",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleUpdateStatus(st as OrderStatus)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors border ${
                    status === st
                      ? "bg-acid text-void font-bold border-acid"
                      : "bg-void border-subtle text-muted hover:text-bone"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Courier Assignment & Shipping Dispatch Form */}
          <div className="relative bg-ash border border-subtle p-6 rounded space-y-4">
            <FiligreeCorner position="top-right" size={14} />
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <h2 className="font-heading text-base uppercase text-bone flex items-center gap-2">
                <Truck className="w-4 h-4 text-acid" />
                <span>Courier Assignment & Tracking</span>
              </h2>
              {order.tracking_number && (
                <span className="text-[11px] font-mono text-acid bg-acid/10 px-2 py-0.5 rounded border border-acid/30">
                  AWB Active
                </span>
              )}
            </div>

            <form onSubmit={handleSaveFulfillment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Courier Partner Name
                  </label>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="e.g. Bluedart / Delhivery / DTDC / Shiprocket"
                    className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone focus:border-acid focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Tracking / AWB Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. BD12345678IN"
                    className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Tracking Direct URL
                  </label>
                  <input
                    type="url"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="https://track.bluedart.com/..."
                    className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Estimated Delivery Date
                  </label>
                  <input
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-muted">
                  <input
                    type="checkbox"
                    checked={notifyCustomer}
                    onChange={(e) => setNotifyCustomer(e.target.checked)}
                    className="accent-acid w-4 h-4 rounded"
                  />
                  <span>Dispatch automated tracking email to {order.customer_email}</span>
                </label>

                <ClawButton
                  type="submit"
                  disabled={savingFulfillment}
                  variant="acid"
                  className="text-xs py-2 px-4 self-start sm:self-auto"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5 inline" />
                  {savingFulfillment ? "SAVING..." : "SAVE & DISPATCH AWB"}
                </ClawButton>
              </div>
            </form>
          </div>

          {/* Purchased Relics Table */}
          <div className="bg-ash border border-subtle rounded overflow-hidden">
            <div className="p-4 border-b border-subtle">
              <h2 className="font-heading text-base uppercase text-bone">
                Handcrafted Relics In This Order ({items.length})
              </h2>
            </div>

            <div className="divide-y divide-subtle/60">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 relative bg-void border border-subtle rounded overflow-hidden shrink-0">
                      <Image
                        src={
                          item.image_url
                            ? item.image_url.endsWith(".jpg")
                              ? item.image_url.replace(".jpg", "-v2.png")
                              : item.image_url
                            : PRODUCT_IMAGE_MAP["8-can-gun-sculpture"]
                        }
                        alt={item.product_title}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-bone text-sm">
                        {item.product_title}
                      </p>
                      {item.variant_label && (
                        <p className="text-xs text-acid font-mono">
                          Variant: {item.variant_label}
                          {item.selected_option ? ` (${item.selected_option})` : ""}
                        </p>
                      )}
                      <p className="text-xs text-muted font-mono">
                        Qty: {item.quantity} × {formatINR(item.unit_price_paise)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono font-bold text-bone">
                    {formatINR(item.total_price_paise)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals Summary */}
            <div className="p-4 bg-void/60 border-t border-subtle space-y-2 text-xs font-mono">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatINR(order.subtotal_paise)}</span>
              </div>
              {order.discount_paise > 0 && (
                <div className="flex justify-between text-acid">
                  <span>Discount</span>
                  <span>- {formatINR(order.discount_paise)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Shipping Fee</span>
                <span>
                  {order.shipping_fee_paise === 0
                    ? "FREE"
                    : formatINR(order.shipping_fee_paise)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-bone pt-2 border-t border-subtle">
                <span>Total Amount Paid</span>
                <span className="text-acid">{formatINR(order.total_paise)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Customer, Address, Payment & Notes */}
        <div className="space-y-6">
          {/* Customer & Shipping Destination */}
          <div className="bg-ash border border-subtle p-5 rounded space-y-4">
            <h3 className="font-heading text-sm uppercase text-bone flex items-center gap-2">
              <MapPin className="w-4 h-4 text-acid" />
              <span>Customer & Destination</span>
            </h3>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-bone text-sm">{order.customer_name}</p>

              <div className="space-y-1 text-muted font-mono">
                <a
                  href={`mailto:${order.customer_email}`}
                  className="flex items-center gap-2 hover:text-acid transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-steel" />
                  <span>{order.customer_email}</span>
                </a>

                <a
                  href={`tel:${order.customer_phone}`}
                  className="flex items-center gap-2 hover:text-acid transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-steel" />
                  <span>+91 {order.customer_phone}</span>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-emerald-950/40 border border-emerald-600/40 text-emerald-400 hover:bg-emerald-900/40 rounded text-[11px] transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Direct WhatsApp Chat</span>
                </a>
              </div>

              <div className="pt-3 border-t border-subtle space-y-1">
                <p className="text-[10px] font-mono text-muted uppercase">
                  Delivery Address:
                </p>
                <p className="text-bone">{order.shipping_address_line1}</p>
                {order.shipping_address_line2 && (
                  <p className="text-bone">{order.shipping_address_line2}</p>
                )}
                <p className="text-bone">
                  {order.shipping_city}, {order.shipping_state} -{" "}
                  <span className="font-mono text-acid font-bold">
                    {order.shipping_pincode}
                  </span>
                </p>
                <p className="text-[10px] text-muted font-mono">India</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-ash border border-subtle p-5 rounded space-y-3">
            <h3 className="font-heading text-sm uppercase text-bone flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-acid" />
              <span>Payment Details</span>
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-subtle">
                <span className="text-muted">Method:</span>
                <span className="text-bone uppercase">{order.payment_method}</span>
              </div>
              {order.razorpay_order_id && (
                <div className="space-y-0.5 py-1 border-b border-subtle">
                  <span className="text-muted text-[10px]">Razorpay Order ID:</span>
                  <span className="text-bone text-[11px] block truncate">
                    {order.razorpay_order_id}
                  </span>
                </div>
              )}
              {order.razorpay_payment_id && (
                <div className="space-y-0.5 py-1 border-b border-subtle">
                  <span className="text-muted text-[10px]">Payment ID:</span>
                  <span className="text-acid text-[11px] block truncate font-bold">
                    {order.razorpay_payment_id}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Workshop Internal Notes */}
          <div className="bg-ash border border-subtle p-5 rounded space-y-3">
            <h3 className="font-heading text-sm uppercase text-bone flex items-center gap-2">
              <FileText className="w-4 h-4 text-steel" />
              <span>Workshop Notes</span>
            </h3>
            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal artisan notes (e.g. customized stand, client packaging requests)..."
              className="w-full bg-void border border-subtle p-2.5 text-xs text-bone font-mono focus:border-acid focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="w-full py-2 bg-void border border-subtle hover:border-steel text-xs font-mono text-bone uppercase rounded transition-colors"
            >
              {savingNotes ? "Saving Notes..." : "Save Notes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
