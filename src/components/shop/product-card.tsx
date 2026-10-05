"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/shop";
import { getProductImageUrl, getProductAltText, getProductObjectPosition } from "@/lib/product-media";
import { TiltCard } from "@/components/ui/tilt-card";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { ClawButton } from "@/components/ui/claw-button";
import { GlitchText } from "@/components/ui/glitch-text";
import { formatINR } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/components/ui/toast";
import { ShoppingBag, ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const toast = useToast();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If product has variants, navigate to product detail page to select variant and design option
    if (product.variants && product.variants.length > 0) {
      router.push(`/shop/${product.slug}`);
      return;
    }

    addItem({
      id: product.id,
      productId: product.id,
      slug: product.slug,
      title: product.title,
      pricePaise: product.price_paise,
      imageUrl: getProductImageUrl(product.slug),
      isMadeToOrder: product.is_made_to_order,
      maxStock: product.stock_count,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);

    toast.success(
      "ADDED TO VAULT",
      `${product.title} has been added to your shopping cart.`
    );
  };


  return (
    <TiltCard className="p-5 flex flex-col justify-between h-full bg-ash/50 border border-steel/20 group">
      <FiligreeCorner position="top-right" size={24} variant="acid" />

      <div>
        {/* Product Image Container */}
        <Link
          href={`/shop/${product.slug}`}
          className="relative block w-full aspect-[4/3] rounded-sm overflow-hidden bg-void/90 border border-steel/10 mb-5 group-hover:border-steel/40 transition-colors"
        >
          <Image
            src={getProductImageUrl(product.slug)}
            alt={getProductAltText(product.slug, product.title)}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{ objectPosition: getProductObjectPosition(product.slug) }}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Can Count / Chip Badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-sm bg-void/90 border border-acid/50 text-acid font-mono text-[11px] font-bold tracking-widest uppercase">
            {product.custom_chip || `${product.cans_count} CANS`}
          </div>

          {/* Custom Badge (e.g. Diwali Special) */}
          {product.custom_badge ? (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-sm bg-acid text-void font-mono text-[10px] font-bold tracking-wider uppercase shadow-acid">
              {product.custom_badge}
            </div>
          ) : null}

          {product.is_made_to_order && (
            <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-sm bg-void/90 border border-steel/30 text-steel font-mono text-[10px] font-medium tracking-wider uppercase">
              MADE TO ORDER ({product.lead_time_days}D)
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

        {/* Brand safety legal notice / Custom card tagline */}
        <p className="font-mono text-[10px] text-steel/50 uppercase tracking-widest mt-3">
          {product.card_tagline || "DECORATIVE DISPLAY PIECE • NOT A WEAPON"}
        </p>
      </div>

      {/* Pricing & Add to Cart Action */}
      <div className="pt-6 mt-4 border-t border-steel/10 flex items-center justify-between">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-steel/70 block">
            PRICE
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold text-bone">
              {product.price_prefix || ""}{formatINR(product.price_paise)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddToCart}
            aria-label={
              product.variants && product.variants.length > 0
                ? `Select options for ${product.title}`
                : `Add ${product.title} to cart`
            }
            className={`p-2.5 rounded-sm border transition-all duration-300 ${
              isAdded
                ? "border-acid bg-acid text-void scale-110 shadow-[0_0_15px_#B8FF1F]"
                : "border-acid/40 bg-void text-acid hover:bg-acid hover:text-void shadow-acid"
            }`}
          >
            {isAdded ? (
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
  );
}
