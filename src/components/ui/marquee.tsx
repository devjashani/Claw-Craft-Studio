"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children?: React.ReactNode;
  items?: string[];
  reverse?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  speed?: "slow" | "normal" | "fast";
}

export function Marquee({
  children,
  items,
  reverse = false,
  pauseOnHover = true,
  className,
  speed = "normal",
}: MarqueeProps) {
  const speedClass = {
    slow: "[animation-duration:45s]",
    normal: "[animation-duration:28s]",
    fast: "[animation-duration:16s]",
  }[speed];

  const content = items ? (
    <div className="flex items-center gap-8 py-2">
      {items.map((item, idx) => (
        <span
          key={idx}
          className="flex items-center gap-6 font-display uppercase tracking-widest text-lg md:text-2xl text-steel/80 hover:text-acid transition-colors whitespace-nowrap"
        >
          <span>{item}</span>
          <span className="text-acid select-none font-sans font-black text-xl">✦</span>
        </span>
      ))}
    </div>
  ) : (
    children
  );

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border-y border-steel/20 bg-ash/90 py-3 select-none flex",
        className
      )}
    >
      {/* Edge gradient fades for seamless visual looping */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-void to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-void to-transparent z-10 pointer-events-none" />

      <div
        className={cn(
          "flex shrink-0 min-w-full items-center justify-around gap-8 animate-marquee",
          reverse && "animate-marquee-reverse",
          pauseOnHover && "hover:[animation-play-state:paused]",
          speedClass
        )}
      >
        {content}
      </div>

      <div
        aria-hidden="true"
        className={cn(
          "flex shrink-0 min-w-full items-center justify-around gap-8 animate-marquee",
          reverse && "animate-marquee-reverse",
          pauseOnHover && "hover:[animation-play-state:paused]",
          speedClass
        )}
      >
        {content}
      </div>
    </div>
  );
}
