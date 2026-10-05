"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { ClawButton } from "@/components/ui/claw-button";
import { Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

interface OrderAccessGateProps {
  orderIdentifier: string;
}

export function OrderAccessGate({ orderIdentifier }: OrderAccessGateProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 4) {
      setError("Please enter the registered mobile phone number used at checkout.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIdentifier,
          phone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.order?.public_token) {
        // Redirect to same order page with valid token
        router.push(`/order/${orderIdentifier}?t=${encodeURIComponent(data.order.public_token)}`);
      } else {
        setError(data.error || "Verification failed. The phone number does not match this order.");
      }
    } catch {
      setError("Failed to verify access. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void py-16 px-4 flex items-center justify-center">
      <div className="max-w-md w-full relative p-8 rounded-sm border-2 border-steel/30 bg-ash/80 backdrop-blur-md text-center shadow-2xl">
        <FiligreeCorner position="top-left" size={24} variant="acid" />
        <FiligreeCorner position="bottom-right" size={24} variant="acid" />

        <div className="w-12 h-12 rounded-full bg-void border border-steel/30 text-steel flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-acid" />
        </div>

        <div className="font-mono text-[10px] text-acid uppercase tracking-widest mb-1">
          SECURE ORDER VERIFICATION
        </div>

        <h1 className="font-display uppercase text-2xl text-bone mb-2">
          CONFIRM YOUR IDENTITY
        </h1>

        <p className="font-sans text-xs text-steel/80 leading-relaxed mb-6">
          To protect customer privacy and sensitive shipping details, please enter the registered mobile phone number associated with Order <strong>{orderIdentifier}</strong>.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-sm bg-blood/10 border border-blood/30 text-blood text-xs font-mono text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left font-mono text-xs">
          <div>
            <label className="block text-steel uppercase mb-1">
              Registered Mobile Phone *
            </label>
            <input
              type="tel"
              placeholder="9876543210"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full bg-void border border-steel/30 rounded-sm px-3.5 py-2.5 text-bone focus:outline-none focus:border-acid"
              required
              autoFocus
            />
          </div>

          <ClawButton
            type="submit"
            variant="primary"
            size="md"
            disabled={loading || phone.length < 4}
            className="w-full justify-center mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                Access Order Confirmation <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </ClawButton>
        </form>
      </div>
    </div>
  );
}
