-- Fast invoice links, customer edit unlocks, and backorder-aware stock updates.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 20 CHECK (low_stock_threshold >= 0),
  ADD COLUMN IF NOT EXISTS stock_management_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS backorder_policy TEXT NOT NULL DEFAULT 'disabled'
    CHECK (backorder_policy IN ('disabled', 'enabled', 'enabled_with_warning')),
  ADD COLUMN IF NOT EXISTS max_backorder_quantity INTEGER CHECK (max_backorder_quantity IS NULL OR max_backorder_quantity >= 0),
  ADD COLUMN IF NOT EXISTS max_purchase_quantity INTEGER CHECK (max_purchase_quantity IS NULL OR max_purchase_quantity > 0),
  ADD COLUMN IF NOT EXISTS estimated_availability_date DATE,
  ADD COLUMN IF NOT EXISTS backorder_message TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS requires_admin_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_confirmation_reason TEXT,
  ADD COLUMN IF NOT EXISTS customer_edit_token TEXT,
  ADD COLUMN IF NOT EXISTS customer_edit_allowed_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_edit_enabled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_customer_edit_token
  ON public.orders (customer_edit_token)
  WHERE customer_edit_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.fast_invoice_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  recipient_email TEXT,
  required_member_id TEXT,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fast_invoice_links_created_at
  ON public.fast_invoice_links (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fast_invoice_links_active
  ON public.fast_invoice_links (active, expires_at);

ALTER TABLE public.fast_invoice_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage fast invoice links" ON public.fast_invoice_links;
CREATE POLICY "Admins manage fast invoice links"
  ON public.fast_invoice_links FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS fast_invoice_links_updated_at ON public.fast_invoice_links;
CREATE TRIGGER fast_invoice_links_updated_at BEFORE UPDATE ON public.fast_invoice_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.apply_order_stock_changes(
  p_order_id UUID,
  p_items JSONB,
  p_threshold INTEGER DEFAULT 20
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  previous_stock INTEGER,
  new_stock INTEGER,
  quantity_sold INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_product_name TEXT;
  v_previous_stock INTEGER;
  v_new_stock INTEGER;
  v_stock_management_enabled BOOLEAN;
  v_backorder_policy TEXT;
  v_product_threshold INTEGER;
  v_effective_threshold INTEGER;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN;
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_product_id := NULLIF(v_item->>'product_id', '')::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
      CONTINUE;
    END;

    v_quantity := GREATEST(COALESCE((v_item->>'quantity')::INTEGER, 0), 0);

    IF v_product_id IS NULL OR v_quantity <= 0 THEN
      CONTINUE;
    END IF;

    SELECT
      products.name,
      products.stock,
      products.stock_management_enabled,
      products.backorder_policy,
      products.low_stock_threshold
    INTO
      v_product_name,
      v_previous_stock,
      v_stock_management_enabled,
      v_backorder_policy,
      v_product_threshold
    FROM public.products
    WHERE products.id = v_product_id
    FOR UPDATE;

    IF NOT FOUND OR COALESCE(v_stock_management_enabled, TRUE) IS FALSE THEN
      CONTINUE;
    END IF;

    IF COALESCE(v_backorder_policy, 'disabled') IN ('enabled', 'enabled_with_warning') THEN
      v_new_stock := COALESCE(v_previous_stock, 0) - v_quantity;
    ELSE
      v_new_stock := GREATEST(COALESCE(v_previous_stock, 0) - v_quantity, 0);
    END IF;

    UPDATE public.products
    SET stock = v_new_stock,
        updated_at = NOW()
    WHERE products.id = v_product_id;

    v_effective_threshold := GREATEST(COALESCE(v_product_threshold, p_threshold, 20), 0);

    IF v_new_stock < v_effective_threshold THEN
      INSERT INTO public.product_stock_alerts (
        product_id,
        order_id,
        product_name,
        previous_stock,
        new_stock,
        quantity_sold,
        threshold
      )
      VALUES (
        v_product_id,
        p_order_id,
        v_product_name,
        COALESCE(v_previous_stock, 0),
        v_new_stock,
        v_quantity,
        v_effective_threshold
      );

      product_id := v_product_id;
      product_name := v_product_name;
      previous_stock := COALESCE(v_previous_stock, 0);
      new_stock := v_new_stock;
      quantity_sold := v_quantity;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_order_stock_changes(UUID, JSONB, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_order_stock_changes(UUID, JSONB, INTEGER) TO service_role;
