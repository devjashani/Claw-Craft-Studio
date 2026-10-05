-- ==============================================================================
-- CLAWCRAFT INITIAL SEED DATA
-- Initial 4 Products & Default Site Settings
-- ==============================================================================

-- 1. Insert Initial 4 Products (Prices in integer paise)
insert into public.products (
  id,
  slug,
  title,
  tagline,
  description,
  category,
  cans_count,
  price_paise,
  stock_count,
  is_made_to_order,
  lead_time_days,
  dimensions_cm,
  weight_grams,
  is_active,
  display_order
) values
(
  'e1a2b3c4-0001-4000-8000-000000000001',
  '8-can-gun-sculpture',
  '8-Can Gun Sculpture',
  'Compact handheld architectural silhouette forged from 8 reclaimed cans.',
  'An aggressive, compact display sculpture crafted from eight sanitized and precision-scored energy-drink aluminum cans. Features reinforced internal polymer stabilization and hand-riveted joints. Finished with clean edge bevels for a striking dark gothic desktop centerpiece. Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.',
  'sculptures',
  8,
  129900, -- Rs 1,299
  5,
  false,
  2,
  '{"width": 38, "height": 22, "depth": 7}'::jsonb,
  450,
  true,
  1
),
(
  'e1a2b3c4-0002-4000-8000-000000000002',
  '14-can-gun-sculpture',
  '14-Can Gun Sculpture',
  'Extended assault silhouette with dual-cylinder stock crafted from 14 cans.',
  'Our flagship heavy display piece. Built from fourteen individually selected, cleaned, and architectural-scored energy-drink cans. Features a layered multi-can barrel assembly, angled magazine grip, and counterweighted stock. Designed for mantle display or gallery wall mounting. Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.',
  'sculptures',
  14,
  229900, -- Rs 2,299
  3,
  false,
  3,
  '{"width": 64, "height": 28, "depth": 8}'::jsonb,
  820,
  true,
  2
),
(
  'e1a2b3c4-0003-4000-8000-000000000003',
  '12-can-heart-wall-art',
  '12-Can Heart Wall Art',
  'Symmetric geometric wall heart relief built from 12 pristine cans.',
  'A striking geometric heart wall installation composed of twelve sanitized energy-drink cans mounted in stepped relief. Accented with raw silver and metallic highlights that shimmer under directional spotlighting. Pre-fitted with rear architectural mounting brackets for seamless hanging. Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.',
  'hearts',
  12,
  199900, -- Rs 1,999
  4,
  false,
  2,
  '{"width": 42, "height": 40, "depth": 7}'::jsonb,
  680,
  true,
  3
),
(
  'e1a2b3c4-0004-4000-8000-000000000004',
  '27-can-heart-wall-art',
  '27-Can Heart Wall Art',
  'Monumental 27-can mosaic heart sculpture in high-contrast stepped relief.',
  'Our largest statement wall installation. Twenty-seven precision-aligned aluminum cans compose a towering, layered heart silhouette with deep visual depth and subterranean aesthetic impact. Features an integrated rear aluminum subframe for rigid wall balance. Handcrafted decorative display piece made from cleaned, empty cans. Not a toy. Not a weapon. Not for children.',
  'hearts',
  27,
  489900, -- Rs 4,899
  2,
  true,
  5,
  '{"width": 75, "height": 72, "depth": 8}'::jsonb,
  1650,
  true,
  4
)
on conflict (id) do nothing;

-- 2. Insert Default Site Settings
insert into public.site_settings (key, value, description)
values
  ('shipping_flat_rate_paise', '14900'::jsonb, 'Default flat shipping rate in paise (Rs 149)'),
  ('free_shipping_threshold_paise', '299900'::jsonb, 'Order total threshold for free shipping (Rs 2,999)'),
  ('cod_enabled', 'false'::jsonb, 'Cash on Delivery toggle (default disabled)'),
  ('announcement_text', '"LIMITED DROP: HANDCRAFTED RECYCLED CAN SCULPTURES • PAN-INDIA SHIPPING"'::jsonb, 'Header marquee announcement'),
  ('support_phone', '"919876543210"'::jsonb, 'Studio support WhatsApp/Call number'),
  ('support_email', '"studio@clawcraft.in"'::jsonb, 'Studio customer service email')
