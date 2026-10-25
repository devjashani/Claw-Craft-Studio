import type { Metadata } from "next";
import { siteConfig, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | CLAWCRAFT",
  description:
    "Everything you need to know about CLAWCRAFT handcrafted can sculptures, transit armor packaging, care instructions, and custom orders.",
  alternates: {
    canonical: absoluteUrl("/faq"),
  },
  openGraph: {
    title: `FAQ | ${siteConfig.name}`,
    description:
      "Everything you need to know about CLAWCRAFT handcrafted can sculptures, transit armor packaging, care instructions, and custom orders.",
    url: absoluteUrl("/faq"),
    siteName: siteConfig.name,
    images: [
      {
        url: absoluteUrl("/assets/og-image.jpg"),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} FAQ`,
      },
    ],
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
