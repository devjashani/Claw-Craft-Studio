"use client";

import React, { useEffect, useRef } from "react";

export function CustomCursor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotInnerRef = useRef<HTMLDivElement>(null);
  const ringInnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Guard against touch devices & coarse pointers (mobile/tablet)
    const isCoarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (isCoarse) return;

    // Check prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = reducedMotionQuery.matches;

    const onReducedMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    reducedMotionQuery.addEventListener("change", onReducedMotionChange);

    // Apply cursor-none class to body only while custom cursor is active
    document.body.classList.add("has-custom-cursor");

    // Position & state tracking in plain variables (zero React re-renders)
    let targetX = -100;
    let targetY = -100;
    let dotX = -100;
    let dotY = -100;
    let ringX = -100;
    let ringY = -100;

    let isVisible = false;
    let isHovered = false;
    let isRafRunning = false;
    let rafId = 0;
    let lastTime = performance.now();
    let isPointerMoving = false;
    let idleTimeout: NodeJS.Timeout | null = null;

    const dotEl = dotRef.current;
    const ringEl = ringRef.current;
    const dotInner = dotInnerRef.current;
    const ringInner = ringInnerRef.current;
    const container = containerRef.current;

    const setVisibility = (visible: boolean) => {
      isVisible = visible;
      if (container) {
        container.style.opacity = visible ? "1" : "0";
      }
    };

    const updateHoverState = (hovering: boolean) => {
      if (isHovered === hovering) return;
      isHovered = hovering;

      if (dotInner) {
        if (hovering) {
          dotInner.style.transform = "scale(1.6)";
          dotInner.style.backgroundColor = "#B8FF1F";
        } else {
          dotInner.style.transform = "scale(1)";
          dotInner.style.backgroundColor = "#F2F0EA";
        }
      }

      if (ringInner) {
        if (hovering) {
          ringInner.style.transform = prefersReducedMotion
            ? "scale(1.35)"
            : "scale(1.35) rotate(45deg)";
          ringInner.style.borderColor = "#B8FF1F";
        } else {
          ringInner.style.transform = "scale(1) rotate(0deg)";
          ringInner.style.borderColor = "rgba(201, 205, 210, 0.4)";
        }
      }
    };

    const loop = (currentTime: number) => {
      if (!isRafRunning) return;

      const dt = Math.min(currentTime - lastTime, 64);
      lastTime = currentTime;

      // Delta-time frame-rate independent lerp
      // factor = 1 - Math.pow(1 - 0.18, dt / 16.67)
      const ringFactor = prefersReducedMotion ? 1 : 1 - Math.pow(1 - 0.18, dt / 16.67);
      ringX += (targetX - ringX) * ringFactor;
      ringY += (targetY - ringY) * ringFactor;

      // Inner dot: follows pointer with near-zero lag (lerp ~0.75)
      const dotFactor = prefersReducedMotion ? 1 : 1 - Math.pow(1 - 0.75, dt / 16.67);
      dotX += (targetX - dotX) * dotFactor;
      dotY += (targetY - dotY) * dotFactor;

      // Center offset: -3px for 6px dot, -14px for 28px ring
      if (dotEl) {
        dotEl.style.transform = `translate3d(${dotX - 3}px, ${dotY - 3}px, 0)`;
      }
      if (ringEl) {
        ringEl.style.transform = `translate3d(${ringX - 14}px, ${ringY - 14}px, 0)`;
      }

      // Idle pause condition: pointer is still and ring has caught up (< 0.1px)
      const distRing = Math.hypot(targetX - ringX, targetY - ringY);
      const distDot = Math.hypot(targetX - dotX, targetY - dotY);

      if (!isPointerMoving && distRing < 0.1 && distDot < 0.1) {
        ringX = targetX;
        ringY = targetY;
        dotX = targetX;
        dotY = targetY;
        if (dotEl) {
          dotEl.style.transform = `translate3d(${targetX - 3}px, ${targetY - 3}px, 0)`;
        }
        if (ringEl) {
          ringEl.style.transform = `translate3d(${targetX - 14}px, ${targetY - 14}px, 0)`;
        }
        isRafRunning = false;
        return; // Pause rAF!
      }

      rafId = requestAnimationFrame(loop);
    };

    const startRaf = () => {
      if (!isRafRunning) {
        isRafRunning = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        // Snap initial position so it doesn't glide across the screen on load
        if (ringX < 0) {
          ringX = targetX;
          ringY = targetY;
          dotX = targetX;
          dotY = targetY;
        }
        setVisibility(true);
      }

      isPointerMoving = true;
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        isPointerMoving = false;
      }, 50);

      startRaf();
    };

    // Delegated hover detection (ZERO getBoundingClientRect on pointermove)
    const onPointerOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest(
        'button, a, input, textarea, select, [role="button"], [data-cursor="pointer"], .cursor-pointer'
      );
      updateHoverState(!!interactive);
    };

    const onPointerOut = (e: PointerEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (!related) {
        updateHoverState(false);
        return;
      }
      const interactive = related.closest(
        'button, a, input, textarea, select, [role="button"], [data-cursor="pointer"], .cursor-pointer'
      );
      updateHoverState(!!interactive);
    };

    const onPointerLeaveDoc = () => {
      setVisibility(false);
    };

    const onPointerEnterDoc = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setVisibility(true);
      startRaf();
    };

    const onWindowBlur = () => {
      setVisibility(false);
      isRafRunning = false;
      if (rafId) cancelAnimationFrame(rafId);
    };

    const onWindowFocus = () => {
      // Will become visible and restart on next pointermove
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        setVisibility(false);
        isRafRunning = false;
        if (rafId) cancelAnimationFrame(rafId);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("pointerout", onPointerOut, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeaveDoc, { passive: true });
    document.documentElement.addEventListener("pointerenter", onPointerEnterDoc, { passive: true });
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.documentElement.removeEventListener("pointerleave", onPointerLeaveDoc);
      document.documentElement.removeEventListener("pointerenter", onPointerEnterDoc);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      if (idleTimeout) clearTimeout(idleTimeout);
      if (rafId) cancelAnimationFrame(rafId);
      isRafRunning = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        opacity: 0,
        transition: "opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className="fixed inset-0 pointer-events-none z-[9999] select-none"
    >
      {/* 1. Center Pinpoint (6px x 6px, centered with -3px) */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "6px",
          height: "6px",
          pointerEvents: "none",
          willChange: "transform",
          contain: "layout paint style",
          transform: "translate3d(-100px, -100px, 0)",
        }}
      >
        <div
          ref={dotInnerRef}
          className="relative w-full h-full rounded-full"
          style={{
            backgroundColor: "#F2F0EA",
            transform: "scale(1)",
            transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease-out",
          }}
        >
          {/* Pre-rendered static glow to prevent re-rasterization during translation */}
          <span
            className="absolute -inset-0.5 rounded-full pointer-events-none"
            style={{
              boxShadow: "0 0 8px #B8FF1F",
            }}
          />
        </div>
      </div>

      {/* 2. Gothic Crosshair Reticle with 4 Claw Slash Ticks (28px x 28px, centered with -14px) */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "28px",
          height: "28px",
          pointerEvents: "none",
          willChange: "transform",
          contain: "layout paint style",
          transform: "translate3d(-100px, -100px, 0)",
        }}
      >
        <div
          ref={ringInnerRef}
          className="relative w-full h-full rounded-full border border-dashed"
          style={{
            borderColor: "rgba(201, 205, 210, 0.4)",
            transform: "scale(1) rotate(0deg)",
            transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease-out",
          }}
        >
          {/* Top tick */}
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-[1px] h-1.5 bg-acid" />
          {/* Bottom tick */}
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-[1px] h-1.5 bg-acid" />
          {/* Left tick */}
          <span className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1 h-[1px] w-1.5 bg-acid" />
          {/* Right tick */}
          <span className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1 h-[1px] w-1.5 bg-acid" />
        </div>
      </div>
    </div>
  );
}
