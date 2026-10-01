import { Product } from "@/types/shop";
import { createClient } from "@/lib/supabase/server";

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
    compare_at_price_paise: 159900,
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
    compare_at_price_paise: 279900,
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
    compare_at_price_paise: 249900,
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
    compare_at_price_paise: 599900,
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
  },
];

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return initialProductsFallback;
    }

    return data as unknown as Product[];
  } catch {
    return initialProductsFallback;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return initialProductsFallback.find((p) => p.slug === slug) || null;
    }

    return data as unknown as Product;
  } catch {
    return initialProductsFallback.find((p) => p.slug === slug) || null;
  }
}
