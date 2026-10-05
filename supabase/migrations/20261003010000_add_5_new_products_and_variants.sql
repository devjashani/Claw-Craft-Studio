-- ==============================================================================
-- CLAWCRAFT MIGRATION: ADD 5 NEW PRODUCTS AND VARIANT SUPPORT
-- Migration: 20261003010000_add_5_new_products_and_variants.sql
-- Idempotent script for Supabase SQL Editor
-- ==============================================================================

-- 1. Create product_variants table if not exists
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  price_paise bigint not null check (price_paise > 0),
  stock integer not null default 0 check (stock >= 0),
  sort_order integer not null default 1,
  options text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_variants_product on public.product_variants(product_id);

-- Enable RLS on product_variants
alter table public.product_variants enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'product_variants' and policyname = 'Public can view active product variants'
  ) then
    create policy "Public can view active product variants"
      on public.product_variants for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'product_variants' and policyname = 'Admin full access to product variants'
  ) then
    create policy "Admin full access to product variants"
      on public.product_variants for all
      using (auth.role() = 'authenticated' or auth.role() = 'service_role');
  end if;
end $$;

-- 2. Extend products table with storefront metadata fields
alter table public.products add column if not exists is_new boolean not null default false;
alter table public.products add column if not exists tags text[] not null default array[]::text[];
alter table public.products add column if not exists badge text;
alter table public.products add column if not exists chip text;
alter table public.products add column if not exists price_prefix text;
alter table public.products add column if not exists safety_notice text;

-- 3. Extend order_items table for variant tracking
alter table public.order_items add column if not exists variant_id uuid references public.product_variants(id) on delete set null;
alter table public.order_items add column if not exists variant_label text;
alter table public.order_items add column if not exists selected_option text;

-- 4. Upsert the 5 New Products into public.products
-- Product 1: 30-Can Guitar Wall Art
insert into public.products (
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
  materials,
  in_the_box,
  is_active,
  display_order,
  is_new,
  chip
) values (
  '30-can-guitar-wall-art',
  '30-Can Guitar Wall Art',
  'HANDCRAFTED DECOR PIECE',
  'Guitar-shaped wall sculpture built from 30 cans. Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.',
  'Wall Art',
  30,
  429900,
  null,
  5,
  false,
  4,
  '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  0,
  array[]::text[],
  array['Handcrafted Can Sculpture', 'Certificate of Authenticity', 'Mounting Hardware Kit', 'Studio Sticker Pack'],
  true,
  5,
  true,
  '30 CANS'
)
on conflict (slug) do update set
  title = excluded.title,
  tagline = excluded.tagline,
  description = excluded.description,
  category = excluded.category,
  cans_count = excluded.cans_count,
  price_paise = excluded.price_paise,
  stock_count = excluded.stock_count,
  is_new = excluded.is_new,
  chip = excluded.chip,
  updated_at = now();

-- Product 2: 11-Can Bow Wall Art
insert into public.products (
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
  materials,
  in_the_box,
  is_active,
  display_order,
  is_new,
  chip
) values (
  '11-can-bow-wall-art',
  '11-Can Bow Wall Art',
  'HANDCRAFTED DECOR PIECE',
  'Ribbon-bow wall piece built from 11 cans. Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.',
  'Wall Art',
  11,
  179900,
  null,
  5,
  false,
  3,
  '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  0,
  array[]::text[],
  array['Handcrafted Can Sculpture', 'Certificate of Authenticity', 'Mounting Hardware Kit', 'Studio Sticker Pack'],
  true,
  6,
  true,
  '11 CANS'
)
on conflict (slug) do update set
  title = excluded.title,
  tagline = excluded.tagline,
  description = excluded.description,
  category = excluded.category,
  cans_count = excluded.cans_count,
  price_paise = excluded.price_paise,
  stock_count = excluded.stock_count,
  is_new = excluded.is_new,
  chip = excluded.chip,
  updated_at = now();

-- Product 3: Can Desk Station
insert into public.products (
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
  materials,
  in_the_box,
  is_active,
  display_order,
  is_new,
  chip
) values (
  'can-desk-station',
  'Can Desk Station',
  'HANDCRAFTED DECOR PIECE',
  'Pen and desk organiser crafted from a single can. Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.',
  'Desk & Decor',
  1,
  34900,
  null,
  5,
  false,
  2,
  '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  0,
  array[]::text[],
  array['Handcrafted Can Desk Organiser', 'Studio Sticker Pack'],
  true,
  7,
  true,
  '1 CAN'
)
on conflict (slug) do update set
  title = excluded.title,
  tagline = excluded.tagline,
  description = excluded.description,
  category = excluded.category,
  cans_count = excluded.cans_count,
  price_paise = excluded.price_paise,
  stock_count = excluded.stock_count,
  is_new = excluded.is_new,
  chip = excluded.chip,
  updated_at = now();

