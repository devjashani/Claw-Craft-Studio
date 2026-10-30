-- ==============================================================================
-- CLAWCRAFT STUDIO - ORDERS SOFT ARCHIVE & DASHBOARD METRICS RPC
-- Migration: 20261030_order_soft_archive_and_metrics.sql
-- Idempotent: Can be run multiple times safely.
-- ==============================================================================

-- 1. Add archived_at column to orders table for soft archiving test/stale orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Index for instant filtering of unarchived orders in admin & dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_archived_at 
ON public.orders (archived_at);

-- Partial index for active unarchived orders
CREATE INDEX IF NOT EXISTS idx_orders_unarchived_active 
ON public.orders (created_at DESC) 
WHERE archived_at IS NULL;

-- 2. Server-side Database Aggregate Function for Dashboard KPIs
-- Performs zero-row download aggregation in PostgreSQL for sub-millisecond response.
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_revenue_paise BIGINT := 0;
  v_total_orders_count INT := 0;
  v_pending_courier_count INT := 0;
  v_pending_delivery_count INT := 0;
  v_cod_collected_today_paise BIGINT := 0;
  v_low_stock_count INT := 0;
  v_attention_orders_count INT := 0;
  v_attention_inquiries_count INT := 0;
  v_today_ist DATE;
BEGIN
  -- Current date in Indian Standard Time (Asia/Kolkata)
  v_today_ist := (now() AT TIME ZONE 'Asia/Kolkata')::date;

  -- 1. Total Gross Revenue (in integer paise)
  -- Paid online orders + COD orders with cash collected, minus refunded amounts.
  -- Excludes pending_payment, failed, abandoned, cancelled, and archived orders.
  SELECT COALESCE(SUM(
    CASE 
      -- Paid online orders
      WHEN payment_method <> 'cod' 
        AND (payment_status = 'paid' OR (payment_status IS NULL AND status IN ('paid', 'processing', 'shipped', 'delivered')))
        AND status NOT IN ('pending_payment', 'cancelled', 'refunded')
        AND (payment_status IS NULL OR payment_status NOT IN ('pending_payment', 'failed', 'abandoned', 'cancelled', 'refunded'))
        THEN total_paise

      -- COD orders with cash collected
      WHEN payment_method = 'cod' 
        AND (payment_status = 'cod_collected' OR cod_collected_at IS NOT NULL)
        AND status NOT IN ('pending_payment', 'cancelled', 'refunded')
        AND (payment_status IS NULL OR payment_status NOT IN ('pending_payment', 'failed', 'abandoned', 'cancelled', 'refunded'))
        THEN COALESCE(cod_amount_collected_paise, total_paise)

      ELSE 0
    END
  ), 0)
  INTO v_total_revenue_paise
  FROM public.orders
  WHERE archived_at IS NULL;

  -- 2. Total Orders Count
  -- Orders that are paid, or COD placed and not cancelled.
  -- Excludes pending_payment, failed, abandoned, cancelled, and archived.
  SELECT COUNT(*)
  INTO v_total_orders_count
  FROM public.orders
  WHERE archived_at IS NULL
    AND status NOT IN ('pending_payment', 'cancelled', 'refunded')
    AND (payment_status IS NULL OR payment_status NOT IN ('pending_payment', 'failed', 'abandoned', 'cancelled', 'refunded'))
    AND (
      -- Paid online order
      (payment_method <> 'cod' AND (payment_status = 'paid' OR status IN ('paid', 'processing', 'shipped', 'delivered')))
      OR
      -- COD placed and not cancelled
      (payment_method = 'cod' AND status IN ('awaiting_confirmation', 'confirmed', 'processing', 'out_for_delivery', 'shipped', 'delivered', 'paid'))
    );

  -- 3. Pending Shipments & Deliveries
  -- Paid or confirmed orders that are not yet shipped, out for delivery, delivered, cancelled or archived.
  -- Split by delivery_mode: 'local' (Jaipur) vs 'courier' (Pan-India).
  SELECT 
    COUNT(*) FILTER (WHERE delivery_mode = 'courier' OR delivery_mode IS NULL),
    COUNT(*) FILTER (WHERE delivery_mode = 'local')
  INTO v_pending_courier_count, v_pending_delivery_count
  FROM public.orders
  WHERE archived_at IS NULL
    AND status IN ('paid', 'confirmed', 'processing')
    AND (
      (payment_method <> 'cod' AND (payment_status = 'paid' OR status = 'paid' OR status = 'processing'))
      OR
      (payment_method = 'cod' AND status IN ('confirmed', 'processing'))
    );

  -- 4. COD Cash Collected Today (IST Date 00:00 to 23:59)
  SELECT COALESCE(SUM(COALESCE(cod_amount_collected_paise, total_paise)), 0)
  INTO v_cod_collected_today_paise
  FROM public.orders
  WHERE archived_at IS NULL
    AND payment_method = 'cod'
    AND (payment_status = 'cod_collected' OR cod_collected_at IS NOT NULL)
    AND status NOT IN ('cancelled', 'refunded')
    AND (
      COALESCE(cod_collected_at, updated_at) AT TIME ZONE 'Asia/Kolkata'
    )::date = v_today_ist;

  -- 5. Low Stock Count (Products with <= 3 ready units in active catalog)
  SELECT COUNT(*)
  INTO v_low_stock_count
  FROM public.products
  WHERE is_active = true
    AND is_made_to_order = false
    AND stock_count <= 3;

  -- 6. Attention Orders Count (Unarchived paid/confirmed orders awaiting fulfillment)
  SELECT COUNT(*)
  INTO v_attention_orders_count
  FROM public.orders
  WHERE archived_at IS NULL
    AND status IN ('paid', 'awaiting_confirmation', 'confirmed');

  -- 7. Attention Inquiries Count (Unreviewed custom commission submissions)
  SELECT COUNT(*)
  INTO v_attention_inquiries_count
  FROM public.custom_requests
  WHERE status = 'new';

  -- Return consolidated JSON payload
  RETURN jsonb_build_object(
    'total_revenue_paise', v_total_revenue_paise,
    'total_orders_count', v_total_orders_count,
    'pending_shipments_count', (v_pending_courier_count + v_pending_delivery_count),
    'pending_courier_count', v_pending_courier_count,
    'pending_delivery_count', v_pending_delivery_count,
    'cod_collected_today_paise', v_cod_collected_today_paise,
    'low_stock_count', v_low_stock_count,
    'attention_orders_count', v_attention_orders_count,
    'attention_inquiries_count', v_attention_inquiries_count
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO authenticated, service_role;

