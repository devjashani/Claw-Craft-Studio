"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Product } from "@/types/shop";
import { ProductCard } from "@/components/shop/product-card";
import { ClawButton } from "@/components/ui/claw-button";
import { ArrowUpDown, SlidersHorizontal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShopCatalogProps {
  initialProducts: Product[];
}

export function ShopCatalog({ initialProducts }: ShopCatalogProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");

  const categories = [
    { id: "all", label: "All Relics" },
    { id: "sculptures", label: "Gun Sculptures" },
    { id: "hearts", label: "Heart Wall Art" },
    { id: "custom", label: "Custom Builds" },
  ];

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...initialProducts];

    // Filter by Category
    if (activeCategory === "sculptures") {
      result = result.filter((p) => p.category === "sculptures");
    } else if (activeCategory === "hearts") {
      result = result.filter((p) => p.category === "hearts");
    } else if (activeCategory === "custom") {
      result = result.filter((p) => p.is_made_to_order);
    }

    // Sort
    if (sortBy === "price-low") {
      result.sort((a, b) => a.price_paise - b.price_paise);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price_paise - a.price_paise);
    } else if (sortBy === "cans-high") {
      result.sort((a, b) => b.cans_count - a.cans_count);
    } else {
      result.sort((a, b) => a.display_order - b.display_order);
    }

    return result;
  }, [initialProducts, activeCategory, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Catalog Header Banner */}
      <div className="mb-12 border-b border-steel/20 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 mb-2 font-mono text-xs text-acid uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ORIGINAL CAN METALWORK</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-display uppercase tracking-tight text-bone">
            STUDIO VAULT
          </h1>
          <p className="font-sans text-steel text-sm sm:text-base max-w-xl mt-2 leading-relaxed">
            Decorative display artifacts handcrafted from sanitized, reclaimed
            energy-drink cans. Not toys. Not weapons. Built in limited studio batches.
          </p>
        </div>

        {/* Total Count Badge */}
        <div className="font-mono text-xs text-steel/80 bg-ash/80 px-4 py-2 rounded-sm border border-steel/20 self-start md:self-end">
          SHOWING <span className="text-acid font-bold">{filteredAndSortedProducts.length}</span> PIECES
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          <SlidersHorizontal className="w-4 h-4 text-steel/60 hidden sm:inline shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-sm font-mono text-xs uppercase tracking-widest whitespace-nowrap transition-all border",
                activeCategory === cat.id
                  ? "bg-acid text-void font-bold border-acid shadow-acid"
                  : "bg-ash/70 text-steel hover:text-bone border-steel/20 hover:border-steel/50"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <ArrowUpDown className="w-4 h-4 text-steel/60" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-ash border border-steel/30 text-bone rounded-sm px-3 py-2 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-acid"
            aria-label="Sort products"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="cans-high">Cans: Most to Least</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-steel/20 rounded-sm bg-ash/30 p-8">
          <p className="font-display uppercase text-2xl text-bone mb-2">
            NO SCULPTURES FOUND
          </p>
          <p className="font-sans text-xs text-steel/70 mb-6 max-w-sm mx-auto">
            No products match your selected filter criteria. Explore our custom
            commissions for made-to-order pieces.
          </p>
          <ClawButton variant="primary" size="sm" onClick={() => setActiveCategory("all")}>
            Reset Filter
          </ClawButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}

          {/* Dedicated Custom Commission Card in Grid */}
          <div className="p-6 rounded-sm border-2 border-dashed border-acid/40 bg-ash/40 flex flex-col justify-between relative group hover:border-acid transition-colors">
            <div>
              <div className="px-2.5 py-1 rounded-sm bg-void border border-acid/50 text-acid font-mono text-[11px] font-bold tracking-widest uppercase inline-block mb-4">
                CUSTOM BUILD
              </div>
              <h3 className="font-display uppercase text-2xl text-bone mb-2">
                BESPOKE COMMISSION
              </h3>
              <p className="font-sans text-xs text-steel/80 leading-relaxed mb-4">
                Want a custom can silhouette, favorite energy-drink flavor palette,
                or a large-scale gaming wall centerpiece?
              </p>
              <ul className="text-[11px] font-mono text-steel/70 space-y-1 mb-6">
                <li>• Custom can count & dimensions</li>
                <li>• Hand-riveted aluminum chassis</li>
                <li>• Direct artisan consultation</li>
              </ul>
            </div>

            <Link href="/custom">
              <ClawButton variant="secondary" size="sm" className="w-full">
                Commission Art
              </ClawButton>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
