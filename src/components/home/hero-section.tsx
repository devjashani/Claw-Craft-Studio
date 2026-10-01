"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { ClawButton } from "@/components/ui/claw-button";
import { GlitchText } from "@/components/ui/glitch-text";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { ClawDivider } from "@/components/ui/claw-divider";
import { HeroCanvasParticles } from "@/components/home/hero-canvas-particles";
import { ArrowDown, Sparkles } from "lucide-react";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 80, mass: 0.2 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const hasFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
    if (!hasFinePointer) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = ((e.clientX - innerWidth / 2) / (innerWidth / 2)) * -18;
      const y = ((e.clientY - innerHeight / 2) / (innerHeight / 2)) * -14;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [shouldReduceMotion, mouseX, mouseY]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[92vh] md:min-h-screen flex flex-col justify-between items-center text-center px-4 pt-24 pb-12 overflow-hidden bg-void select-none"
    >
      {/* Background Layer: Creation of Adam Motif with Parallax */}
      <motion.div
        style={{
          x: shouldReduceMotion ? 0 : smoothX,
          y: shouldReduceMotion ? 0 : smoothY,
          scale: 1.05,
        }}
        className="absolute inset-0 pointer-events-none z-0 gpu-accel will-change-transform"
      >
        <Image
          src="/assets/branding/hero-creation-adam.jpg"
          alt="Hands reaching toward glowing aluminum can sculpture"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-40 mix-blend-screen filter contrast-125"
        />

        {/* Ambient Dark Gradient Vignette Masks */}
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-void/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-void via-transparent to-void" />
      </motion.div>

      {/* High-Performance 60fps HTML5 Canvas Condensation Particles */}
      <HeroCanvasParticles />

      {/* Center Acid Radial Aura Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] md:w-[500px] md:h-[500px] rounded-full bg-acid/15 blur-[120px] pointer-events-none z-0 gpu-accel"
        aria-hidden="true"
      />

      {/* Hero Content Shell */}
      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center my-auto">
        {/* Subtitle / Tagline pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-steel/20 bg-ash/80 backdrop-blur-md text-acid font-mono text-xs uppercase tracking-widest mb-6 shadow-void"
        >
          <Sparkles className="w-3.5 h-3.5 text-acid" />
          <span>HANDCRAFTED RECYCLED CAN ART • MADE IN INDIA</span>
        </motion.div>

        {/* Massive Anton Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-display uppercase tracking-tight text-bone font-black leading-[0.88] mb-6 drop-shadow-2xl"
        >
          <GlitchText as="span">EMPTY CANS.</GlitchText> <br />
          <span className="text-acid text-glow-acid">FULL ATTITUDE.</span>
        </motion.h1>

        {/* Narrative Manifesto Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-sans text-base sm:text-lg md:text-xl text-steel/90 max-w-2xl leading-relaxed mb-10"
        >
          Rescuing empty beverage aluminum from landfills to forge aggressive,
          architectural display art and wall installations. Raw underground metalcraft
          for gaming rooms, studio spaces, and private art collections.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          <MagneticButton className="w-full sm:w-auto">
            <Link href="/shop" className="w-full sm:w-auto block">
              <ClawButton variant="primary" size="lg" className="w-full sm:w-auto">
                Shop the collection
              </ClawButton>
            </Link>
          </MagneticButton>

          <MagneticButton className="w-full sm:w-auto">
            <Link href="/custom" className="w-full sm:w-auto block">
              <ClawButton variant="secondary" size="lg" className="w-full sm:w-auto">
                Request a custom build
              </ClawButton>
            </Link>
          </MagneticButton>
        </motion.div>
      </div>

      {/* Bottom Scroll Cue & Signature Claw Slash Divider */}
      <div className="relative z-10 w-full max-w-4xl mt-8">
        <ClawDivider variant="acid" glow className="my-4" />
        <div className="flex items-center justify-center gap-2 text-steel/60 font-mono text-[11px] uppercase tracking-widest">
          <span>SCROLL TO EXPLORE DROP</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce text-acid" />
        </div>
      </div>
    </section>
  );
}
