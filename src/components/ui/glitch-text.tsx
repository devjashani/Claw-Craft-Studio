"use client";

import React, { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  children: string;
  as?: "h1" | "h2" | "h3" | "h4" | "span" | "p";
  className?: string;
  glitchOnHoverOnly?: boolean;
}

export function GlitchText({
  children,
  as: Component = "span",
  className,
  glitchOnHoverOnly = true,
}: GlitchTextProps) {
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const isGlitching = !shouldReduceMotion && (isHovered || !glitchOnHoverOnly);

  return (
    <Component
      className={cn(
        "relative inline-block select-none tracking-tight font-display uppercase group/glitch cursor-default",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      aria-label={children}
    >
      {/* Base readable text */}
      <span className="relative z-10 block transition-colors duration-200 group-hover/glitch:text-bone">
        {children}
      </span>

      {/* Red/Blood Chromatic Split Layer (Upper Slice) */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 text-blood z-0 select-none pointer-events-none clip-path-glitch-1 gpu-accel transition-opacity duration-100",
          isGlitching
            ? "opacity-90 animate-glitch-shift"
            : "opacity-0"
        )}
      >
        {children}
      </span>

      {/* Acid Green Chromatic Split Layer (Lower Slice) */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 text-acid z-0 select-none pointer-events-none clip-path-glitch-2 gpu-accel transition-opacity duration-100",
          isGlitching
            ? "opacity-90 -translate-x-[2px] translate-y-[1px]"
            : "opacity-0"
        )}
      >
        {children}
      </span>
    </Component>
  );
}

