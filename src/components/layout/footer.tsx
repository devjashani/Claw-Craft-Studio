"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteContent } from "@/content/site";
import { ClawDivider } from "@/components/ui/claw-divider";

export function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="relative bg-ash/90 border-t border-steel/20 pt-12 pb-16 px-4 sm:px-6 lg:px-8 text-steel overflow-hidden select-none">
      <div className="max-w-7xl mx-auto">
        {/* Brand Decorative Slash Divider */}
        <ClawDivider variant="steel" className="mb-12" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Column 1: Studio Identity */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="inline-block font-display text-3xl md:text-4xl text-bone tracking-tighter uppercase font-black hover:text-acid transition-colors mb-3"
            >
              {siteContent.brand.name}
            </Link>
            <p className="font-mono text-xs uppercase tracking-widest text-acid mb-4">
              {siteContent.brand.tagline}
            </p>
            <p className="text-sm text-steel/80 max-w-md leading-relaxed mb-6 font-sans">
              Handcrafting architectural sculptures and gothic relief art from
              rescued aluminum energy-drink cans. Each piece is an uncompromising
              expression of metalcraft and raw underground energy.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-steel/20 bg-void/50 text-[11px] font-mono text-steel">
              <span className="w-2 h-2 rounded-full bg-acid animate-pulse" />
              <span>HANDMADE IN INDIA • PAN-INDIA DOORSTEP DELIVERY</span>
            </div>
          </div>

          {/* Column 2: Studio Explore Navigation */}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-bone font-bold mb-4">
              Explore
            </p>
            <ul className="space-y-2.5 font-sans text-sm">
              {siteContent.navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-acid transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal & Studio Policies */}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-bone font-bold mb-4">
              Policies
            </p>
            <ul className="space-y-2.5 font-sans text-sm">
              {siteContent.policies.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-acid transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* MANDATORY LEGAL & BRAND SAFETY DISCLAIMER BOX */}
        <div className="p-4 md:p-5 rounded-sm border border-steel/20 bg-void/70 my-8">
          <p className="font-mono text-[11px] tracking-wide text-steel/90 text-center leading-relaxed">
            <strong className="text-bone uppercase tracking-wider mr-2 font-display">
              LEGAL DISCLAIMER:
            </strong>
            {siteContent.brand.disclaimer}
          </p>
          <p className="font-mono text-[11px] tracking-wide text-acid/90 text-center mt-2">
            <strong>SAFETY NOTICE:</strong> {siteContent.brand.productSafetyNotice}
          </p>
        </div>

        {/* Bottom Bar: Copyright & Payment Security */}
        <div className="pt-6 border-t border-steel/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-steel/60">
          <p>
            © {new Date().getFullYear()} {siteContent.brand.name}. All Rights
            Reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="hover:text-steel transition-colors">
              Encrypted Razorpay Checkout (UPI / Cards / NetBanking)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
