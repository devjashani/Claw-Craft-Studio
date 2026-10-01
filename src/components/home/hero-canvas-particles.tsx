"use client";

import React, { useRef, useEffect } from "react";
import { useReducedMotion } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  radius: number;
  vy: number;
  vx: number;
  alpha: number;
  alphaSpeed: number;
  glintPhase: number;
}

export function HeroCanvasParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Capped particle count: 10 on mobile, 22 on desktop for strict 60fps
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 10 : 22;
    const particles: Particle[] = [];

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * (width || 800),
        y: Math.random() * (height || 600),
        radius: Math.random() * 2.5 + 1.5,
        vy: Math.random() * 0.4 + 0.2,
        vx: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.5 + 0.25,
        alphaSpeed: (Math.random() * 0.008 + 0.004) * (Math.random() > 0.5 ? 1 : -1),
        glintPhase: Math.random() * Math.PI * 2,
      });
    }

    // IntersectionObserver to pause loop when scrolled out of view
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isVisible = entry.isIntersecting;
        if (isVisible && !animationFrameId) {
          lastTime = performance.now();
          animationFrameId = requestAnimationFrame(render);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    // Tab visibility handling
    const handleVisibility = () => {
      if (document.hidden) {
        isVisible = false;
      } else {
        isVisible = true;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("resize", handleResize);

    let lastTime = performance.now();

    const render = (time: number) => {
      if (!isVisible) {
        animationFrameId = 0;
        return;
      }

      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Physics update
        p.y += p.vy * 60 * delta;
        p.x += Math.sin(time * 0.001 + p.glintPhase) * 0.2;
        p.alpha += p.alphaSpeed;

        if (p.alpha > 0.75 || p.alpha < 0.2) {
          p.alphaSpeed = -p.alphaSpeed;
        }

        // Recycle if out of bounds
        if (p.y > height + 10) {
          p.y = -10;
          p.x = Math.random() * width;
        }

        // Draw water droplet condensation with specular highlight
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        // Radial droplet gradient
        const grad = ctx.createRadialGradient(
          p.x - p.radius * 0.3,
          p.y - p.radius * 0.3,
          p.radius * 0.1,
          p.x,
          p.y,
          p.radius
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha * 0.9})`);
        grad.addColorStop(0.6, `rgba(184, 255, 31, ${p.alpha * 0.4})`);
        grad.addColorStop(1, `rgba(201, 205, 210, ${p.alpha * 0.15})`);

        ctx.fillStyle = grad;
        ctx.shadowColor = "rgba(184, 255, 31, 0.4)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("resize", handleResize);
    };
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-1 w-full h-full gpu-accel"
    />
  );
}
