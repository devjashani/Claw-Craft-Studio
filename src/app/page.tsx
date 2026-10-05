import React from "react";
import { Preloader } from "@/components/layout/preloader";
import { HeroSection } from "@/components/home/hero-section";
import { Marquee } from "@/components/ui/marquee";
import { FeaturedProducts } from "@/components/home/featured-products";
import { DiwaliBanner } from "@/components/home/diwali-banner";
import { NewDrops } from "@/components/home/new-drops";
import { CraftStory } from "@/components/home/craft-story";
import { CustomBuildsBanner } from "@/components/home/custom-builds-banner";
import { InstagramStrip } from "@/components/home/instagram-strip";
import { FaqAndTrust } from "@/components/home/faq-and-trust";
import { getProducts } from "@/lib/products";

export const revalidate = 60; // ISR cache revalidation

export default async function HomePage() {
  const products = await getProducts();

  const marqueeStatements = [
    "HANDCRAFTED IN INDIA",
    "RECYCLED BEVERAGE CANS",
    "PAN-INDIA HOME DELIVERY",
    "NOT A TOY • NOT A WEAPON",
    "100% REPURPOSED ALUMINUM",
    "STATIONARY DECORATIVE DISPLAY PIECES",
    "INDEPENDENT ART STUDIO",
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Can Pop Preloader (under 2s, skippable, once per session, sound toggle) */}
      <Preloader />

      {/* 2. Hero Section with Creation-of-Adam motif, parallax & water particles */}
      <HeroSection />

      {/* 3. Marquee Ticker */}
      <Marquee items={marqueeStatements} speed="normal" />

      {/* 4. Featured Products (Horizontal Scroll-Pinned Showcase with Tilt Cards) */}
      <FeaturedProducts products={products} />

      {/* Slim Diwali Special Banner */}
      <DiwaliBanner />

      {/* New Drops Row (5 New Products) */}
      <NewDrops products={products} />

      {/* 5. How It's Made: 4-Step Craft Story with Slash Transitions */}
      <CraftStory />

      {/* 6. Custom Builds CTA Banner */}
      <CustomBuildsBanner />

      {/* 7. Instagram / Reels Strip (Performance-safe links only) */}
      <InstagramStrip />

      {/* 8. FAQ Teaser & Verified Trust Row */}
      <FaqAndTrust />
    </div>
  );
}