-- Product 4: Can Candle - Diwali Special
insert into public.products (
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
  materials,
  in_the_box,
  is_active,
  display_order,
  is_new,
  badge,
  chip,
  price_prefix,
  tags,
  safety_notice
) values (
  'can-candle-diwali-special',
  'Can Candle - Diwali Special',
  'HANDCRAFTED DECOR PIECE',
  'Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.',
  'Desk & Decor',
  1,
  17900,
  null,
  5,
  false,
  2,
  '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  0,
  array[]::text[],
  array['Handcrafted Can Candle', 'Studio Sticker Pack'],
  true,
  8,
  true,
  'DIWALI SPECIAL',
  '1 OR 4 CANS',
  'From',
  array['Diwali Special'],
  'Burn on a flat, heat-safe surface. Never leave a burning candle unattended. Keep away from children and pets.'
)
on conflict (slug) do update set
  title = excluded.title,
  tagline = excluded.tagline,
  description = excluded.description,
  category = excluded.category,
  cans_count = excluded.cans_count,
  price_paise = excluded.price_paise,
  stock_count = excluded.stock_count,
  is_new = excluded.is_new,
  badge = excluded.badge,
  chip = excluded.chip,
  price_prefix = excluded.price_prefix,
  tags = excluded.tags,
  safety_notice = excluded.safety_notice,
  updated_at = now();

-- Product 5: 24-Can Spider Wall Art
insert into public.products (
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
  materials,
  in_the_box,
  is_active,
  display_order,
  is_new,
  chip
) values (
  '24-can-spider-wall-art',
  '24-Can Spider Wall Art',
  'HANDCRAFTED DECOR PIECE',
  'Eight-legged wall sculpture built from 24 cans. Handcrafted decorative piece made from cleaned, empty cans. Not a toy. Not for children.',
  'Wall Art',
  24,
  359900,
  null,
  5,
  false,
  4,
  '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  0,
  array[]::text[],
  array['Handcrafted Can Sculpture', 'Certificate of Authenticity', 'Corner Mounting Hardware Kit', 'Studio Sticker Pack'],
  true,
  9,
  true,
  '24 CANS'
)
on conflict (slug) do update set
  title = excluded.title,
  tagline = excluded.tagline,
  description = excluded.description,
  category = excluded.category,
  cans_count = excluded.cans_count,
  price_paise = excluded.price_paise,
  stock_count = excluded.stock_count,
  is_new = excluded.is_new,
  chip = excluded.chip,
  updated_at = now();

-- 5. Insert Images by looking up product IDs by slug
delete from public.product_images where product_id in (
  select id from public.products where slug in (
    '30-can-guitar-wall-art',
    '11-can-bow-wall-art',
    'can-desk-station',
    'can-candle-diwali-special',
    '24-can-spider-wall-art'
  )
);

insert into public.product_images (product_id, image_url, alt_text, display_order, is_primary)
select
  p.id,
  '/assets/products/30-can-guitar-wall-art-v1.webp',
  'Handcrafted electric guitar wall sculpture constructed from thirty cleaned energy drink cans with decorative back illumination',
  1,
  true
from public.products p where p.slug = '30-can-guitar-wall-art';

insert into public.product_images (product_id, image_url, alt_text, display_order, is_primary)
select
  p.id,
  '/assets/products/11-can-bow-wall-art-v1.webp',
  'Handcrafted ribbon bow wall art assembled from eleven cleaned pink energy drink cans',
  1,
  true
from public.products p where p.slug = '11-can-bow-wall-art';

insert into public.product_images (product_id, image_url, alt_text, display_order, is_primary)
select
  p.id,
  '/assets/products/can-desk-station-v1.webp',
  'Handcrafted desk organiser and pen holder created from a single cleaned textured white energy drink can with sculpted rim',
  1,
  true
from public.products p where p.slug = 'can-desk-station';

insert into public.product_images (product_id, image_url, alt_text, display_order, is_primary)
select
  p.id,
  '/assets/products/can-candle-diwali-special-v1.webp',
  'Set of four decorative candles set inside repurposed cut energy drink cans in metallic purple, black, pink, and teal colours',
  1,
  true
from public.products p where p.slug = 'can-candle-diwali-special';

insert into public.product_images (product_id, image_url, alt_text, display_order, is_primary)
select
  p.id,
  '/assets/products/24-can-spider-wall-art-v1.webp',
  'Handcrafted corner wall sculpture in the shape of an eight-legged spider constructed from twenty-four cleaned colourful energy drink cans',
  1,
  true
from public.products p where p.slug = '24-can-spider-wall-art';

-- 6. Insert Candle Variants by looking up product ID by slug
delete from public.product_variants where product_id in (
  select id from public.products where slug = 'can-candle-diwali-special'
);

insert into public.product_variants (product_id, label, price_paise, stock, sort_order, options)
select
  p.id,
  'Single can',
  17900,
  5,
  1,
  array['Violet', 'Black', 'Rose', 'Teal']
from public.products p where p.slug = 'can-candle-diwali-special';

insert into public.product_variants (product_id, label, price_paise, stock, sort_order, options)
select
  p.id,
  'Pack of 4',
  54900,
  5,
  2,
  array['One of each colour (Violet, Black, Rose, Teal)']
from public.products p where p.slug = 'can-candle-diwali-special';
