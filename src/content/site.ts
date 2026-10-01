export interface SiteContent {
  brand: {
    name: string;
    tagline: string;
    disclaimer: string;
    productSafetyNotice: string;
  };
  navigation: Array<{ label: string; href: string }>;
  policies: Array<{ label: string; href: string }>;
  socials: {
    instagram: string;
    whatsapp: string;
  };
  craftSteps: Array<{
    step: string;
    title: string;
    description: string;
  }>;
  trustPoints: Array<{
    title: string;
    description: string;
    badge: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export const siteContent: SiteContent = {
  brand: {
    name: "CLAWCRAFT",
    tagline: "Empty cans. Full attitude.",
    disclaimer:
      "CLAWCRAFT is an independent art studio. Not affiliated with, sponsored by or endorsed by any beverage brand. Products are handcrafted art made from empty, recycled cans.",
    productSafetyNotice:
      "Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.",
  },
  navigation: [
    { label: "Shop", href: "/shop" },
    { label: "Custom Builds", href: "/custom" },
    { label: "About Studio", href: "/about" },
    { label: "Track Order", href: "/track" },
    { label: "FAQ", href: "/faq" },
  ],
  policies: [
    { label: "Privacy Policy", href: "/policies/privacy" },
    { label: "Terms of Service", href: "/policies/terms" },
    { label: "Shipping Policy", href: "/policies/shipping" },
    { label: "Refund & Cancellation", href: "/policies/refund-cancellation" },
  ],
  socials: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/clawcraft.art",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876543210",
  },
  craftSteps: [
    {
      step: "01",
      title: "COLLECT & SANITIZE",
      description:
        "Every single aluminum energy-drink can is thoroughly de-tabbed, ultrasonically cleansed, and sanitized before entering our assembly bench.",
    },
    {
      step: "02",
      title: "ARCHITECTURAL SCORING",
      description:
        "Cans are precision-scored along reinforced stress lines, retaining structural rigidity without collapsing thin metal walls.",
    },
    {
      step: "03",
      title: "HAND-RIVETED ASSEMBLY",
      description:
        "Modules are locked into balanced geometric and relief silhouettes using internal industrial bonding and hand-seated rivets.",
    },
    {
      step: "04",
      title: "ARMOR PACKAGING & DISPATCH",
      description:
        "Sculptures are braced inside custom multi-ply rigid cartons with high-density shock padding for safe Pan-India doorstep delivery.",
    },
  ],
  trustPoints: [
    {
      badge: "GENUINE UPCYCLING",
      title: "100% Repurposed Aluminum",
      description:
        "Every sculpture rescues 8 to 27 post-consumer cans from landfills, transforming raw street culture into lasting display art.",
    },
    {
      badge: "SECURE PAYMENTS",
      title: "Razorpay Protected Checkout",
      description:
        "Encrypted transactions supporting UPI (Google Pay, PhonePe, Paytm), credit/debit cards, and all major Indian banks.",
    },
    {
      badge: "SAFE TRANSIT",
      title: "Pan-India Rigid Box Delivery",
      description:
        "Dispatched via verified courier partners with direct live tracking notifications straight to your phone and email.",
    },
  ],
  faqs: [
    {
      question: "Are these items real weapons or toys?",
      answer:
        "No. Every Clawcraft piece is strictly a stationary, handcrafted decorative display sculpture made from cleaned empty beverage cans. They have no mechanical firing parts, contain zero projectiles, and are explicitly not toys and not for children.",
    },
    {
      question: "Are the edges of the cans sharp?",
      answer:
        "All cut edges are folded, rounded, and sealed with protective architectural resin during fabrication to eliminate raw razor surfaces. However, as fine metal art, pieces should be handled with care.",
    },
    {
      question: "How long does shipping take within India?",
      answer:
        "In-stock pieces dispatch within 24 to 48 hours. Made-to-order pieces have an artisanal lead time of 3 to 5 business days before courier pickup. Delivery typically takes 3 to 6 days depending on your PIN code.",
    },
    {
      question: "Can I request a custom design or specific can flavors?",
      answer:
        "Yes! Through our Custom Build commission form, you can specify desired silhouettes, dimensions, or favorite can designs. We will review your concept and provide a quote within 24 hours.",
    },
  ],
};
