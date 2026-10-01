"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FiligreeCornerProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
  variant?: "acid" | "steel" | "blood" | "bone";
  size?: number;
}

export function FiligreeCorner({
  position = "top-left",
  className,
  variant = "steel",
  size = 32,
}: FiligreeCornerProps) {
  const positionClasses = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0 rotate-90",
    "bottom-right": "bottom-0 right-0 rotate-180",
    "bottom-left": "bottom-0 left-0 -rotate-90",
  };

  const variantClasses = {
    steel: "text-steel/40",
    acid: "text-acid/80 drop-shadow-[0_0_6px_rgba(184,255,31,0.5)]",
    blood: "text-blood/80 drop-shadow-[0_0_6px_rgba(225,29,46,0.6)]",
    bone: "text-bone/50",
  };

  return (
    <div
      className={cn(
        "absolute pointer-events-none select-none z-10 transition-colors duration-300",
        positionClasses[position],
        variantClasses[variant],
        className
      )}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer framing lines */}
        <path d="M0 0 H40 V2 H2 V40 H0 Z" fill="currentColor" />
        {/* Secondary inner accent step */}
        <path d="M4 4 H24 V5 H5 V24 H4 Z" fill="currentColor" opacity="0.6" />
        {/* Gothic fleur/leaf flourish */}
        <path
          d="M8 8 C14 8 16 12 18 16 C16 14 12 12 8 8 Z"
          fill="currentColor"
          opacity="0.8"
        />
        <path
          d="M8 8 C8 14 12 16 16 18 C14 16 12 12 8 8 Z"
          fill="currentColor"
          opacity="0.8"
        />
        {/* Diamond apex stud */}
        <polygon points="6,6 9,4 12,6 9,8" fill="currentColor" />
      </svg>
    </div>
  );
}
