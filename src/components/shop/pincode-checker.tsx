"use client";

import React, { useState } from "react";
import { Truck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { ClawButton } from "@/components/ui/claw-button";

export function PincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    serviceable: boolean;
    message: string;
  } | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      setResult({
        serviceable: false,
        message: "Please enter a valid 6-digit Indian PIN code.",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/pincode/validate?pincode=${pincode}`);
      const data = await res.json();
      if (res.ok && data.serviceable) {
        setResult({
          serviceable: true,
          message: data.message,
        });
      } else {
        setResult({
          serviceable: false,
          message: data.message || "Delivery currently unserviceable for this area.",
        });
      }
    } catch {
      setResult({
        serviceable: false,
        message: "Unable to verify PIN code right now. Pan-India shipping available.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-sm border border-steel/20 bg-ash/60">
      <div className="flex items-center gap-2 mb-2 font-mono text-xs uppercase tracking-wider text-bone">
        <Truck className="w-4 h-4 text-acid" />
        <span>Check Delivery & Dispatch Time</span>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2 mt-3">
        <input
          type="text"
          maxLength={6}
          placeholder="Enter 6-digit PIN"
          value={pincode}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, "");
            setPincode(val);
            if (result) setResult(null);
          }}
          className="flex-1 bg-void border border-steel/30 rounded-sm px-3 py-2 text-sm font-mono text-bone placeholder:text-steel/40 focus:outline-none focus:border-acid transition-colors"
        />
        <ClawButton
          type="submit"
          variant="secondary"
          size="sm"
          disabled={loading || pincode.length !== 6}
          className="shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
        </ClawButton>
      </form>

      {result && (
        <div
          className={`mt-3 p-3 rounded-sm text-xs font-mono flex items-start gap-2 ${
            result.serviceable
              ? "bg-acid/10 border border-acid/30 text-bone"
              : "bg-blood/10 border border-blood/30 text-bone"
          }`}
        >
          {result.serviceable ? (
            <CheckCircle2 className="w-4 h-4 text-acid shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-blood shrink-0 mt-0.5" />
          )}
          <span className="leading-snug">{result.message}</span>
        </div>
      )}
    </div>
  );
}
