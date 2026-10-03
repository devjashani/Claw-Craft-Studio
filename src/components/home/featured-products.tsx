"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/shop";
import { getProductImageUrl, getProductAltText } from "@/lib/product-media";
import { TiltCard } from "@/components/ui/tilt-card";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { ClawButton } from "@/components/ui/claw-button";
import { GlitchText } from "@/components/ui/glitch-text";
import { formatINR } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/components/ui/toast";
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Check } from "lucide-react";

interface FeaturedProductsProps {
  products: Product[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const toast = useToast();
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: product.id,
      slug: product.slug,
      title: product.title,
      pricePaise: product.price_paise,
      imageUrl: getProductImageUrl(product.slug),
      isMadeToOrder: product.is_made_to_order,
      maxStock: product.stock_count,
    });

    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);

    toast.success(
      "ADDED TO VAULT",
      `${product.title} has been added to your shopping cart.`
    );
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 380;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-void border-t border-steel/10 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2 font-mono text-xs text-acid uppercase tracking-widest">
              <span className="w-4 h-[1px] bg-acid" />
              <span>LIMITED ARTISANAL PRODUCTION</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-display uppercase tracking-tight text-bone">
              <GlitchText as="span">FEATURED SCULPTURES</GlitchText>
            </h2>
            <p className="font-sans text-steel text-sm sm:text-base max-w-xl mt-2">
              Each unit is assembled by hand from empty energy-drink cans. Cleaned,
              reinforced, and precision-riveted for permanent showcase.
            </p>
          </div>

          {/* Desktop Arrow Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="p-3 border border-steel/20 bg-ash/60 rounded-sm text-steel hover:text-acid hover:border-acid transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="p-3 border border-steel/20 bg-ash/60 rounded-sm text-steel hover:text-acid hover:border-acid transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Scrolling Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-none scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="min-w-[300px] sm:min-w-[360px] md:min-w-[400px] snap-start shrink-0"
            >
              <TiltCard className="p-5 flex flex-col justify-between h-full bg-ash/50 border border-steel/20 group">
                <FiligreeCorner position="top-right" size={24} variant="acid" />

                <div>
                  {/* Product Image Frame */}
                  <Link
                    href={`/shop/${product.slug}`}
                    className="relative block w-full aspect-[4/3] rounded-sm overflow-hidden bg-void/90 border border-steel/10 mb-5 group-hover:border-steel/40 transition-colors"
                  >
                    <Image
                      src={getProductImageUrl(product.slug)}
                      alt={getProductAltText(product.slug, product.title)}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Can Count Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-sm bg-void/90 border border-acid/50 text-acid font-mono text-[11px] font-bold tracking-widest uppercase">
                      {product.cans_count} CANS
                    </div>

                    {/* Stock Alert Badge */}
                    {product.stock_count > 0 && product.stock_count <= 3 && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-sm bg-blood/90 text-bone font-mono text-[10px] font-bold tracking-wider uppercase">
                        ONLY {product.stock_count} LEFT
                      </div>
                    )}
                  </Link>

                  {/* Title & Tagline */}
                  <Link href={`/shop/${product.slug}`} className="block group/title">
                    <h3 className="text-2xl text-bone group-hover/title:text-acid transition-colors truncate">
                      <GlitchText as="span">{product.title}</GlitchText>
                    </h3>
                  </Link>

                  <p className="font-sans text-xs text-steel/80 mt-1 line-clamp-2 leading-relaxed">
                    {product.tagline}
                  </p>

                  <p className="font-mono text-[10px] text-steel/50 uppercase tracking-widest mt-3">
                    DECORATIVE ART PIECE • NOT A WEAPON
                  </p>
                </div>

                {/* Price and Cart Action */}
                <div className="pt-6 mt-4 border-t border-steel/10 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-steel/70 block">
                      PRICE
                    </span>
                    <span className="font-mono text-xl font-bold text-bone">
                      {formatINR(product.price_paise)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      aria-label={`Add ${product.title} to cart`}
                      className={`p-2.5 rounded-sm border transition-all duration-300 ${
                        addedId === product.id
                          ? "border-acid bg-acid text-void scale-110 shadow-[0_0_15px_#B8FF1F]"
                          : "border-acid/40 bg-void text-acid hover:bg-acid hover:text-void shadow-acid"
                      }`}
                    >
                      {addedId === product.id ? (
                        <Check className="w-4 h-4 animate-in zoom-in-50" />
                      ) : (
                        <ShoppingBag className="w-4 h-4" />
                      )}
                    </button>

                    <Link href={`/shop/${product.slug}`}>
                      <ClawButton variant="secondary" size="sm">
                        Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </ClawButton>
                    </Link>
                  </div>
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
