"use client";

import React, { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/types/shop";
import { createClient } from "@/lib/supabase/client";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { AvatarUploader } from "@/components/account/avatar-uploader";
import { useToast } from "@/components/ui/toast";
import { User as UserIcon, Mail, Phone, MapPin, Check, Loader2, AlertCircle } from "lucide-react";

interface ProfileDetailsProps {
  user: User;
  profile: Profile | null;
  onProfileUpdated: () => void;
}

export function ProfileDetails({
  user,
  profile,
  onProfileUpdated,
}: ProfileDetailsProps) {
  const toast = useToast();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(
    profile?.display_name || user.user_metadata?.full_name || ""
  );
  const [phone, setPhone] = useState(profile?.phone || "");
  const [city, setCity] = useState(profile?.city || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile?.avatar_url || user.user_metadata?.avatar_url || null
  );

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if profile changes
  useEffect(() => {
    if (profile) {
      if (profile.display_name) setDisplayName(profile.display_name);
      if (profile.phone) setPhone(profile.phone);
      if (profile.city) setCity(profile.city);
      if (profile.avatar_url !== undefined) setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate 10-digit Indian mobile phone if provided
    let cleanPhone = phone.trim();
    if (cleanPhone) {
      cleanPhone = cleanPhone.replace(/[^0-9]/g, "");
      if (cleanPhone.length !== 10) {
        setErrorMsg("Please enter a valid 10-digit Indian mobile phone number.");
        return;
      }
    }

    setSaving(true);
    try {
      const { error } = await (supabase.from("profiles") as any)
        .update({
          display_name: displayName.trim() || null,
          phone: cleanPhone || null,
          city: city.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile Updated", "Your studio identity has been saved.");
      onProfileUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile.");
      toast.error("Error", err.message || "Could not save profile details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Avatar Uploader Component */}
      <AvatarUploader
        userId={user.id}
        currentAvatarUrl={avatarUrl}
        displayName={displayName || user.email}
        onAvatarUpdated={(newUrl) => {
          setAvatarUrl(newUrl);
          onProfileUpdated();
        }}
      />

      {/* 2. Identity Information Form */}
      <div className="bg-ash/70 border border-steel/25 rounded-sm p-6 sm:p-7 relative backdrop-blur-md shadow-xl">
        <FiligreeCorner position="top-right" size={20} variant="acid" />

        <div className="border-b border-steel/20 pb-4 mb-5">
          <h3 className="font-display uppercase text-base text-bone font-bold tracking-wider">
            Personal Information
          </h3>
          <p className="font-sans text-xs text-steel">
            Your primary contact coordinates for sculpture certifications and studio dispatch.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-blood/10 border border-blood text-blood text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 max-w-xl">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-mono uppercase text-steel mb-1">
              Collector Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Vikram Sharma"
                className="w-full bg-void border border-steel/30 rounded-sm px-3.5 py-2.5 text-xs text-bone focus:border-acid focus:outline-none pl-9"
              />
              <UserIcon className="w-4 h-4 text-steel/60 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-xs font-mono uppercase text-steel mb-1">
              Registered Email (Read-Only)
            </label>
            <div className="relative">
              <input
                type="email"
                disabled
                value={user.email || ""}
                className="w-full bg-void/50 border border-steel/20 rounded-sm px-3.5 py-2.5 text-xs text-steel/80 cursor-not-allowed pl-9 font-mono"
              />
              <Mail className="w-4 h-4 text-steel/40 absolute left-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[10px] text-steel/60 mt-1">
              Email is tied to your primary security login credentials.
            </p>
          </div>

          {/* Phone (10-digit Indian Mobile) */}
          <div>
            <label className="block text-xs font-mono uppercase text-steel mb-1">
              Mobile Phone (10-Digit Indian Mobile)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 font-mono text-xs text-steel/60">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                placeholder="9876543210"
                maxLength={10}
                className="w-full bg-void border border-steel/30 rounded-sm pl-12 pr-3.5 py-2.5 text-xs text-bone focus:border-acid focus:outline-none font-mono"
              />
            </div>
            <p className="text-[10px] text-steel/60 mt-1">
              Used for courier delivery notifications and shipping tracking.
            </p>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-mono uppercase text-steel mb-1">
              City
            </label>
            <div className="relative">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
                className="w-full bg-void border border-steel/30 rounded-sm px-3.5 py-2.5 text-xs text-bone focus:border-acid focus:outline-none pl-9"
              />
              <MapPin className="w-4 h-4 text-steel/60 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="pt-2">
            <ClawButton type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-void" />
                  <span>Saving...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-void" />
                  <span>Save Profile</span>
                </span>
              )}
            </ClawButton>
          </div>
        </form>
      </div>
    </div>
  );
}
