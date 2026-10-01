"use client";

import React from "react";
import Image from "next/image";
import { siteContent } from "@/content/site";
import { Instagram, ExternalLink, Play } from "lucide-react";

export function InstagramStrip() {
  const posts = [
    {
      title: "De-tabbing & ultrasonic sanitization cycle",
      image: "/assets/products/8-can-gun-sculpture.jpg",
      views: "14.2K",
    },
    {
      title: "Hand-riveting the 14-Can statement sculpture",
      image: "/assets/products/14-can-gun-sculpture.jpg",
      views: "28.5K",
    },
    {
      title: "Stepped relief wall mounting for the 12-Can Heart",
      image: "/assets/products/12-can-heart-wall-art.jpg",
      views: "42.1K",
    },
    {
      title: "Assembling the monumental 27-Can Mosaic Heart",
      image: "/assets/products/27-can-heart-wall-art.jpg",
      views: "56.8K",
    },
  ];

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-void border-t border-steel/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-2 font-mono text-xs text-acid uppercase tracking-widest">
              <Instagram className="w-4 h-4 text-acid" />
              <span>@CLAWCRAFT.ART ON INSTAGRAM</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display uppercase tracking-tight text-bone">
              FROM THE BENCH
            </h2>
          </div>

          <a
            href={siteContent.socials.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-acid hover:text-bone transition-colors"
          >
            <span>Follow Studio Drops</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Reels Link Grid (Performance-optimized, NO heavy iframe embeds) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {posts.map((post, idx) => (
            <a
              key={idx}
              href={siteContent.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View Instagram Reel: ${post.title}`}
              className="group relative aspect-[9/14] rounded-sm overflow-hidden border border-steel/20 bg-ash/60 block"
            >
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-void via-void/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

              {/* Center Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-void/80 border border-acid/50 text-acid flex items-center justify-center transform group-hover:scale-110 group-hover:bg-acid group-hover:text-void transition-all duration-300 shadow-acid">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>

              {/* Bottom Reel Caption */}
              <div className="absolute bottom-3 left-3 right-3 text-left">
                <p className="font-mono text-[10px] text-acid uppercase tracking-wider mb-1 font-bold">
                  {post.views} VIEWS
                </p>
                <p className="font-sans text-xs text-bone font-medium line-clamp-2 leading-snug">
                  {post.title}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
