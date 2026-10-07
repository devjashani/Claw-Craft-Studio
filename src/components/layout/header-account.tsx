"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { ClawButton } from "@/components/ui/claw-button";
import { User, Package, MapPin, LogOut, ChevronRight } from "lucide-react";

interface HeaderAccountProps {
  isMobileDrawer?: boolean;
  onNavigate?: () => void;
}

export function HeaderAccount({ isMobileDrawer = false, onNavigate }: HeaderAccountProps) {
  const { user, profile, loading, signOut, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Keyboard navigation & accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setDropdownOpen(false);
      buttonRef.current?.focus();
    }
  };

  // If loading, render an unobtrusive fixed-size placeholder to prevent layout shift
  if (loading) {
    if (isMobileDrawer) {
      return (
        <div className="py-2 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-steel/10 animate-pulse" />
          <div className="h-4 w-28 bg-steel/10 rounded animate-pulse" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-steel/10 animate-pulse shrink-0" aria-hidden="true" />
    );
  }

  // --- MOBILE DRAWER RENDERING ---
  if (isMobileDrawer) {
    if (!isAuthenticated) {
      return (
        <div className="pt-4 border-t border-steel/15">
          <Link href="/login" onClick={onNavigate}>
            <ClawButton variant="primary" size="md" className="w-full">
              LOGIN / SIGN UP
            </ClawButton>
          </Link>
        </div>
      );
    }

    const displayName =
      profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Collector";
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
    const initial = (displayName[0] || "C").toUpperCase();

    return (
      <div className="pt-4 border-t border-steel/15 space-y-3">
        {/* User Card */}
        <div className="flex items-center gap-3 p-2 bg-ash/60 border border-steel/20 rounded">
          <div className="avatar-glowing-ring shrink-0">
            <div className="avatar-glowing-inner">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover rounded-full"
                  unoptimized
                />
              ) : (
                <span className="text-acid font-display font-black text-xs select-none">
                  {initial}
                </span>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display uppercase text-sm text-bone truncate">{displayName}</p>
            <p className="font-mono text-[10px] text-steel/70 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 gap-1">
          <Link
            href="/account"
            onClick={onNavigate}
            className="flex items-center justify-between p-2 rounded text-xs font-mono uppercase text-steel hover:text-acid hover:bg-steel/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-acid" /> Profile & Energy Stat
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-steel/50" />
          </Link>

          <Link
            href="/account?tab=orders"
            onClick={onNavigate}
            className="flex items-center justify-between p-2 rounded text-xs font-mono uppercase text-steel hover:text-acid hover:bg-steel/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-acid" /> My Orders
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-steel/50" />
          </Link>

          <Link
            href="/account?tab=addresses"
            onClick={onNavigate}
            className="flex items-center justify-between p-2 rounded text-xs font-mono uppercase text-steel hover:text-acid hover:bg-steel/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-acid" /> Saved Addresses
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-steel/50" />
          </Link>

          <button
            type="button"
            onClick={() => {
              signOut();
              onNavigate?.();
            }}
            className="flex items-center gap-2 w-full text-left p-2 rounded text-xs font-mono uppercase text-blood hover:bg-blood/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-blood" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // --- DESKTOP RENDERING (Top right, before the cart icon) ---
  if (!isAuthenticated) {
    return (
      <Link href="/login" className="hidden sm:inline-block">
        <ClawButton variant="secondary" size="sm" className="font-mono text-xs tracking-wider">
          LOGIN / SIGN UP
        </ClawButton>
      </Link>
    );
  }

  const displayName =
    profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Collector";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initial = (displayName[0] || "C").toUpperCase();

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-label={`User account menu for ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={dropdownOpen}
        className="avatar-glowing-ring focus-visible:outline-none select-none"
      >
        <div className="avatar-glowing-inner">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={36}
              height={36}
              className="w-full h-full object-cover rounded-full"
              unoptimized
            />
          ) : (
            <span className="text-acid font-display font-black text-sm select-none tracking-tighter">
              {initial}
            </span>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div
          ref={dropdownRef}
          role="menu"
          aria-label="Account options"
          onKeyDown={handleKeyDown}
          className="absolute right-0 mt-3 w-56 bg-ash/95 border border-steel/30 rounded-sm shadow-2xl backdrop-blur-md p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header user info */}
          <div className="px-3 py-2 border-b border-steel/15 mb-1.5">
            <p className="font-display uppercase text-xs text-bone truncate font-bold">
              {displayName}
            </p>
            <p className="font-mono text-[10px] text-steel/70 truncate">{user?.email}</p>
          </div>

          <div className="space-y-0.5">
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono uppercase text-steel hover:text-bone hover:bg-void/70 rounded-sm transition-colors"
            >
              <User className="w-3.5 h-3.5 text-acid" />
              <span>Profile</span>
            </Link>

            <Link
              href="/account?tab=orders"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono uppercase text-steel hover:text-bone hover:bg-void/70 rounded-sm transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-acid" />
              <span>My Orders</span>
            </Link>

            <Link
              href="/account?tab=addresses"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-mono uppercase text-steel hover:text-bone hover:bg-void/70 rounded-sm transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-acid" />
              <span>Saved Addresses</span>
            </Link>

            <div className="my-1 border-t border-steel/15" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setDropdownOpen(false);
                signOut();
              }}
              className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-mono uppercase text-blood hover:bg-blood/10 rounded-sm transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-blood" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
