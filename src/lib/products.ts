import { Product } from "@/types/shop";
import { createClient } from "@/lib/supabase/server";
import {
  getProductImageUrl,
  getProductAltText,
  PRODUCT_IMAGE_MAP,
  PRODUCT_ALT_MAP,
} from "./product-media";

export {
  getProductImageUrl,
  getProductAltText,
  PRODUCT_IMAGE_MAP,
  PRODUCT_ALT_MAP,
};

export const initialProductsFallback: Product[] = [
  {
    id: "e1a2b3c4-0001-4000-8000-000000000001",
    slug: "8-can-gun-sculpture",
    title: "8-Can Gun Sculpture",
    tagline: "Compact handheld architectural silhouette forged from 8 reclaimed cans.",
    description:
      "An aggressive, compact display sculpture crafted from eight sanitized and precision-scored energy-drink aluminum cans. Features reinforced internal polymer stabilization and hand-riveted joints. Finished with clean edge bevels for a striking dark gothic desktop centerpiece. Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.",
    category: "sculptures",
    cans_count: 8,
    price_paise: 129900, // Rs 1,299
    stock_count: 5,
    is_made_to_order: false,
    lead_time_days: 2,
    dimensions_cm: { width: 38, height: 22, depth: 7 },
    weight_grams: 450,
    materials: [
      "Cleaned Aluminum Energy-Drink Cans",
      "Industrial Rivets",
      "Structural Polymer Bonding",
    ],
    in_the_box: [
      "Handcrafted Can Sculpture",
      "Certificate of Authenticity",
      "Display Stand or Mounting Kit",
      "Studio Sticker Pack",
    ],
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "a0000001-0001-4000-8000-000000000001",
        product_id: "e1a2b3c4-0001-4000-8000-000000000001",
        image_url: "/assets/products/8-can-gun-sculpture-v2.png",
        alt_text: "8-Can Gun Sculpture, handcrafted decorative display piece",
        display_order: 1,
        is_primary: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "e1a2b3c4-0002-4000-8000-000000000002",
    slug: "14-can-gun-sculpture",
    title: "14-Can Gun Sculpture",
    tagline: "Extended assault silhouette with dual-cylinder stock crafted from 14 cans.",
    description:
      "Our flagship heavy display piece. Built from fourteen individually selected, cleaned, and architectural-scored energy-drink cans. Features a layered multi-can barrel assembly, angled magazine grip, and counterweighted stock. Designed for mantle display or gallery wall mounting. Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.",
    category: "sculptures",
    cans_count: 14,
    price_paise: 229900, // Rs 2,299
    stock_count: 3,
    is_made_to_order: false,
    lead_time_days: 3,
    dimensions_cm: { width: 64, height: 28, depth: 8 },
    weight_grams: 820,
    materials: [
      "Cleaned Aluminum Energy-Drink Cans",
      "Industrial Rivets",
      "Structural Polymer Bonding",
    ],
    in_the_box: [
      "Handcrafted Can Sculpture",
      "Certificate of Authenticity",
      "Display Stand or Mounting Kit",
      "Studio Sticker Pack",
    ],
    is_active: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "a0000001-0002-4000-8000-000000000002",
        product_id: "e1a2b3c4-0002-4000-8000-000000000002",
        image_url: "/assets/products/14-can-gun-sculpture-v2.png",
        alt_text: "14-Can Gun Sculpture, handcrafted decorative display piece",
        display_order: 1,
        is_primary: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "e1a2b3c4-0003-4000-8000-000000000003",
    slug: "12-can-heart-wall-art",
    title: "12-Can Heart Wall Art",
    tagline: "Symmetric geometric wall heart relief built from 12 pristine cans.",
    description:
      "A striking geometric heart wall installation composed of twelve sanitized energy-drink cans mounted in stepped relief. Accented with raw silver and metallic highlights that shimmer under directional spotlighting. Pre-fitted with rear architectural mounting brackets for seamless hanging. Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.",
    category: "hearts",
    cans_count: 12,
    price_paise: 199900, // Rs 1,999
    stock_count: 4,
    is_made_to_order: false,
    lead_time_days: 2,
    dimensions_cm: { width: 42, height: 40, depth: 7 },
    weight_grams: 680,
    materials: [
      "Cleaned Aluminum Energy-Drink Cans",
      "Industrial Rivets",
      "Structural Polymer Bonding",
    ],
    in_the_box: [
      "Handcrafted Can Wall Art",
      "Certificate of Authenticity",
      "Wall Anchor & Mounting Hardware",
      "Studio Sticker Pack",
    ],
    is_active: true,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "a0000001-0003-4000-8000-000000000003",
        product_id: "e1a2b3c4-0003-4000-8000-000000000003",
        image_url: "/assets/products/12-can-heart-wall-art-v2.png",
        alt_text: "12-Can Heart Wall Art, handcrafted decorative display piece",
        display_order: 1,
        is_primary: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "e1a2b3c4-0004-4000-8000-000000000004",
    slug: "27-can-heart-wall-art",
    title: "27-Can Heart Wall Art",
    tagline: "Monumental 27-can mosaic heart sculpture in high-contrast stepped relief.",
    description:
      "Our largest statement wall installation. Twenty-seven precision-aligned aluminum cans compose a towering, layered heart silhouette with deep visual depth and subterranean aesthetic impact. Features an integrated rear aluminum subframe for rigid wall balance. Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.",
    category: "hearts",
    cans_count: 27,
    price_paise: 489900, // Rs 4,899
    stock_count: 2,
    is_made_to_order: true,
    lead_time_days: 5,
    dimensions_cm: { width: 75, height: 72, depth: 8 },
    weight_grams: 1650,
    materials: [
      "Cleaned Aluminum Energy-Drink Cans",
      "Industrial Rivets",
      "Reinforced Aluminum Subframe",
    ],
    in_the_box: [
      "Monumental Can Heart Installation",
      "Certificate of Authenticity",
      "Heavy-Duty Wall Mounting Kit",
      "Care & Cleaning Instructions",
      "Studio Sticker Pack",
    ],
    is_active: true,
    display_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "a0000001-0004-4000-8000-000000000004",
        product_id: "e1a2b3c4-0004-4000-8000-000000000004",
        image_url: "/assets/products/27-can-heart-wall-art-v2.png",
        alt_text: "27-Can Heart Wall Art, handcrafted decorative display piece",
        display_order: 1,
        is_primary: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "e1a2b3c4-0005-4000-8000-000000000005",
    slug: "30-can-guitar-wall-art",
    title: "30-Can Guitar Wall Art",
    tagline: "Guitar-shaped wall sculpture built from 30 cans.",
    description: "Guitar-shaped wall sculpture built from 30 cans.",
    category: "Wall Art",
    cans_count: 30,
    price_paise: 429900, // Rs 4,299
    stock_count: 5,
    is_made_to_order: false,
    lead_time_days: 3,
    dimensions_cm: { width: 0, height: 0, depth: 0 },
    weight_grams: 0,
    materials: [],
    in_the_box: [],
    is_active: true,
    display_order: 5,
    custom_chip: "30 CANS",
    card_tagline: "HANDCRAFTED DECOR PIECE",
    safety_notice: "Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.",
    object_position: "center 28%",
    is_portrait: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "a0000001-0005-4000-8000-000000000005",
        product_id: "e1a2b3c4-0005-4000-8000-000000000005",
        image_url: "/assets/products/30-can-guitar-wall-art-v1.png",
        alt_text: "30-Can Guitar Wall Art, handcrafted guitar-shaped wall sculpture made from 30 empty cans",
        display_order: 1,
        is_primary: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "e1a2b3c4-0006-4000-8000-000000000006",
    slug: "11-can-bow-wall-art",
    title: "11-Can Bow Wall Art",
    tagline: "Ribbon-bow wall piece built from 11 cans.",
    description: "Ribbon-bow wall piece built from 11 cans.",
    category: "Wall Art",
    cans_count: 11,
    price_paise: 179900, // Rs 1,799
    stock_count: 5,
    is_made_to_order: false,
    lead_time_days: 3,
    dimensions_cm: { width: 0, height: 0, depth: 0 },
    weight_grams: 0,
    materials: [],
    in_the_box: [],
    is_active: true,
    display_order: 6,
    custom_chip: "11 CANS",
    card_tagline: "HANDCRAFTED DECOR PIECE",
    safety_notice: "Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.",
    object_position: "center 50%",
    is_portrait: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "a0000001-0006-4000-8000-000000000006",
        product_id: "e1a2b3c4-0006-4000-8000-000000000006",
        image_url: "/assets/products/11-can-bow-wall-art-v1.png",
        alt_text: "11-Can Bow Wall Art, handcrafted ribbon-bow wall piece made from 11 empty cans",
        display_order: 1,
        is_primary: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "e1a2b3c4-0007-4000-8000-000000000007",
    slug: "can-desk-station",
    title: "Can Desk Station",
    tagline: "Pen and desk organiser crafted from a single can.",
    description: "Pen and desk organiser crafted from a single can.",
    category: "Desk & Decor",
    cans_count: 1,
    price_paise: 34900, // Rs 349
    stock_count: 5,
    is_made_to_order: false,
    lead_time_days: 2,
    dimensions_cm: { width: 0, height: 0, depth: 0 },
    weight_grams: 0,
    materials: [],
    in_the_box: [],
    is_active: true,
    display_order: 7,
    custom_chip: "1 CAN",
    card_tagline: "HANDCRAFTED DECOR PIECE",
    safety_notice: "Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.",
    object_position: "center 50%",
    is_portrait: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "a0000001-0007-4000-8000-000000000007",
        product_id: "e1a2b3c4-0007-4000-8000-000000000007",
        image_url: "/assets/products/can-desk-station-v1.png",
        alt_text: "Can Desk Station, handcrafted pen and desk organizer made from a single empty can",
        display_order: 1,
        is_primary: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "e1a2b3c4-0008-4000-8000-000000000008",
    slug: "can-candle-diwali-special",
    title: "Can Candle - Diwali Special",
    tagline: "Decorative hand-poured candle crafted in custom repurposed cans.",
    description: "Decorative hand-poured candle crafted in custom repurposed cans.",
    category: "Desk & Decor",
    tag: "Diwali Special",
    tags: ["Diwali Special"],
    cans_count: 1,
    price_paise: 17900, // Rs 179 base
    stock_count: 5,
    is_made_to_order: false,
    lead_time_days: 2,
    dimensions_cm: { width: 0, height: 0, depth: 0 },
    weight_grams: 0,
    materials: [],
    in_the_box: [],
    is_active: true,
    display_order: 8,
    custom_badge: "DIWALI SPECIAL",
    custom_chip: "1 OR 4 CANS",
    price_prefix: "From ",
    card_tagline: "HANDCRAFTED DECOR PIECE",
    safety_notice: "Burn on a flat, heat-safe surface. Never leave a burning candle unattended. Keep away from children and pets.",
    object_position: "center 55%",
    is_portrait: false,
    variants: [
      {
        id: "v0000001-0008-4000-8000-000000000001",
        product_id: "e1a2b3c4-0008-4000-8000-000000000008",
        label: "Single can",
        price_paise: 17900,
        stock: 5,
        sort: 1,
        options: ["Violet", "Black", "Rose", "Teal"],
        description_note: "Select design option (Violet, Black, Rose, Teal, subject to availability).",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "v0000001-0008-4000-8000-000000000002",
        product_id: "e1a2b3c4-0008-4000-8000-000000000008",
        label: "Pack of 4",
        price_paise: 54900,
        stock: 5,
        sort: 2,
        options: ["One of each colour (Violet, Black, Rose, Teal) as pictured"],
        description_note: "Save Rs 167 compared to 4 singles",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "a0000001-0008-4000-8000-000000000008",
        product_id: "e1a2b3c4-0008-4000-8000-000000000008",
        image_url: "/assets/products/can-candle-diwali-special-v1.png",
        alt_text: "Can Candle - Diwali Special, handcrafted decorative can candles in four colors",
        display_order: 1,
        is_primary: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "e1a2b3c4-0009-4000-8000-000000000009",
    slug: "24-can-spider-wall-art",
    title: "24-Can Spider Wall Art",
    tagline: "Eight-legged wall sculpture built from 24 cans.",
    description: "Eight-legged wall sculpture built from 24 cans.",
    category: "Wall Art",
    cans_count: 24,
    price_paise: 359900, // Rs 3,599
    stock_count: 5,
    is_made_to_order: false,
    lead_time_days: 3,
    dimensions_cm: { width: 0, height: 0, depth: 0 },
    weight_grams: 0,
    materials: [],
    in_the_box: [],
    is_active: true,
    display_order: 9,
    custom_chip: "24 CANS",
    card_tagline: "HANDCRAFTED DECOR PIECE",
    safety_notice: "Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.",
    object_position: "center 38%",
    is_portrait: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [
      {
        id: "a0000001-0009-4000-8000-000000000009",
        product_id: "e1a2b3c4-0009-4000-8000-000000000009",
        image_url: "/assets/products/24-can-spider-wall-art-v1.png",
        alt_text: "24-Can Spider Wall Art, handcrafted eight-legged wall sculpture made from 24 empty cans",
        display_order: 1,
        is_primary: true,
        created_at: new Date().toISOString(),
      },
    ],
  },
];

function attachFallbackImages(product: Product): Product {
  const imageUrl = getProductImageUrl(product.slug);
  const altText = getProductAltText(product.slug, product.title);
  const fallback = initialProductsFallback.find((p) => p.slug === product.slug);

  let updatedImages = product.images;
  if (product.images && product.images.length > 0) {
    updatedImages = product.images.map((img) => ({
      ...img,
      image_url: img.image_url?.endsWith(".jpg") ? imageUrl : img.image_url,
      alt_text: img.image_url?.endsWith(".jpg") ? altText : img.alt_text,
    }));
  } else {
    updatedImages = [
      {
        id: `img-fallback-${product.id}`,
        product_id: product.id,
        image_url: imageUrl,
        alt_text: altText,
        display_order: 1,
        is_primary: true,
        created_at: product.created_at || new Date().toISOString(),
      },
    ];
  }

  return {
    ...product,
    images: updatedImages,
    variants: product.variants && product.variants.length > 0 ? product.variants : fallback?.variants,
    custom_badge: product.custom_badge || fallback?.custom_badge,
    custom_chip: product.custom_chip || fallback?.custom_chip,
    card_tagline: product.card_tagline || fallback?.card_tagline,
    safety_notice: product.safety_notice || fallback?.safety_notice,
    object_position: product.object_position || fallback?.object_position,
    is_portrait: product.is_portrait ?? fallback?.is_portrait,
    price_prefix: product.price_prefix || fallback?.price_prefix,
    tag: product.tag || fallback?.tag,
    tags: product.tags && product.tags.length > 0 ? product.tags : fallback?.tags,
  };
}

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(*), variants:product_variants(*)")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return initialProductsFallback;
    }

    return (data as unknown as Product[]).map(attachFallbackImages);
  } catch {
    return initialProductsFallback;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(*), variants:product_variants(*)")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      const fallback = initialProductsFallback.find((p) => p.slug === slug);
      return fallback ? attachFallbackImages(fallback) : null;
    }

    return attachFallbackImages(data as unknown as Product);
  } catch {
    const fallback = initialProductsFallback.find((p) => p.slug === slug);
    return fallback ? attachFallbackImages(fallback) : null;
  }
}
