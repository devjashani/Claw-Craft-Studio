"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CustomerCustomRequestDetail } from "@/lib/custom-requests/service";
import {
  CustomRequestStepper,
  CustomRequestTimeline,
  CustomRequestSpecs,
} from "@/components/custom-requests/custom-request-views";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import {
  Search,
  Compass,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Mail,
  FileText,
} from "lucide-react";

function TrackCustomContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const refParam = searchParams.get("ref") || "";
  const tokenParam = searchParams.get("t") || "";

  const [refCode, setRefCode] = useState(refParam);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CustomerCustomRequestDetail | null>(null);

  const fetchWithToken = useCallback(async (ref: string, token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/track/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, token }),
      });
      const data = await res.json();
      if (res.ok && data.request) {
        setResult(data.request);
      } else {
        setError(data.error || "Unable to locate custom build request.");
      }
    } catch {
      setError("Network error connecting to atelier tracking servers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (refParam && tokenParam) {
      fetchWithToken(refParam, tokenParam);
    }
  }, [refParam, tokenParam, fetchWithToken]);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refCode.trim() || !email.trim()) {
      setError("Please enter both your Reference Code and registered Email.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/track/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: refCode.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.request) {
        setResult(data.request);
        if (data.publicToken) {
          // Seamlessly update URL without full page reload
          router.replace(
            `/track/custom?ref=${encodeURIComponent(data.request.ref_code)}&t=${encodeURIComponent(
              data.publicToken
            )}`
          );
        }
      } else {
        setError(data.error || "No custom request found matching those details.");
      }
    } catch {
      setError("Network error connecting to atelier tracking servers.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void text-bone py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/track"
            className="inline-flex items-center gap-2 font-mono text-xs text-steel hover:text-acid transition-colors uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Standard Order Tracking</span>
          </Link>

          <Link
            href="/custom"
            className="font-mono text-xs text-acid hover:underline uppercase"
          >
            Commission New Relic &rarr;
          </Link>
        </div>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-ash border border-acid/40 rounded-full text-xs font-mono uppercase tracking-widest text-acid">
            <Compass className="w-3.5 h-3.5" />
            <span>BESPOKE ATELIER PROGRESS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display uppercase tracking-tight text-bone">
            CUSTOM BUILD TRACKER
          </h1>
          <p className="font-sans text-xs sm:text-sm text-steel leading-relaxed">
            Monitor the architectural design, quote review, and artisan assembly status of your handcrafted commission.
          </p>
        </div>

        {/* Manual Lookup Form (shown if no result or if user wants to search another) */}
        {!result && (
          <div className="relative p-6 sm:p-8 rounded border-2 border-steel/20 bg-ash/70 backdrop-blur-md shadow-2xl">
            <FiligreeCorner position="top-left" size={16} />
            <FiligreeCorner position="bottom-right" size={16} />

            <form onSubmit={handleManualSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-steel mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-acid" />
                    <span>Reference Code *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value)}
                    placeholder="e.g. CR-2026-0001"
                    className="w-full bg-void border border-steel/30 px-3.5 py-2.5 text-xs text-bone placeholder:text-steel/50 focus:border-acid focus:outline-none rounded font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-steel mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-acid" />
                    <span>Registered Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-void border border-steel/30 px-3.5 py-2.5 text-xs text-bone placeholder:text-steel/50 focus:border-acid focus:outline-none rounded font-mono"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-blood/10 border border-blood/40 rounded flex items-center gap-2 text-blood text-xs font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-acid hover:bg-lime-400 text-void font-mono text-xs uppercase font-bold tracking-wider rounded transition-colors shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Atelier Archive...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Track Custom Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Live Tracking Result View */}
        {result && (
          <div className="space-y-8">
            <div className="relative p-6 sm:p-8 bg-ash border border-steel/25 rounded shadow-2xl space-y-8">
              <FiligreeCorner position="top-left" size={20} />
              <FiligreeCorner position="bottom-right" size={20} />

              {/* Reference Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-steel/20 pb-6">
                <div>
                  <span className="font-mono text-[10px] text-steel uppercase tracking-widest block">
                    Commission Reference Code
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <h2 className="font-mono text-2xl sm:text-3xl font-bold text-acid tracking-wider">
                      {result.ref_code}
                    </h2>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-void border border-steel/30 rounded text-[11px] font-mono text-steel">
                      <ShieldCheck className="w-3.5 h-3.5 text-acid" />
                      <span>Verified Atelier Record</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="self-start sm:self-auto font-mono text-xs text-steel hover:text-bone underline"
                >
                  Search Another Request
                </button>
              </div>

              {/* Status Stepper */}
              <div className="space-y-2">
                <span className="font-mono text-xs uppercase tracking-wider text-steel block">
                  Fabrication Progress
                </span>
                <CustomRequestStepper status={result.status} />
              </div>

              {/* Timeline Updates */}
              <CustomRequestTimeline events={result.events} />

              {/* Specifications Submitted */}
              <div className="border-t border-steel/20 pt-6">
                <span className="font-mono text-xs uppercase tracking-wider text-steel block mb-3">
                  Commission Specifications
                </span>
                <CustomRequestSpecs request={result} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function TrackCustomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-void flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-acid animate-spin" />
        </div>
      }
    >
      <TrackCustomContent />
    </Suspense>
  );
}
