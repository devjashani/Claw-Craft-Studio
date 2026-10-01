"use client";

import React, { useState } from "react";
import Link from "next/link";
import { siteContent } from "@/content/site";
import { ClawButton } from "@/components/ui/claw-button";
import { ShieldCheck, Truck, Headphones, Recycle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FaqAndTrust() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const trustBadges = [
    {
      icon: <Recycle className="w-5 h-5 text-acid" />,
      title: "100% Repurposed Cans",
      desc: "Sanitized, de-tabbed, and permanently upcycled into display art.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-acid" />,
      title: "Razorpay Protected",
      desc: "Fast, encrypted payments via UPI (GPay, PhonePe, Paytm) & Cards.",
    },
    {
      icon: <Truck className="w-5 h-5 text-acid" />,
      title: "Pan-India Rigid Box Delivery",
      desc: "Custom multi-ply shock cartons ensuring damage-free transit.",
    },
    {
      icon: <Headphones className="w-5 h-5 text-acid" />,
      title: "Direct Builder Support",
      desc: "Direct communication with our studio via WhatsApp or email.",
    },
  ];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-void border-t border-steel/10">
      <div className="max-w-7xl mx-auto">
        {/* Trust Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {trustBadges.map((badge, idx) => (
            <div
              key={idx}
              className="p-6 rounded-sm border border-steel/20 bg-ash/40 flex items-start gap-4"
            >
              <div className="p-2.5 rounded-sm border border-steel/20 bg-void shrink-0 mt-0.5">
                {badge.icon}
              </div>
              <div>
                <h4 className="font-display uppercase text-lg text-bone mb-1">
                  {badge.title}
                </h4>
                <p className="font-sans text-xs text-steel/80 leading-relaxed">
                  {badge.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Teaser */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-2 font-mono text-xs text-acid uppercase tracking-widest">
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display uppercase tracking-tight text-bone">
              CLARITY BEFORE YOU BUY
            </h2>
            <p className="font-sans text-steel text-sm sm:text-base mt-2">
              Honest details on craft construction, safe handling, and delivery.
            </p>
          </div>

          <div className="space-y-3">
            {siteContent.faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-steel/20 bg-ash/50 rounded-sm overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-display uppercase text-base sm:text-lg text-bone hover:text-acid transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-steel transition-transform duration-200 shrink-0",
                        isOpen && "rotate-180 text-acid"
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-steel/90 font-sans text-sm leading-relaxed border-t border-steel/10 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link href="/faq">
              <ClawButton variant="secondary" size="md">
                View Full FAQ Knowledgebase
              </ClawButton>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
