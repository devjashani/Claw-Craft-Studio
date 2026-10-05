"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Product, ProductVariant } from "@/types/shop";
import { getProductImageUrl } from "@/lib/product-media";
import { ClawButton } from "@/components/ui/claw-button";
import { formatINR } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/components/ui/toast";
import { Plus, Minus, ShoppingBag, Zap, CheckCircle2, Clock, Check, Sparkles } from "lucide-react";

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const toast = useToast();

  const variants = product.variants || [];
  const hasVariants = variants.length > 0;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants ? variants[0] : null
  );

  const initialOption =
    selectedVariant?.options && selectedVariant.options.length > 0
      ? selectedVariant.options[0]
      : "";
  const [selectedOption, setSelectedOption] = useState<string>(initialOption);

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const currentPricePaise = selectedVariant ? selectedVariant.price_paise : product.price_paise;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock_count;
  const maxStock = Math.max(1, currentStock);

  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    if (variant.options && variant.options.length > 0) {
      setSelectedOption(variant.options[0]);
    } else {
      setSelectedOption("");
    }
    setQuantity(1);
  };

  const handleAddToCart = () => {
    const lineId = selectedVariant
      ? `${product.id}:${selectedVariant.id}:${selectedOption || ""}`
      : product.id;

    const displayTitle = selectedVariant
      ? `${product.title} (${selectedVariant.label}${
          selectedOption && selectedVariant.options && selectedVariant.options.length > 1
            ? ` - ${selectedOption}`
            : ""
        })`
      : product.title;

    addItem(
      {
        id: lineId,
        productId: product.id,
        slug: product.slug,
        title: displayTitle,
        pricePaise: currentPricePaise,
        imageUrl: getProductImageUrl(product.slug),
        isMadeToOrder: product.is_made_to_order,
        maxStock: currentStock,
        variantId: selectedVariant?.id,
        variantLabel: selectedVariant?.label,
        selectedOption:
          selectedVariant?.options && selectedVariant.options.length > 1
            ? selectedOption
            : selectedVariant?.label === "Pack of 4"
            ? "One of each colour"
            : undefined,
      },
      quantity
    );

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);

    toast.success(
      "ADDED TO CART",
      `${quantity}x ${displayTitle} added to your shopping cart.`
    );
  };

  const handleBuyNow = () => {
    const lineId = selectedVariant
      ? `${product.id}:${selectedVariant.id}:${selectedOption || ""}`
      : product.id;

    const displayTitle = selectedVariant
      ? `${product.title} (${selectedVariant.label}${
          selectedOption && selectedVariant.options && selectedVariant.options.length > 1
            ? ` - ${selectedOption}`
            : ""
        })`
      : product.title;

    addItem(
      {
        id: lineId,
        productId: product.id,
        slug: product.slug,
        title: displayTitle,
        pricePaise: currentPricePaise,
        imageUrl: getProductImageUrl(product.slug),
        isMadeToOrder: product.is_made_to_order,
        maxStock: currentStock,
        variantId: selectedVariant?.id,
        variantLabel: selectedVariant?.label,
        selectedOption:
          selectedVariant?.options && selectedVariant.options.length > 1
            ? selectedOption
            : selectedVariant?.label === "Pack of 4"
            ? "One of each colour"
            : undefined,
      },
      quantity
    );
    router.push("/checkout");
  };

  return (
    <div id="product-actions" className="space-y-6 pt-2">
      {/* Dynamic Price Display */}
      <div className="p-4 rounded-sm border border-steel/20 bg-ash/40 flex items-baseline gap-4">
        <span className="font-mono text-3xl font-bold text-bone">
          {formatINR(currentPricePaise)}
        </span>
        <span className="font-mono text-xs text-acid ml-auto uppercase tracking-wider font-semibold">
          Taxes Included
        </span>
      </div>

      {/* Variant Selector (if product has variants) */}
      {hasVariants && (
        <div className="space-y-4 p-4 rounded-sm border border-steel/20 bg-ash/30">
          <div>
            <label className="block font-mono text-xs text-bone uppercase tracking-wider mb-2 font-semibold">
              SELECT OPTION / PACK
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {variants.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleVariantChange(v)}
                    className={`p-3 rounded-sm border text-left font-mono transition-all ${
                      isSelected
                        ? "border-acid bg-acid/15 text-bone shadow-acid"
                        : "border-steel/20 bg-void/50 text-steel hover:text-bone hover:border-steel/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase">{v.label}</span>
                      <span className="text-acid font-bold text-xs">
                        {formatINR(v.price_paise)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pack of 4 Savings Callout */}
          {selectedVariant?.label === "Pack of 4" && (
            <div className="p-3 rounded-sm bg-acid/10 border border-acid/40 text-bone font-mono text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-acid shrink-0" />
              <span>
                <strong className="text-acid">Save Rs 167</strong> compared to 4 singles (one of each colour as pictured: Violet, Black, Rose, Teal).
              </span>
            </div>
          )}

          {/* Single Can Color/Design Options */}
          {selectedVariant?.label === "Single can" &&
            selectedVariant.options &&
            selectedVariant.options.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono text-xs text-bone uppercase tracking-wider font-semibold">
                    CHOOSE CAN DESIGN OPTION
                  </label>
                  <span className="font-mono text-[10px] text-steel/60 uppercase">
                    (Subject to availability)
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedVariant.options.map((opt) => {
                    const isOptSelected = selectedOption === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedOption(opt)}
                        className={`px-3.5 py-1.5 rounded-sm font-mono text-xs uppercase tracking-wider border transition-all ${
                          isOptSelected
                            ? "border-acid bg-acid text-void font-bold shadow-acid"
                            : "border-steel/20 bg-void/60 text-steel hover:text-bone hover:border-steel/50"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Stock & Lead Time Indicators */}
      <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
        {product.is_made_to_order ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-ash border border-steel/30 text-steel">
            <Clock className="w-3.5 h-3.5 text-acid" />
            <span>Made to Order (Lead Time: {product.lead_time_days} days)</span>
          </div>
        ) : currentStock > 0 ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-acid/10 border border-acid/40 text-bone">
            <CheckCircle2 className="w-3.5 h-3.5 text-acid" />
            <span>In Stock • Ready to Dispatch in 24-48h</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-blood/20 border border-blood/50 text-blood">
            <span>Sold Out</span>
          </div>
        )}

        {currentStock > 0 && currentStock <= 3 && !product.is_made_to_order && (
          <span className="text-blood font-bold tracking-wider animate-pulse">
            ONLY {currentStock} LEFT IN VAULT
          </span>
        )}
      </div>

      {/* Quantity Selector & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* Quantity Controls */}
        <div className="flex items-center border-2 border-steel/30 bg-ash rounded-sm h-12 shrink-0">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || currentStock <= 0}
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
            disabled={quantity >= maxStock || currentStock <= 0}
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
          disabled={currentStock <= 0}
          className={`flex-1 h-12 transition-all duration-300 ${
            isAdded ? "border-acid bg-acid text-void shadow-[0_0_20px_#B8FF1F]" : ""
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4 mr-2 animate-in zoom-in-50" />
              Added to Vault!
            </>
          ) : currentStock <= 0 ? (
            "Sold Out"
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
          disabled={currentStock <= 0}
          className="flex-1 h-12 border-acid/50 text-acid hover:bg-acid hover:text-void"
        >
          <Zap className="w-4 h-4 mr-2" />
          Buy Now
        </ClawButton>
      </div>
    </div>
  );
}
