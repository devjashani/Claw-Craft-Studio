-- ==============================================================================
-- CLAWCRAFT STUDIO - LOCAL DELIVERY ZONE, CASH ON DELIVERY & FREE SHIPPING PROMOTION
-- Migration: 20261028_cod_and_promo_system.sql
-- ==============================================================================

-- ==============================================================================
-- BLOCK 1: ENUM EXTENSIONS (ISOLATED EXECUTION)
-- Note: In PostgreSQL, ALTER TYPE ... ADD VALUE must run outside multi-statement
-- transactions that use the new enum values.
-- ==============================================================================
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'awaiting_confirmation';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';

-- ==============================================================================
-- BLOCK 2: LOCAL DELIVERY COD PIN CODES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cod_pincodes (
  pincode TEXT PRIMARY KEY CHECK (pincode ~ '^[1-9][0-9]{5}$'),
  area_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for instant lookup by pincode and active status
CREATE INDEX IF NOT EXISTS idx_cod_pincodes_active ON public.cod_pincodes (pincode) WHERE is_active = true;

-- Enable Row Level Security (RLS)
ALTER TABLE public.cod_pincodes ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if any
DROP POLICY IF EXISTS "Public access denied on cod_pincodes" ON public.cod_pincodes;
DROP POLICY IF EXISTS "Service role full access on cod_pincodes" ON public.cod_pincodes;

-- Service role full access only (reads go through server-side code only, NO public policies)
CREATE POLICY "Service role full access on cod_pincodes"
  ON public.cod_pincodes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- BLOCK 3: SEED 23 JAIPUR LOCAL DELIVERY PIN CODES
-- ==============================================================================
INSERT INTO public.cod_pincodes (pincode, area_name, is_active)
VALUES
  ('302001', 'Jaipur GPO / Ashok Nagar / C.P.M.G / Chandpole Bazar', true),
  ('302002', 'Amer Road / Govind Nagar', true),
  ('302003', 'Jaipur City / Haldiyon Ka Rasta', true),
  ('302004', 'Jawahar Nagar / Janta Colony', true),
  ('302005', 'High Court / Industrial Estate', true),
  ('302006', 'Ajmer Road / Jaipur R.S.', true),
  ('302011', 'Sanganer Bazaar', true),
  ('302012', 'Jhotwara Industrial Area / Bindayaka / Hathoj', true),
  ('302013', 'Harmada / Akhepura', true),
  ('302015', 'Bapu Nagar / Bajaj Nagar / Barkat Nagar / Gandhi Nagar', true),
  ('302016', 'Bani Park / Collectorate / Dwarikapuri', true),
  ('302017', 'Jagatpura', true),
  ('302018', 'Durgapura / Tonk Road', true),
  ('302020', 'Mansarovar', true),
  ('302021', 'Heerapura', true),
  ('302022', 'Sitapura Industrial Area / Bilwa / Goner', true),
  ('302026', 'Bhankrota / Jaisinghpura Bas', true),
  ('302027', 'CRPF Campus Lalwas', true),
  ('302028', 'Amer / Basna / Bhanpur Kalan', true),
  ('302029', 'Sanganer Airport', true),
  ('302031', 'Jamdoli', true),
  ('302033', 'Pratap Nagar Housing Board', true),
  ('302036', 'Jaisinghpura Khore', true),
  ('302039', 'Amba Bari / Dehar Ka Balaji / Vidhyadhar Nagar', true)
ON CONFLICT (pincode) DO NOTHING;

-- Grant service role full permissions on cod_pincodes
GRANT ALL ON public.cod_pincodes TO service_role;

-- ==============================================================================
-- BLOCK 4: ORDERS TABLE SCHEMA EXTENSIONS
-- ==============================================================================
DO $$
BEGIN
  -- Add delivery_mode column ('courier' or 'local')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'delivery_mode'
  ) THEN
    ALTER TABLE public.orders 
      ADD COLUMN delivery_mode TEXT NOT NULL DEFAULT 'courier' CHECK (delivery_mode IN ('courier', 'local'));
  END IF;

  -- Add cod_fee_paise column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cod_fee_paise'
  ) THEN
    ALTER TABLE public.orders 
      ADD COLUMN cod_fee_paise BIGINT NOT NULL DEFAULT 0 CHECK (cod_fee_paise >= 0);
  END IF;

  -- Add cod_amount_collected_paise column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cod_amount_collected_paise'
  ) THEN
    ALTER TABLE public.orders 
      ADD COLUMN cod_amount_collected_paise BIGINT CHECK (cod_amount_collected_paise IS NULL OR cod_amount_collected_paise >= 0);
  END IF;

  -- Add cod_collected_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cod_collected_at'
  ) THEN
    ALTER TABLE public.orders 
      ADD COLUMN cod_collected_at TIMESTAMPTZ;
  END IF;

  -- Add stock_deducted flag to guarantee single deduction
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'stock_deducted'
  ) THEN
    ALTER TABLE public.orders 
      ADD COLUMN stock_deducted BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Add stock_restored flag to guarantee single restoration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'stock_restored'
  ) THEN
    ALTER TABLE public.orders 
      ADD COLUMN stock_restored BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create index on delivery_mode and status
