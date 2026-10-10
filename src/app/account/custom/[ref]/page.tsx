"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { CustomerCustomRequestDetail } from "@/lib/custom-requests/service";
import {
  CustomRequestStepper,
  CustomRequestTimeline,
  CustomRequestSpecs,
} from "@/components/custom-requests/custom-request-views";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Compass,
} from "lucide-react";

export default function AccountCustomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const refCode = decodeURIComponent((params.ref as string) || "");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<CustomerCustomRequestDetail | null>(null);

  // Protected: Redirect to login if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(
        `/login?next=${encodeURIComponent(`/account/custom/${encodeURIComponent(refCode)}`)}`
      );
    }
  }, [authLoading, user, router, refCode]);

  useEffect(() => {
    if (!user || !refCode) return;

    async function fetchDetail() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/account/custom-requests/${encodeURIComponent(refCode)}`);
        const data = await res.json();

        if (res.ok && data.request) {
          setRequest(data.request);
        } else {
          setError(data.error || "Custom build request not found.");
        }
      } catch {
        setError("Unable to load request from atelier servers.");
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [user, refCode]);

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-acid animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-bone py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back Link */}
        <div>
          <Link
            href="/account?tab=orders"
            className="inline-flex items-center gap-2 font-mono text-xs text-steel hover:text-acid transition-colors uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Collector Vault</span>
          </Link>
        </div>

        {loading ? (
          <div className="p-16 text-center space-y-3 bg-ash/50 border border-steel/20 rounded">
            <Loader2 className="w-6 h-6 text-acid animate-spin mx-auto" />
            <p className="font-mono text-xs text-steel uppercase tracking-widest">
              Retrieving Commission Specs...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 bg-blood/10 border border-blood/40 rounded space-y-3">
            <div className="flex items-center gap-2 text-blood text-sm font-mono font-bold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <p className="text-xs text-steel">
              Ensure you are logged in with the email address used when placing this commission request.
            </p>
            <div className="pt-2">
              <Link
                href="/account?tab=orders"
                className="px-4 py-2 bg-ash border border-steel/30 text-bone text-xs font-mono uppercase rounded inline-block"
              >
                Return to Orders
              </Link>
            </div>
          </div>
        ) : request ? (
          <div className="relative p-6 sm:p-8 bg-ash border border-steel/25 rounded shadow-2xl space-y-8">
            <FiligreeCorner position="top-left" size={20} />
            <FiligreeCorner position="bottom-right" size={20} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-steel/20 pb-6">
              <div>
                <span className="font-mono text-[10px] text-steel uppercase tracking-widest block">
                  Commission Reference Code
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h1 className="font-mono text-2xl sm:text-3xl font-bold text-acid tracking-wider">
                    {request.ref_code}
                  </h1>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-void border border-steel/30 rounded text-[11px] font-mono text-steel">
                    <ShieldCheck className="w-3.5 h-3.5 text-acid" />
                    <span>Vault Linked</span>
                  </div>
                </div>
              </div>

              {request.public_token && (
                <Link
                  href={`/track/custom?ref=${encodeURIComponent(request.ref_code)}&t=${encodeURIComponent(
                    request.public_token
                  )}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-acid hover:underline"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Public Tracking Link</span>
                </Link>
              )}
            </div>

            {/* Stepper */}
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-steel block">
                Fabrication Progress
              </span>
              <CustomRequestStepper status={request.status} />
            </div>

            {/* Timeline */}
            <CustomRequestTimeline events={request.events} />

            {/* Submitted Specs */}
            <div className="border-t border-steel/20 pt-6">
              <span className="font-mono text-xs uppercase tracking-wider text-steel block mb-3">
                Commission Specifications
              </span>
              <CustomRequestSpecs request={request} />
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
