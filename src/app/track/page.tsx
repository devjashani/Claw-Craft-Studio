"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Order, OrderItem } from "@/types/shop";
import { formatINR } from "@/lib/utils";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function TrackOrderPage() {
  const [orderIdentifier, setOrderIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    order: Order;
    items: OrderItem[];
  } | null>(null);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdentifier.trim() || !phone.trim()) {
      setError("Please provide both Order Number and Phone Number.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIdentifier: orderIdentifier.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.order) {
        setResult(data);
      } else {
        setError(data.error || "Order not found. Please verify details.");
      }
    } catch {
      setError("Unable to connect to studio tracking servers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: "Order Received", status: "paid" },
    { label: "Artisan Inspection", status: "processing" },
    { label: "Armor Packed & Shipped", status: "shipped" },
    { label: "Delivered", status: "delivered" },
  ];

  const currentStepIndex =
    result?.order.status === "delivered"
      ? 3
      : result?.order.status === "shipped"
      ? 2
      : result?.order.status === "processing"
      ? 1
      : 0;

  return (
    <div className="min-h-screen bg-void py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-2 font-mono text-xs text-acid uppercase tracking-widest">
            <Truck className="w-3.5 h-3.5" />
            <span>DISPATCH & SHIPMENT PORTAL</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-display uppercase tracking-tight text-bone mb-3">
            TRACK YOUR RELIC
          </h1>
          <p className="font-sans text-xs sm:text-sm text-steel leading-relaxed">
            Enter your Order Reference Number (e.g., CC-2026-XXXX) and registered
            mobile number to view real-time assembly and transit status.
          </p>
        </div>

        {/* Search Box */}
        <div className="relative p-6 sm:p-8 rounded-sm border-2 border-steel/20 bg-ash/70 backdrop-blur-md">
          <FiligreeCorner position="top-left" size={24} variant="acid" />
          <FiligreeCorner position="bottom-right" size={24} variant="acid" />

          <form
            onSubmit={handleTrackSubmit}
            className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end"
          >
            <div className="sm:col-span-5 font-mono text-xs">
              <label className="block text-steel uppercase mb-1">
                Order ID / Number *
              </label>
              <input
                type="text"
                placeholder="CC-2026-1001"
                value={orderIdentifier}
                onChange={(e) => setOrderIdentifier(e.target.value.toUpperCase())}
                className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2.5 text-bone uppercase focus:outline-none focus:border-acid"
              />
            </div>

            <div className="sm:col-span-5 font-mono text-xs">
              <label className="block text-steel uppercase mb-1">
                Registered Mobile Phone *
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2.5 text-bone focus:outline-none focus:border-acid"
              />
            </div>

            <div className="sm:col-span-2">
              <ClawButton
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
                className="w-full h-10"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-1.5" /> Track
                  </>
                )}
              </ClawButton>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-sm bg-blood/10 border border-blood/40 text-blood font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Tracking Results */}
        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Status Stepper */}
            <div className="p-6 rounded-sm border border-steel/20 bg-ash/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-steel/20 pb-4 mb-6 gap-2">
                <div>
                  <span className="font-mono text-xs text-acid uppercase tracking-widest">
                    CURRENT STATE: {result.order.status.toUpperCase()}
                  </span>
                  <h3 className="font-display uppercase text-2xl text-bone">
                    ORDER #{result.order.order_number}
                  </h3>
                </div>
                <div className="font-mono text-xs text-steel">
                  Total: {formatINR(result.order.total_paise)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {steps.map((s, idx) => {
                  const isPast = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div
                      key={s.label}
                      className={`p-4 rounded-sm border text-center font-mono text-xs ${
                        isCurrent
                          ? "border-acid bg-acid/10 text-bone shadow-acid"
                          : isPast
                          ? "border-steel/40 bg-void/50 text-steel"
                          : "border-steel/10 bg-void/20 text-steel/40"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full mx-auto mb-2 flex items-center justify-center text-[10px] font-bold ${
                          isPast ? "bg-acid text-void" : "bg-steel/20 text-steel"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="block font-bold">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Courier Tracking Link */}
              {result.order.tracking_number ? (
                <div className="mt-6 p-4 rounded-sm bg-void border border-acid/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
                  <div>
                    <span className="text-steel">Courier Partner: </span>
                    <strong className="text-bone">
                      {result.order.courier_name || "Express Courier"}
                    </strong>
                    <br />
                    <span className="text-steel">Tracking Airway Bill: </span>
                    <strong className="text-acid">
                      {result.order.tracking_number}
                    </strong>
                  </div>

                  {result.order.tracking_url && (
                    <a
                      href={result.order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-acid text-void font-bold hover:bg-bone transition-colors"
                    >
                      <span>Track on Courier Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="mt-6 p-4 rounded-sm bg-void border border-steel/20 text-xs font-mono text-steel">
                  Our artisan is currently completing final joint stabilization
                  and shock padding. Tracking number will be emailed and updated
                  here upon handover to the courier.
                </div>
              )}
            </div>

            {/* Items Summary */}
            <div className="p-6 rounded-sm border border-steel/20 bg-ash/40">
              <h4 className="font-display uppercase text-lg text-bone mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-acid" /> ITEMS IN SHIPMENT
              </h4>

              <div className="divide-y divide-steel/10">
                {result.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-display uppercase text-sm text-bone">
                        {item.product_title}
                      </p>
                      <p className="font-mono text-xs text-steel">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold text-bone">
                      {formatINR(item.total_price_paise)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
