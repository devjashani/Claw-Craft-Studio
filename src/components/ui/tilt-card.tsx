"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltMaxAngleX?: number;
  tiltMaxAngleY?: number;
  glareEnable?: boolean;
}

export function TiltCard({
  children,
  className,
  tiltMaxAngleX = 8,
  tiltMaxAngleY = 8,
  glareEnable = true,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [canHover, setCanHover] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanHover(media.matches);

    const listener = (e: MediaQueryListEvent) => setCanHover(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const rotXVal = useMotionValue(0);
  const rotYVal = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 220, mass: 0.1 };
  const smoothRotX = useSpring(rotXVal, springConfig);
  const smoothRotY = useSpring(rotYVal, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canHover || shouldReduceMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const targetRotX = ((y - centerY) / centerY) * -tiltMaxAngleX;
    const targetRotY = ((x - centerX) / centerX) * tiltMaxAngleY;

    rotXVal.set(targetRotX);
    rotYVal.set(targetRotY);

    if (glareEnable) {
      setGlarePos({
        x: Math.round((x / rect.width) * 100),
        y: Math.round((y / rect.height) * 100),
      });
    }
  };

  const handleMouseEnter = () => {
    if (canHover && !shouldReduceMotion) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    rotXVal.set(0);
    rotYVal.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: smoothRotX,
        rotateY: smoothRotY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative rounded-sm border border-steel/20 bg-ash/60 overflow-hidden shadow-void transition-colors hover:border-steel/50 gpu-accel will-change-transform",
        className
      )}
    >
      {/* Specular Holographic Glare / Aluminum Shine Layer */}
      {glareEnable && canHover && !shouldReduceMotion && (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 z-30 transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}
          style={{
            background: `radial-gradient(circle 380px at ${glarePos.x}% ${glarePos.y}%, rgba(184, 255, 31, 0.22), rgba(201, 205, 210, 0.12) 35%, transparent 70%)`,
          }}
        />
      )}

      {/* Brushed Metal Diagonal Sheen Stripe */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent"
      />

      {/* Card Content with subtle 3D lift */}
      <div style={{ transform: "translateZ(12px)" }}>{children}</div>
    </motion.div>
  );
}

