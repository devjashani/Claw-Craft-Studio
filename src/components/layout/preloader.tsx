"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, FastForward } from "lucide-react";

export function Preloader() {
  const [shouldShow, setShouldShow] = useState(false);
  const [phase, setPhase] = useState<"pop" | "slash" | "reveal" | "done">("pop");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Synthesize realistic can pop and fizz sound effects via Web Audio API
  const playSynthesizedCanPop = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // 1. Can Tab Pop Click (Low-frequency punch)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
      oscGain.gain.setValueAtTime(0.6, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);

      // 2. High Pressure Carbonation Fizz (Filtered White Noise)
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(2500, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now + 0.02);
      noise.stop(now + 0.8);
    } catch {
      // AudioContext unavailable or blocked by autoplay policy
    }
  }, [soundEnabled]);

  const handleSkip = useCallback(() => {
    sessionStorage.setItem("clawcraft_preloader_seen", "true");
    setPhase("done");
    setTimeout(() => setShouldShow(false), 200);
  }, []);

  useEffect(() => {
    // Only show once per browser session
    const seen = sessionStorage.getItem("clawcraft_preloader_seen");
    if (seen === "true") {
      setShouldShow(false);
      return;
    }

    setShouldShow(true);

    // Timeline under 1.9 seconds
    const popTimer = setTimeout(() => {
      setPhase("slash");
    }, 600);

    const slashTimer = setTimeout(() => {
      setPhase("reveal");
    }, 1100);

    const endTimer = setTimeout(() => {
      sessionStorage.setItem("clawcraft_preloader_seen", "true");
      setPhase("done");
      setTimeout(() => setShouldShow(false), 300);
    }, 1850);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleSkip();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(popTimer);
      clearTimeout(slashTimer);
      clearTimeout(endTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSkip]);

  useEffect(() => {
    if (phase === "pop" && soundEnabled) {
      playSynthesizedCanPop();
    }
  }, [phase, soundEnabled, playSynthesizedCanPop]);

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="fixed inset-0 z-[99999] bg-void flex flex-col items-center justify-center overflow-hidden select-none"
        >
          {/* Top Controls: Sound Toggle and Skip */}
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-50">
            <button
              onClick={() => {
                setSoundEnabled((prev) => !prev);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-steel/20 bg-ash/80 text-steel hover:text-bone text-xs font-mono tracking-widest uppercase transition-colors"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-acid" />
                  <span>Audio: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-steel/60" />
                  <span>Audio: MUTED</span>
                </>
              )}
            </button>

            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-steel/20 bg-ash/80 text-steel hover:text-acid text-xs font-mono tracking-widest uppercase transition-colors"
            >
              <span>Skip</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Central Animation Sequence */}
          <div className="relative w-full max-w-lg aspect-square flex items-center justify-center p-8">
            {/* Phase 1: Can Tab Pop Open with Fizz Bubbles */}
            {phase === "pop" && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.1, opacity: 0 }}
                className="flex flex-col items-center justify-center relative"
              >
                {/* SVG Silhouette of Beverage Can Top & Pull Tab */}
                <div className="relative w-44 h-44 rounded-full border-2 border-steel/40 bg-gradient-to-b from-ash to-void flex items-center justify-center shadow-[0_0_40px_rgba(201,205,210,0.15)]">
                  {/* Pull Tab with pop leverage animation */}
                  <motion.div
                    initial={{ rotateX: 0, y: 0 }}
                    animate={{ rotateX: -60, y: -8 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="w-16 h-24 border-2 border-bone rounded-t-xl rounded-b-md flex flex-col items-center justify-between p-2 shadow-lg"
                  >
                    <div className="w-6 h-6 rounded-full border border-steel/50" />
                    <div className="w-10 h-2 bg-acid/80 rounded-sm" />
                  </motion.div>

                  {/* Rising Fizz Bubbles */}
                  <div className="absolute inset-0 pointer-events-none overflow-visible">
                    {[...Array(14)].map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{
                          opacity: 0,
                          y: 0,
                          x: (i - 7) * 8,
                          scale: 0.5,
                        }}
                        animate={{
                          opacity: [0, 0.9, 0],
                          y: -120 - Math.random() * 80,
                          x: (i - 7) * 14 + (Math.random() * 20 - 10),
                          scale: [0.5, 1.2, 0.2],
                        }}
                        transition={{
                          duration: 0.7,
                          delay: 0.1 + i * 0.03,
                          ease: "easeOut",
                        }}
                        className="absolute bottom-1/2 left-1/2 w-2.5 h-2.5 rounded-full bg-acid/90 shadow-[0_0_8px_#B8FF1F]"
                      />
                    ))}
                  </div>
                </div>

                <p className="font-mono text-xs text-steel/60 uppercase tracking-widest mt-6">
                  OPENING CAN VAULT...
                </p>
              </motion.div>
            )}

            {/* Phase 2: Three Claw Slashes Wiping Across */}
            {phase === "slash" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <svg
                  viewBox="0 0 400 400"
                  className="w-full h-full drop-shadow-[0_0_25px_#B8FF1F]"
                >
                  {/* Slash 1 */}
                  <motion.path
                    d="M60 380 L150 20 L170 30 L80 390 Z"
                    fill="#B8FF1F"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                  {/* Slash 2 */}
                  <motion.path
                    d="M160 395 L240 10 L260 20 L180 405 Z"
                    fill="#F2F0EA"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.22, delay: 0.05, ease: "easeOut" }}
                  />
                  {/* Slash 3 */}
                  <motion.path
                    d="M260 375 L330 25 L350 35 L280 385 Z"
                    fill="#B8FF1F"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.24, delay: 0.1, ease: "easeOut" }}
                  />
                </svg>
              </motion.div>
            )}

            {/* Phase 3: Brand Reveal */}
            {phase === "reveal" && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.05, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="text-center z-10 flex flex-col items-center"
              >
                <div className="font-mono text-xs text-acid tracking-widest uppercase mb-2">
                  STUDIO PRESENTATION
                </div>
                <h1 className="text-6xl md:text-8xl font-display uppercase tracking-tight text-bone font-black leading-none text-glow-acid">
                  CLAWCRAFT
                </h1>
                <p className="font-mono text-xs md:text-sm text-steel tracking-widest uppercase mt-3">
                  EMPTY CANS. FULL ATTITUDE.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
