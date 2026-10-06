-- ==============================================================================
-- MIGRATION: 20261005010000_update_product_images_to_cloudinary.sql
-- DESCRIPTION: Idempotently upsert the 9 product images in public.product_images
--              with their high-resolution Cloudinary CDN URLs.
-- ==============================================================================

-- 1. 8-Can Gun Sculpture
INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0001-4000-8000-000000000001'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791203495/8-can-gun-sculpture-v2.png',
  '8-Can Gun Sculpture, handcrafted decorative display piece',
  1,
  true
FROM public.products WHERE slug = '8-can-gun-sculpture'
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  alt_text = EXCLUDED.alt_text,
  is_primary = true;

-- 2. 14-Can Gun Sculpture
INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0002-4000-8000-000000000002'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205370/14-can-gun-sculpture-v2.png',
  '14-Can Gun Sculpture, handcrafted decorative display piece',
  1,
  true
FROM public.products WHERE slug = '14-can-gun-sculpture'
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  alt_text = EXCLUDED.alt_text,
  is_primary = true;

-- 3. 12-Can Heart Wall Art
INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0003-4000-8000-000000000003'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205381/12-can-heart-wall-art-v2.png',
  '12-Can Heart Wall Art, handcrafted decorative display piece',
  1,
  true
FROM public.products WHERE slug = '12-can-heart-wall-art'
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  alt_text = EXCLUDED.alt_text,
  is_primary = true;

-- 4. 27-Can Heart Wall Art
INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0004-4000-8000-000000000004'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205435/27-can-heart-wall-art-v2.png',
  '27-Can Heart Wall Art, handcrafted decorative display piece',
  1,
  true
FROM public.products WHERE slug = '27-can-heart-wall-art'
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  alt_text = EXCLUDED.alt_text,
  is_primary = true;

-- 5. 30-Can Guitar Wall Art
INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0005-4000-8000-000000000005'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205372/30-can-guitar-wall-art-v1.png',
  '30-Can Guitar Wall Art, handcrafted guitar-shaped wall sculpture made from 30 empty cans',
  1,
  true
FROM public.products WHERE slug = '30-can-guitar-wall-art'
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  alt_text = EXCLUDED.alt_text,
  is_primary = true;

-- 6. 11-Can Bow Wall Art
INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0006-4000-8000-000000000006'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205372/11-can-bow-wall-art-v1.png',
  '11-Can Bow Wall Art, handcrafted ribbon-bow wall piece made from 11 empty cans',
  1,
  true
FROM public.products WHERE slug = '11-can-bow-wall-art'
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  alt_text = EXCLUDED.alt_text,
  is_primary = true;

-- 7. Can Desk Station
INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0007-4000-8000-000000000007'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205385/can-desk-station-v1.png',
  'Can Desk Station, handcrafted pen and desk organizer made from a single empty can',
  1,
  true
FROM public.products WHERE slug = 'can-desk-station'
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  alt_text = EXCLUDED.alt_text,
  is_primary = true;

-- 8. Can Candle - Diwali Special
INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0008-4000-8000-000000000008'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205439/can-candle-diwali-special-v1.png',
  'Can Candle - Diwali Special, handcrafted decorative can candles in four colors',
  1,
  true
FROM public.products WHERE slug = 'can-candle-diwali-special'
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  alt_text = EXCLUDED.alt_text,
  is_primary = true;

-- 9. 24-Can Spider Wall Art
INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
SELECT
  'a0000001-0009-4000-8000-000000000009'::uuid,
  id,
  'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205379/24-can-spider-wall-art-v1.png',
  '24-Can Spider Wall Art, handcrafted eight-legged wall sculpture made from 24 empty cans',
  1,
  true
FROM public.products WHERE slug = '24-can-spider-wall-art'
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  alt_text = EXCLUDED.alt_text,
  is_primary = true;

-- Fallback update: In case any product_images exist with non-matching IDs, update by product slug directly
UPDATE public.product_images pi
SET image_url = 'https://res.cloudinary.com/afpsv7zi/image/upload/v1791203495/8-can-gun-sculpture-v2.png'
FROM public.products p
WHERE pi.product_id = p.id AND p.slug = '8-can-gun-sculpture';

UPDATE public.product_images pi
SET image_url = 'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205370/14-can-gun-sculpture-v2.png'
FROM public.products p
WHERE pi.product_id = p.id AND p.slug = '14-can-gun-sculpture';

UPDATE public.product_images pi
SET image_url = 'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205381/12-can-heart-wall-art-v2.png'
FROM public.products p
WHERE pi.product_id = p.id AND p.slug = '12-can-heart-wall-art';

UPDATE public.product_images pi
SET image_url = 'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205435/27-can-heart-wall-art-v2.png'
FROM public.products p
WHERE pi.product_id = p.id AND p.slug = '27-can-heart-wall-art';

UPDATE public.product_images pi
SET image_url = 'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205372/30-can-guitar-wall-art-v1.png'
FROM public.products p
WHERE pi.product_id = p.id AND p.slug = '30-can-guitar-wall-art';

UPDATE public.product_images pi
SET image_url = 'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205372/11-can-bow-wall-art-v1.png'
FROM public.products p
WHERE pi.product_id = p.id AND p.slug = '11-can-bow-wall-art';

UPDATE public.product_images pi
SET image_url = 'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205385/can-desk-station-v1.png'
FROM public.products p
WHERE pi.product_id = p.id AND p.slug = 'can-desk-station';

UPDATE public.product_images pi
SET image_url = 'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205439/can-candle-diwali-special-v1.png'
FROM public.products p
WHERE pi.product_id = p.id AND p.slug = 'can-candle-diwali-special';

UPDATE public.product_images pi
SET image_url = 'https://res.cloudinary.com/afpsv7zi/image/upload/v1791205379/24-can-spider-wall-art-v1.png'
FROM public.products p
WHERE pi.product_id = p.id AND p.slug = '24-can-spider-wall-art';
