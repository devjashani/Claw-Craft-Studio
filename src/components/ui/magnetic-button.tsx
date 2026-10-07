"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number; // Distance pull multiplier
}

export function MagneticButton({
  children,
  className,
  onClick,
  strength = 0.25,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const isHovered = useRef(false);
  const isRafActive = useRef(false);
  const rafId = useRef(0);
  const lastTime = useRef(0);

  const updateRect = useCallback(() => {
    if (ref.current) {
      rectRef.current = ref.current.getBoundingClientRect();
    }
  }, []);

  useEffect(() => {
    // Only enable magnetic pull on desktop pointer devices
    const isCoarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isCoarse || prefersReducedMotion) return;

    // Refresh cached rect on window scroll & resize while hovered
    const handleWindowChange = () => {
      if (isHovered.current) {
        updateRect();
      }
    };

    window.addEventListener("scroll", handleWindowChange, { passive: true });
    window.addEventListener("resize", handleWindowChange, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleWindowChange);
      window.removeEventListener("resize", handleWindowChange);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [updateRect]);

  const animate = (time: number) => {
    if (!isRafActive.current) return;

    const dt = Math.min(time - lastTime.current, 64);
    lastTime.current = time;

    // Frame-rate independent lerp factor for snappy magnetic feel
    const factor = 1 - Math.pow(1 - 0.25, dt / 16.67);
    currentPos.current.x += (targetPos.current.x - currentPos.current.x) * factor;
    currentPos.current.y += (targetPos.current.y - currentPos.current.y) * factor;

    const el = ref.current;
    if (el) {
      el.style.transform = `translate3d(${currentPos.current.x.toFixed(2)}px, ${currentPos.current.y.toFixed(2)}px, 0)`;
    }

    const dist = Math.hypot(
      targetPos.current.x - currentPos.current.x,
      targetPos.current.y - currentPos.current.y
    );

    // If mouse left and returned to resting position (< 0.05px)
    if (!isHovered.current && dist < 0.05) {
      currentPos.current.x = 0;
      currentPos.current.y = 0;
      if (el) el.style.transform = "translate3d(0, 0, 0)";
      isRafActive.current = false;
      return;
    }

    rafId.current = requestAnimationFrame(animate);
  };

  const startLoop = () => {
    if (!isRafActive.current) {
      isRafActive.current = true;
      lastTime.current = performance.now();
      rafId.current = requestAnimationFrame(animate);
    }
  };

  const handlePointerEnter = () => {
    isHovered.current = true;
    updateRect();
    startLoop();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = rectRef.current;
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    targetPos.current.x = (e.clientX - centerX) * strength;
    targetPos.current.y = (e.clientY - centerY) * strength;

    startLoop();
  };

  const handlePointerLeave = () => {
    isHovered.current = false;
    targetPos.current.x = 0;
    targetPos.current.y = 0;
    startLoop();
  };

  return (
    <div
      ref={ref}
      data-cursor="pointer"
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn("inline-block will-change-transform", className)}
      style={{ willChange: "transform" }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