on conflict (key) do update set value = excluded.value;

-- 3. Insert Initial Welcome Coupon
insert into public.coupons (
  id,
  code,
  discount_type,
  discount_value,
  min_order_paise,
  usage_limit,
  is_active
) values (
  'c1a2b3c4-0001-4000-8000-000000000001',
  'CLAW10',
  'percentage',
  10, -- 10% off
  100000, -- Min Rs 1,000
  100,
  true
)
on conflict (code) do nothing;

-- 4. Insert Primary Product Images (v2 High Quality Assets)
insert into public.product_images (
  id,
  product_id,
  image_url,
  alt_text,
  display_order,
  is_primary
)
select
  'a0000001-0001-4000-8000-000000000001'::uuid,
  id,
  '/assets/products/8-can-gun-sculpture-v2.png',
  '8-Can Gun Sculpture, handcrafted decorative display piece',
  1,
  true
from public.products where slug = '8-can-gun-sculpture'
on conflict (id) do update set
  product_id = excluded.product_id,
  image_url = excluded.image_url,
  alt_text = excluded.alt_text,
  display_order = excluded.display_order,
  is_primary = excluded.is_primary;

insert into public.product_images (
  id,
  product_id,
  image_url,
  alt_text,
  display_order,
  is_primary
)
select
  'a0000001-0002-4000-8000-000000000002'::uuid,
  id,
  '/assets/products/14-can-gun-sculpture-v2.png',
  '14-Can Gun Sculpture, handcrafted decorative display piece',
  1,
  true
from public.products where slug = '14-can-gun-sculpture'
on conflict (id) do update set
  product_id = excluded.product_id,
  image_url = excluded.image_url,
  alt_text = excluded.alt_text,
  display_order = excluded.display_order,
  is_primary = excluded.is_primary;

insert into public.product_images (
  id,
  product_id,
  image_url,
  alt_text,
  display_order,
  is_primary
)
select
  'a0000001-0003-4000-8000-000000000003'::uuid,
  id,
  '/assets/products/12-can-heart-wall-art-v2.png',
  '12-Can Heart Wall Art, handcrafted decorative display piece',
  1,
  true
from public.products where slug = '12-can-heart-wall-art'
on conflict (id) do update set
  product_id = excluded.product_id,
  image_url = excluded.image_url,
  alt_text = excluded.alt_text,
  display_order = excluded.display_order,
  is_primary = excluded.is_primary;

insert into public.product_images (
  id,
  product_id,
  image_url,
  alt_text,
  display_order,
  is_primary
)
select
  'a0000001-0004-4000-8000-000000000004'::uuid,
  id,
  '/assets/products/27-can-heart-wall-art-v2.png',
  '27-Can Heart Wall Art, handcrafted decorative display piece',
  1,
  true
from public.products where slug = '27-can-heart-wall-art'
on conflict (id) do update set
  product_id = excluded.product_id,
  image_url = excluded.image_url,
  alt_text = excluded.alt_text,
  display_order = excluded.display_order,
  is_primary = excluded.is_primary;

-- 5 New Products Seed Data
insert into public.products (
  id,
  slug,
  title,
  tagline,
  description,
  category,
  cans_count,
  price_paise,
  stock_count,
  is_made_to_order,
  lead_time_days,
  dimensions_cm,
  weight_grams,
  is_active,
  display_order
) values
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
  5
),
(
  'e1a2b3c4-0006-4000-8000-000000000006',
  '11-can-bow-wall-art',
  '11-Can Bow Wall Art',
  'HANDCRAFTED DECOR PIECE',
  'Ribbon-bow wall piece built from 11 cans. Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.',
  'Wall Art',
  11,
  179900,
  5,
  false,
  3,
  '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  0,
  true,
  6
),
(
  'e1a2b3c4-0007-4000-8000-000000000007',
  'can-desk-station',
  'Can Desk Station',
  'HANDCRAFTED DECOR PIECE',
  'Pen and desk organiser crafted from a single can. Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.',
  'Desk & Decor',
  1,
  34900,
  5,
  false,
  2,
  '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  0,
  true,
  7
),
(
  'e1a2b3c4-0008-4000-8000-000000000008',
  'can-candle-diwali-special',
  'Can Candle - Diwali Special',
  'HANDCRAFTED DECOR PIECE',
  'Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.',
  'Desk & Decor',
  1,
  17900,
  5,
  false,
  2,
  '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  0,
  true,
  8
),
(
  'e1a2b3c4-0009-4000-8000-000000000009',
  '24-can-spider-wall-art',
  '24-Can Spider Wall Art',
  'HANDCRAFTED DECOR PIECE',
  'Eight-legged wall sculpture built from 24 cans. Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.',
  'Wall Art',
  24,
  359900,
  5,
  false,
  4,
  '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  0,
  true,
  9
)
on conflict (slug) do update set
  title = excluded.title,
  tagline = excluded.tagline,
  description = excluded.description,
  category = excluded.category,
  cans_count = excluded.cans_count,
  price_paise = excluded.price_paise,
  stock_count = excluded.stock_count;

