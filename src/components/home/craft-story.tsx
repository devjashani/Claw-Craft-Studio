"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { siteContent } from "@/content/site";
import { ClawDivider } from "@/components/ui/claw-divider";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { GlitchText } from "@/components/ui/glitch-text";
import { ShieldCheck, Sparkles, Hammer, Package } from "lucide-react";

export function CraftStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const can1Y = useTransform(scrollYProgress, [0, 1], [60, -80]);
  const can1Rotate = useTransform(scrollYProgress, [0, 1], [-15, 10]);
  const can2Y = useTransform(scrollYProgress, [0, 1], [-40, 70]);
  const can2Rotate = useTransform(scrollYProgress, [0, 1], [20, -10]);

  const stepIcons = [
    <Sparkles key="1" className="w-6 h-6 text-acid" />,
    <ShieldCheck key="2" className="w-6 h-6 text-acid" />,
    <Hammer key="3" className="w-6 h-6 text-acid" />,
    <Package key="4" className="w-6 h-6 text-acid" />,
  ];

  return (
    <section
      ref={containerRef}
      className="relative py-24 px-4 sm:px-6 lg:px-8 bg-void bg-halftone overflow-hidden border-t border-steel/10"
    >
      {/* Scroll-Linked Parallax Floating Can Wireframe 1 (Left) */}
      {!shouldReduceMotion && (
        <motion.div
          style={{ y: can1Y, rotate: can1Rotate }}
          className="absolute -left-12 top-1/4 w-48 h-80 pointer-events-none opacity-10 border border-acid/40 rounded-3xl z-0 gpu-accel will-change-transform hidden lg:block"
          aria-hidden="true"
        >
          <div className="absolute inset-x-4 top-4 h-8 border-b border-acid/30 rounded-t-xl" />
          <div className="absolute inset-x-8 bottom-4 h-6 border-t border-acid/30 rounded-b-xl" />
          <div className="absolute inset-y-12 left-1/2 w-[1px] bg-acid/20" />
        </motion.div>
      )}

      {/* Scroll-Linked Parallax Floating Can Wireframe 2 (Right) */}
      {!shouldReduceMotion && (
        <motion.div
          style={{ y: can2Y, rotate: can2Rotate }}
          className="absolute -right-12 bottom-1/4 w-52 h-84 pointer-events-none opacity-10 border border-steel/40 rounded-3xl z-0 gpu-accel will-change-transform hidden lg:block"
          aria-hidden="true"
        >
          <div className="absolute inset-x-4 top-4 h-8 border-b border-steel/30 rounded-t-xl" />
          <div className="absolute inset-x-8 bottom-4 h-6 border-t border-steel/30 rounded-b-xl" />
          <div className="absolute inset-y-12 left-1/2 w-[1px] bg-steel/20" />
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-6 h-[1px] bg-acid" />
            <span className="font-mono text-xs text-acid uppercase tracking-widest font-semibold">
              FABRICATION PROTOCOL
            </span>
            <span className="w-6 h-[1px] bg-acid" />
          </div>
          <h2 className="text-4xl sm:text-6xl font-display uppercase tracking-tight text-bone">
            <GlitchText as="span">HOW IT&apos;S FORGED</GlitchText>
          </h2>
          <p className="font-sans text-steel text-sm sm:text-base mt-3 leading-relaxed">
            From discarded street aluminum to permanent architectural display
            relics. Discover our rigorous 4-stage handcrafting lifecycle.
          </p>
        </div>

        {/* 4 Steps Grid with Gothic Framing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {siteContent.craftSteps.map((step, idx) => (
            <div
              key={step.step}
              className="relative p-6 sm:p-8 rounded-sm border border-steel/20 bg-ash/70 backdrop-blur-sm flex flex-col justify-between group hover:border-acid/60 transition-colors duration-300"
            >
              <FiligreeCorner position="top-left" size={24} variant="steel" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-display text-4xl text-steel/40 group-hover:text-acid group-hover:text-glow-acid transition-colors">
                    {step.step}
                  </span>
                  <div className="p-2.5 rounded-sm border border-steel/20 bg-void/60">
                    {stepIcons[idx]}
                  </div>
                </div>

                <h3 className="font-display uppercase text-xl text-bone mb-3 group-hover:text-acid transition-colors">
                  {step.title}
                </h3>

                <p className="font-sans text-xs sm:text-sm text-steel/80 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Step indicator notch */}
              <div className="mt-8 pt-4 border-t border-steel/10 flex items-center justify-between font-mono text-[10px] text-steel/50 uppercase tracking-widest">
                <span>STAGE {idx + 1} OF 4</span>
                <span className="text-acid">VERIFIED</span>
              </div>
            </div>
          ))}
        </div>

        <ClawDivider variant="acid" className="mt-16" />
      </div>
    </section>
  );
}
