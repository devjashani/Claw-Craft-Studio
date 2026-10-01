"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { cn } from "@/lib/utils";
import { ZoomIn } from "lucide-react";

interface ProductGalleryProps {
  title: string;
  images: string[];
}

export function ProductGallery({ title, images }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const activeImage = images[selectedIndex] || images[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Viewport Container */}
      <div
        className="relative aspect-[4/3] rounded-sm overflow-hidden border-2 border-steel/20 bg-void/90 select-none group cursor-crosshair"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <FiligreeCorner position="top-left" size={28} variant="acid" />
        <FiligreeCorner position="bottom-right" size={28} variant="acid" />

        <Image
          src={activeImage}
          alt={`${title} - View ${selectedIndex + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={cn(
            "object-cover object-center transition-transform duration-300",
            isZoomed && "scale-150"
          )}
          style={
            isZoomed
              ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
              : undefined
          }
        />

        {/* Zoom Hint Indicator */}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-sm bg-void/80 border border-steel/20 text-steel font-mono text-[10px] tracking-widest uppercase flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ZoomIn className="w-3.5 h-3.5 text-acid" />
          <span>HOVER TO ZOOM</span>
        </div>
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              aria-label={`View photo ${idx + 1}`}
              className={cn(
                "relative w-20 h-16 rounded-sm overflow-hidden border-2 shrink-0 bg-void/80 transition-all",
                selectedIndex === idx
                  ? "border-acid shadow-acid scale-105"
                  : "border-steel/20 hover:border-steel/50 opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={img}
                alt={`${title} thumb ${idx + 1}`}
                fill
                sizes="80px"
                className="object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