-- Seed Images for 5 New Products
insert into public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
select
  'a0000001-0005-4000-8000-000000000005'::uuid,
  id,
  '/assets/products/30-can-guitar-wall-art-v1.webp',
  'Handcrafted electric guitar wall sculpture constructed from thirty cleaned energy drink cans with decorative back illumination',
  1,
  true
from public.products where slug = '30-can-guitar-wall-art'
on conflict (id) do update set image_url = excluded.image_url, alt_text = excluded.alt_text;

insert into public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
select
  'a0000001-0006-4000-8000-000000000006'::uuid,
  id,
  '/assets/products/11-can-bow-wall-art-v1.webp',
  'Handcrafted ribbon bow wall art assembled from eleven cleaned pink energy drink cans',
  1,
  true
from public.products where slug = '11-can-bow-wall-art'
on conflict (id) do update set image_url = excluded.image_url, alt_text = excluded.alt_text;

insert into public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
select
  'a0000001-0007-4000-8000-000000000007'::uuid,
  id,
  '/assets/products/can-desk-station-v1.webp',
  'Handcrafted desk organiser and pen holder created from a single cleaned textured white energy drink can with sculpted rim',
  1,
  true
from public.products where slug = 'can-desk-station'
on conflict (id) do update set image_url = excluded.image_url, alt_text = excluded.alt_text;

insert into public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
select
  'a0000001-0008-4000-8000-000000000008'::uuid,
  id,
  '/assets/products/can-candle-diwali-special-v1.webp',
  'Set of four decorative candles set inside repurposed cut energy drink cans in metallic purple, black, pink, and teal colours',
  1,
  true
from public.products where slug = 'can-candle-diwali-special'
on conflict (id) do update set image_url = excluded.image_url, alt_text = excluded.alt_text;

insert into public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
select
  'a0000001-0009-4000-8000-000000000009'::uuid,
  id,
  '/assets/products/24-can-spider-wall-art-v1.webp',
  'Handcrafted corner wall sculpture in the shape of an eight-legged spider constructed from twenty-four cleaned colourful energy drink cans',
  1,
  true
from public.products where slug = '24-can-spider-wall-art'
on conflict (id) do update set image_url = excluded.image_url, alt_text = excluded.alt_text;

-- Seed Variants for Candle
insert into public.product_variants (id, product_id, label, price_paise, stock, sort_order, options)
select
  'c0000001-0001-4000-8000-000000000001'::uuid,
  id,
  'Single can',
  17900,
  5,
  1,
  array['Violet', 'Black', 'Rose', 'Teal']
from public.products where slug = 'can-candle-diwali-special'
on conflict (id) do update set label = excluded.label, price_paise = excluded.price_paise, stock = excluded.stock;

insert into public.product_variants (id, product_id, label, price_paise, stock, sort_order, options)
select
  'c0000001-0002-4000-8000-000000000002'::uuid,
  id,
  'Pack of 4',
  54900,
  5,
  2,
  array['One of each colour (Violet, Black, Rose, Teal)']
from public.products where slug = 'can-candle-diwali-special'
on conflict (id) do update set label = excluded.label, price_paise = excluded.price_paise, stock = excluded.stock;


