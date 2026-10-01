"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ClawButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "acid";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  slashAccent?: boolean;
}

export const ClawButton = forwardRef<HTMLButtonElement, ClawButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      slashAccent = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-4 py-2 text-xs tracking-wider",
      md: "px-6 py-3 text-sm tracking-widest",
      lg: "px-8 py-4 text-base tracking-widest",
    };

    const variantClasses = {
      primary:
        "border-acid/80 text-bone hover:text-void bg-ash/70 before:bg-acid",
      acid:
        "border-acid/80 text-bone hover:text-void bg-ash/70 before:bg-acid",
      secondary:
        "border-steel/40 text-bone hover:text-void bg-void/80 before:bg-steel",
      danger:
        "border-blood/80 text-bone hover:text-void bg-ash/80 before:bg-blood",
      ghost:
        "border-transparent text-steel hover:text-acid hover:border-acid/40 before:bg-acid/10",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "group relative inline-flex items-center justify-center font-display uppercase font-bold overflow-hidden border transition-all duration-300 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-acid focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:opacity-50 disabled:cursor-not-allowed",
          // Angled corner clip-path for gothic mechanical bevel
          "clip-claw-button",
          // Diagonal slash-wipe pseudo-element
          "before:absolute before:inset-0 before:origin-left before:-translate-x-full before:skew-x-[-25deg] before:transition-transform before:duration-300 before:ease-out hover:before:translate-x-0",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {/* Decorative corner notch accent */}
        {slashAccent && (
          <span
            aria-hidden="true"
            className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-acid opacity-70 group-hover:opacity-100 transition-opacity"
          />
        )}

        {/* Content container elevated above the wiping layer */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
          {children}
        </span>
      </button>
    );
  }
);

ClawButton.displayName = "ClawButton";
