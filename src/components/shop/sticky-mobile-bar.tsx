"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/types/shop";
import { ClawButton } from "@/components/ui/claw-button";
import { formatINR } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/components/ui/toast";
import { ShoppingBag, Check } from "lucide-react";

interface StickyMobileBarProps {
  product: Product;
}

export function StickyMobileBar({ product }: StickyMobileBarProps) {
  const [visible, setVisible] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { addItem } = useCart();
  const toast = useToast();

  useEffect(() => {
    const handleScroll = () => {
      // Show once scrolled past the initial hero info
      setVisible(window.scrollY > 380);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      slug: product.slug,
      title: product.title,
      pricePaise: product.price_paise,
      imageUrl: `/assets/products/${product.slug}.jpg`,
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-void/95 backdrop-blur-xl border-t border-steel/20 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-300 gpu-accel">
      <div className="min-w-0 flex-1">
        <p className="font-display uppercase text-sm text-bone truncate">
          {product.title}
        </p>
        <p className="font-mono text-base font-bold text-acid">
          {formatINR(product.price_paise)}
        </p>
      </div>

      <ClawButton
        variant="primary"
        size="sm"
        onClick={handleAddToCart}
        className={`shrink-0 transition-all duration-300 ${
          isAdded ? "border-acid bg-acid text-void" : ""
        }`}
      >
        {isAdded ? (
          <>
            <Check className="w-4 h-4 mr-1.5 animate-in zoom-in-50" />
            Added!
          </>
        ) : (
          <>
            <ShoppingBag className="w-4 h-4 mr-1.5" />
            Add to Cart
          </>
        )}
      </ClawButton>
    </div>
  );
}

