"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useReducedMotion } from "framer-motion";

export function SlashFlashOverlay() {
  const { lastAddedTimestamp } = useCart();
  const [active, setActive] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!lastAddedTimestamp || shouldReduceMotion) return;

    setActive(true);
    const timer = setTimeout(() => {
      setActive(false);
    }, 380);

    return () => clearTimeout(timer);
  }, [lastAddedTimestamp, shouldReduceMotion]);

  if (!active || shouldReduceMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {/* Primary high-speed green laser slash beam */}
      <div className="absolute top-0 left-[-20%] w-[140%] h-full bg-gradient-to-r from-transparent via-acid/25 to-transparent skew-x-[-32deg] animate-slash-flash mix-blend-screen" />

      {/* Ultra-bright razor white center beam */}
      <div className="absolute top-0 left-[-10%] w-[120%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-32deg] animate-slash-flash mix-blend-overlay" />
    </div>
  );
}
