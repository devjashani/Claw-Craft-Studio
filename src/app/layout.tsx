import type { Metadata, Viewport } from "next";
import "./globals.css";
import {
  fontAnton,
  fontUnifraktur,
  fontSpaceGrotesk,
  fontJetBrainsMono,
} from "@/lib/fonts";
import { SmoothScrollProvider } from "@/components/layout/smooth-scroll";
import { ToastProvider } from "@/components/ui/toast";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { CustomCursor } from "@/components/layout/custom-cursor";
import { SlashFlashOverlay } from "@/components/ui/slash-flash";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://clawcraft.in"
  ),
  title: {
    default: `${siteContent.brand.name} | Handcrafted Empty Can Art`,
    template: `%s | ${siteContent.brand.name}`,
  },
  description:
    "Handcrafted display art and wall sculptures fabricated from recycled, empty energy-drink cans. Made in India. Pan-India shipping.",
  keywords: [
    "recycled can art",
    "energy drink can art",
    "can sculpture",
    "heart wall art",
    "upcycled aluminum art",
    "handcrafted art India",
    "gothic can art",
  ],
  authors: [{ name: "Clawcraft Studio" }],
  creator: "Clawcraft Studio",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://clawcraft.in",
    siteName: siteContent.brand.name,
    title: `${siteContent.brand.name} | ${siteContent.brand.tagline}`,
    description:
      "Handcrafted display sculptures built from cleaned, empty energy-drink cans. Empty cans. Full attitude.",
    images: [
      {
        url: "/assets/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Clawcraft Handcrafted Can Art",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteContent.brand.name} | ${siteContent.brand.tagline}`,
    description:
      "Handcrafted display art and sculptures from cleaned energy-drink cans.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://clawcraft.in";
  const orgSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteContent.brand.name,
        url: siteUrl,
        logo: `${siteUrl}/assets/branding/claw-slash-triple.svg`,
        description:
          "Independent Indian art studio handcrafting decorative display art and geometric sculptures from cleaned, recycled energy-drink cans.",
        slogan: siteContent.brand.tagline,
        address: {
          "@type": "PostalAddress",
          addressCountry: "IN",
        },
        sameAs: [
          process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/clawcraft.art",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteContent.brand.name,
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/shop?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`${fontAnton.variable} ${fontUnifraktur.variable} ${fontSpaceGrotesk.variable} ${fontJetBrainsMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body className="bg-void text-bone antialiased selection:bg-acid selection:text-void min-h-screen flex flex-col">
        {/* Subtle Film Grain Texture Overlay */}
        <div className="film-grain" aria-hidden="true" />

        {/* Custom Reticle Cursor on Desktop */}
        <CustomCursor />

        <ToastProvider>
          <SlashFlashOverlay />
          <SmoothScrollProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <FloatingWhatsApp />
            <CartDrawer />
          </SmoothScrollProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
