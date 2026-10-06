-- ==============================================================================
-- CLAWCRAFT COMPLETE ALL-IN-ONE SUPABASE DATABASE SETUP
-- File: supabase/COMPLETE_SUPABASE_SETUP.sql
-- Instructions: Copy and run this entire script in Supabase SQL Editor.
-- It is completely IDEMPOTENT (safe to run on fresh or existing databases).
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending_payment',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE coupon_discount_type AS ENUM (
    'percentage',
    'flat'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE custom_request_status AS ENUM (
    'new',
    'reviewed',
    'in_discussion',
    'accepted',
    'declined'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'sculptures',
  cans_count INTEGER NOT NULL CHECK (cans_count > 0),
  price_paise BIGINT NOT NULL CHECK (price_paise > 0),
  stock_count INTEGER NOT NULL DEFAULT 5 CHECK (stock_count >= 0),
  is_made_to_order BOOLEAN NOT NULL DEFAULT false,
  lead_time_days INTEGER NOT NULL DEFAULT 3,
  dimensions_cm JSONB NOT NULL DEFAULT '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  weight_grams INTEGER NOT NULL DEFAULT 500,
  materials TEXT[] NOT NULL DEFAULT ARRAY['Cleaned Aluminum Energy-Drink Cans', 'Industrial Rivets', 'Structural Polymer Bonding'],
  in_the_box TEXT[] NOT NULL DEFAULT ARRAY['Handcrafted Can Sculpture', 'Certificate of Authenticity', 'Display Stand or Mounting Kit', 'Studio Sticker Pack'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::text[],
  custom_badge TEXT,
  custom_chip TEXT,
  card_tagline TEXT,
  safety_notice TEXT,
  object_position TEXT,
  is_portrait BOOLEAN DEFAULT false,
  price_prefix TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all metadata columns exist on products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS custom_badge TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS custom_chip TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS card_tagline TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS safety_notice TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS object_position TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_portrait BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_prefix TEXT;

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- 4. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);

-- 5. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price_paise BIGINT NOT NULL CHECK (price_paise > 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sort_order INTEGER NOT NULL DEFAULT 1,
  options TEXT[],
  description_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);

-- 6. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type coupon_discount_type NOT NULL DEFAULT 'percentage',
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  min_order_paise BIGINT NOT NULL DEFAULT 0,
  max_discount_paise BIGINT,
  usage_limit INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- 7. SEQUENTIAL ORDER NUMBER SEQUENCE & GENERATOR
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  next_val BIGINT;
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    next_val := NEXTVAL('order_number_seq');
    NEW.order_number := 'CC-' || current_year || '-' || LPAD(next_val::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  status order_status NOT NULL DEFAULT 'pending_payment',
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address_line1 TEXT NOT NULL,
  shipping_address_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_pincode TEXT NOT NULL,
  subtotal_paise BIGINT NOT NULL,
  discount_paise BIGINT NOT NULL DEFAULT 0,
  shipping_fee_paise BIGINT NOT NULL DEFAULT 0,
  total_paise BIGINT NOT NULL,
  coupon_id UUID REFERENCES public.coupons(id),
  payment_method TEXT NOT NULL DEFAULT 'upi',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  courier_name TEXT,
  tracking_id TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  estimated_delivery_date DATE,
  admin_notes TEXT,
  public_token TEXT,
  payment_status TEXT DEFAULT 'pending_payment',
  payment_meta JSONB DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all order dynamic fields exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS public_token TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending_payment';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'upi';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_meta JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee_paise BIGINT DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_paise BIGINT DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Backfill public_token if missing
UPDATE public.orders
SET public_token = encode(gen_random_bytes(24), 'hex')
WHERE public_token IS NULL OR public_token = '';

-- Attach order_number generator trigger
DROP TRIGGER IF EXISTS trigger_generate_order_number ON public.orders;
CREATE TRIGGER trigger_generate_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_public_token ON public.orders(public_token);

-- 9. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  unit_price_paise BIGINT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price_paise BIGINT NOT NULL,
  image_url TEXT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  variant_label TEXT,
  selected_option TEXT
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS variant_label TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS selected_option TEXT;

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 10. CUSTOM REQUESTS (COMMISSIONS) TABLE
CREATE TABLE IF NOT EXISTS public.custom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  concept_description TEXT NOT NULL,
  preferred_can_types TEXT,
  estimated_size TEXT,
  budget_inr TEXT,
  reference_image_urls TEXT[] NOT NULL DEFAULT '{}',
  status custom_request_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Dynamically drop all existing policies on our public tables so re-running is 100% idempotent
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('products', 'product_images', 'product_variants', 'coupons', 'orders', 'order_items', 'custom_requests', 'site_settings')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Public read permissions
CREATE POLICY "Allow public read on active products"
  ON public.products FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read on product images"
  ON public.product_images FOR SELECT USING (true);

CREATE POLICY "Public can view active product variants"
  ON public.product_variants FOR SELECT USING (true);

CREATE POLICY "Allow public read on site settings"
  ON public.site_settings FOR SELECT USING (true);

-- Authenticated and Service Role Permissions (Full CRUD access)
CREATE POLICY "Allow full access to authenticated admin on products"
  ON public.products FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow full access to authenticated admin on product_images"
  ON public.product_images FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admin full access to product variants"
  ON public.product_variants FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow full access to authenticated admin on coupons"
  ON public.coupons FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow full access to authenticated admin on orders"
  ON public.orders FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow full access to authenticated admin on order_items"
  ON public.order_items FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow full access to authenticated admin on custom_requests"
  ON public.custom_requests FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow full access to authenticated admin on site_settings"
  ON public.site_settings FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');



-- ==============================================================================
-- 13. SEED STOREFRONT PRODUCTS (ALL 9 PRODUCTS WITH REAL NON-DISCOUNTED PRICES)
-- ==============================================================================

INSERT INTO public.products (
  id, slug, title, tagline, description, category, cans_count, price_paise,
  stock_count, is_made_to_order, lead_time_days, dimensions_cm, weight_grams,
  is_active, display_order, custom_chip, card_tagline, safety_notice,
  object_position, is_portrait, price_prefix, tags
) VALUES
(
  'e1a2b3c4-0001-4000-8000-000000000001',
  '8-can-gun-sculpture',
  '8-Can Gun Sculpture',
  'Compact handheld architectural silhouette forged from 8 reclaimed cans.',
  'An aggressive, compact display sculpture crafted from eight sanitized and precision-scored energy-drink aluminum cans. Features reinforced internal polymer stabilization and hand-riveted joints. Finished with clean edge bevels for a striking dark gothic desktop centerpiece. Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.',
  'sculptures',
  8,
  129900,
  5,
  false,
  2,
  '{"width": 38, "height": 22, "depth": 7}'::jsonb,
  450,
  true,
  1,
  '8 CANS',
  'HANDCRAFTED DECOR PIECE',
  'Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.',
  'center',
  false,
  null,
  ARRAY[]::text[]
),
(
  'e1a2b3c4-0002-4000-8000-000000000002',
  '14-can-gun-sculpture',
  '14-Can Gun Sculpture',
  'Extended assault silhouette with dual-cylinder stock crafted from 14 cans.',
  'Our flagship heavy display piece. Built from fourteen individually selected, cleaned, and architectural-scored energy-drink cans. Features a layered multi-can barrel assembly, angled magazine grip, and counterweighted stock. Designed for mantle display or gallery wall mounting. Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.',
  'sculptures',
  14,
  229900,
  3,
  false,
  3,
  '{"width": 64, "height": 28, "depth": 8}'::jsonb,
  820,
  true,
  2,
  '14 CANS',
  'HANDCRAFTED DECOR PIECE',
  'Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.',
  'center',
  false,
  null,
  ARRAY[]::text[]
),
(
  'e1a2b3c4-0003-4000-8000-000000000003',
  '12-can-heart-wall-art',
  '12-Can Heart Wall Art',
  'Symmetric geometric wall heart relief built from 12 pristine cans.',
  'A striking geometric heart wall installation composed of twelve sanitized energy-drink cans mounted in stepped relief. Accented with raw silver and metallic highlights that shimmer under directional spotlighting. Pre-fitted with rear architectural mounting brackets for seamless hanging. Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.',
  'hearts',
  12,
  199900,
  4,
  false,
  2,
  '{"width": 42, "height": 40, "depth": 7}'::jsonb,
  680,
  true,
  3,
  '12 CANS',
  'HANDCRAFTED DECOR PIECE',
  'Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.',
  'center',
  false,
  null,
  ARRAY[]::text[]
),
(
  'e1a2b3c4-0004-4000-8000-000000000004',
  '27-can-heart-wall-art',
  '27-Can Heart Wall Art',
  'Monumental 27-can mosaic heart sculpture in high-contrast stepped relief.',
  'Our largest statement wall installation. Twenty-seven precision-aligned aluminum cans compose a towering, layered heart silhouette with deep visual depth and subterranean aesthetic impact. Features an integrated rear aluminum subframe for rigid wall balance. Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.',
  'hearts',
  27,
  489900,
  2,
  true,
  5,
  '{"width": 75, "height": 72, "depth": 8}'::jsonb,
  1650,
  true,
  4,
  '27 CANS',
  'HANDCRAFTED DECOR PIECE',
  'Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.',
  'center',
  false,
  null,
  ARRAY[]::text[]
),
(
  'e1a2b3c4-0005-4000-8000-000000000005',
  '30-can-guitar-wall-art',
  '30-Can Guitar Wall Art',
  'HANDCRAFTED DECOR PIECE',
  'Guitar-shaped wall sculpture built from 30 cans. Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.',
  'Wall Art',
  30,
  429900,
  5,
  false,
  4,
  '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  0,
  true,
  5,
  '30 CANS',
  'HANDCRAFTED DECOR PIECE',
  'Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.',
  'center 28%',
  true,
  null,
  ARRAY[]::text[]
),
(
  'e1a2b3c4-0006-4000-8000-000000000006',
  '11-can-bow-wall-art',
  '11-Can Bow Wall Art',
  'Ribbon-bow wall piece built from 11 cans.',
  'Ribbon-bow wall piece built from 11 cans.',
  'Wall Art',
  11,
  179900,
  5,
  false,
  3,
  '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  0,
  true,
  6,
  '11 CANS',
  'HANDCRAFTED DECOR PIECE',
  'Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.',
  'center 50%',
  false,
  null,
  ARRAY[]::text[]
),
(
  'e1a2b3c4-0007-4000-8000-000000000007',
  'can-desk-station',
  'Can Desk Station',
  'Pen and desk organiser crafted from a single can.',
  'Pen and desk organiser crafted from a single can.',
  'Desk & Decor',
  1,
  34900,
  5,
  false,
  2,
  '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  0,
  true,
  7,
  '1 CAN',
  'HANDCRAFTED DECOR PIECE',
  'Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.',
  'center 50%',
  false,
  null,
  ARRAY[]::text[]
),
(
  'e1a2b3c4-0008-4000-8000-000000000008',
  'can-candle-diwali-special',
  'Can Candle - Diwali Special',
  'Decorative hand-poured candle crafted in custom repurposed cans.',
  'Decorative hand-poured candle crafted in custom repurposed cans.',
  'Desk & Decor',
  1,
  17900,
  5,
  false,
  2,
  '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  0,
  true,
  8,
  '1 OR 4 CANS',
  'HANDCRAFTED DECOR PIECE',
  'Burn on a flat, heat-safe surface. Never leave a burning candle unattended. Keep away from children and pets.',
  'center 55%',
  false,
  'From ',
  ARRAY['Diwali Special']
),
(
  'e1a2b3c4-0009-4000-8000-000000000009',
  '24-can-spider-wall-art',
  '24-Can Spider Wall Art',
  'Eight-legged wall sculpture built from 24 cans.',
  'Eight-legged wall sculpture built from 24 cans.',
  'Wall Art',
  24,
  359900,
  5,
  false,
  3,
  '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  0,
  true,
  9,
  '24 CANS',
  'HANDCRAFTED DECOR PIECE',
  'Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.',
  'center 38%',
  true,
  null,
  ARRAY[]::text[]
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  cans_count = EXCLUDED.cans_count,
  price_paise = EXCLUDED.price_paise,
  stock_count = EXCLUDED.stock_count,
  display_order = EXCLUDED.display_order,
  custom_chip = EXCLUDED.custom_chip,
  card_tagline = EXCLUDED.card_tagline,
  safety_notice = EXCLUDED.safety_notice,
  object_position = EXCLUDED.object_position,
  is_portrait = EXCLUDED.is_portrait,
  price_prefix = EXCLUDED.price_prefix,
  tags = EXCLUDED.tags;

-- ==============================================================================
-- 14. SEED PRODUCT IMAGES (ALL 9 PRODUCTS WITH CLOUDINARY CDN URLS)
-- ==============================================================================

INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0001-4000-8000-000000000001'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791203495/8-can-gun-sculpture-v2.png',
  '8-Can Gun Sculpture, handcrafted decorative display piece',
  1,
  true
FROM public.products WHERE slug = '8-can-gun-sculpture'
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0002-4000-8000-000000000002'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205370/14-can-gun-sculpture-v2.png',
  '14-Can Gun Sculpture, handcrafted decorative display piece',
  1,
  true
FROM public.products WHERE slug = '14-can-gun-sculpture'
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0003-4000-8000-000000000003'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205381/12-can-heart-wall-art-v2.png',
  '12-Can Heart Wall Art, handcrafted decorative display piece',
  1,
  true
FROM public.products WHERE slug = '12-can-heart-wall-art'
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0004-4000-8000-000000000004'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205435/27-can-heart-wall-art-v2.png',
  '27-Can Heart Wall Art, handcrafted decorative display piece',
  1,
  true
FROM public.products WHERE slug = '27-can-heart-wall-art'
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0005-4000-8000-000000000005'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205372/30-can-guitar-wall-art-v1.png',
  '30-Can Guitar Wall Art, handcrafted guitar-shaped wall sculpture made from 30 empty cans',
  1,
  true
FROM public.products WHERE slug = '30-can-guitar-wall-art'
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0006-4000-8000-000000000006'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205372/11-can-bow-wall-art-v1.png',
  '11-Can Bow Wall Art, handcrafted ribbon-bow wall piece made from 11 empty cans',
  1,
  true
FROM public.products WHERE slug = '11-can-bow-wall-art'
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0007-4000-8000-000000000007'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205385/can-desk-station-v1.png',
  'Can Desk Station, handcrafted pen and desk organizer made from a single empty can',
  1,
  true
FROM public.products WHERE slug = 'can-desk-station'
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0008-4000-8000-000000000008'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205439/can-candle-diwali-special-v1.png',
  'Can Candle - Diwali Special, handcrafted decorative can candles in four colors',
  1,
  true
FROM public.products WHERE slug = 'can-candle-diwali-special'
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0009-4000-8000-000000000009'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205379/24-can-spider-wall-art-v1.png',
  '24-Can Spider Wall Art, handcrafted eight-legged wall sculpture made from 24 empty cans',
  1,
  true
FROM public.products WHERE slug = '24-can-spider-wall-art'
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;

-- ==============================================================================
-- 15. SEED CANDLE VARIANTS
-- ==============================================================================

INSERT INTO public.product_variants (id, product_id, label, price_paise, stock, sort_order, options, description_note)
SELECT
  'c0000001-0001-4000-8000-000000000001'::uuid,
  id,
  'Single can',
  17900,
  5,
  1,
  ARRAY['Violet', 'Black', 'Rose', 'Teal'],
  'Select design option (Violet, Black, Rose, Teal, subject to availability).'
FROM public.products WHERE slug = 'can-candle-diwali-special'
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  price_paise = EXCLUDED.price_paise,
  stock = EXCLUDED.stock;

INSERT INTO public.product_variants (id, product_id, label, price_paise, stock, sort_order, options, description_note)
SELECT
  'c0000001-0002-4000-8000-000000000002'::uuid,
  id,
  'Pack of 4',
  54900,
  5,
  2,
  ARRAY['One of each colour (Violet, Black, Rose, Teal) as pictured'],
  null
FROM public.products WHERE slug = 'can-candle-diwali-special'
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  price_paise = EXCLUDED.price_paise,
  stock = EXCLUDED.stock;

-- ==============================================================================
-- 16. SEED DEFAULT COUPON & SITE SETTINGS
-- ==============================================================================

INSERT INTO public.coupons (id, code, discount_type, discount_value, min_order_paise, max_discount_paise, usage_limit, is_active)
VALUES (
  'c1a2b3c4-0001-4000-8000-000000000001',
  'CLAW10',
  'percentage',
  10,
  100000,
  50000,
  100,
  true
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.site_settings (key, value, description)
VALUES
  ('flat_shipping_paise', '14900'::jsonb, 'Flat standard Pan-India shipping in paise (Rs 149)'),
  ('free_shipping_threshold_paise', '299900'::jsonb, 'Free delivery threshold in paise (Rs 2,999)'),
  ('enable_cod', 'false'::jsonb, 'Cash on delivery toggle'),
  ('announcement_bar_enabled', 'true'::jsonb, 'Announcement bar active state'),
  ('announcement_bar_text', '"HANDCRAFTED FROM CLEANED RECYCLED CANS • FREE PAN-INDIA SHIPPING ON ORDERS ABOVE ₹2,999"'::jsonb, 'Header marquee text'),
  ('whatsapp_number', '"919876543210"'::jsonb, 'Studio support phone/WhatsApp'),
  ('admin_notification_email', '"studio@clawcraft.in"'::jsonb, 'Admin alert notification email'),
  ('watermark_text', '"CLAWCRAFT STUDIO"'::jsonb, 'Diagonal receipt watermark text')
ON CONFLICT (key) DO NOTHING;
