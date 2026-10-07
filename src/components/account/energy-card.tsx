"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { useToast } from "@/components/ui/toast";
import { Zap, Sparkles, Trophy, Award, Flame, Shield, Check, Loader2 } from "lucide-react";

interface EnergyCardProps {
  userId: string;
  hookedSince?: string | null;
  favouriteFlavour?: string | null;
  onUpdated: (hookedSince: string | null, favouriteFlavour: string | null) => void;
}

export function EnergyCard({
  userId,
  hookedSince,
  favouriteFlavour,
  onUpdated,
}: EnergyCardProps) {
  const toast = useToast();
  const supabase = createClient();

  // Parse initial years & months from hookedSince
  const getInitialYearsAndMonths = (dateStr?: string | null) => {
    if (!dateStr) return { years: 0, months: 0, hasSet: false };
    const start = new Date(dateStr);
    if (isNaN(start.getTime())) return { years: 0, months: 0, hasSet: false };

    const now = new Date();
    let totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) totalMonths -= 1;
    totalMonths = Math.max(0, totalMonths);

    return {
      years: Math.min(30, Math.floor(totalMonths / 12)),
      months: totalMonths % 12,
      hasSet: true,
    };
  };

  const initialValues = getInitialYearsAndMonths(hookedSince);

  const [years, setYears] = useState(initialValues.years);
  const [months, setMonths] = useState(initialValues.months);
  const [flavour, setFlavour] = useState(favouriteFlavour || "");
  const [isEditing, setIsEditing] = useState(!initialValues.hasSet);
  const [saving, setSaving] = useState(false);

  // Derive dynamic live duration from hookedSince
  const calculateLiveDuration = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const start = new Date(dateStr);
    if (isNaN(start.getTime())) return null;

    const now = new Date();
    let totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) totalMonths -= 1;
    totalMonths = Math.max(0, totalMonths);

    const yrs = Math.floor(totalMonths / 12);
    const mths = totalMonths % 12;

    let text = "";
    if (yrs > 0 && mths > 0) {
      text = `${yrs} ${yrs === 1 ? "YEAR" : "YEARS"} ${mths} ${mths === 1 ? "MONTH" : "MONTHS"}`;
    } else if (yrs > 0) {
      text = `${yrs} ${yrs === 1 ? "YEAR" : "YEARS"}`;
    } else if (mths > 0) {
      text = `${mths} ${mths === 1 ? "MONTH" : "MONTHS"}`;
    } else {
      text = "JUST STARTED (UNDER 1 MONTH)";
    }

    // Badge classification
    let tier: "Rookie" | "Regular" | "Veteran" | "Legend" = "Rookie";
    let icon = Sparkles;
    let colorClass = "text-steel border-steel/40 bg-steel/10";

    if (totalMonths < 6) {
      tier = "Rookie";
      icon = Sparkles;
      colorClass = "text-steel border-steel/40 bg-steel/10";
    } else if (totalMonths <= 24) {
      tier = "Regular";
      icon = Award;
      colorClass = "text-acid border-acid/50 bg-acid/10";
    } else if (totalMonths <= 60) {
      tier = "Veteran";
      icon = Trophy;
      colorClass = "text-acid border-acid bg-acid/20 shadow-[0_0_12px_rgba(184,255,31,0.4)]";
    } else {
      tier = "Legend";
      icon = Flame;
      colorClass = "text-acid border-acid bg-acid/30 shadow-[0_0_20px_rgba(184,255,31,0.6)] animate-pulse";
    }

    return { text, totalMonths, tier, icon, colorClass };
  };

  const liveStats = calculateLiveDuration(hookedSince);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Derive start date (hooked_since)
      const targetDate = new Date();
      targetDate.setFullYear(targetDate.getFullYear() - years);
      targetDate.setMonth(targetDate.getMonth() - months);
      // Keep day stable
      targetDate.setDate(1);
      const derivedHookedSince = targetDate.toISOString().split("T")[0];

      const cleanFlavour = flavour.trim() || null;

      const { error } = await (supabase.from("profiles") as any)
        .update({
          hooked_since: derivedHookedSince,
          favourite_flavour: cleanFlavour,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Energy Profile Updated", "Your energy drink duration stat has been recorded.");
      onUpdated(derivedHookedSince, cleanFlavour);
      setIsEditing(false);
    } catch (err: any) {
      toast.error("Failed to Save", err.message || "Could not save energy profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-ash/70 border border-steel/25 rounded-sm p-6 sm:p-7 relative backdrop-blur-md shadow-xl overflow-hidden">
      <FiligreeCorner position="top-right" size={20} variant="acid" />
      <FiligreeCorner position="bottom-left" size={20} variant="acid" />

      {/* Decorative lightning background watermark */}
      <div className="absolute -right-6 -bottom-6 w-36 h-36 opacity-5 pointer-events-none text-acid">
        <Zap className="w-full h-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-steel/20 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-acid/15 border border-acid/50 text-acid flex items-center justify-center">
            <Zap className="w-4 h-4 fill-acid" />
          </div>
          <div>
            <h3 className="font-display uppercase text-base text-bone font-bold tracking-wider">
              Energy Drink Profile
            </h3>
            <p className="font-sans text-xs text-steel">
              Your personal energy enthusiast milestone and taste profile.
            </p>
          </div>
        </div>

        {hookedSince && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-mono uppercase text-acid hover:underline"
          >
            Edit Stats
          </button>
        )}
      </div>

      {/* Display Card (when saved and not editing) */}
      {!isEditing && liveStats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Live Duration Display */}
            <div className="p-4 bg-void/60 border border-steel/20 rounded-sm space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-steel">
                Total Hooked Duration
              </span>
              <p className="font-display text-xl sm:text-2xl uppercase tracking-wider text-acid font-black">
                {liveStats.text}
              </p>
              <p className="text-[11px] font-sans text-steel/70">
                Grows automatically over time based on your derived anniversary.
              </p>
            </div>

            {/* Rank / Tier Badge */}
            <div className="p-4 bg-void/60 border border-steel/20 rounded-sm flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-steel">
                Enthusiast Rank
              </span>
              <div className="pt-2 flex items-center gap-3">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border font-mono text-xs uppercase tracking-widest font-bold ${liveStats.colorClass}`}
                >
                  <liveStats.icon className="w-4 h-4" />
                  <span>{liveStats.tier}</span>
                </div>
                <span className="text-xs text-steel font-sans">
                  {liveStats.tier === "Rookie" && "Welcome to the circuit"}
                  {liveStats.tier === "Regular" && "Reliable high-voltage focus"}
                  {liveStats.tier === "Veteran" && "Hardened energy connoisseur"}
                  {liveStats.tier === "Legend" && "Elite caffeine endurance"}
                </span>
              </div>
            </div>
          </div>

          {/* Favourite Flavour Display */}
          {favouriteFlavour && (
            <div className="p-3.5 bg-void/40 border border-steel/15 rounded-sm flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-steel">
                Signature Flavour:
              </span>
              <span className="font-display uppercase text-sm text-bone font-bold tracking-wide text-glow-acid">
                {favouriteFlavour}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Edit / Setup Form */
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase text-steel mb-2">
              How long have you been hooked on energy drinks?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Years Selector (0 - 30) */}
              <div>
                <span className="block text-[11px] font-mono text-steel/70 mb-1">Years</span>
                <select
                  value={years}
                  onChange={(e) => setYears(parseInt(e.target.value, 10))}
                  className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2 text-xs text-bone focus:border-acid focus:outline-none"
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i} value={i}>
                      {i} {i === 1 ? "Year" : "Years"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Months Selector (0 - 11) */}
              <div>
                <span className="block text-[11px] font-mono text-steel/70 mb-1">Months</span>
                <select
                  value={months}
                  onChange={(e) => setMonths(parseInt(e.target.value, 10))}
                  className="w-full bg-void border border-steel/30 rounded-sm px-3 py-2 text-xs text-bone focus:border-acid focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {i} {i === 1 ? "Month" : "Months"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Optional Favourite Flavour */}
          <div>
            <label className="block text-xs font-mono uppercase text-steel mb-1">
              Favourite Flavour (Optional)
            </label>
            <input
              type="text"
              value={flavour}
              onChange={(e) => setFlavour(e.target.value)}
              placeholder="e.g. Sour Apple, Neon Citrus, Tropical Mango, Arctic Freeze"
              maxLength={50}
              className="w-full bg-void border border-steel/30 rounded-sm px-3.5 py-2 text-xs text-bone focus:border-acid focus:outline-none"
            />
            <p className="text-[10px] text-steel/60 mt-1">
              Your go-to taste profile when powering through long creative sessions.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-3 pt-2">
            <ClawButton
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-void" />
                  <span>Saving...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-void" />
                  <span>Save Energy Profile</span>
                </span>
              )}
            </ClawButton>

            {hookedSince && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs font-mono uppercase text-steel hover:text-bone"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Mandatory Disclaimer Footer: Fun profile stat, not health advice. */}
      <div className="mt-6 pt-3 border-t border-steel/15 flex items-center gap-2 text-[11px] text-steel/60 font-mono">
        <Shield className="w-3.5 h-3.5 text-acid shrink-0" />
        <span>Fun profile stat, not health advice.</span>
      </div>
    </div>
  );
}
