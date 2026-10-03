import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getProductBySlug, getProducts, getProductImageUrl, getProductAltText } from "@/lib/products";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductActions } from "@/components/shop/product-actions";
import { PincodeChecker } from "@/components/shop/pincode-checker";
import { StickyMobileBar } from "@/components/shop/sticky-mobile-bar";
import { ProductCard } from "@/components/shop/product-card";
import { ClawDivider } from "@/components/ui/claw-divider";
import { formatINR } from "@/lib/utils";
import { ShieldAlert, Package, Ruler, ShieldCheck, ChevronRight } from "lucide-react";

interface ProductPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Sculpture Not Found | CLAWCRAFT" };

  const imageUrl = getProductImageUrl(product.slug);
  const altText = getProductAltText(product.slug, product.title);

  return {
    title: `${product.title} | Handcrafted Can Art`,
    description: product.tagline || product.description,
    openGraph: {
      title: `${product.title} | CLAWCRAFT Studio`,
      description: product.description,
      images: [
        {
          url: imageUrl,
          width: 1536,
          height: 1024,
          alt: altText,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | CLAWCRAFT Studio`,
      description: product.description,
      images: [imageUrl],
    },
  };
}

export const revalidate = 60;

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const allProducts = await getProducts();
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  // Gallery images with single clean v2 product image
  const productImages = [getProductImageUrl(product.slug)];

  // Schema.org JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: [getProductImageUrl(product.slug)],
    description: product.description,
    brand: {
      "@type": "Brand",
      name: "CLAWCRAFT",
    },
    offers: {
      "@type": "Offer",
      url: `https://clawcraft.in/shop/${product.slug}`,
      priceCurrency: "INR",
      price: (product.price_paise / 100).toFixed(2),
      availability:
        product.stock_count > 0 || product.is_made_to_order
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="min-h-screen bg-void py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumbs"
          className="flex items-center gap-2 font-mono text-xs text-steel/60 uppercase tracking-widest mb-8"
        >
          <Link href="/" className="hover:text-acid transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/shop" className="hover:text-acid transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-acid truncate">{product.title}</span>
        </nav>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7">
            <ProductGallery title={product.title} images={productImages} />
          </div>

          {/* Right Column: Information, Pricing & Actions */}
          <div className="lg:col-span-5 flex flex-col justify-start space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-ash border border-acid/40 text-acid font-mono text-xs font-bold uppercase tracking-widest mb-3">
                <span>{product.cans_count} RECYCLED CANS</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-display uppercase tracking-tight text-bone leading-tight">
                {product.title}
              </h1>

              <p className="font-sans text-sm text-steel/80 mt-2 leading-relaxed">
                {product.tagline}
              </p>
            </div>

            {/* Price Display */}
            <div className="p-4 rounded-sm border border-steel/20 bg-ash/40 flex items-baseline gap-4">
              <span className="font-mono text-3xl font-bold text-bone">
                {formatINR(product.price_paise)}
              </span>
              {product.compare_at_price_paise && (
                <span className="font-mono text-base line-through text-steel/50">
                  {formatINR(product.compare_at_price_paise)}
                </span>
              )}
              <span className="font-mono text-xs text-acid ml-auto uppercase tracking-wider font-semibold">
                Taxes Included
              </span>
            </div>

            {/* MANDATORY LEGAL & PRODUCT SAFETY NOTICE */}
            <div className="p-4 rounded-sm border-2 border-blood/60 bg-blood/10 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-blood shrink-0 mt-0.5" />
              <div>
                <strong className="font-mono text-xs text-blood uppercase tracking-wider block mb-1">
                  MANDATORY DISPLAY ART NOTICE:
                </strong>
                <p className="font-sans text-xs text-steel leading-relaxed">
                  Handcrafted decorative display piece made from cleaned, empty
                  cans. <strong>Not a toy. Not a weapon. Not for children.</strong>
                </p>
              </div>
            </div>

            {/* Quantity Selector, Add to Cart & Buy Now */}
            <ProductActions product={product} />

            {/* Live PIN Code Delivery Verification */}
            <PincodeChecker />

            {/* Specifications & Craft Details */}
            <div className="border-t border-steel/20 pt-6 space-y-4 font-mono text-xs">
              <div className="flex items-start gap-3">
                <Ruler className="w-4 h-4 text-acid shrink-0 mt-0.5" />
                <div>
                  <span className="text-bone uppercase tracking-wider">
                    DIMENSIONS & WEIGHT:
                  </span>
                  <p className="text-steel/80 font-sans mt-0.5">
                    {product.dimensions_cm.width}W × {product.dimensions_cm.height}H
                    × {product.dimensions_cm.depth}D cm • Approx{" "}
                    {product.weight_grams} grams
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-acid shrink-0 mt-0.5" />
                <div>
                  <span className="text-bone uppercase tracking-wider">
                    MATERIALS:
                  </span>
                  <p className="text-steel/80 font-sans mt-0.5">
                    {product.materials.join(" • ")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="w-4 h-4 text-acid shrink-0 mt-0.5" />
                <div>
                  <span className="text-bone uppercase tracking-wider">
                    WHAT&apos;S IN THE BOX:
                  </span>
                  <ul className="text-steel/80 font-sans mt-0.5 list-disc list-inside space-y-0.5">
                    {product.in_the_box.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Narrative Description */}
        <div className="max-w-4xl mx-auto my-16 p-8 rounded-sm border border-steel/20 bg-ash/30">
          <h2 className="font-display uppercase text-2xl text-bone mb-4">
            ARTISAN CRAFT NOTES
          </h2>
          <p className="font-sans text-sm sm:text-base text-steel/90 leading-relaxed">
            {product.description}
          </p>
        </div>


        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 border-t border-steel/10 pt-16">
            <ClawDivider variant="acid" className="mb-12" />
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display uppercase tracking-tight text-bone">
                OTHER RELICS FROM THE DROP
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar for Mobile Viewports */}
      <StickyMobileBar product={product} />
    </div>
  );
}
