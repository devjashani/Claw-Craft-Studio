"use client";

import React, { useState, useEffect } from "react";
import { SiteSettingsMap } from "@/lib/admin/admin-data";
import { formatINR } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { ClawButton } from "@/components/ui/claw-button";
import {
  Settings,
  Truck,
  IndianRupee,
  Megaphone,
  Phone,
  Mail,
  ShieldCheck,
  Save,
  CheckCircle2,
  FileText,
} from "lucide-react";

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states (converted to rupees for user convenience)
  const [flatShippingRupees, setFlatShippingRupees] = useState(149);
  const [freeShippingThresholdRupees, setFreeShippingThresholdRupees] = useState(2999);
  const [enableCod, setEnableCod] = useState(false);
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [announcementText, setAnnouncementText] = useState(
    "HANDCRAFTED FROM CLEANED RECYCLED CANS • FREE PAN-INDIA SHIPPING ON ORDERS ABOVE ₹2,999"
  );
  const [whatsappNumber, setWhatsappNumber] = useState("919876543210");
  const [adminNotificationEmail, setAdminNotificationEmail] = useState("studio@clawcraft.in");
  const [businessAddress, setBusinessAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [watermarkText, setWatermarkText] = useState("CLAWCRAFT STUDIO");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.settings) {
          const s: SiteSettingsMap = data.settings;
          setFlatShippingRupees(Math.round(s.flat_shipping_paise / 100));
          setFreeShippingThresholdRupees(Math.round(s.free_shipping_threshold_paise / 100));
          setEnableCod(s.enable_cod);
          setAnnouncementEnabled(s.announcement_bar_enabled);
          setAnnouncementText(s.announcement_bar_text);
          setWhatsappNumber(s.whatsapp_number);
          setAdminNotificationEmail(s.admin_notification_email);
          setBusinessAddress(s.business_address || "");
          setGstin(s.gstin || "");
          setWatermarkText(s.watermark_text || "CLAWCRAFT STUDIO");
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: Partial<SiteSettingsMap> = {
        flat_shipping_paise: Math.round(Number(flatShippingRupees) * 100),
        free_shipping_threshold_paise: Math.round(Number(freeShippingThresholdRupees) * 100),
        enable_cod: enableCod,
        announcement_bar_enabled: announcementEnabled,
        announcement_bar_text: announcementText.trim(),
        whatsapp_number: whatsappNumber.trim(),
        admin_notification_email: adminNotificationEmail.trim(),
        business_address: businessAddress.trim(),
        gstin: gstin.trim(),
        watermark_text: watermarkText.trim() || "CLAWCRAFT STUDIO",
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      showToast("Studio settings saved successfully!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-muted font-mono text-xs">
        Loading studio parameters...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-subtle pb-6">
        <span className="font-mono text-xs uppercase tracking-widest text-acid">
          Global Workshop Parameters
        </span>
        <h1 className="font-heading text-3xl uppercase tracking-wider text-bone mt-1">
          Store Settings
        </h1>
        <p className="text-xs text-muted font-mono mt-1">
          Configure Pan-India shipping rates, free shipping thresholds, announcement banners & support contacts.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Shipping & Delivery Configuration */}
        <div className="relative bg-ash border border-subtle p-6 rounded space-y-4">
          <FiligreeCorner position="top-right" size={14} />
          <h2 className="font-heading text-base uppercase text-bone flex items-center gap-2">
            <Truck className="w-4 h-4 text-acid" />
            <span>Shipping & Logistics Rules (Pan-India)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Standard Flat Shipping Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                required
                value={flatShippingRupees}
                onChange={(e) => setFlatShippingRupees(Number(e.target.value))}
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <span className="text-[10px] text-muted font-mono mt-1 block">
                Applied to cart orders below free shipping threshold.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Free Shipping Threshold (₹)
              </label>
              <input
                type="number"
                min={0}
                required
                value={freeShippingThresholdRupees}
                onChange={(e) => setFreeShippingThresholdRupees(Number(e.target.value))}
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <span className="text-[10px] text-muted font-mono mt-1 block">
                Orders equal or exceeding this qualify for ₹0 delivery.
              </span>
            </div>
          </div>

          {/* Cash on Delivery Toggle */}
          <div className="pt-2 border-t border-subtle flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase text-bone">
                Enable Cash on Delivery (COD)
              </p>
              <p className="text-[10px] text-muted">
                Online payment via Razorpay (UPI, Cards, NetBanking) is default.
              </p>
            </div>
            <input
              type="checkbox"
              checked={enableCod}
              onChange={(e) => setEnableCod(e.target.checked)}
              className="accent-acid w-5 h-5 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Announcement Bar */}
        <div className="relative bg-ash border border-subtle p-6 rounded space-y-4">
          <FiligreeCorner position="top-right" size={14} />
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base uppercase text-bone flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-steel" />
              <span>Announcement Bar Ticker</span>
            </h2>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-bone">
              <input
                type="checkbox"
                checked={announcementEnabled}
                onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                className="accent-acid w-4 h-4 rounded"
              />
              <span>Enabled</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted mb-1">
              Banner Text Message
            </label>
            <input
              type="text"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="Notice shown at top of website..."
              className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
            />
          </div>
        </div>

        {/* Studio Contacts & Alerts */}
        <div className="relative bg-ash border border-subtle p-6 rounded space-y-4">
          <FiligreeCorner position="top-right" size={14} />
          <h2 className="font-heading text-base uppercase text-bone flex items-center gap-2">
            <Mail className="w-4 h-4 text-steel" />
            <span>Studio Contacts & Notifications</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Studio WhatsApp Support Number
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="919876543210"
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <span className="text-[10px] text-muted font-mono mt-1 block">
                Include country code (e.g. 91 for India).
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Admin Alert Notification Email
              </label>
              <input
                type="email"
                value={adminNotificationEmail}
                onChange={(e) => setAdminNotificationEmail(e.target.value)}
                placeholder="studio@clawcraft.in"
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <span className="text-[10px] text-muted font-mono mt-1 block">
                Receives order alerts and commission inquiries.
              </span>
            </div>
          </div>
        </div>

        {/* Official Receipt & Payment Slip Configuration */}
        <div className="relative bg-ash border border-subtle p-6 rounded space-y-4">
          <FiligreeCorner position="top-right" size={14} />
          <h2 className="font-heading text-base uppercase text-bone flex items-center gap-2">
            <FileText className="w-4 h-4 text-steel" />
            <span>Official Receipt & Payment Slip (PDF)</span>
          </h2>
          <p className="text-[11px] text-muted font-mono">
            These parameters are embedded in downloadable customer slips, admin records, and verification QR links.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Studio GSTIN (Optional)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="27AAAAA0000A1Z5"
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <span className="text-[10px] text-muted font-mono mt-1 block">
                If provided, slip is labeled with GSTIN. If omitted, slip states it is not a GST invoice.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Diagonal Watermark Text
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="CLAWCRAFT STUDIO"
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <span className="text-[10px] text-muted font-mono mt-1 block">
                Tiled diagonally at -35° across every page of generated PDF slips.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted mb-1">
              Registered Business Address (Optional)
            </label>
            <textarea
              rows={2}
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="Workshop 4, Industrial Area Phase II, Mumbai, Maharashtra 400013"
              className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none resize-none"
            />
            <span className="text-[10px] text-muted font-mono mt-1 block">
              Printed on the receipt header if configured.
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <ClawButton
            type="submit"
            disabled={saving}
            variant="acid"
            className="text-xs py-2.5 px-6 font-mono font-bold"
          >
            <Save className="w-4 h-4 mr-2 inline" />
            {saving ? "SAVING SETTINGS..." : "SAVE STUDIO SETTINGS"}
          </ClawButton>
        </div>
      </form>
    </div>
  );
}
