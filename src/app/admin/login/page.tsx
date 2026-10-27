"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, ShieldCheck, AlertCircle, Sparkles, KeyRound } from "lucide-react";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Cloudflare Turnstile integration (when configured)
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (requiresCaptcha && turnstileSiteKey && typeof window !== "undefined") {
      // Load Turnstile script dynamically if not loaded
      if (!document.getElementById("turnstile-script")) {
        const script = document.createElement("script");
        script.id = "turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }
  }, [requiresCaptcha, turnstileSiteKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: Record<string, any> = {
        email: email.trim().toLowerCase(),
        password,
      };

      if (isMfaStep) {
        payload.totpCode = totpCode.trim();
        payload.factorId = factorId;
      }

      if (turnstileToken) {
        payload.turnstileToken = turnstileToken;
      }

      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresCaptcha) {
          setRequiresCaptcha(true);
        }
        throw new Error(data.error || "Invalid email or password.");
      }

      // If server requests 2FA step
      if (data.step === "mfa_required") {
        setIsMfaStep(true);
        setFactorId(data.factorId || null);
        setError(null);
        return;
      }

      router.push(nextUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // Local development only test sign-in helper
  const handleDevLocalLogin = async () => {
    if (process.env.NODE_ENV !== "development") return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Local authentication failed.");
      }

      router.push(nextUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Local sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="relative bg-ash border border-subtle p-8 md:p-10 shadow-2xl backdrop-blur-md">
        <FiligreeCorner position="top-left" size={20} />
        <FiligreeCorner position="bottom-right" size={20} />

        {/* Studio Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-void border border-acid/40 text-acid mb-4">
            {isMfaStep ? <KeyRound className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <h1 className="font-heading text-3xl md:text-4xl uppercase tracking-wider text-bone">
            STUDIO CONTROL
          </h1>
          <p className="font-mono text-xs uppercase tracking-widest text-acid mt-1">
            Restricted Artisan Portal
          </p>
          <p className="text-xs text-muted mt-2">
            {isMfaStep
              ? "Two-factor authentication required. Enter the 6-digit code from your authenticator app."
              : "Sign in with verified administrator credentials to access the studio control panel."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-blood/10 border border-blood/30 text-blood text-xs flex items-start gap-2.5 rounded">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isMfaStep ? (
            <>
              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1.5">
                  Studio Email
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="artisan@domain.com"
                  className="w-full bg-void border border-subtle px-3.5 py-2.5 text-sm text-bone placeholder:text-muted/50 focus:border-acid focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-muted mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-void border border-subtle px-3.5 py-2.5 text-sm text-bone placeholder:text-muted/50 focus:border-acid focus:outline-none transition-colors"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-mono uppercase text-acid mb-1.5 flex items-center justify-between">
                <span>6-Digit Security Code</span>
                <span className="text-[10px] text-muted">Google Auth / TOTP</span>
              </label>
              <input
                type="text"
                name="totpCode"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full bg-void border border-acid/60 px-3.5 py-2.5 text-center text-lg font-mono tracking-widest text-acid placeholder:text-muted/40 focus:border-acid focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => {
                  setIsMfaStep(false);
                  setTotpCode("");
                }}
                className="text-[11px] text-muted hover:text-bone underline font-mono mt-2 block"
              >
                ← Back to Password
              </button>
            </div>
          )}

          {/* Turnstile Container (if CAPTCHA required) */}
          {requiresCaptcha && turnstileSiteKey && (
            <div className="pt-2">
              <div
                className="cf-turnstile"
                data-sitekey={turnstileSiteKey}
                data-callback="onTurnstileSuccess"
              />
            </div>
          )}

          <div className="pt-2">
            <ClawButton
              type="submit"
              disabled={loading}
              variant="acid"
              className="w-full justify-center text-sm py-3"
            >
              {loading
                ? "AUTHENTICATING..."
                : isMfaStep
                ? "VERIFY SECURITY CODE"
                : "ENTER WORKSHOP"}
              <ArrowRight className="w-4 h-4 ml-1.5 inline" />
            </ClawButton>
          </div>
        </form>

        {/* Development only local shortcut (completely stripped from production bundle by dead-code elimination) */}
        {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_ALLOW_DEMO_ADMIN === "true" && (
          <div className="mt-8 pt-6 border-t border-subtle/60 text-center">
            <p className="text-xs text-muted mb-3 font-mono">LOCAL DEVELOPMENT SHORTCUT</p>
            <button
              type="button"
              onClick={handleDevLocalLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-void hover:bg-subtle/40 border border-dashed border-acid/50 text-acid text-xs font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Local Dev Quick Sign-In</span>
            </button>
            <p className="text-[10px] text-muted/70 mt-2">
              Only active on localhost with explicit environment opt-in.
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-muted hover:text-bone transition-colors underline font-mono"
          >
            ← Return to Public Gallery
          </Link>
        </div>
      </div>

      <div className="mt-6 text-center flex items-center justify-center gap-2 text-muted text-xs font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-acid" />
        <span>CLAWCRAFT Artisan Portal • Encrypted Server Session</span>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-muted font-mono text-xs">Loading studio portal...</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
