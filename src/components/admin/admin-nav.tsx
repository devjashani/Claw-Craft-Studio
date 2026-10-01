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

export function AdminNav({ userEmail = "studio@clawcraft.in" }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
    <header className="sticky top-0 z-50 bg-ash/95 border-b border-subtle backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Badge */}
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="font-heading text-xl tracking-wider text-bone uppercase">
                CLAWCRAFT
              </span>
              <span className="text-[10px] font-mono tracking-widest bg-void border border-acid/40 text-acid px-2 py-0.5 uppercase rounded-sm">
                STUDIO DESK
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-muted pl-2 border-l border-subtle">
              <span className="w-2 h-2 rounded-full bg-acid animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
                    isActive
                      ? "bg-void text-acid border border-acid/30"
                      : "text-muted hover:text-bone hover:bg-subtle/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 text-xs font-mono text-muted hover:text-bone transition-colors py-1 px-2.5 rounded bg-void border border-subtle"
              title="Open Public Storefront"
            >
              <ExternalLink className="w-3.5 h-3.5 text-acid" />
              <span>Store</span>
            </Link>

            <div className="text-right pl-2 border-l border-subtle">
              <p className="text-[11px] font-mono text-bone truncate max-w-[140px]">
                {userEmail}
              </p>
              <p className="text-[9px] font-mono text-acid uppercase">Artisan Admin</p>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-1.5 text-muted hover:text-blood hover:bg-blood/10 rounded transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="p-2 text-muted hover:text-bone"
              title="Open Public Store"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-bone hover:text-acid"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-ash border-b border-subtle px-4 pt-2 pb-6 space-y-2">
          <div className="py-2 border-b border-subtle flex items-center justify-between text-xs font-mono text-muted">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-acid" />
              {userEmail}
            </span>
            <span className="text-[10px] text-acid font-bold">ACTIVE</span>
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-mono uppercase tracking-wider rounded ${
                  isActive
                    ? "bg-void text-acid border border-acid/40"
                    : "text-muted hover:text-bone hover:bg-subtle/30"
                }`}
              >
                <Icon className="w-4 h-4 text-acid" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-subtle flex items-center justify-between">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-mono text-muted hover:text-bone flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Store</span>
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-xs font-mono text-blood hover:underline flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
