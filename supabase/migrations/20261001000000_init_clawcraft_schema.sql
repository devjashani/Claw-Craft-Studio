-- ==============================================================================
-- CLAWCRAFT PRODUCTION DATABASE SCHEMA
-- Migration: 20261001000000_init_clawcraft_schema.sql
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- 1. ENUM TYPES
create type order_status as enum (
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

create type coupon_discount_type as enum (
  'percentage',
  'flat'
);

create type custom_request_status as enum (
  'new',
  'reviewed',
  'in_discussion',
  'accepted',
  'declined'
);

-- 2. PRODUCTS TABLE
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  tagline text not null,
  description text not null,
  category text not null default 'sculptures',
  cans_count integer not null check (cans_count > 0),
  price_paise bigint not null check (price_paise > 0),
  compare_at_price_paise bigint check (compare_at_price_paise is null or compare_at_price_paise >= price_paise),
  stock_count integer not null default 0 check (stock_count >= 0),
  is_made_to_order boolean not null default false,
  lead_time_days integer not null default 3,
  dimensions_cm jsonb not null default '{"width": 0, "height": 0, "depth": 0}'::jsonb,
  weight_grams integer not null default 500,
  materials text[] not null default array['Cleaned Aluminum Energy-Drink Cans', 'Industrial Rivets', 'Structural Polymer Bonding'],
  in_the_box text[] not null default array['Handcrafted Can Sculpture', 'Certificate of Authenticity', 'Display Stand or Mounting Kit', 'Studio Sticker Pack'],
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_slug on public.products(slug);
create index idx_products_active on public.products(is_active);
create index idx_products_category on public.products(category);

-- 3. PRODUCT IMAGES TABLE
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text not null,
  display_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_product_images_product on public.product_images(product_id);

-- 4. COUPONS TABLE
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type coupon_discount_type not null,
  discount_value integer not null check (discount_value > 0),
  min_order_paise bigint not null default 0,
  max_discount_paise bigint,
  usage_limit integer,
  times_used integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_coupons_code on public.coupons(code);

-- 5. ORDERS TABLE
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  status order_status not null default 'pending_payment',
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address_line1 text not null,
  shipping_address_line2 text,
  shipping_city text not null,
  shipping_state text not null,
  shipping_pincode text not null,
  subtotal_paise bigint not null,
  discount_paise bigint not null default 0,
  shipping_fee_paise bigint not null default 0,
  total_paise bigint not null,
  coupon_id uuid references public.coupons(id),
  payment_method text not null default 'razorpay',
  razorpay_order_id text unique,
  razorpay_payment_id text,
  razorpay_signature text,
  courier_name text,
  tracking_number text,
  tracking_url text,
  estimated_delivery_date date,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_status on public.orders(status);
create index idx_orders_lookup on public.orders(order_number, customer_phone);
create index idx_orders_razorpay on public.orders(razorpay_order_id);

-- 6. ORDER ITEMS TABLE
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_title text not null,
  unit_price_paise bigint not null,
  quantity integer not null check (quantity > 0),
  total_price_paise bigint not null,
  image_url text
);

create index idx_order_items_order on public.order_items(order_id);

-- 7. CUSTOM COMMISSIONS TABLE
create table public.custom_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  concept_description text not null,
  preferred_can_types text,
  estimated_size text,
  budget_inr text,
  reference_image_urls text[] not null default '{}',
  status custom_request_status not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now()
);

create index idx_custom_requests_status on public.custom_requests(status);

-- 8. SITE SETTINGS TABLE
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

-- 9. ATOMIC STOCK DECREMENT FUNCTION
create or replace function public.decrement_stock_on_paid_order(target_order_id uuid)
returns void as $$
declare
  item record;
begin
  for item in
    select product_id, quantity
    from public.order_items
    where order_id = target_order_id
  loop
    update public.products
    set stock_count = greatest(0, stock_count - item.quantity),
        updated_at = now()
    where id = item.product_id
      and is_made_to_order = false;
  end loop;
end;
$$ language plpgsql security definer;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.custom_requests enable row level security;
alter table public.site_settings enable row level security;

-- Public read permissions
create policy "Allow public read on active products"
  on public.products for select using (is_active = true);

create policy "Allow public read on product images"
  on public.product_images for select using (true);

create policy "Allow public read on site settings"
  on public.site_settings for select using (true);

-- Authenticated Admin permissions (ALL operations)
create policy "Allow full access to authenticated admin on products"
  on public.products for all using (auth.role() = 'authenticated');

create policy "Allow full access to authenticated admin on product_images"
  on public.product_images for all using (auth.role() = 'authenticated');

create policy "Allow full access to authenticated admin on coupons"
  on public.coupons for all using (auth.role() = 'authenticated');

create policy "Allow full access to authenticated admin on orders"
  on public.orders for all using (auth.role() = 'authenticated');

create policy "Allow full access to authenticated admin on order_items"
  on public.order_items for all using (auth.role() = 'authenticated');

create policy "Allow full access to authenticated admin on custom_requests"
  on public.custom_requests for all using (auth.role() = 'authenticated');

create policy "Allow full access to authenticated admin on site_settings"
  on public.site_settings for all using (auth.role() = 'authenticated');

-- Storage Bucket Setup for Product and Commission Images
insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do nothing;

create policy "Public Access to product media"
  on storage.objects for select
  using (bucket_id = 'product-media');

create policy "Admin upload to product media"
  on storage.objects for insert
  with check (bucket_id = 'product-media' and auth.role() = 'authenticated');
