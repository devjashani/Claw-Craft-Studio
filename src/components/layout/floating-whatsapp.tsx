"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { siteContent } from "@/content/site";

export function FloatingWhatsApp() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const rawNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || siteContent.socials.whatsapp;
  const sanitizedNumber = rawNumber.replace(/[^0-9]/g, "");
  const defaultMessage = encodeURIComponent(
    "Hi Clawcraft Studio! I'm interested in your handcrafted energy can sculptures."
  );
  const whatsappUrl = `https://wa.me/${sanitizedNumber}?text=${defaultMessage}`;

  return (
    <aside
      aria-label="Direct Studio Contact"
      className="fixed bottom-6 left-6 z-40 select-none print:hidden"
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Clawcraft Studio on WhatsApp"
        className="group relative flex items-center gap-3 p-3 sm:px-4 sm:py-2.5 rounded-full border border-acid/40 bg-ash/90 text-bone hover:text-void hover:bg-acid hover:border-acid shadow-acid transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-acid backdrop-blur-md"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-acid opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-acid group-hover:bg-void transition-colors" />
        </span>

        <MessageCircle className="w-5 h-5 text-acid group-hover:text-void transition-colors" />

        <span className="hidden sm:inline font-mono text-xs uppercase tracking-widest font-bold">
          Studio Chat
        </span>
      </a>
    </aside>
  );
}
