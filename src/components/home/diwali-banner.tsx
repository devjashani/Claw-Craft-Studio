"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export function DiwaliBanner() {
  return (
    <section className="bg-void py-3 px-4 sm:px-6 lg:px-8 border-y border-acid/30 bg-gradient-to-r from-void via-ash/60 to-void">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-acid/20 text-acid border border-acid/40 shrink-0">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-bone">
            <strong className="text-acid font-bold mr-1.5">DIWALI SPECIAL:</strong>
            Handcrafted Can Candles in 4 Distinct Metallic Tones. Available Now.
          </span>
        </div>

        <Link
          href="/shop?filter=diwali-special"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-acid text-void font-mono text-xs font-bold uppercase tracking-wider hover:bg-bone transition-colors shrink-0 shadow-acid"
        >
          <span>Shop Diwali Drop</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
