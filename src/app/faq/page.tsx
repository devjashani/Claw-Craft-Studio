"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClawDivider } from "@/components/ui/claw-divider";
import { FiligreeCorner } from "@/components/ui/filigree-corner";
import {
  ChevronDown,
  HelpCircle,
  ShieldAlert,
  Search,
  MessageSquare,
  ArrowRight,
  Package,
} from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
  category: "art" | "shipping" | "custom" | "care";
}

const faqsData: FaqItem[] = [
  // Art & Safety
  {
    category: "art",
    q: "Are the gun sculptures functional, or can they be used as toys?",
    a: "NO. Every CLAWCRAFT sculpture is strictly a stationary, non-firing, decorative display piece handcrafted from cleaned empty energy-drink cans. They contain zero mechanical firing pins, have no hollow chambers for projectiles, and are explicitly NOT toys and NOT weapons. They are fine collectible display art pieces for desks and walls and should be kept away from children.",
  },
  {
    category: "art",
    q: "Are these crafted from genuine post-consumer beverage cans?",
    a: "Yes. 100% of the exterior metal skin is upcycled from authentic, post-consumer aluminum energy-drink cans collected across Indian cities. Each can is de-tabbed, ultrasonically sanitized, and precision-scored by hand.",
  },
  {
    category: "art",
    q: "Are the cut aluminum edges razor sharp?",
    a: "During our 4-step fabrication protocol, all exposed cut edges are folded, beveled, and encapsulated with structural bonding resin to eliminate raw razor surfaces. While the edges are smooth to normal handling, these are handcrafted metal relics and should be displayed thoughtfully.",
  },
  {
    category: "art",
    q: "Do the sculptures stand independently, or do they need mounts?",
    a: "The 8-Can and 14-Can Gun Sculptures are balanced to rest on flat surfaces or display stands. The 12-Can and 27-Can Heart pieces feature built-in reinforced wall hangers and include mounting templates in the box.",
  },

  // Shipping & Logistics
  {
    category: "shipping",
    q: "How do you protect delicate aluminum art during courier transit across India?",
    a: "We engineer proprietary 'Armor Packaging' for every shipment. The sculpture is suspended in high-density customized shock-absorbing foam inside a reinforced, multi-ply rigid corrugated box. Over 99% of our shipments arrive in immaculate gallery condition.",
  },
  {
    category: "shipping",
    q: "What are the shipping charges and delivery timelines?",
    a: "We offer FREE Pan-India shipping on all orders of ₹2,999 or above. Orders below ₹2,999 carry a flat delivery fee of ₹149. Ready pieces dispatch within 24 to 48 hours via premium express couriers (Bluedart, Delhivery, DTDC). Transit time typically ranges between 3 to 6 business days depending on your PIN code.",
  },
  {
    category: "shipping",
    q: "How do I track my order once shipped?",
    a: "As soon as your package is scanned by the courier, you receive an automated email and SMS notification containing the courier name and live AWB tracking link. You can also enter your order number anytime on our /track portal.",
  },

  // Custom Commissions
  {
    category: "custom",
    q: "Can I commission a custom sculpture with specific can colorways?",
    a: "Absolutely! Through our /custom commission page, you can request custom silhouettes (such as gaming studio mascots, dragons, initials, geometric emblems) or specify favorite color palettes (neon green, matte black, silver, red, gold). Our artisan will prepare an architectural sketch and quote within 24 hours.",
  },
  {
    category: "custom",
    q: "Can I send in my own empty cans to be built into a personal relic?",
    a: "Yes! Many collectors save limited-edition cans from festivals or travels. You can courier your washed empty cans to our Bengaluru studio, and we will incorporate them into a bespoke centerpiece. Inquire through our /custom portal for shipping instructions.",
  },

  // Care & Policies
  {
    category: "care",
    q: "How should I clean and maintain my aluminum sculpture?",
    a: "Keep your piece away from direct continuous rain or moisture. For dusting, use a soft micro-fiber cloth or gentle compressed air can. Avoid abrasive scouring pads or harsh solvent cleaners that could strip the anodized lacquer.",
  },
  {
    category: "care",
    q: "What happens if a piece arrives damaged in transit?",
    a: "We take extreme care in packaging, but in the rare event of transit damage, notify us within 48 hours of delivery at studio@clawcraft.in or on WhatsApp with unboxing photos/video. We will immediately arrange a courier return pickup and fabricate a free replacement or issue a full refund.",
  },
  {
    category: "care",
    q: "What payment methods are supported?",
    a: "We accept all major Indian payment methods through Razorpay's 128-bit encrypted gateway: UPI (Google Pay, PhonePe, Paytm, CRED), Credit/Debit Cards (Visa, Mastercard, RuPay), and NetBanking across 50+ Indian banks.",
  },
];

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const filteredFaqs = faqsData.filter((item) => {
    const matchesCat = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      !search ||
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleAccordion = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-void text-bone py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="font-mono text-xs uppercase tracking-widest text-acid">
            Collector Handbook
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-wider text-bone">
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <p className="text-sm text-muted leading-relaxed font-body">
            Everything you need to know about our handcrafted can relics, rigid armor shipping, safety, and custom commissions.
          </p>
          <ClawDivider variant="acid" className="my-6 max-w-xs mx-auto" />
        </div>

        {/* Search Bar */}
        <div className="relative max-w-lg mx-auto">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions (e.g. shipping, safety, custom, edges)..."
            className="w-full pl-10 pr-4 py-3 bg-ash border border-subtle text-xs text-bone placeholder:text-muted focus:border-acid focus:outline-none rounded font-mono shadow-lg"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
          {[
            { id: "all", label: "All Questions" },
            { id: "art", label: "Sculptures & Safety" },
            { id: "shipping", label: "Packaging & Delivery" },
            { id: "custom", label: "Custom Builds" },
            { id: "care", label: "Care & Payments" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-acid text-void font-bold shadow-md"
                  : "bg-ash border border-subtle text-muted hover:text-bone"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="p-12 text-center text-muted font-mono text-xs bg-ash border border-subtle rounded">
              No matching answers found. Try a different search term or message us directly on WhatsApp!
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = expandedIndex === idx;

              return (
                <div
                  key={idx}
                  className="bg-ash border border-subtle rounded overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-void/40 transition-colors"
                  >
                    <span className="font-heading text-base sm:text-lg uppercase text-bone tracking-wide">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-acid shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-bone/80 leading-relaxed font-body border-t border-subtle/40 bg-void/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Mandatory Safety Notice Card */}
        <div className="bg-void border border-subtle p-6 rounded space-y-2">
          <div className="flex items-center gap-2 text-acid font-mono font-bold text-xs uppercase">
            <ShieldAlert className="w-4 h-4" />
            <span>MANDATORY COLLECTOR STATEMENT</span>
          </div>
          <p className="text-xs text-muted leading-relaxed font-body">
            Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children. CLAWCRAFT is an independent art studio not affiliated with, sponsored by, or endorsed by any beverage brand.
          </p>
        </div>

        {/* Still Have Questions CTA */}
        <div className="text-center p-8 bg-ash border border-subtle rounded space-y-4">
          <h3 className="font-heading text-xl uppercase text-bone">
            Have a Specific Question?
          </h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            Our workshop artisan is available on WhatsApp to answer any query regarding dimensions, materials, or delivery.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-void font-bold text-xs font-mono uppercase tracking-wider rounded transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask on WhatsApp</span>
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-void border border-subtle hover:border-steel text-bone text-xs font-mono uppercase tracking-wider rounded transition-colors"
            >
              <span>Email the Studio</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
