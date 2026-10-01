import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ClawDivider } from "@/components/ui/claw-divider";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import { ClawButton } from "@/components/ui/claw-button";
import {
  Sparkles,
  Recycle,
  Hammer,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Boxes,
  Truck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Studio | CLAWCRAFT Handcrafted Can Art",
  description:
    "Learn about CLAWCRAFT — an independent Indian art studio transforming cleaned, empty energy-drink cans into handcrafted geometric wall art and display sculptures.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-void text-bone py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Hero Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="font-mono text-xs uppercase tracking-widest text-acid">
            Our Studio Manifesto
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl uppercase tracking-wider text-bone">
            EMPTY CANS. FULL ATTITUDE.
          </h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed font-body">
            CLAWCRAFT is an independent Indian art studio forging aggressive, precision-built display sculptures from cleaned, recycled energy-drink cans.
          </p>
          <ClawDivider variant="acid" className="my-6 max-w-xs mx-auto" />
        </div>

        {/* Narrative / Genesis */}
        <div className="relative bg-ash border border-subtle p-8 sm:p-12 rounded shadow-2xl space-y-6">
          <FiligreeCorner position="top-left" size={20} />
          <FiligreeCorner position="bottom-right" size={20} />

          <h2 className="font-heading text-2xl uppercase tracking-wider text-bone">
            The Genesis of CLAWCRAFT
          </h2>

          <div className="space-y-4 text-sm sm:text-base text-bone/85 leading-relaxed font-body">
            <p>
              Across Indian cities, millions of empty aluminum energy-drink cans end up crushed in scrap yards or buried in landfills every single month. We looked at those empty cylinders differently: we saw bold typography, vibrant anodized metallics, and high-tensile architectural aluminum begging for a second life.
            </p>
            <p>
              Founded in our workshop, CLAWCRAFT was born to bridge raw underground subculture with museum-grade geometric sculpture. Each creation is meticulously handcrafted by an artisan — transforming 8, 14, 12, or 27 discarded cans into balanced silhouettes that command attention on desktops, creative studios, and gallery walls.
            </p>
          </div>
        </div>

        {/* 4 Pillars of Craftsmanship */}
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-acid">
              Engineering Protocol
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl uppercase tracking-wider text-bone">
              The 4-Step Fabrication Standard
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-ash border border-subtle p-6 rounded space-y-3">
              <span className="text-xs font-mono text-acid font-bold">01 / HYGIENE & PREP</span>
              <h3 className="font-heading text-lg uppercase text-bone">
                Ultrasonic Cleaning & De-tabbing
              </h3>
              <p className="text-xs text-muted leading-relaxed font-body">
                Every single can undergoes an intensive multi-stage wash, ultrasonic scrub, and internal sanitization. Zero sticky residue, zero odors — only pristine, dry, sanitized metal enters our workbench.
              </p>
            </div>

            <div className="bg-ash border border-subtle p-6 rounded space-y-3">
              <span className="text-xs font-mono text-acid font-bold">02 / SCORING</span>
              <h3 className="font-heading text-lg uppercase text-bone">
                Architectural Stress Scoring
              </h3>
              <p className="text-xs text-muted leading-relaxed font-body">
                Thin aluminum walls collapse easily if forced. We hand-score each can along calculated stress lines, creating angled bevels and interlocks while preserving the can’s intrinsic rigidity.
              </p>
            </div>

            <div className="bg-ash border border-subtle p-6 rounded space-y-3">
              <span className="text-xs font-mono text-acid font-bold">03 / STABILIZATION</span>
              <h3 className="font-heading text-lg uppercase text-bone">
                Polymer Internal Cores & Riveting
              </h3>
              <p className="text-xs text-muted leading-relaxed font-body">
                To prevent crushing under handling, key structural junctions receive high-density internal polymer cores and are joined with mechanical hand-set rivets for permanent, rattle-free durability.
              </p>
            </div>

            <div className="bg-ash border border-subtle p-6 rounded space-y-3">
              <span className="text-xs font-mono text-acid font-bold">04 / DISPATCH</span>
              <h3 className="font-heading text-lg uppercase text-bone">
                Rigid Armor Packaging
              </h3>
              <p className="text-xs text-muted leading-relaxed font-body">
                Delicate silhouettes are packed within heavy multi-ply rigid boxes with precision shock-absorbing foam. Pan-India tracked dispatch ensures pieces arrive in pristine gallery condition.
              </p>
            </div>
          </div>
        </div>

        {/* Environmental Commitment */}
        <div className="relative bg-ash border border-acid/40 p-8 rounded flex flex-col sm:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-acid/10 border border-acid text-acid flex items-center justify-center shrink-0">
            <Recycle className="w-8 h-8" />
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-heading text-xl uppercase text-bone">
              100% Repurposed Aluminum Bodies
            </h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed font-body">
              Every sculpture removes non-biodegradable waste from local scrap streams. By purchasing a CLAWCRAFT piece, you are supporting local Indian artisanal upcycling and sustainable creative fabrication.
            </p>
          </div>
        </div>

        {/* Brand Safety & Legal Transparency */}
        <div className="bg-void border border-subtle p-6 rounded space-y-3">
          <div className="flex items-center gap-2 text-acid font-mono font-bold text-xs uppercase">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Independent Art Studio Legal Transparency</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            CLAWCRAFT is an independent art studio. We are not affiliated with, sponsored by, licensed by, or endorsed by any energy-drink brand, beverage corporation, or trademark holder. Our sculptures are artistic transformations of post-consumer discarded packaging.
          </p>
          <p className="text-xs text-muted leading-relaxed">
            <strong>Product Classification:</strong> All items sold by CLAWCRAFT are strictly non-functional, decorative handmade display sculptures and geometric wall art pieces. They contain no firing mechanisms, contain zero projectiles, and are explicitly <strong>NOT toys and NOT weapons. Keep out of reach of small children.</strong>
          </p>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 pt-4">
          <h3 className="font-heading text-2xl uppercase text-bone">
            Ready to Own a Piece of the Craft?
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/shop">
              <ClawButton variant="acid" className="text-xs py-3 px-6">
                <span>EXPLORE READY SCULPTURES</span>
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </ClawButton>
            </Link>

            <Link href="/custom">
              <ClawButton variant="secondary" className="text-xs py-3 px-6">
                <span>COMMISSION A CUSTOM BUILD</span>
              </ClawButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
