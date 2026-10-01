"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { FiligreeCorner } from "./filigree-corner";
import { GlitchText } from "./glitch-text";

interface SectionShellProps {
  id?: string;
  className?: string;
  containerClassName?: string;
  tagline?: string;
  title?: string;
  description?: string;
  withCorners?: boolean;
  withHalftone?: boolean;
  children: React.ReactNode;
}

export function SectionShell({
  id,
  className,
  containerClassName,
  tagline,
  title,
  description,
  withCorners = false,
  withHalftone = false,
  children,
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-void",
        withHalftone && "bg-halftone",
        className
      )}
    >
      <div
        className={cn(
          "max-w-7xl mx-auto relative",
          withCorners &&
            "p-6 md:p-12 border border-steel/20 bg-ash/40 backdrop-blur-sm",
          containerClassName
        )}
      >
        {withCorners && (
          <>
            <FiligreeCorner position="top-left" size={36} />
            <FiligreeCorner position="top-right" size={36} />
            <FiligreeCorner position="bottom-left" size={36} />
            <FiligreeCorner position="bottom-right" size={36} />
          </>
        )}

        {(tagline || title || description) && (
          <div className="mb-12 text-center max-w-3xl mx-auto">
            {tagline && (
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="w-6 h-[1px] bg-acid" />
                <span className="font-mono text-xs text-acid uppercase tracking-widest font-semibold">
                  {tagline}
                </span>
                <span className="w-6 h-[1px] bg-acid" />
              </div>
            )}
            {title && (
              <h2 className="text-4xl md:text-6xl font-display uppercase tracking-tight text-bone mb-4">
                <GlitchText as="span">{title}</GlitchText>
              </h2>
            )}
            {description && (
              <p className="text-steel font-sans text-base md:text-lg leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </section>
  );
}
