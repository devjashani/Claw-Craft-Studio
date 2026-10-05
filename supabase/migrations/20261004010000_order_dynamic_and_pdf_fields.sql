-- ==============================================================================
-- Migration: 20261004010000_order_dynamic_and_pdf_fields.sql
-- Description: Dynamic order confirmation, sequential order number, access token, 
--              payment metadata, tracking, email timestamps, and receipt settings.
-- Idempotent & Safe: NO DROP, NO DELETE.
-- ==============================================================================

-- 1. Create sequential order number sequence & generator function
create sequence if not exists order_number_seq start with 1001;

create or replace function public.generate_order_number()
returns text as $$
begin
  return 'CC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 4, '0');
end;
$$ language plpgsql;

-- 2. Add dynamic order and security fields to public.orders
alter table public.orders add column if not exists public_token text;
alter table public.orders add column if not exists payment_status text not null default 'pending_payment';
alter table public.orders add column if not exists payment_meta jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists tracking_id text;
alter table public.orders add column if not exists email_sent_at timestamptz;

-- Set default generator on order_number if not already set
alter table public.orders alter column order_number set default public.generate_order_number();

-- Backfill public_token for existing orders if null
update public.orders
set public_token = md5(id::text || clock_timestamp()::text || random()::text)
where public_token is null;

-- Make public_token unique and not null once backfilled
alter table public.orders alter column public_token set default md5(gen_random_uuid()::text || clock_timestamp()::text);
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_public_token_key'
  ) then
    alter table public.orders add constraint orders_public_token_key unique (public_token);
  end if;
end $$;

-- Backfill payment_status and paid_at based on existing status
update public.orders
set payment_status = 'paid',
    paid_at = coalesce(paid_at, updated_at, created_at)
where status in ('paid', 'processing', 'shipped', 'delivered')
  and (payment_status is null or payment_status = 'pending_payment');

-- Mirror tracking_number into tracking_id if tracking_number exists
update public.orders
set tracking_id = tracking_number
where tracking_id is null and tracking_number is not null;

-- Create indexes for fast lookup and secure token query
create index if not exists idx_orders_public_token on public.orders(public_token);
create index if not exists idx_orders_payment_status on public.orders(payment_status);

-- 3. Add receipt settings (business address, GSTIN, watermark) to public.site_settings
insert into public.site_settings (key, value, description)
values
  ('business_address', '""'::jsonb, 'Studio registered business address displayed on receipts'),
  ('gstin', '""'::jsonb, 'Studio GSTIN for official invoices (optional)'),
  ('watermark_text', '"CLAWCRAFT STUDIO"'::jsonb, 'Diagonal watermark text printed on PDF order receipts')
on conflict (key) do nothing;
