import type { Metadata } from "next";
import { siteConfig, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Custom Builds & Bespoke Can Sculptures",
  description:
    "Commission a bespoke geometric or wall display sculpture handcrafted from recycled energy-drink cans. Tailored to your favorite cans, dimensions, and aesthetic.",
  alternates: {
    canonical: absoluteUrl("/custom"),
  },
  openGraph: {
    title: `Custom Builds | ${siteConfig.name} Studio`,
    description:
      "Commission a bespoke geometric or wall display sculpture handcrafted from recycled energy-drink cans. Tailored to your favorite cans, dimensions, and aesthetic.",
    url: absoluteUrl("/custom"),
    siteName: siteConfig.name,
    images: [
      {
        url: absoluteUrl("/assets/og-image.jpg"),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} Custom Builds`,
      },
    ],
  },
};

export default function CustomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
