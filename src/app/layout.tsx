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
import {
  siteConfig,
  getSiteUrl,
  absoluteUrl,
  validateProductionSiteUrl,
} from "@/lib/site";

// Validate production deployment configuration at build time
validateProductionSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteConfig.defaultTitle,
    template: siteConfig.titleTemplate,
  },
  description: siteConfig.defaultDescription,
  keywords: [
    "recycled can art",
    "energy drink can art",
    "can sculpture",
    "heart wall art",
    "upcycled aluminum art",
    "handcrafted art India",
    "gothic can art",
  ],
  authors: [{ name: siteConfig.longName }],
  creator: siteConfig.longName,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    type: "website",
    locale: siteConfig.ogLocale,
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.defaultDescription,
    images: [
      {
        url: absoluteUrl("/assets/og-image.jpg"),
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} Handcrafted Can Art`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.defaultDescription,
    images: [absoluteUrl("/assets/og-image.jpg")],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = getSiteUrl();
  const socialLinks = [process.env.NEXT_PUBLIC_INSTAGRAM_URL].filter(Boolean) as string[];

  const orgSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteConfig.name,
        url: siteUrl,
        logo: absoluteUrl("/assets/branding/claw-slash-triple.svg"),
        description:
          "Independent Indian art studio handcrafting decorative display art and geometric sculptures from cleaned, recycled energy-drink cans.",
        slogan: siteConfig.tagline,
        address: {
          "@type": "PostalAddress",
          addressCountry: "IN",
        },
        sameAs: socialLinks.length > 0 ? socialLinks : undefined,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteConfig.name,
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/shop")}?q={search_term_string}`,
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
