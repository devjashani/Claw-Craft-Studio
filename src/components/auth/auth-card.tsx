"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { useToast } from "@/components/ui/toast";
import {
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Shield,
} from "lucide-react";

interface AuthCardProps {
  initialMode?: "login" | "signup";
}

function formatAuthErrorMessage(error: unknown): string {
  const message =
    typeof error === "string"
      ? error
      : (error as { message?: string })?.message || "";
  const lower = message.toLowerCase();

  if (
    lower.includes("failed to fetch") ||
    lower.includes("err_name_not_resolved") ||
    lower.includes("network")
  ) {
    const isMock =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("mock-project") ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (isMock) {
      return "Cannot connect to Supabase: .env.local is currently configured with placeholder credentials (mock-project.supabase.co). Please replace them with your actual Supabase Project URL & Anon Key from your Supabase dashboard and restart the server.";
    }
    return "Cannot reach the Supabase authentication server. Please check your internet connection or verify your Supabase project URL.";
  }

  if (lower.includes("email not confirmed")) {
    return "Please confirm your email address. Check your inbox for the verification link.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password. Please double check and try again.";
  }

  if (lower.includes("rate limit")) {
    return "Supabase email rate limit exceeded (free tier allows only 3 emails/hr). In your Supabase dashboard, go to Authentication -> Providers -> Email, turn OFF 'Confirm email', click Save, and try again.";
  }

  return message || "An unexpected error occurred. Please try again.";
}

export function AuthCard({ initialMode = "login" }: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const nextUrl = searchParams.get("next") || "/account";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const supabase = createClient();
  const isGoogleAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(formatAuthErrorMessage(error));
        return;
      }

      if (data.user) {
        toast.success("Welcome back", `Logged in as ${data.user.email}`);
        router.push(nextUrl);
        router.refresh();
      }
    } catch (err) {
      setErrorMessage(formatAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please provide an email and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("Please accept the terms of service and privacy policy to continue.");
      return;
    }

    setLoading(true);
    try {
      const siteUrl = window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim() || splitEmailName(email),
          },
          emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
        },
      });

      if (error) {
        setErrorMessage(formatAuthErrorMessage(error));
        return;
      }

      if (data.user) {
        // If Supabase auto-confirmed (e.g. dev mode) or session exists
        if (data.session) {
          toast.success("Account Created", "Welcome to CLAWCRAFT Studio.");
          router.push(nextUrl);
          router.refresh();
        } else {
          // Email confirmation is required
          setSignupSuccess(true);
        }
      }
    } catch (err) {
      setErrorMessage(formatAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      const siteUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
        },
      });

      if (error) {
        setErrorMessage(formatAuthErrorMessage(error));
        setGoogleLoading(false);
      }
    } catch (err) {
      setErrorMessage(formatAuthErrorMessage(err));
      setGoogleLoading(false);
    }
  };

  const splitEmailName = (e: string) => {
    return e.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ").trim();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Container Box */}
      <div className="bg-ash/70 border border-steel/30 rounded-sm p-6 sm:p-8 relative backdrop-blur-md shadow-2xl">
        <FiligreeCorner position="top-right" size={24} variant="acid" />
        <FiligreeCorner position="bottom-left" size={24} variant="acid" />

        {/* Tab Headers: Login vs Sign Up */}
        <div className="flex items-center border-b border-steel/20 pb-4 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMessage(null);
            }}
            className={`flex-1 text-center font-display uppercase tracking-wider text-sm pb-2 border-b-2 transition-all ${
              mode === "login"
                ? "border-acid text-bone font-bold"
                : "border-transparent text-steel hover:text-bone"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMessage(null);
            }}
            className={`flex-1 text-center font-display uppercase tracking-wider text-sm pb-2 border-b-2 transition-all ${
              mode === "signup"
                ? "border-acid text-bone font-bold"
                : "border-transparent text-steel hover:text-bone"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Signup Success Notice (Email confirmation required) */}
        {signupSuccess ? (
          <div className="space-y-4 py-4 text-center">
            <div className="w-12 h-12 bg-acid/10 border border-acid text-acid rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-display uppercase text-lg text-bone">
              Verification Link Sent
            </h3>
            <p className="font-sans text-xs text-steel leading-relaxed">
              We sent a confirmation link to{" "}
              <strong className="text-acid font-mono">{email}</strong>. Please check your inbox
              (and spam folder) and click the link to activate your studio account.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSignupSuccess(false);
                  setMode("login");
                }}
                className="text-xs font-mono text-acid hover:underline"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-sm bg-blood/10 border border-blood text-blood text-xs font-sans flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google OAuth Option (Only if enabled) */}
            {isGoogleAuthEnabled && (
              <div className="mb-6 space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-void border border-steel/40 hover:border-acid text-bone text-xs font-mono uppercase tracking-wider rounded-sm transition-all"
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-acid" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <span className="absolute inset-x-0 h-[1px] bg-steel/20" />
                  <span className="relative bg-ash px-2 text-[10px] font-mono uppercase text-steel">
                    or with email
                  </span>
                </div>
              </div>
            )}

            {/* Login / Signup Form */}
            <form
              onSubmit={mode === "login" ? handleLogin : handleSignup}
              className="space-y-4"
            >
              {/* Full Name field (Signup only) */}
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-mono uppercase text-steel mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vikram Sharma"
                      className="w-full bg-void border border-steel/30 rounded-sm px-3.5 py-2.5 text-xs text-bone focus:border-acid focus:outline-none pl-9"
                    />
                    <User className="w-4 h-4 text-steel/60 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div>
                <label className="block text-xs font-mono uppercase text-steel mb-1">
                  Email Address *
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

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono uppercase text-steel">
                    Password *
                  </label>
                  {mode === "login" && (
                    <Link
                      href="/forgot-password"
                      className="text-[11px] font-mono text-acid hover:underline"
                    >
                      Forgot?
                    </Link>
                  )}
                </div>
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

              {/* Consent Checkbox & Optional Note (Signup only) */}
              {mode === "signup" && (
                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-2.5 text-[11px] text-steel font-sans select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 accent-acid w-4 h-4 rounded border-steel/40 cursor-pointer"
                    />
                    <span>
                      I agree to the{" "}
                      <Link
                        href="/policies/terms"
                        target="_blank"
                        className="text-acid hover:underline"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/policies/privacy"
                        target="_blank"
                        className="text-acid hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

                  {/* Account is optional notice */}
                  <div className="p-2.5 bg-void/50 border border-steel/15 rounded text-[11px] text-steel flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-acid shrink-0" />
                    <span>Account is optional. You can always check out as a guest.</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
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
                      <span>{mode === "login" ? "Authenticating..." : "Creating Account..."}</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>{mode === "login" ? "Sign In to Studio" : "Create Account"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </ClawButton>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Guest Checkout Quick Link */}
      <div className="mt-6 text-center text-xs font-mono text-steel">
        <span>Ordering without an account? </span>
        <Link href="/shop" className="text-acid hover:underline">
          Continue as Guest &rarr;
        </Link>
      </div>
    </div>
  );
}
