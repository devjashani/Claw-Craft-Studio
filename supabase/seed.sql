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
  compare_at_price_paise,
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
  159900, -- Rs 1,599 compare price
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
  279900, -- Rs 2,799 compare price
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
  249900, -- Rs 2,499 compare price
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
  599900, -- Rs 5,999 compare price
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
