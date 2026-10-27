"use client";

import React, { useState, useEffect } from "react";
import { SiteSettingsMap } from "@/lib/admin/admin-data";
import { validateIndianMobile } from "@/lib/contact";
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
  FileText,
  Volume2,
  VolumeX,
  Bell,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
  QrCode,
  History,
  CheckCircle2,
  Trash2,
  Copy,
  Lock,
  Sparkles,
  MapPin,
  Search,
  FileUp,
  X,
} from "lucide-react";
import {
  getAdminSoundEnabled,
  setAdminSoundEnabled,
  playNotificationChime,
  ADMIN_SOUND_CHANGE_EVENT,
} from "@/lib/admin/attention";
import { formatISTDate } from "@/lib/pdf/order-slip";

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [paymentGateway, setPaymentGateway] = useState<{
    mode: "LIVE" | "TEST" | "MISSING" | "INVALID";
    isProduction: boolean;
    isTestKeyInProduction: boolean;
    isLiveKeyOutsideProduction: boolean;
    maskedKeyId: string;
    webhookSecretConfigured: boolean;
    lastWebhookReceivedAt: string | null;
    lastVerifiedPaymentAt: string | null;
    isGatewayReady: boolean;
  } | null>(null);

  // Security & 2FA State
  const [mfaData, setMfaData] = useState<{
    isEnrolled: boolean;
    isEnforced: boolean;
    aal: string;
    verifiedFactorId: string | null;
    email: string;
  } | null>(null);

  const [enrollment, setEnrollment] = useState<{
    active: boolean;
    factorId: string | null;
    qrCodeUrl: string | null;
    secret: string | null;
    verificationCode: string;
    loading: boolean;
  }>({
    active: false,
    factorId: null,
    qrCodeUrl: null,
    secret: null,
    verificationCode: "",
    loading: false,
  });

  const [unenrollState, setUnenrollState] = useState<{
    active: boolean;
    code: string;
    loading: boolean;
  }>({
    active: false,
    code: "",
    loading: false,
  });

  const [auditLog, setAuditLog] = useState<{
    events: Array<{
      id: string;
      adminEmail: string;
      action: string;
      target: string | null;
      ipHash: string | null;
      userAgent: string | null;
      success: boolean;
      createdAtIST: string;
    }>;
    lastLogin: {
      email: string;
      timeIST: string;
      ipHash: string | null;
      userAgent: string | null;
    } | null;
  } | null>(null);

  // Form states (converted to rupees for user convenience)
  const [flatShippingRupees, setFlatShippingRupees] = useState(149);
  const [freeShippingThresholdRupees, setFreeShippingThresholdRupees] = useState(2999);
  const [enableCod, setEnableCod] = useState(false);
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [announcementText, setAnnouncementText] = useState(
    "HANDCRAFTED FROM CLEANED RECYCLED CANS • FREE PAN-INDIA SHIPPING ON ORDERS ABOVE ₹2,999"
  );
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [supportHours, setSupportHours] = useState("");
  const [adminNotificationEmail, setAdminNotificationEmail] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [watermarkText, setWatermarkText] = useState("CLAWCRAFT STUDIO");
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(false);
  const [audioBlockedHint, setAudioBlockedHint] = useState(false);

  // Free Shipping Promotion (Temporary & Reversible)
  const [freeShippingPromoEnabled, setFreeShippingPromoEnabled] = useState(false);
  const [freeShippingPromoEndsAt, setFreeShippingPromoEndsAt] = useState("");
  const [freeShippingPromoScope, setFreeShippingPromoScope] = useState<"all" | "local">("local");

  // COD & Local Delivery Parameters
  const [codEnabled, setCodEnabled] = useState(false);
  const [codMaxOrderValueInr, setCodMaxOrderValueInr] = useState(5000);
  const [codFeeInr, setCodFeeInr] = useState(0);
  const [codMaxOpenOrdersPerPhone, setCodMaxOpenOrdersPerPhone] = useState(2);
  const [codBlockedPhonesText, setCodBlockedPhonesText] = useState("");
  const [codConfirmationNote, setCodConfirmationNote] = useState(
    "We will call you to confirm before delivery"
  );
  const [localDeliveryWindowText, setLocalDeliveryWindowText] = useState("");

  // Local Delivery PIN Codes Zone State
  interface AdminPinRow {
    pincode: string;
    area_name: string;
    is_active: boolean;
    created_at?: string;
  }
  const [pincodes, setPincodes] = useState<AdminPinRow[]>([]);
  const [pincodesLoading, setPincodesLoading] = useState(true);
  const [pincodesSearch, setPincodesSearch] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newArea, setNewArea] = useState("");
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkDefaultArea, setBulkDefaultArea] = useState("Jaipur Local Delivery Zone");
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  // Helper: Evaluates whether promotion is active now
  const isPromoActiveNow = () => {
    if (!freeShippingPromoEnabled) return false;
    if (!freeShippingPromoEndsAt.trim()) return true;
    try {
      const match = freeShippingPromoEndsAt.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) return true;
      const [, y, m, d] = match;
      const istExpiryEpoch = new Date(`${y}-${m}-${d}T23:59:59.999+05:30`).getTime();
      return Date.now() <= istExpiryEpoch;
    } catch {
      return true;
    }
  };

  // Helper: Validate 6-digit Jaipur PIN code
  const validateJaipurPincode = (pin: string): { valid: boolean; error?: string } => {
    const clean = pin.trim();
    if (!/^\d{6}$/.test(clean)) {
      return { valid: false, error: "PIN code must be exactly 6 digits." };
    }
    if (clean.startsWith("0")) {
      return { valid: false, error: "Indian postal codes cannot start with 0." };
    }
    if (!clean.startsWith("3")) {
      return { valid: false, error: "Jaipur delivery PIN codes must start with 3 (e.g. 302012)." };
    }
    return { valid: true };
  };

  useEffect(() => {
    const sync = () => setSoundAlertsEnabled(getAdminSoundEnabled());
    sync();

    if (typeof window !== "undefined") {
      window.addEventListener(ADMIN_SOUND_CHANGE_EVENT, sync);
      window.addEventListener("storage", sync);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(ADMIN_SOUND_CHANGE_EVENT, sync);
        window.removeEventListener("storage", sync);
      }
    };
  }, []);

  const handlePlayTestSound = async () => {
    try {
      const result = await playNotificationChime({ force: true });
      if (result.blocked) {
        setAudioBlockedHint(true);
      } else {
        setAudioBlockedHint(false);
        showToast("Test notification chime played", "info");
      }
    } catch {
      setAudioBlockedHint(true);
    }
  };

  const handleToggleSound = () => {
    const next = !soundAlertsEnabled;
    setSoundAlertsEnabled(next);
    setAdminSoundEnabled(next);
    if (next) {
      showToast("Notification sound enabled", "success");
      handlePlayTestSound();
    } else {
      showToast("Notification sound muted", "info");
    }
  };

  const fetchPincodes = async () => {
    setPincodesLoading(true);
    try {
      const res = await fetch("/api/admin/cod-pincodes");
      const data = await res.json();
      if (data.pincodes) {
        setPincodes(data.pincodes);
      }
    } catch (err) {
      console.error("Failed to load cod pincodes", err);
    } finally {
      setPincodesLoading(false);
    }
  };

  const handleTogglePinActive = async (pincode: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/cod-pincodes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode, is_active: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update PIN code status");
      setPincodes((prev) =>
        prev.map((p) => (p.pincode === pincode ? { ...p, is_active: !currentActive } : p))
      );
      showToast(
        `PIN code ${pincode} ${!currentActive ? "enabled" : "disabled"} for local delivery`,
        "success"
      );
    } catch (err: any) {
      showToast(err.message || "Failed to update PIN code", "error");
    }
  };

  const handleDeletePin = async (pincode: string) => {
    if (!confirm(`Are you sure you want to remove PIN code ${pincode} from the local delivery zone?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/cod-pincodes?pincode=${encodeURIComponent(pincode)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete PIN code");
      setPincodes((prev) => prev.filter((p) => p.pincode !== pincode));
      showToast(`PIN code ${pincode} removed from local delivery zone`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to delete PIN code", "error");
    }
  };

  const handleAddSinglePin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = newPin.trim();
    if (!pin) {
      showToast("Please enter a PIN code", "error");
      return;
    }
    const val = validateJaipurPincode(pin);
    if (!val.valid) {
      showToast(val.error!, "error");
      return;
    }

    setIsAddingPin(true);
    try {
      const res = await fetch("/api/admin/cod-pincodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pincode: pin,
          area_name: newArea.trim() || "Jaipur Local Delivery Zone",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add PIN code");
      setPincodes((prev) => {
        const existing = prev.filter((p) => p.pincode !== pin);
        return [
          ...existing,
          { pincode: pin, area_name: newArea.trim() || "Jaipur Local Delivery Zone", is_active: true },
        ].sort((a, b) => a.pincode.localeCompare(b.pincode));
      });
      setNewPin("");
      setNewArea("");
      showToast(`PIN code ${pin} added to local delivery zone`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to add PIN code", "error");
    } finally {
      setIsAddingPin(false);
    }
  };

  const handleBulkImportPins = async () => {
    if (!bulkText.trim()) {
      showToast("Please enter one or more PIN codes", "error");
      return;
    }

    setIsBulkImporting(true);
    try {
      const res = await fetch("/api/admin/cod-pincodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulkText: bulkText.trim(),
          defaultAreaName: bulkDefaultArea.trim() || "Jaipur Local Delivery Zone",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import PIN codes");

      showToast(
        `Successfully imported/updated ${data.importedCount} PIN codes.`,
        "success"
      );
      setBulkModalOpen(false);
      setBulkText("");
      fetchPincodes();
    } catch (err: any) {
      showToast(err.message || "Failed to import PIN codes", "error");
    } finally {
      setIsBulkImporting(false);
    }
  };

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
          setWhatsappNumber(s.whatsapp_number || "");
          setSupportHours(s.support_hours || "");
          setAdminNotificationEmail(s.admin_notification_email);
          setBusinessAddress(s.business_address || "");
          setGstin(s.gstin || "");
          setWatermarkText(s.watermark_text || "CLAWCRAFT STUDIO");

          // Free shipping promo
          setFreeShippingPromoEnabled(Boolean(s.free_shipping_promo_enabled));
          setFreeShippingPromoEndsAt(s.free_shipping_promo_ends_at || "");
          setFreeShippingPromoScope(s.free_shipping_promo_scope || "local");

          // COD parameters
          setCodEnabled(Boolean(s.cod_enabled || s.enable_cod));
          setCodMaxOrderValueInr(s.cod_max_order_value_inr ?? 5000);
          setCodFeeInr(s.cod_fee_inr ?? 0);
          setCodMaxOpenOrdersPerPhone(s.cod_max_open_orders_per_phone ?? 2);
          setCodBlockedPhonesText((s.cod_blocked_phones || []).join("\n"));
          setCodConfirmationNote(s.cod_confirmation_note || "We will call you to confirm before delivery");
          setLocalDeliveryWindowText(s.local_delivery_window_text || "");
        }
        if (data.paymentGateway) {
          setPaymentGateway(data.paymentGateway);
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchMfa = async () => {
      try {
        const res = await fetch("/api/admin/mfa");
        const data = await res.json();
        if (data.success) {
          setMfaData(data);
        }
      } catch (err) {
        console.error("Failed to load MFA status", err);
      }
    };

    const fetchAuditLog = async () => {
      try {
        const res = await fetch("/api/admin/audit-log");
        const data = await res.json();
        if (data.success) {
          setAuditLog(data);
        }
      } catch (err) {
        console.error("Failed to load audit log", err);
      }
    };

    fetchSettings();
    fetchMfa();
    fetchAuditLog();
    fetchPincodes();
  }, []);

  const handleStartEnroll = async () => {
    setEnrollment((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/admin/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enroll" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start enrollment.");
      setEnrollment({
        active: true,
        factorId: data.factorId,
        qrCodeUrl: data.qrCodeUrl,
        secret: data.secret,
        verificationCode: "",
        loading: false,
      });
    } catch (err: any) {
      showToast(err.message, "error");
      setEnrollment((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleConfirmEnroll = async () => {
    if (!enrollment.verificationCode || enrollment.verificationCode.length !== 6) {
      showToast("Please enter a valid 6-digit code.", "error");
      return;
    }
    setEnrollment((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/admin/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          factorId: enrollment.factorId,
          code: enrollment.verificationCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      showToast("Two-factor authenticator activated successfully!", "success");
      setEnrollment({
        active: false,
        factorId: null,
        qrCodeUrl: null,
        secret: null,
        verificationCode: "",
        loading: false,
      });
      // Refresh MFA and audit log
      const mfaRes = await fetch("/api/admin/mfa");
      const mfaJson = await mfaRes.json();
      if (mfaJson.success) setMfaData(mfaJson);
      const auditRes = await fetch("/api/admin/audit-log");
      const auditJson = await auditRes.json();
      if (auditJson.success) setAuditLog(auditJson);
    } catch (err: any) {
      showToast(err.message, "error");
      setEnrollment((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleUnenroll = async () => {
    if (!unenrollState.code || unenrollState.code.length !== 6) {
      showToast("Please enter your current 6-digit code to confirm removal.", "error");
      return;
    }
    setUnenrollState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/admin/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unenroll",
          factorId: mfaData?.verifiedFactorId,
          code: unenrollState.code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove authenticator.");
      showToast("Authenticator removed successfully.", "info");
      setUnenrollState({ active: false, code: "", loading: false });
      const mfaRes = await fetch("/api/admin/mfa");
      const mfaJson = await mfaRes.json();
      if (mfaJson.success) setMfaData(mfaJson);
      const auditRes = await fetch("/api/admin/audit-log");
      const auditJson = await auditRes.json();
      if (auditJson.success) setAuditLog(auditJson);
    } catch (err: any) {
      showToast(err.message, "error");
      setUnenrollState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (whatsappNumber.trim()) {
        const check = validateIndianMobile(whatsappNumber.trim());
        if (!check.isValid) {
          throw new Error(
            "Invalid WhatsApp number. Please enter a valid 10-digit Indian mobile number (e.g. 91XXXXXXXXXX or 10 digits starting 6-9)."
          );
        }
      }

      const blockedPhones = codBlockedPhonesText
        .split(/[\r\n,;]+/)
        .map((p) => p.trim().replace(/\D/g, ""))
        .filter((p) => p.length >= 10);

      const payload: Partial<SiteSettingsMap> = {
        flat_shipping_paise: Math.round(Number(flatShippingRupees) * 100),
        free_shipping_threshold_paise: Math.round(Number(freeShippingThresholdRupees) * 100),
        enable_cod: codEnabled,
        announcement_bar_enabled: announcementEnabled,
        announcement_bar_text: announcementText.trim(),
        whatsapp_number: whatsappNumber.trim(),
        support_hours: supportHours.trim(),
        admin_notification_email: adminNotificationEmail.trim(),
        business_address: businessAddress.trim(),
        gstin: gstin.trim(),
        watermark_text: watermarkText.trim() || "CLAWCRAFT STUDIO",

        // Free Shipping Promotion (Reversible)
        free_shipping_promo_enabled: freeShippingPromoEnabled,
        free_shipping_promo_ends_at: freeShippingPromoEndsAt.trim() || null,
        free_shipping_promo_scope: freeShippingPromoScope,

        // COD Settings
        cod_enabled: codEnabled,
        cod_max_order_value_inr: Math.max(100, Number(codMaxOrderValueInr) || 5000),
        cod_fee_inr: Math.max(0, Number(codFeeInr) || 0),
        cod_max_open_orders_per_phone: Math.max(1, Number(codMaxOpenOrdersPerPhone) || 2),
        cod_blocked_phones: blockedPhones,
        cod_confirmation_note:
          codConfirmationNote.trim() || "We will call you to confirm before delivery",
        local_delivery_window_text: localDeliveryWindowText.trim(),
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      if (data.paymentGateway) setPaymentGateway(data.paymentGateway);

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
      {/* Free Shipping Promotion Top Active Banner */}
      {isPromoActiveNow() && (
        <div className="relative overflow-hidden bg-acid/10 border-2 border-acid/60 p-4 rounded-sm space-y-1 shadow-[0_0_20px_rgba(184,255,31,0.15)]">
          <FiligreeCorner position="top-right" size={12} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-acid opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-acid"></span>
            </span>
            <h3 className="font-heading text-sm uppercase tracking-wider text-acid font-bold">
              FREE SHIPPING PROMOTION ACTIVE
            </h3>
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-acid text-void">
              SCOPE: {freeShippingPromoScope === "all" ? "PAN-INDIA (ALL ORDERS)" : "JAIPUR LOCAL ONLY"}
            </span>
            {freeShippingPromoEndsAt && (
              <span className="text-[11px] font-mono text-bone ml-auto">
                Ends: <strong>{freeShippingPromoEndsAt} (23:59 IST)</strong>
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-bone pt-0.5">
            Customers qualify for <strong className="text-acid">₹0 shipping</strong> on{" "}
            {freeShippingPromoScope === "all"
              ? "all orders nationwide"
              : "orders to active Jaipur local delivery PIN codes"}
            {freeShippingPromoEndsAt ? ` through ${freeShippingPromoEndsAt} (end of day IST)` : " (indefinite promotion)"}.
          </p>
          <p className="font-mono text-[10px] text-muted">
            Evaluated strictly on the server at calculation time. Your standard flat shipping rate (₹
            {flatShippingRupees}) and threshold (₹{freeShippingThresholdRupees}) remain untouched and will automatically resume once expired.
          </p>
        </div>
      )}

      {/* Promotion Expired Notice if Enabled but Past Date */}
      {freeShippingPromoEnabled && !isPromoActiveNow() && (
        <div className="bg-void border border-subtle/80 p-3 rounded-sm font-mono text-xs text-muted flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>
              Promotion end date (<strong className="text-bone">{freeShippingPromoEndsAt}</strong>) has passed in IST. Server is automatically charging regular shipping rates.
            </span>
          </div>
          <span className="text-[10px] uppercase text-amber-400 font-bold tracking-widest px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/40">
            AUTO-EXPIRED
          </span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Payments Card (STEP 3 Requirements: Mode, Masked Key, Webhook Secret, Timestamps) */}
        <div className="relative bg-ash border border-subtle p-6 rounded space-y-4">
          <FiligreeCorner position="top-right" size={14} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="font-heading text-base uppercase text-bone flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-acid" />
              <span>Razorpay Payments Gateway</span>
            </h2>

            {paymentGateway && (
              <span
                className={`w-fit px-2.5 py-0.5 rounded-sm font-mono text-[10px] uppercase font-bold tracking-widest ${
                  paymentGateway.mode === "LIVE"
                    ? "bg-acid/15 border border-acid/50 text-acid"
                    : paymentGateway.mode === "TEST"
                    ? paymentGateway.isTestKeyInProduction
                      ? "bg-blood/20 border border-blood text-blood"
                      : "bg-amber-500/20 border border-amber-500/50 text-amber-400"
                    : "bg-void border border-subtle text-muted"
                }`}
              >
                MODE: {paymentGateway.mode}
              </span>
            )}
          </div>

          {/* Red Warning Banner when in Production with Test Keys */}
          {paymentGateway?.isTestKeyInProduction && (
            <div className="p-3 bg-blood/10 border border-blood/40 rounded-sm text-blood font-mono text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-blood" />
              <span>
                <strong>Razorpay is in TEST mode</strong> — Real payments cannot be processed in production. Update your Vercel Production Environment Variables with live credentials (rzp_live_...).
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-3 bg-void border border-subtle/70 rounded-sm space-y-1">
              <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">
                API Key ID (Public)
              </span>
              <p className="font-mono text-xs text-bone font-bold">
                {paymentGateway?.maskedKeyId || "Not configured"}
              </p>
              <span className="text-[10px] font-mono text-muted block">
                Secret is kept server-only and never exposed.
              </span>
            </div>

            <div className="p-3 bg-void border border-subtle/70 rounded-sm space-y-1">
              <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">
                Webhook Secret Status
              </span>
              <p className="font-mono text-xs font-bold flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    paymentGateway?.webhookSecretConfigured ? "bg-acid" : "bg-blood"
                  }`}
                />
                <span className={paymentGateway?.webhookSecretConfigured ? "text-acid" : "text-blood"}>
                  {paymentGateway?.webhookSecretConfigured ? "Configured (Active)" : "Not configured"}
                </span>
              </p>
              <span className="text-[10px] font-mono text-muted block">
                Validates HMAC signatures for captured/failed events.
              </span>
            </div>

            <div className="p-3 bg-void border border-subtle/70 rounded-sm space-y-1">
              <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">
                Last Webhook Received
              </span>
              <p className="font-mono text-xs text-bone">
                {paymentGateway?.lastWebhookReceivedAt
                  ? formatISTDate(paymentGateway.lastWebhookReceivedAt)
                  : "Never received"}
              </p>
              <span className="text-[10px] font-mono text-muted block">
                Syncs orders if customer closes browser after paying.
              </span>
            </div>

            <div className="p-3 bg-void border border-subtle/70 rounded-sm space-y-1">
              <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">
                Last Verified Payment
              </span>
              <p className="font-mono text-xs text-acid font-bold">
                {paymentGateway?.lastVerifiedPaymentAt
                  ? formatISTDate(paymentGateway.lastVerifiedPaymentAt)
                  : "No verified payments recorded"}
              </p>
              <span className="text-[10px] font-mono text-muted block">
                Only recorded after server-side bank verification.
              </span>
            </div>
          </div>
        </div>

        {/* Security, 2FA & Audit Log Card (STEP 5 & 7 Requirements) */}
        <div className="relative bg-ash border border-subtle p-6 rounded space-y-5">
          <FiligreeCorner position="top-right" size={14} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="font-heading text-base uppercase text-bone flex items-center gap-2">
              <Lock className="w-4 h-4 text-acid" />
              <span>Security & Two-Factor Authentication (TOTP)</span>
            </h2>

            {mfaData && (
              <span
                className={`w-fit px-2.5 py-0.5 rounded-sm font-mono text-[10px] uppercase font-bold tracking-widest ${
                  mfaData.isEnrolled
                    ? "bg-acid/15 border border-acid/50 text-acid"
                    : "bg-amber-500/20 border border-amber-500/50 text-amber-400"
                }`}
              >
                {mfaData.isEnrolled ? "2FA: ACTIVE" : "2FA: NOT ENROLLED"}
              </span>
            )}
          </div>

          <p className="text-[11px] text-muted font-mono">
            Protect your artisan portal with time-based one-time password (TOTP) two-factor authentication via Google Authenticator, 1Password, or Authy.
          </p>

          {/* MFA Status & Enrollment Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-void border border-subtle/70 rounded-sm space-y-2">
              <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">
                Two-Factor Status
              </span>
              <p className="font-mono text-xs text-bone font-bold flex items-center gap-2">
                {mfaData?.isEnrolled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-acid" />
                    <span>Enrolled (Active)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Not Enrolled</span>
                  </>
                )}
              </p>
              <span className="text-[10px] font-mono text-muted block">
                Server Enforcement:{" "}
                <strong className={mfaData?.isEnforced ? "text-acid" : "text-bone"}>
                  {mfaData?.isEnforced ? "STRICT (ADMIN_REQUIRE_MFA=true)" : "Optional"}
                </strong>
              </span>
            </div>

            <div className="p-4 bg-void border border-subtle/70 rounded-sm space-y-2">
              <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">
                Last Verified Admin Login
              </span>
              <p className="font-mono text-xs text-acid font-bold">
                {auditLog?.lastLogin?.timeIST || "No login recorded"}
              </p>
              <span className="text-[10px] font-mono text-muted block">
                IP Hash: {auditLog?.lastLogin?.ipHash || "N/A"}
              </span>
            </div>
          </div>

          {/* MFA Action Block */}
          {!mfaData?.isEnrolled && !enrollment.active && (
            <div className="p-4 bg-void border border-dashed border-acid/40 rounded-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-heading text-sm uppercase text-bone flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-acid" />
                    <span>Enrol Authenticator App</span>
                  </h3>
                  <p className="text-[11px] text-muted font-mono mt-0.5">
                    Link your phone to require a 6-digit code on every login.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartEnroll}
                  disabled={enrollment.loading}
                  className="px-4 py-2 bg-acid text-void font-bold text-xs font-mono uppercase tracking-wider rounded hover:bg-bone transition-colors"
                >
                  {enrollment.loading ? "INITIALIZING..." : "START ENROLLMENT"}
                </button>
              </div>

              {/* Guidance on How to Enforce */}
              <div className="p-3 bg-ash/50 border border-subtle/60 rounded text-[11px] font-mono text-muted space-y-1">
                <p className="text-bone font-bold">How to safely enforce 2FA without lockout:</p>
                <ol className="list-decimal list-inside space-y-0.5 pl-1">
                  <li>Click &quot;START ENROLLMENT&quot; above to scan the QR code and verify your 6-digit code.</li>
                  <li>Go to your Vercel Project Settings &rarr; Environment Variables.</li>
                  <li>Add <code className="text-acid">ADMIN_REQUIRE_MFA=true</code> and redeploy.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Enrollment In Progress Form */}
          {enrollment.active && (
            <div className="p-5 bg-void border border-acid/60 rounded-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm uppercase text-acid flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  <span>Scan QR Code with Authenticator</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setEnrollment((prev) => ({ ...prev, active: false }))}
                  className="text-xs text-muted hover:text-bone underline font-mono"
                >
                  Cancel
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {enrollment.qrCodeUrl && (
                  <div className="p-2 bg-white rounded shadow-md shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={enrollment.qrCodeUrl}
                      alt="Authenticator QR Code"
                      width={160}
                      height={160}
                      className="block"
                    />
                  </div>
                )}

                <div className="space-y-3 flex-1 min-w-0">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-muted tracking-wider block">
                      Manual Secret Key
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs font-mono text-acid bg-ash px-2.5 py-1.5 rounded border border-subtle select-all break-all">
                        {enrollment.secret}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          if (enrollment.secret) {
                            navigator.clipboard.writeText(enrollment.secret);
                            showToast("Secret key copied to clipboard", "success");
                          }
                        }}
                        className="p-1.5 text-muted hover:text-bone border border-subtle rounded hover:bg-ash transition-colors"
                        title="Copy Key"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-muted mb-1">
                      Enter 6-Digit Code from App
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={enrollment.verificationCode}
                        onChange={(e) =>
                          setEnrollment((prev) => ({
                            ...prev,
                            verificationCode: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        className="w-36 bg-ash border border-acid/60 px-3 py-1.5 text-center text-sm font-mono tracking-widest text-acid focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleConfirmEnroll}
                        disabled={enrollment.loading || enrollment.verificationCode.length !== 6}
                        className="px-4 py-1.5 bg-acid text-void font-bold text-xs font-mono uppercase tracking-wider rounded hover:bg-bone disabled:opacity-50 transition-colors"
                      >
                        {enrollment.loading ? "VERIFYING..." : "ACTIVATE 2FA"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enrolled & Manage Section */}
          {mfaData?.isEnrolled && (
            <div className="p-4 bg-void border border-subtle/70 rounded-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-mono text-xs text-bone flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-acid" />
                    <span>Authenticator protection is active.</span>
                  </p>
                  <p className="text-[10px] text-muted font-mono">
                    Factor ID: {mfaData.verifiedFactorId}
                  </p>
                </div>

                {!unenrollState.active ? (
                  <button
                    type="button"
                    onClick={() => setUnenrollState({ active: true, code: "", loading: false })}
                    disabled={mfaData.isEnforced}
                    className="px-3 py-1.5 bg-void hover:bg-blood/20 border border-blood/40 text-blood text-xs font-mono uppercase rounded disabled:opacity-40 transition-colors"
                    title={mfaData.isEnforced ? "Cannot unenroll while ADMIN_REQUIRE_MFA is enforced." : "Remove Factor"}
                  >
                    Remove Authenticator
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Current 6-digit code"
                      value={unenrollState.code}
                      onChange={(e) =>
                        setUnenrollState((prev) => ({
                          ...prev,
                          code: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      className="w-36 bg-ash border border-blood/50 px-2 py-1 text-center text-xs font-mono text-bone focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleUnenroll}
                      disabled={unenrollState.loading || unenrollState.code.length !== 6}
                      className="px-3 py-1 bg-blood text-white font-bold text-xs font-mono uppercase rounded disabled:opacity-50"
                    >
                      {unenrollState.loading ? "REMOVING..." : "CONFIRM"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnenrollState({ active: false, code: "", loading: false })}
                      className="text-xs text-muted hover:text-bone underline font-mono"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {mfaData.isEnforced && (
                <p className="text-[10px] font-mono text-amber-400">
                  ⚠️ Note: Authenticator removal is blocked because <code className="text-bone">ADMIN_REQUIRE_MFA=true</code> is enforced on the server.
                </p>
              )}
            </div>
          )}

          {/* Audit Log Table (Last 20 Events) */}
          <div className="pt-2">
            <h3 className="font-heading text-xs uppercase tracking-wider text-muted mb-2 flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-steel" />
              <span>Recent Security Events (Last 20 Actions)</span>
            </h3>

            <div className="border border-subtle/70 rounded-sm overflow-hidden bg-void">
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-ash border-b border-subtle text-muted uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Timestamp (IST)</th>
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3">Target</th>
                      <th className="py-2 px-3">IP Hash</th>
                      <th className="py-2 px-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle/40 text-bone">
                    {auditLog && auditLog.events.length > 0 ? (
                      auditLog.events.map((evt) => (
                        <tr key={evt.id} className="hover:bg-ash/40">
                          <td className="py-2 px-3 text-muted">{evt.createdAtIST}</td>
                          <td className="py-2 px-3 font-bold text-acid">{evt.action}</td>
                          <td className="py-2 px-3 text-muted truncate max-w-[140px]">{evt.target || "—"}</td>
                          <td className="py-2 px-3 text-muted">{evt.ipHash || "—"}</td>
                          <td className="py-2 px-3 text-right">
                            {evt.success ? (
                              <span className="text-acid text-[10px] uppercase font-bold">Success</span>
                            ) : (
                              <span className="text-blood text-[10px] uppercase font-bold">Failed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted">
                          No audit log events recorded yet. Run the migration to start logging events.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

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

          <div className="pt-2 border-t border-subtle flex items-center justify-between text-[11px] font-mono text-muted">
            <span>Standard Pan-India rates applied when no promotion is active.</span>
            <span className="text-bone">Base Flat: ₹{flatShippingRupees} • Threshold: ₹{freeShippingThresholdRupees}</span>
          </div>
        </div>

        {/* Free Shipping Promotion Configuration (Temporary & Reversible) */}
        <div className="relative bg-ash border border-subtle p-6 rounded space-y-4">
          <FiligreeCorner position="top-right" size={14} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="font-heading text-base uppercase text-bone flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-acid" />
                <span>Free Shipping Promotion (Limited-Time & Reversible)</span>
              </h2>
              <p className="text-[11px] text-muted font-mono mt-0.5">
                Temporary promotion setting shipping fee to ₹0 for orders in scope without altering base rates.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-bone self-start sm:self-auto">
              <input
                type="checkbox"
                checked={freeShippingPromoEnabled}
                onChange={(e) => setFreeShippingPromoEnabled(e.target.checked)}
                className="accent-acid w-5 h-5 rounded cursor-pointer"
              />
              <span className={freeShippingPromoEnabled ? "text-acid font-bold" : "text-muted"}>
                {freeShippingPromoEnabled ? "PROMO ACTIVE" : "PROMO OFF"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Promotion Scope
              </label>
              <select
                value={freeShippingPromoScope}
                onChange={(e) => setFreeShippingPromoScope(e.target.value as "all" | "local")}
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              >
                <option value="local">Local Jaipur Orders Only (Zone PIN Codes)</option>
                <option value="all">All Pan-India Orders (Nationwide)</option>
              </select>
              <span className="text-[10px] text-muted font-mono mt-1 block">
                Default &quot;local&quot; applies free shipping solely to verified Jaipur delivery PIN codes.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Promotion End Date (IST, End of that Day)
              </label>
              <input
                type="date"
                value={freeShippingPromoEndsAt}
                onChange={(e) => setFreeShippingPromoEndsAt(e.target.value)}
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <span className="text-[10px] text-muted font-mono mt-1 block">
                Expires at 23:59:59 IST. When date passes, promotion stops automatically on the server (no cron needed).
              </span>
            </div>
          </div>
        </div>

        {/* Local Delivery & Cash on Delivery (COD) Configuration */}
        <div className="relative bg-ash border border-subtle p-6 rounded space-y-4">
          <FiligreeCorner position="top-right" size={14} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="font-heading text-base uppercase text-bone flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-acid" />
                <span>Local Delivery & Cash on Delivery (COD)</span>
              </h2>
              <p className="text-[11px] text-muted font-mono mt-0.5">
                Artisan owner doorstep delivery for selected Jaipur PIN codes (no courier). Online Razorpay is default.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-bone self-start sm:self-auto">
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => {
                  setCodEnabled(e.target.checked);
                  setEnableCod(e.target.checked);
                }}
                className="accent-acid w-5 h-5 rounded cursor-pointer"
              />
              <span className={codEnabled ? "text-acid font-bold" : "text-muted"}>
                {codEnabled ? "COD ENABLED" : "COD DISABLED"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Max Order Value (₹)
              </label>
              <input
                type="number"
                min={100}
                max={50000}
                value={codMaxOrderValueInr}
                onChange={(e) => setCodMaxOrderValueInr(Number(e.target.value))}
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <span className="text-[10px] text-muted font-mono mt-1 block">
                Default ₹5,000. Carts above this amount must pay online.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                COD Handling Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                max={500}
                value={codFeeInr}
                onChange={(e) => setCodFeeInr(Number(e.target.value))}
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <span className="text-[10px] text-muted font-mono mt-1 block">
                Default ₹0. Added as a line item on the server.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Max Open Orders / Phone
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={codMaxOpenOrdersPerPhone}
                onChange={(e) => setCodMaxOpenOrdersPerPhone(Number(e.target.value))}
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <span className="text-[10px] text-muted font-mono mt-1 block">
                Default 2 uncollected open orders per customer phone.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Customer Confirmation Note
              </label>
              <input
                type="text"
                value={codConfirmationNote}
                onChange={(e) => setCodConfirmationNote(e.target.value)}
                placeholder="We will call you to confirm before delivery"
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <span className="text-[10px] text-muted font-mono mt-1 block">
                Short note shown at checkout for Pay on Delivery. No invented delivery times.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-muted mb-1">
                Local Delivery Window Text (Optional)
              </label>
              <input
                type="text"
                value={localDeliveryWindowText}
                onChange={(e) => setLocalDeliveryWindowText(e.target.value)}
                placeholder="e.g. Delivered personally within 24-48 hrs"
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <span className="text-[10px] text-muted font-mono mt-1 block">
                Shown to customer when configured. Hidden when empty.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted mb-1">
              Blocked Customer Phone Numbers
            </label>
            <textarea
              rows={2}
              value={codBlockedPhonesText}
              onChange={(e) => setCodBlockedPhonesText(e.target.value)}
              placeholder="Enter phone numbers separated by newlines or commas (e.g. 9829012345)"
              className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none resize-none"
            />
            <span className="text-[10px] text-muted font-mono mt-1 block">
              Numbers blocked from COD. These customers will be prompted to complete checkout online.
            </span>
          </div>
        </div>

        {/* Local Delivery Zone (Jaipur PIN Codes) */}
        <div className="relative bg-ash border border-subtle p-6 rounded space-y-4">
          <FiligreeCorner position="top-right" size={14} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-acid" />
                <h2 className="font-heading text-base uppercase text-bone">
                  Jaipur Local Delivery Zone (PIN Codes)
                </h2>
                <span className="px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase font-bold tracking-widest bg-acid/15 border border-acid/50 text-acid">
                  {pincodes.filter((p) => p.is_active).length} Active
                </span>
              </div>
              <p className="text-[11px] text-muted font-mono mt-0.5">
                Orders to active PIN codes are delivered personally by the studio owner and qualify for Cash on Delivery.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-void hover:bg-subtle/60 border border-subtle text-bone text-xs font-mono uppercase rounded transition-colors"
              >
                <FileUp className="w-3.5 h-3.5 text-acid" />
                <span>Paste Many</span>
              </button>
            </div>
          </div>

          {/* Add Single PIN Form */}
          <div className="p-3 bg-void border border-subtle/70 rounded space-y-2">
            <span className="text-[10px] font-mono uppercase text-muted tracking-wider block font-bold">
              Add Single Local PIN Code
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="PIN (e.g. 302012)"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                className="w-full sm:w-36 bg-ash border border-subtle px-3 py-1.5 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <input
                type="text"
                placeholder="Area / Neighborhood Name (e.g. Jhotwara)"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                className="flex-1 bg-ash border border-subtle px-3 py-1.5 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSinglePin}
                disabled={isAddingPin || !newPin.trim()}
                className="px-4 py-1.5 bg-acid text-void font-bold text-xs font-mono uppercase tracking-wider rounded hover:bg-bone disabled:opacity-40 transition-colors shrink-0"
              >
                {isAddingPin ? "ADDING..." : "ADD PIN"}
              </button>
            </div>
            <span className="text-[10px] font-mono text-muted block">
              Must be 6 digits, cannot start with 0, and starts with 3 for Jaipur postal network.
            </span>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search PIN code or area..."
                value={pincodesSearch}
                onChange={(e) => setPincodesSearch(e.target.value)}
                className="w-full bg-void border border-subtle pl-8 pr-3 py-1.5 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
            </div>
            <span className="text-[11px] font-mono text-muted">
              Showing{" "}
              {
                pincodes.filter((p) => {
                  if (!pincodesSearch.trim()) return true;
                  const q = pincodesSearch.toLowerCase().trim();
                  return p.pincode.includes(q) || p.area_name.toLowerCase().includes(q);
                }).length
              }{" "}
              of {pincodes.length}
            </span>
          </div>

          {/* PIN Codes Table */}
          <div className="border border-subtle/70 rounded-sm overflow-hidden bg-void">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-ash border-b border-subtle text-muted uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">PIN Code</th>
                    <th className="py-2 px-3">Area / Neighborhood</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle/40 text-bone">
                  {pincodesLoading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted">
                        Loading local delivery PIN codes...
                      </td>
                    </tr>
                  ) : pincodes.length > 0 ? (
                    pincodes
                      .filter((p) => {
                        if (!pincodesSearch.trim()) return true;
                        const q = pincodesSearch.toLowerCase().trim();
                        return p.pincode.includes(q) || p.area_name.toLowerCase().includes(q);
                      })
                      .map((pin) => (
                        <tr key={pin.pincode} className="hover:bg-ash/40">
                          <td className="py-2 px-3 font-bold text-acid">{pin.pincode}</td>
                          <td className="py-2 px-3 text-bone truncate max-w-[260px]">{pin.area_name}</td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                                pin.is_active
                                  ? "bg-acid/15 text-acid border border-acid/40"
                                  : "bg-void text-muted border border-subtle"
                              }`}
                            >
                              {pin.is_active ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleTogglePinActive(pin.pincode, pin.is_active)}
                                className={`px-2 py-1 text-[10px] font-mono uppercase rounded border transition-colors ${
                                  pin.is_active
                                    ? "bg-void border-subtle text-muted hover:text-bone hover:border-steel"
                                    : "bg-acid text-void font-bold border-acid"
                                }`}
                              >
                                {pin.is_active ? "Disable" : "Enable"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePin(pin.pincode)}
                                className="p-1 text-muted hover:text-blood transition-colors"
                                title={`Delete ${pin.pincode}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted">
                        No PIN codes configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                placeholder="91XXXXXXXXXX"
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <span className="text-[10px] text-muted font-mono mt-1 block">
                Indian 10-digit mobile with country code (e.g. 91XXXXXXXXXX).
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
                placeholder="admin@domain.com"
                className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
              />
              <span className="text-[10px] text-muted font-mono mt-1 block">
                Receives order alerts and commission inquiries.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted mb-1">
              Studio Support & Artisan Hours (Optional)
            </label>
            <input
              type="text"
              value={supportHours}
              onChange={(e) => setSupportHours(e.target.value)}
              placeholder="e.g. Mon – Sat: 10 AM – 8 PM IST"
              className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
            />
            <span className="text-[10px] text-muted font-mono mt-1 block">
              Displayed on public Contact page if configured. Hidden when empty (no hours are invented).
            </span>
          </div>

          {/* Audio Chime Notification Toggle & Test Sound */}
          <div className="pt-4 border-t border-subtle space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-acid" />
                  <span className="text-xs font-mono text-bone uppercase tracking-wider font-semibold">
                    Live Audio Notifications
                  </span>
                </div>
                <p className="text-[11px] text-muted font-mono">
                  Play a sound when a new order or inquiry arrives
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePlayTestSound}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider rounded border border-subtle bg-void text-muted hover:text-bone hover:border-steel transition-colors"
                  title="Test notification chime"
                >
                  <Volume2 className="w-3.5 h-3.5 text-acid" />
                  <span>Play test sound</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded border transition-all ${
                    soundAlertsEnabled
                      ? "bg-acid text-void border-acid font-bold shadow-[0_0_10px_rgba(184,255,31,0.3)]"
                      : "bg-void text-muted border-subtle hover:text-bone"
                  }`}
                  aria-label={`Notification sound: ${soundAlertsEnabled ? "ON" : "OFF"}`}
                >
                  {soundAlertsEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-void" />
                      <span>ON</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-muted" />
                      <span>OFF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {audioBlockedHint && (
              <div className="p-2.5 bg-blood/10 border border-blood/30 rounded flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-blood shrink-0 mt-0.5" />
                <p className="text-[11px] text-bone font-mono">
                  Your browser blocks sounds until you click anywhere on the page once.
                </p>
              </div>
            )}
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

      {/* Bulk Import PIN Codes Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-void/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-ash border border-subtle rounded-md max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <FiligreeCorner position="top-right" size={14} />
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base uppercase text-bone flex items-center gap-2">
                <FileUp className="w-4 h-4 text-acid" />
                <span>Paste Many PIN Codes</span>
              </h3>
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="p-1 text-muted hover:text-bone"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted font-mono">
              Paste a list of 6-digit PIN codes separated by commas, spaces, or newlines. Any duplicate entries are automatically merged.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1">
                  Default Area Name
                </label>
                <input
                  type="text"
                  value={bulkDefaultArea}
                  onChange={(e) => setBulkDefaultArea(e.target.value)}
                  placeholder="Jaipur Local Delivery Zone"
                  className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1">
                  PIN Codes (One per line or comma-separated)
                </label>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="302001, 302002&#10;302003&#10;302004 - Jawahar Nagar"
                  className="w-full bg-void border border-subtle px-3 py-2 text-xs text-bone font-mono focus:border-acid focus:outline-none resize-none"
                />
                <span className="text-[10px] text-muted font-mono mt-1 block">
                  Validates 6 digits, prevents 0-prefix, and checks 3-prefix for Jaipur local network.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBulkModalOpen(false)}
                className="px-4 py-2 border border-subtle text-muted hover:text-bone text-xs font-mono uppercase rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImportPins}
                disabled={isBulkImporting || !bulkText.trim()}
                className="px-4 py-2 bg-acid text-void font-bold text-xs font-mono uppercase rounded hover:bg-bone disabled:opacity-50 transition-colors"
              >
                {isBulkImporting ? "IMPORTING..." : "IMPORT PIN CODES"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
