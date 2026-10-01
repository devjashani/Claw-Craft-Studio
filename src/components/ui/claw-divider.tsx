"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ClawDividerProps {
  className?: string;
  glow?: boolean;
  variant?: "acid" | "steel" | "blood";
}

export function ClawDivider({
  className,
  glow = false,
  variant = "acid",
}: ClawDividerProps) {
  const shouldReduceMotion = useReducedMotion();

  const colorMap = {
    acid: "text-acid stroke-acid",
    steel: "text-steel/40 stroke-steel/40",
    blood: "text-blood stroke-blood",
  };

  const glowStyle = glow
    ? variant === "acid"
      ? "drop-shadow-[0_0_12px_rgba(184,255,31,0.5)]"
      : variant === "blood"
      ? "drop-shadow-[0_0_12px_rgba(225,29,46,0.6)]"
      : "drop-shadow-[0_0_8px_rgba(201,205,210,0.3)]"
    : "";

  const slashTransition = (delay: number) => ({
    duration: 0.35,
    delay: shouldReduceMotion ? 0 : delay,
    ease: [0.16, 1, 0.3, 1], // --ease-claw
  });

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : "hidden"}
      whileInView={shouldReduceMotion ? undefined : "visible"}
      viewport={{ once: true, margin: "-40px" }}
      className={cn(
        "relative w-full flex items-center justify-center my-8 select-none overflow-hidden gpu-accel",
        className
      )}
      aria-hidden="true"
    >
      {/* Left fine steel line */}
      <motion.div
        variants={{
          hidden: { scaleX: 0, opacity: 0 },
          visible: { scaleX: 1, opacity: 1 },
        }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ originX: 1 }}
        className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-steel/20 to-steel/40 will-change-transform"
      />

      {/* Center original ClawCraft 4-slash vector */}
      <div className={cn("mx-4 flex items-center shrink-0", colorMap[variant], glowStyle)}>
        <svg
          width="90"
          height="32"
          viewBox="0 0 90 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 hover:scale-105"
        >
          {/* Slash 1: Leftmost aggressive rake */}
          <motion.path
            d="M8 28L18 4L22 5L12 29L8 28Z"
            fill="currentColor"
            className="opacity-80"
            variants={{
              hidden: { opacity: 0, scaleY: 0, y: -6 },
              visible: { opacity: 0.8, scaleY: 1, y: 0 },
            }}
            transition={slashTransition(0.05)}
            style={{ originY: 0 }}
          />
          {/* Slash 2: Deep center-left gouge */}
          <motion.path
            d="M28 31L42 2L47 3L33 32L28 31Z"
            fill="currentColor"
            variants={{
              hidden: { opacity: 0, scaleY: 0, y: -8 },
              visible: { opacity: 1, scaleY: 1, y: 0 },
            }}
            transition={slashTransition(0.12)}
            style={{ originY: 0 }}
          />
          {/* Slash 3: Dominant center-right rip */}
          <motion.path
            d="M50 30L63 3L68 5L55 31L50 30Z"
            fill="currentColor"
            variants={{
              hidden: { opacity: 0, scaleY: 0, y: -8 },
              visible: { opacity: 1, scaleY: 1, y: 0 },
            }}
            transition={slashTransition(0.18)}
            style={{ originY: 0 }}
          />
          {/* Slash 4: Trailing right edge laceration */}
          <motion.path
            d="M72 26L80 7L84 8L76 27L72 26Z"
            fill="currentColor"
            className="opacity-75"
            variants={{
              hidden: { opacity: 0, scaleY: 0, y: -6 },
              visible: { opacity: 0.75, scaleY: 1, y: 0 },
            }}
            transition={slashTransition(0.24)}
            style={{ originY: 0 }}
          />
          {/* Subtle micro jagged gouge notches */}
          <motion.polygon
            points="26,16 30,14 27,19"
            fill="currentColor"
            variants={{
              hidden: { opacity: 0, scale: 0 },
              visible: { opacity: 1, scale: 1 },
            }}
            transition={slashTransition(0.28)}
          />
          <motion.polygon
            points="65,18 69,15 67,21"
            fill="currentColor"
            variants={{
              hidden: { opacity: 0, scale: 0 },
              visible: { opacity: 1, scale: 1 },
            }}
            transition={slashTransition(0.3)}
          />
        </svg>
      </div>

      {/* Right fine steel line */}
      <motion.div
        variants={{
          hidden: { scaleX: 0, opacity: 0 },
          visible: { scaleX: 1, opacity: 1 },
        }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ originX: 0 }}
        className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-steel/20 to-steel/40 will-change-transform"
      />
    </motion.div>
  );
}

