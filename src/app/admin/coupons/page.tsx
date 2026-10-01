"use client";

import React, { useState, useEffect } from "react";
import { Coupon } from "@/types/shop";
import { CouponDiscountType } from "@/types/database.types";
import { formatINR } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { ClawButton } from "@/components/ui/claw-button";
import {
  Tag,
  Plus,
  Trash2,
  Check,
  X,
  Calendar,
  Percent,
  IndianRupee,
  AlertCircle,
  Copy,
} from "lucide-react";

export default function AdminCouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<CouponDiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderRupees, setMinOrderRupees] = useState<number>(999);
  const [maxDiscountRupees, setMaxDiscountRupees] = useState<number | "">("");
  const [usageLimit, setUsageLimit] = useState<number | "">("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (data.coupons) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.error("Failed to load coupons", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggleActive = async (id: string, current: boolean) => {
    const nextState = !current;
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: nextState } : c))
    );

    try {
      await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: nextState }),
      });
      showToast(nextState ? "Coupon activated" : "Coupon paused", "info");
    } catch {
      showToast("Failed to update coupon", "error");
      fetchCoupons();
    }
  };

  const handleDeleteCoupon = async (id: string, couponCode: string) => {
    if (!confirm(`Delete coupon ${couponCode}? This cannot be undone.`)) return;

    setCoupons((prev) => prev.filter((c) => c.id !== id));
    try {
      await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
      showToast(`Coupon ${couponCode} deleted`, "success");
    } catch {
      showToast("Failed to delete coupon", "error");
      fetchCoupons();
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const minOrderPaise = Math.round(Number(minOrderRupees) * 100);
      const maxDiscountPaise =
        maxDiscountRupees !== "" ? Math.round(Number(maxDiscountRupees) * 100) : null;
      const parsedUsageLimit = usageLimit !== "" ? Number(usageLimit) : null;

      // If flat discount, convert discount value in rupees to paise
      const finalDiscountValue =
        discountType === "flat"
          ? Math.round(Number(discountValue) * 100)
          : Number(discountValue);

      const payload = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: finalDiscountValue,
        min_order_paise: minOrderPaise,
        max_discount_paise: maxDiscountPaise,
        usage_limit: parsedUsageLimit,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: isActive,
      };

      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create coupon");

      showToast(`Coupon ${payload.code} created successfully!`, "success");
      setShowCreateModal(false);
      setCode("");
      fetchCoupons();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error creating coupon", "error");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Code ${text} copied to clipboard!`, "info");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-subtle pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-acid">
            Promotions & Discounts
          </span>
          <h1 className="font-heading text-3xl uppercase tracking-wider text-bone mt-1">
            Studio Coupons
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            Create and track promo codes, percentage cuts, and minimum cart thresholds.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-acid text-void hover:bg-bone transition-colors text-xs font-mono font-bold uppercase tracking-wider rounded self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Coupon</span>
        </button>
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-ash border border-subtle p-6 rounded shadow-2xl">
            <FiligreeCorner position="top-right" size={16} />
            <div className="flex items-center justify-between border-b border-subtle pb-3 mb-4">
              <h2 className="font-heading text-xl uppercase text-bone flex items-center gap-2">
                <Tag className="w-4 h-4 text-acid" />
                <span>Create New Coupon</span>
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted hover:text-bone p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MONSOON20 or CLAW10"
                  className="w-full bg-void border border-subtle px-3 py-2 text-sm text-bone font-mono uppercase tracking-wider focus:border-acid focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
                    className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone focus:border-acid focus:outline-none"
                  >
                    <option value="percentage">Percentage (%) Off</option>
                    <option value="flat">Flat Amount (₹) Off</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Discount Value * {discountType === "percentage" ? "(%)" : "(₹)"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    placeholder={discountType === "percentage" ? "10" : "500"}
                    className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minOrderRupees}
                    onChange={(e) => setMinOrderRupees(Number(e.target.value))}
                    className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={maxDiscountRupees}
                    onChange={(e) =>
                      setMaxDiscountRupees(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="e.g. 500 (optional)"
                    className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Usage Limit (Max Uses)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={usageLimit}
                    onChange={(e) =>
                      setUsageLimit(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="e.g. 100 (optional)"
                    className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-bone">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-acid w-4 h-4 rounded"
                  />
                  <span>Active Immediately</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 bg-void border border-subtle text-muted text-xs font-mono uppercase rounded hover:text-bone"
                  >
                    Cancel
                  </button>
                  <ClawButton
                    type="submit"
                    disabled={creating}
                    variant="acid"
                    className="text-xs py-1.5 px-4"
                  >
                    {creating ? "CREATING..." : "SAVE COUPON"}
                  </ClawButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-ash border border-subtle rounded overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-muted font-mono text-xs">
            Loading coupon database...
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-muted font-mono text-xs">
            No discount coupons created yet. Click &quot;New Coupon&quot; to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-subtle bg-void/50 text-[11px] font-mono text-muted uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min Order</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Expiry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle/60 text-xs font-mono">
                {coupons.map((c) => {
                  const isExpired =
                    c.expires_at && new Date(c.expires_at) < new Date();

                  const discountLabel =
                    c.discount_type === "percentage"
                      ? `${c.discount_value}% OFF`
                      : `${formatINR(c.discount_value)} OFF`;

                  return (
                    <tr key={c.id} className="hover:bg-void/40 transition-colors">
                      {/* Code */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-bone text-sm tracking-wider">
                            {c.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(c.code)}
                            className="p-1 text-muted hover:text-acid transition-colors"
                            title="Copy code"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="py-4 px-4 font-bold text-acid">
                        {discountLabel}
                        {c.max_discount_paise && (
                          <span className="block text-[10px] text-muted font-normal">
                            Max {formatINR(c.max_discount_paise)}
                          </span>
                        )}
                      </td>

                      {/* Min Order */}
                      <td className="py-4 px-4 text-muted">
                        {c.min_order_paise > 0
                          ? formatINR(c.min_order_paise)
                          : "No minimum"}
                      </td>

                      {/* Usage */}
                      <td className="py-4 px-4 text-muted">
                        <span className="text-bone font-bold">{c.times_used}</span>
                        {c.usage_limit ? ` / ${c.usage_limit} uses` : " / Unlimited"}
                      </td>

                      {/* Expiry */}
                      <td className="py-4 px-4">
                        {c.expires_at ? (
                          <span
                            className={
                              isExpired ? "text-blood font-bold" : "text-muted"
                            }
                          >
                            {new Date(c.expires_at).toLocaleDateString("en-IN")}
                            {isExpired && " (Expired)"}
                          </span>
                        ) : (
                          <span className="text-muted/60">Never</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c.id, c.is_active)}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase rounded border transition-colors ${
                            c.is_active && !isExpired
                              ? "bg-acid/10 border-acid text-acid"
                              : "bg-void border-subtle text-muted"
                          }`}
                        >
                          {c.is_active && !isExpired ? (
                            <>
                              <Check className="w-3 h-3 text-acid" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 text-muted" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCoupon(c.id, c.code)}
                          className="p-1.5 text-muted hover:text-blood hover:bg-blood/10 rounded transition-colors"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
