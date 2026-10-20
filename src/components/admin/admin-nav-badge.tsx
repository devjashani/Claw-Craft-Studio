"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AdminNavBadgeProps {
  count: number;
  label: "orders" | "inquiries";
  isPulsing?: boolean;
  className?: string;
}

/**
 * Reusable Admin Navigation Badge.
 *
 * Positions a compact acid circle/pill (~20-22px) directly on the top-right
 * corner of the nav button box (top: -8px, right: -8px), straddling the border.
 * Because it is absolutely positioned, nav buttons do NOT change width when the
 * badge appears or disappears (zero layout shift).
 *
 * Features:
 * - Acid accent fill with dark bold monospace number (11-12px)
 * - 2px ring in header background color (#111214) to cleanly separate from button border
 * - Caps at "99+"
 * - Completely hidden when count is 0
 * - Pulse ping animation on count increase (CSS transform/opacity, respects prefers-reduced-motion)
 * - Accessible with role="status", descriptive aria-label, and sr-only element
 */
export function AdminNavBadge({
  count,
  label,
  isPulsing = false,
  className,
}: AdminNavBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? "99+" : String(count);
  const ariaText = `${count} ${label} need attention`;

  return (
    <span
      role="status"
      aria-label={ariaText}
      className={cn(
        "absolute -top-2 -right-2 z-20 pointer-events-none select-none inline-flex items-center justify-center",
        className
      )}
    >
      {/* Ping animation aura on count increase - respects prefers-reduced-motion */}
      {isPulsing && (
        <span
          aria-hidden="true"
          className="motion-safe:animate-ping absolute inset-0 rounded-full bg-acid opacity-75 pointer-events-none"
        />
      )}

      {/* Acid Accent Badge Circle/Pill sitting on corner with 2px ring separation */}
      <span
        aria-hidden="true"
        className="min-w-[20px] h-[20px] xl:min-w-[22px] xl:h-[22px] px-1 bg-acid text-void font-mono font-bold text-[11px] leading-none rounded-full inline-flex items-center justify-center shadow-[0_0_0_2px_#111214,0_0_8px_rgba(184,255,31,0.4)] border border-acid/90 transition-transform duration-200"
      >
        {displayCount}
      </span>

      {/* Visually hidden screen reader announcement */}
      <span className="sr-only">{ariaText}</span>
    </span>
  );
}
