-- ==============================================================================
-- Migration: 20261004000000_remove_fake_discounts_and_new_badge.sql
-- Description: Idempotently set compare-at / fake discount columns to NULL and is_new to false/NULL if they exist.
-- Safe: NO DROP, NO DELETE. Guarded with column existence checks.
-- ==============================================================================

do $$
begin
  -- 1. Reset compare_at_price_paise on public.products if column exists
  if exists (
    select 1 
    from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'products' 
      and column_name = 'compare_at_price_paise'
  ) then
    execute 'update public.products set compare_at_price_paise = null where compare_at_price_paise is not null';
    raise notice 'Updated public.products: compare_at_price_paise set to NULL.';
  end if;

  -- 2. Reset compare_at_price if an alternative column name exists
  if exists (
    select 1 
    from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'products' 
      and column_name = 'compare_at_price'
  ) then
    execute 'update public.products set compare_at_price = null where compare_at_price is not null';
    raise notice 'Updated public.products: compare_at_price set to NULL.';
  end if;

  -- 3. Reset discount_percent if an alternative column exists
  if exists (
    select 1 
    from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'products' 
      and column_name = 'discount_percent'
  ) then
    execute 'update public.products set discount_percent = null where discount_percent is not null';
    raise notice 'Updated public.products: discount_percent set to NULL.';
  end if;

  -- 4. Reset is_new on public.products if column exists
  if exists (
    select 1 
    from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'products' 
      and column_name = 'is_new'
  ) then
    execute 'update public.products set is_new = false where is_new is true';
    raise notice 'Updated public.products: is_new set to false.';
  end if;
end $$;
