import { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Create Account | CLAWCRAFT Studio",
  description: "Join CLAWCRAFT Studio to preserve your sculpture collection history and enjoy faster checkout.",
};

export default function SignupPage() {
  return (
    <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 relative overflow-hidden bg-void">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-acid/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md mx-auto relative z-10">
        <div className="text-center mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-acid mb-2">
            Collector Register
          </p>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wider text-bone font-black">
            Join The Studio
          </h1>
          <p className="font-sans text-xs text-steel mt-2 max-w-xs mx-auto">
            Create an optional collector profile to preserve orders and expedite acquisitions.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="w-full h-80 flex items-center justify-center bg-ash/50 border border-steel/20 rounded">
              <Loader2 className="w-6 h-6 text-acid animate-spin" />
            </div>
          }
        >
          <AuthCard initialMode="signup" />
        </Suspense>
      </div>
    </main>
  );
}
