"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { siteContent } from "@/content/site";
import { HeaderAccount } from "@/components/layout/header-account";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { openCart, totalItems, isShaking } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const itemCount = mounted ? totalItems() : 0;

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        isScrolled
          ? "bg-void/90 backdrop-blur-md border-b border-steel/20 shadow-2xl py-3.5"
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <Link
          href="/"
          className="group flex items-baseline gap-2 text-bone hover:text-acid transition-colors select-none"
        >
          <span className="font-display text-2xl md:text-3xl tracking-tighter uppercase font-black">
            {siteContent.brand.name}
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-acid tracking-widest uppercase">
            STUDIO
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Main Navigation"
        >
          {siteContent.navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "font-mono text-xs uppercase tracking-widest transition-colors py-1 relative group",
                  isActive
                    ? "text-acid font-semibold"
                    : "text-steel hover:text-bone"
                )}
              >
                {item.label}
                {/* Underline indicator */}
                <span
                  className={cn(
                    "absolute bottom-0 left-0 w-full h-[1px] bg-acid scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100",
                    isActive && "scale-x-100"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right Action Icons (Account, Cart & Mobile Menu) */}
        <div className="flex items-center gap-3">
          {/* Customer Account Avatar / Login Button */}
          <HeaderAccount />

          {/* Cart Button with Tactical Add Shake */}
          <button
            onClick={openCart}
            aria-label={`Open shopping cart with ${itemCount} items`}
            className={cn(
              "group relative p-2.5 rounded-sm border transition-all duration-300 text-bone",
              isShaking
                ? "border-acid bg-acid/20 text-acid shadow-[0_0_20px_rgba(184,255,31,0.6)]"
                : "border-steel/30 bg-ash/70 hover:border-acid hover:text-acid"
            )}
          >
            <ShoppingBag
              className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isShaking && "animate-cart-shake text-acid"
              )}
            />

            {/* Ripple ring on add */}
            {isShaking && (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-sm border border-acid animate-ping pointer-events-none"
              />
            )}

            {/* Cart Count Badge */}
            {itemCount > 0 && (
              <span
                className={cn(
                  "absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-acid text-void font-mono font-black text-[11px] rounded-full flex items-center justify-center shadow-[0_0_10px_#B8FF1F]",
                  isShaking
                    ? "scale-125 transition-transform duration-200"
                    : "animate-in fade-in zoom-in-75"
                )}
              >
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2.5 rounded-sm border border-steel/30 bg-ash/70 text-bone hover:text-acid transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-steel/20 bg-void/95 backdrop-blur-xl px-4 py-6 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-4 mb-4">
            {siteContent.navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-display uppercase text-xl text-bone hover:text-acid transition-colors py-2 border-b border-steel/10 flex items-center justify-between"
              >
                <span>{item.label}</span>
                <span className="text-acid font-mono text-sm">→</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Account Section */}
          <HeaderAccount
            isMobileDrawer
            onNavigate={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}
    </header>
  );
}
