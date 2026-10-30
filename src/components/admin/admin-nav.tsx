"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Mail,
  Tag,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { AdminNavBadge } from "./admin-nav-badge";
import { useAdminCountsContext } from "./admin-counts-context";

interface AdminNavProps {
  userEmail?: string;
}

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/custom-requests", label: "Inquiries", icon: Mail },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav({ userEmail = "" }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const {
    ordersCount,
    inquiriesCount,
    ordersPulsing,
    inquiriesPulsing,
  } = useAdminCountsContext();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-ash/95 border-b border-subtle backdrop-blur-md overflow-visible">
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 2xl:py-0 overflow-visible">
        <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-y-2.5 gap-x-6 2xl:h-16 overflow-visible">
          {/* Row 1: Left (Brand Block) + Right (Store + Account + Logout on 2-row mode; Hamburger on mobile) */}
          <div className="w-full 2xl:w-auto flex items-center justify-between gap-4 shrink-0 overflow-visible">
            {/* Brand Block: Wordmark + Studio Desk Tag + LIVE Indicator */}
            <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
              <Link href="/admin" className="flex items-center gap-2 shrink-0">
                <span className="font-heading text-xl tracking-wider text-bone uppercase">
                  CLAWCRAFT
                </span>
                <span className="text-[10px] font-mono tracking-widest bg-void border border-acid/40 text-acid px-2 py-0.5 uppercase rounded-sm">
                  STUDIO DESK
                </span>
              </Link>

              <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted pl-3 border-l border-subtle shrink-0">
                <span className="w-2 h-2 rounded-full bg-acid animate-pulse" />
                <span>LIVE</span>
              </div>
            </div>

            {/* Right Action Block for 2-Row View (lg to 2xl): Store + Account + Logout */}
            <div className="hidden lg:flex 2xl:hidden items-center gap-3 shrink-0">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-1.5 text-xs font-mono text-muted hover:text-bone transition-colors py-1.5 px-2.5 rounded bg-void border border-subtle shrink-0"
                title="Open Public Storefront"
              >
                <ExternalLink className="w-3.5 h-3.5 text-acid" />
                <span>Store</span>
              </Link>

              <div className="text-right pl-3 border-l border-subtle shrink-0">
                <p
                  title={userEmail}
                  className="text-[11px] font-mono text-bone truncate max-w-[180px] leading-tight"
                >
                  {userEmail}
                </p>
                <p className="text-[9px] font-mono text-acid uppercase tracking-wider leading-tight">
                  Artisan Admin
                </p>
              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="p-1.5 text-muted hover:text-blood hover:bg-blood/10 rounded transition-colors shrink-0"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button (< lg): Header shows only Brand, LIVE, and Hamburger */}
            <div className="flex lg:hidden items-center gap-2 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-bone hover:text-acid"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Row 2 (Desktop): Nav links below brand row on 1024-1535px; Centred on 1536px+ */}
          <nav className="hidden lg:flex items-center flex-wrap gap-2 xl:gap-2.5 pt-1 pb-0.5 2xl:pt-0 2xl:pb-0 w-full 2xl:w-auto 2xl:flex-1 min-w-0 flex-1 min-w-0 2xl:justify-center overflow-visible">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);

              const isOrders = link.href === "/admin/orders";
              const isInquiries = link.href === "/admin/custom-requests";

              const badgeCount = isOrders ? ordersCount : isInquiries ? inquiriesCount : 0;
              const isPulsing = isOrders ? ordersPulsing : isInquiries ? inquiriesPulsing : false;
              const badgeLabel: "orders" | "inquiries" = isOrders ? "orders" : "inquiries";
              const hasAttention = badgeCount > 0;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative min-h-[40px] h-10 flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-mono uppercase tracking-wider rounded transition-all whitespace-nowrap border shrink-0 overflow-visible ${
                    isActive
                      ? "bg-void text-acid border-acid/40 shadow-[0_0_12px_rgba(184,255,31,0.25)]"
                      : hasAttention
                      ? "bg-void/70 text-bone border-acid/40 shadow-[0_0_12px_rgba(184,255,31,0.2)] hover:border-acid/60 hover:text-white"
                      : "text-muted hover:text-bone hover:bg-subtle/40 border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.label}</span>
                  {hasAttention && (
                    <AdminNavBadge
                      count={badgeCount}
                      label={badgeLabel}
                      isPulsing={isPulsing}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Wide Screens Single-Row Right Zone (2xl+: 1536px+) */}
          <div className="hidden 2xl:flex items-center gap-3 shrink-0 justify-end overflow-visible">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 text-xs font-mono text-muted hover:text-bone transition-colors py-1.5 px-2.5 rounded bg-void border border-subtle shrink-0"
              title="Open Public Storefront"
            >
              <ExternalLink className="w-3.5 h-3.5 text-acid" />
              <span>Store</span>
            </Link>

            <div className="text-right pl-3 border-l border-subtle shrink-0">
              <p
                title={userEmail}
                className="text-[11px] font-mono text-bone truncate max-w-[180px] leading-tight"
              >
                {userEmail}
              </p>
              <p className="text-[9px] font-mono text-acid uppercase tracking-wider leading-tight">
                Artisan Admin
              </p>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-1.5 text-muted hover:text-blood hover:bg-blood/10 rounded transition-colors shrink-0"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer (< lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-ash border-b border-subtle px-4 pt-2 pb-6 space-y-3 overflow-visible">
          <div className="py-2 border-b border-subtle flex items-center justify-between text-xs font-mono text-muted">
            <span className="flex items-center gap-1.5 truncate max-w-[240px]">
              <ShieldCheck className="w-3.5 h-3.5 text-acid shrink-0" />
              <span className="truncate" title={userEmail}>{userEmail}</span>
            </span>
            <span className="text-[10px] text-acid font-bold tracking-wider uppercase shrink-0">ARTISAN ADMIN</span>
          </div>

          <div className="space-y-1.5 pt-1 overflow-visible">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);

              const isOrders = link.href === "/admin/orders";
              const isInquiries = link.href === "/admin/custom-requests";

              const badgeCount = isOrders ? ordersCount : isInquiries ? inquiriesCount : 0;
              const isPulsing = isOrders ? ordersPulsing : isInquiries ? inquiriesPulsing : false;
              const badgeLabel: "orders" | "inquiries" = isOrders ? "orders" : "inquiries";
              const hasAttention = badgeCount > 0;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`relative min-h-[44px] flex items-center justify-between px-3.5 py-2.5 text-sm font-mono uppercase tracking-wider rounded border overflow-visible ${
                    isActive
                      ? "bg-void text-acid border-acid/40 shadow-[0_0_10px_rgba(184,255,31,0.2)]"
                      : hasAttention
                      ? "bg-void/70 text-bone border-acid/40 shadow-[0_0_10px_rgba(184,255,31,0.15)]"
                      : "text-muted hover:text-bone hover:bg-subtle/30 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-acid shrink-0" />
                    <span>{link.label}</span>
                  </div>
                  {hasAttention && (
                    <AdminNavBadge
                      count={badgeCount}
                      label={badgeLabel}
                      isPulsing={isPulsing}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-subtle flex items-center justify-between">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-mono text-muted hover:text-bone flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-acid" />
              <span>Public Store</span>
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-xs font-mono text-blood hover:underline flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
