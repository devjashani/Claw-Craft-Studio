"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { useToast } from "@/components/ui/toast";
import { Lock, AlertCircle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccess(true);
        toast.success("Security Updated", "Your password has been changed successfully.");
        setTimeout(() => {
          router.push("/account");
        }, 2000);
      }
    } catch {
      setErrorMsg("Failed to update password due to a connection problem.");
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
            Security Authorization
          </p>
          <h1 className="font-display text-3xl uppercase tracking-wider text-bone font-black">
            New Password
          </h1>
          <p className="font-sans text-xs text-steel mt-2 max-w-xs mx-auto">
            Specify a new, strong password to secure your collector account.
          </p>
        </div>

        <div className="bg-ash/70 border border-steel/30 rounded-sm p-6 sm:p-8 relative backdrop-blur-md shadow-2xl">
          <FiligreeCorner position="top-right" size={24} variant="acid" />
          <FiligreeCorner position="bottom-left" size={24} variant="acid" />

          {success ? (
            <div className="space-y-4 py-4 text-center">
              <div className="w-12 h-12 bg-acid/10 border border-acid text-acid rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-display uppercase text-lg text-bone">
                Password Updated
              </h3>
              <p className="font-sans text-xs text-steel">
                Your credentials have been securely updated. Redirecting to your account dashboard...
              </p>
              <div className="pt-2">
                <Link
                  href="/account"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-acid hover:underline"
                >
                  <span>Go to Account Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-sm bg-blood/10 border border-blood text-blood text-xs font-sans flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase text-steel mb-1">
                  New Password (min 6 chars) *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-void border border-steel/30 rounded-sm px-3.5 py-2.5 text-xs text-bone focus:border-acid focus:outline-none pl-9"
                  />
                  <Lock className="w-4 h-4 text-steel/60 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-steel mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-void border border-steel/30 rounded-sm px-3.5 py-2.5 text-xs text-bone focus:border-acid focus:outline-none pl-9"
                  />
                  <Lock className="w-4 h-4 text-steel/60 absolute left-3 top-3 pointer-events-none" />
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
                      <span>Updating Credentials...</span>
                    </span>
                  ) : (
                    <span>Save New Password</span>
                  )}
                </ClawButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