CREATE INDEX IF NOT EXISTS idx_orders_delivery_mode ON public.orders (delivery_mode);
CREATE INDEX IF NOT EXISTS idx_orders_status_cod ON public.orders (payment_method, status);

-- ==============================================================================
-- BLOCK 5: ATOMIC STOCK DEDUCT & RESTORE FUNCTIONS
-- ==============================================================================

-- 1. Deduct stock for order (idempotent, checks stock_deducted flag)
CREATE OR REPLACE FUNCTION public.decrement_stock_on_paid_order(target_order_id uuid)
RETURNS void AS $$
DECLARE
  item RECORD;
  already_deducted BOOLEAN;
BEGIN
  SELECT stock_deducted INTO already_deducted
  FROM public.orders
  WHERE id = target_order_id;

  IF already_deducted IS TRUE THEN
    RETURN;
  END IF;

  FOR item IN
    SELECT product_id, quantity
    FROM public.order_items
    WHERE order_id = target_order_id
  LOOP
    UPDATE public.products
    SET stock_count = greatest(0, stock_count - item.quantity),
        updated_at = now()
    WHERE id = item.product_id
      AND is_made_to_order = false;
  END LOOP;

  UPDATE public.orders
  SET stock_deducted = true,
      updated_at = now()
  WHERE id = target_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Restore stock when order is cancelled or customer refused delivery
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancelled_order(target_order_id uuid)
RETURNS void AS $$
DECLARE
  item RECORD;
  was_deducted BOOLEAN;
  already_restored BOOLEAN;
BEGIN
  SELECT stock_deducted, stock_restored INTO was_deducted, already_restored
  FROM public.orders
  WHERE id = target_order_id;

  -- Only restore if stock was deducted and has not yet been restored
  IF was_deducted IS TRUE AND (already_restored IS FALSE OR already_restored IS NULL) THEN
    FOR item IN
      SELECT product_id, quantity
      FROM public.order_items
      WHERE order_id = target_order_id
    LOOP
      UPDATE public.products
      SET stock_count = stock_count + item.quantity,
          updated_at = now()
      WHERE id = item.product_id
        AND is_made_to_order = false;
    END LOOP;

    UPDATE public.orders
    SET stock_restored = true,
        updated_at = now()
    WHERE id = target_order_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- BLOCK 6: SEED NEW SITE SETTINGS KEYS
-- ==============================================================================
INSERT INTO public.site_settings (key, value, description)
VALUES
  ('free_shipping_promo_enabled', 'false'::jsonb, 'Temporary free shipping promotion switch (true/false)'),
  ('free_shipping_promo_ends_at', 'null'::jsonb, 'Promotion end date in IST (YYYY-MM-DD)'),
  ('free_shipping_promo_scope', '"local"'::jsonb, 'Promotion scope: "local" (Jaipur PINs) or "all" (Pan-India)'),
  ('cod_enabled', 'false'::jsonb, 'Cash on Delivery master toggle (default false)'),
  ('cod_max_order_value_inr', '5000'::jsonb, 'Maximum order total allowed for Pay on Delivery in Rupees'),
  ('cod_fee_inr', '0'::jsonb, 'Additional delivery fee for COD in Rupees (default 0)'),
  ('cod_max_open_orders_per_phone', '2'::jsonb, 'Maximum open uncollected COD orders allowed per customer phone'),
  ('cod_blocked_phones', '[]'::jsonb, 'Array of customer phone numbers blocked from using Cash on Delivery'),
  ('cod_confirmation_note', '"Our studio artisan will call you to confirm your order details and delivery window before dispatch."'::jsonb, 'Note shown to customer on checkout and receipt for COD orders'),
  ('local_delivery_window_text', '""'::jsonb, 'Optional studio message about personal delivery schedule')
ON CONFLICT (key) DO NOTHING;
