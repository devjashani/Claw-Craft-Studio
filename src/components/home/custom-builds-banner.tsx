"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ClawButton } from "@/components/ui/claw-button";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { GlitchText } from "@/components/ui/glitch-text";
import { ArrowRight, Wrench } from "lucide-react";

export function CustomBuildsBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const auraScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.15, 0.9]);
  const auraX = useTransform(scrollYProgress, [0, 1], [30, -30]);

  return (
    <section ref={containerRef} className="relative py-16 px-4 sm:px-6 lg:px-8 bg-void">
      <div className="max-w-7xl mx-auto">
        <div className="relative p-8 sm:p-12 md:p-16 rounded-sm border-2 border-steel/20 bg-ash/90 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 gpu-accel">
          {/* Gothic Corners */}
          <FiligreeCorner position="top-left" size={32} variant="acid" />
          <FiligreeCorner position="top-right" size={32} variant="acid" />
          <FiligreeCorner position="bottom-left" size={32} variant="acid" />
          <FiligreeCorner position="bottom-right" size={32} variant="acid" />

          {/* Background Acid Aura with Scroll-Linked Parallax */}
          <motion.div
            style={shouldReduceMotion ? undefined : { scale: auraScale, x: auraX }}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-acid/15 blur-[100px] pointer-events-none will-change-transform"
          />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-acid/30 bg-void/70 text-acid font-mono text-[11px] uppercase tracking-widest mb-4">
              <Wrench className="w-3.5 h-3.5" />
              <span>BESPOKE STUDIO COMMISSIONS</span>
            </div>

            <h3 className="text-3xl sm:text-5xl font-display uppercase tracking-tight text-bone mb-4 leading-tight">
              <GlitchText as="span">HAVE A SPECIFIC VISION?</GlitchText> <br />
              <span className="text-acid">COMMISSION A CUSTOM BUILD</span>
            </h3>

            <p className="font-sans text-sm sm:text-base text-steel/90 leading-relaxed">
              Want a personalized silhouette, specific rare can flavors, or a
              monumental wall piece tailored for your gaming room, studio, or
              office? Submit your concept for artisan review.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <Link href="/custom">
              <ClawButton variant="primary" size="lg">
                Request Commission <ArrowRight className="w-4 h-4 ml-2" />
              </ClawButton>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
