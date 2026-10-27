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

      const payload: Partial<SiteSettingsMap> = {
        flat_shipping_paise: Math.round(Number(flatShippingRupees) * 100),
        free_shipping_threshold_paise: Math.round(Number(freeShippingThresholdRupees) * 100),
        enable_cod: enableCod,
        announcement_bar_enabled: announcementEnabled,
        announcement_bar_text: announcementText.trim(),
        whatsapp_number: whatsappNumber.trim(),
        support_hours: supportHours.trim(),
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
    </div>
  );
}
