"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useReducedMotion } from "framer-motion";

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Smooth spring physics for fluid movement
  const cursorX = useSpring(0, { stiffness: 450, damping: 28 });
  const cursorY = useSpring(0, { stiffness: 450, damping: 28 });

  useEffect(() => {
    // Only enable on desktop pointer devices
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch || shouldReduceMotion) return;

    document.body.classList.add("has-custom-cursor");

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest("button") ||
          target.closest("a") ||
          target.closest("input") ||
          target.closest("textarea") ||
          target.closest("select") ||
          target.closest("[role='button']"))
      ) {
        setIsHoveringInteractive(true);
      } else {
        setIsHoveringInteractive(false);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [cursorX, cursorY, isVisible, shouldReduceMotion]);

  if (shouldReduceMotion || !isVisible) return null;

  return (
    <motion.div
      style={{
        x: cursorX,
        y: cursorY,
        translateX: "-50%",
        translateY: "-50%",
      }}
      className="fixed top-0 left-0 pointer-events-none z-[9999] select-none"
    >
      {/* Center pinpoint */}
      <motion.div
        animate={{
          scale: isHoveringInteractive ? 1.6 : 1,
          backgroundColor: isHoveringInteractive ? "#B8FF1F" : "#F2F0EA",
        }}
        className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_#B8FF1F]"
      />

      {/* Gothic Crosshair Reticle with 4 Claw Slash Ticks */}
      <motion.div
        animate={{
          scale: isHoveringInteractive ? 1.35 : 1,
          rotate: isHoveringInteractive ? 45 : 0,
          borderColor: isHoveringInteractive ? "#B8FF1F" : "rgba(201, 205, 210, 0.4)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="absolute -top-3.5 -left-3.5 w-7 h-7 rounded-full border border-dashed pointer-events-none"
      >
        {/* Top tick */}
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-[1px] h-1.5 bg-acid" />
        {/* Bottom tick */}
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-[1px] h-1.5 bg-acid" />
        {/* Left tick */}
        <span className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1 h-[1px] w-1.5 bg-acid" />
        {/* Right tick */}
        <span className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1 h-[1px] w-1.5 bg-acid" />
      </motion.div>
    </motion.div>
  );
}
