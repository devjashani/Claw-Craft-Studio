"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { Mail, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const siteUrl = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSubmitted(true);
      }
    } catch {
      setErrorMsg("Unable to send reset instructions due to a network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 relative overflow-hidden bg-void">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-acid/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md mx-auto relative z-10">
        <div className="text-center mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-acid mb-2">
            Credential Recovery
          </p>
          <h1 className="font-display text-3xl uppercase tracking-wider text-bone font-black">
            Reset Password
          </h1>
          <p className="font-sans text-xs text-steel mt-2 max-w-xs mx-auto">
            Provide the email associated with your collector account to receive recovery instructions.
          </p>
        </div>

        <div className="bg-ash/70 border border-steel/30 rounded-sm p-6 sm:p-8 relative backdrop-blur-md shadow-2xl">
          <FiligreeCorner position="top-right" size={24} variant="acid" />
          <FiligreeCorner position="bottom-left" size={24} variant="acid" />

          {submitted ? (
            <div className="space-y-4 py-4 text-center">
              <div className="w-12 h-12 bg-acid/10 border border-acid text-acid rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-display uppercase text-lg text-bone">
                Reset Link Dispatched
              </h3>
              <p className="font-sans text-xs text-steel leading-relaxed">
                If an account exists for <strong className="text-acid font-mono">{email}</strong>, a secure password recovery link has been sent to your inbox.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-acid hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-sm bg-blood/10 border border-blood text-blood text-xs font-sans flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase text-steel mb-1">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="collector@example.com"
                    className="w-full bg-void border border-steel/30 rounded-sm px-3.5 py-2.5 text-xs text-bone focus:border-acid focus:outline-none pl-9"
                  />
                  <Mail className="w-4 h-4 text-steel/60 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="pt-2">
                <ClawButton
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Instructions...</span>
                    </span>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </ClawButton>
              </div>

              <div className="pt-4 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-steel hover:text-acid transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
