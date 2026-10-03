-- ==============================================================================
-- CLAWCRAFT MIGRATION: Update Product V2 Images
-- Migration: 20261003000000_update_product_v2_images.sql
-- Description: Replaces old image paths with v2 images and neutral alt text
-- for the 4 core handcrafted can sculpture products.
-- ==============================================================================

-- 1. If products table has an image or image_url column in any environment, update it safely
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'products' and column_name = 'image_url'
  ) then
    update public.products set image_url = '/assets/products/8-can-gun-sculpture-v2.png' where slug = '8-can-gun-sculpture';
    update public.products set image_url = '/assets/products/14-can-gun-sculpture-v2.png' where slug = '14-can-gun-sculpture';
    update public.products set image_url = '/assets/products/12-can-heart-wall-art-v2.png' where slug = '12-can-heart-wall-art';
    update public.products set image_url = '/assets/products/27-can-heart-wall-art-v2.png' where slug = '27-can-heart-wall-art';
  end if;

  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'products' and column_name = 'image'
  ) then
    update public.products set image = '/assets/products/8-can-gun-sculpture-v2.png' where slug = '8-can-gun-sculpture';
    update public.products set image = '/assets/products/14-can-gun-sculpture-v2.png' where slug = '14-can-gun-sculpture';
    update public.products set image = '/assets/products/12-can-heart-wall-art-v2.png' where slug = '12-can-heart-wall-art';
    update public.products set image = '/assets/products/27-can-heart-wall-art-v2.png' where slug = '27-can-heart-wall-art';
  end if;
end $$;

-- 2. Remove any old secondary or duplicate gallery images for these 4 products
delete from public.product_images
where product_id in (
  select id from public.products
  where slug in (
    '8-can-gun-sculpture',
    '14-can-gun-sculpture',
    '12-can-heart-wall-art',
    '27-can-heart-wall-art'
  )
);

-- 3. Insert fresh primary product image records with clean neutral alt text
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
  image_url = excluded.image_url,
  alt_text = excluded.alt_text,
  display_order = excluded.display_order,
  is_primary = excluded.is_primary;
