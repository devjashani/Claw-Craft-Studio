"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/shop";
import { getProductImageUrl } from "@/lib/product-media";
import { ClawButton } from "@/components/ui/claw-button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/components/ui/toast";
import { Plus, Minus, ShoppingBag, Zap, CheckCircle2, Clock, Check } from "lucide-react";

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const { addItem } = useCart();
  const toast = useToast();
  const router = useRouter();

  const maxStock = product.stock_count || 10;

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        slug: product.slug,
        title: product.title,
        pricePaise: product.price_paise,
        imageUrl: getProductImageUrl(product.slug),
        isMadeToOrder: product.is_made_to_order,
        maxStock: product.stock_count,
      },
      quantity
    );

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);

    toast.success(
      "ADDED TO CART",
      `${quantity}x ${product.title} added to your shopping cart.`
    );
  };

  const handleBuyNow = () => {
    addItem(
      {
        id: product.id,
        slug: product.slug,
        title: product.title,
        pricePaise: product.price_paise,
        imageUrl: getProductImageUrl(product.slug),
        isMadeToOrder: product.is_made_to_order,
        maxStock: product.stock_count,
      },
      quantity
    );
    router.push("/checkout");
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Stock & Lead Time Indicators */}
      <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
        {product.is_made_to_order ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-ash border border-steel/30 text-steel">
            <Clock className="w-3.5 h-3.5 text-acid" />
            <span>Made to Order (Lead Time: {product.lead_time_days} days)</span>
          </div>
        ) : product.stock_count > 0 ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-acid/10 border border-acid/40 text-bone">
            <CheckCircle2 className="w-3.5 h-3.5 text-acid" />
            <span>In Stock • Ready to Dispatch in 24-48h</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-blood/20 border border-blood/50 text-blood">
            <span>Sold Out</span>
          </div>
        )}

        {product.stock_count > 0 && product.stock_count <= 3 && !product.is_made_to_order && (
          <span className="text-blood font-bold tracking-wider animate-pulse">
            ONLY {product.stock_count} LEFT IN VAULT
          </span>
        )}
      </div>

      {/* Quantity Selector & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* Quantity Controls */}
        <div className="flex items-center border-2 border-steel/30 bg-ash rounded-sm h-12 shrink-0">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="px-3.5 h-full text-steel hover:text-bone disabled:opacity-30 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-mono text-sm font-bold text-bone px-4 select-none">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
            disabled={quantity >= maxStock}
            aria-label="Increase quantity"
            className="px-3.5 h-full text-steel hover:text-bone disabled:opacity-30 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Add To Cart Button */}
        <ClawButton
          variant="primary"
          size="lg"
          onClick={handleAddToCart}
          className={`flex-1 h-12 transition-all duration-300 ${
            isAdded ? "border-acid bg-acid text-void shadow-[0_0_20px_#B8FF1F]" : ""
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4 mr-2 animate-in zoom-in-50" />
              Added to Vault!
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Add to Cart
            </>
          )}
        </ClawButton>

        {/* Buy Now Button */}
        <ClawButton
          variant="secondary"
          size="lg"
          onClick={handleBuyNow}
          className="flex-1 h-12 border-acid/50 text-acid hover:bg-acid hover:text-void"
        >
          <Zap className="w-4 h-4 mr-2" />
          Buy Now
        </ClawButton>
      </div>
    </div>
  );
}
