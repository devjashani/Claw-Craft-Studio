"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ProfileDetails } from "@/components/account/profile-details";
import { EnergyCard } from "@/components/account/energy-card";
import { SavedAddresses } from "@/components/account/saved-addresses";
import { OrderHistory } from "@/components/account/order-history";
import { AccountSecurity } from "@/components/account/account-security";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import {
  User,
  Zap,
  MapPin,
  Package,
  Shield,
  Loader2,
  LogOut,
} from "lucide-react";

type AccountTab = "profile" | "energy" | "addresses" | "orders" | "security";

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();

  const tabParam = (searchParams.get("tab") as AccountTab) || "profile";
  const [activeTab, setActiveTab] = useState<AccountTab>(tabParam);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Protected: Redirect to /login if unauthenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-acid animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest text-steel">
          Verifying Collector Credentials...
        </p>
      </div>
    );
  }

  const tabs: { id: AccountTab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "energy", label: "Energy Stat", icon: Zap },
    { id: "addresses", label: "Saved Addresses", icon: MapPin },
    { id: "orders", label: "My Orders", icon: Package },
    { id: "security", label: "Security & Account", icon: Shield },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
      {/* Top Banner / Welcome */}
      <div className="mb-8 border-b border-steel/20 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-acid mb-1">
            Studio Sanctuary
          </p>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wider text-bone font-black">
            Collector Vault
          </h1>
          <p className="font-sans text-xs text-steel mt-1">
            Logged in as <span className="font-mono text-acid">{user.email}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="self-start sm:self-auto px-3.5 py-1.5 border border-steel/25 hover:border-blood text-steel hover:text-blood text-xs font-mono uppercase rounded transition-colors inline-flex items-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1">
          <nav className="bg-ash/70 border border-steel/25 rounded-sm p-2 backdrop-blur-md space-y-1 relative shadow-xl">
            <FiligreeCorner position="top-right" size={14} variant="steel" />
            <FiligreeCorner position="bottom-left" size={14} variant="steel" />

            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    router.push(`/account?tab=${tab.id}`, { scroll: false });
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-mono uppercase tracking-wider transition-all text-left ${
                    isActive
                      ? "bg-void border border-acid/50 text-acid font-bold shadow-[0_0_10px_rgba(184,255,31,0.15)]"
                      : "text-steel hover:text-bone hover:bg-void/40 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-acid" : "text-steel/70"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Tab Content Display Area */}
        <main className="lg:col-span-3">
          {activeTab === "profile" && (
            <div className="space-y-8">
              <ProfileDetails
                user={user}
                profile={profile}
                onProfileUpdated={refreshProfile}
              />
            </div>
          )}

          {activeTab === "energy" && (
            <div className="space-y-6">
              <EnergyCard
                userId={user.id}
                hookedSince={profile?.hooked_since}
                favouriteFlavour={profile?.favourite_flavour}
                onUpdated={() => refreshProfile()}
              />
            </div>
          )}

          {activeTab === "addresses" && (
            <SavedAddresses userId={user.id} />
          )}

          {activeTab === "orders" && (
            <OrderHistory />
          )}

          {activeTab === "security" && (
            <AccountSecurity />
          )}
        </main>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-28 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-acid animate-spin" />
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
