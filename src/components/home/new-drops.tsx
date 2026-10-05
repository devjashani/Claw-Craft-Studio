"use client";

import React from "react";
import Link from "next/link";
import { Product } from "@/types/shop";
import { ProductCard } from "@/components/shop/product-card";
import { GlitchText } from "@/components/ui/glitch-text";
import { Sparkles, ArrowRight } from "lucide-react";

interface NewDropsProps {
  products: Product[];
}

const NEW_DROP_SLUGS = [
  "30-can-guitar-wall-art",
  "11-can-bow-wall-art",
  "can-desk-station",
  "can-candle-diwali-special",
  "24-can-spider-wall-art",
];

export function NewDrops({ products }: NewDropsProps) {
  const newProducts = products.filter((p) => NEW_DROP_SLUGS.includes(p.slug));

  if (newProducts.length === 0) return null;

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-void border-t border-steel/10">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2 font-mono text-xs text-acid uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-acid" />
              <span>FRESH FROM THE WORKSHOP</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-display uppercase tracking-tight text-bone">
              <GlitchText as="span">NEW DROPS</GlitchText>
            </h2>
            <p className="font-sans text-steel text-sm sm:text-base max-w-xl mt-2 leading-relaxed">
              Explore our 5 latest handcrafted can sculptures, decorative wall pieces,
              and seasonal workshop creations.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-steel hover:text-acid transition-colors self-start md:self-end"
          >
            <span>View Complete Vault</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {newProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
