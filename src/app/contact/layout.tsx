import type { Metadata } from "next";
import { siteConfig, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Studio Desk | CLAWCRAFT",
  description:
    "Direct contact channel to the CLAWCRAFT artisan workshop in India for sculpture inquiries, custom commission discussions, and order assistance.",
  alternates: {
    canonical: absoluteUrl("/contact"),
  },
  openGraph: {
    title: `Contact Studio Desk | ${siteConfig.name}`,
    description:
      "Direct contact channel to the CLAWCRAFT artisan workshop in India for sculpture inquiries, custom commission discussions, and order assistance.",
    url: absoluteUrl("/contact"),
    siteName: siteConfig.name,
    images: [
      {
        url: absoluteUrl("/assets/og-image.jpg"),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} Contact`,
      },
    ],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
