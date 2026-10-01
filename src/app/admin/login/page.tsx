"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from "lucide-react";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to authenticate.");
      }

      router.push(nextUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
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
        throw new Error(data.error || "Demo authentication failed.");
      }

      router.push(nextUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Demo login failed.");
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
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl uppercase tracking-wider text-bone">
            STUDIO CONTROL
          </h1>
          <p className="font-mono text-xs uppercase tracking-widest text-acid mt-1">
            Restricted Artisan Portal
          </p>
          <p className="text-xs text-muted mt-2">
            Sign in to manage orders, catalog inventory, custom commissions & store settings.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-blood/10 border border-blood/30 text-blood text-xs flex items-start gap-2.5 rounded">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-muted mb-1.5">
              Studio Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="studio@clawcraft.in"
              className="w-full bg-void border border-subtle px-3.5 py-2.5 text-sm text-bone placeholder:text-muted/50 focus:border-acid focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted mb-1.5">
              Master Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-void border border-subtle px-3.5 py-2.5 text-sm text-bone placeholder:text-muted/50 focus:border-acid focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-2">
            <ClawButton
              type="submit"
              disabled={loading}
              variant="acid"
              className="w-full justify-center text-sm py-3"
            >
              {loading ? "AUTHENTICATING..." : "ENTER WORKSHOP"}
              <ArrowRight className="w-4 h-4 ml-1.5 inline" />
            </ClawButton>
          </div>
        </form>

        {/* Demo Fast-Track Access */}
        <div className="mt-8 pt-6 border-t border-subtle/60 text-center">
          <p className="text-xs text-muted mb-3 font-mono">DEVELOPMENT & REVIEW SHORTCUT</p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-void hover:bg-subtle/40 border border-dashed border-acid/50 text-acid text-xs font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Demo Studio Sign-In</span>
          </button>
          <p className="text-[10px] text-muted/70 mt-2">
            Bypasses remote credentials for seamless local testing & code review.
          </p>
        </div>

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
        <span>CLAWCRAFT Artisan Portal • Encrypted Session</span>
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
