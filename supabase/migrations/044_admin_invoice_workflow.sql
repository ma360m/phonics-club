-- Admin customer directory and invoice finalization workflow.
-- COD orders remain unfinalized until delivery is confirmed. Bank-transfer
-- orders are estimates until an admin confirms payment.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT 'invoice'
    CHECK (document_type IN ('estimate', 'invoice')),
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finalized_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stock_deducted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stock_deducted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_finalized_at
  ON public.orders (finalized_at DESC)
  WHERE finalized_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_document_type
  ON public.orders (document_type, created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  member_id TEXT,
  address TEXT,
  city TEXT,
  zip TEXT,
  country TEXT NOT NULL DEFAULT 'Pakistan',
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_customers_user_id_unique
  ON public.admin_customers (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_admin_customers_name
  ON public.admin_customers (LOWER(name));

CREATE INDEX IF NOT EXISTS idx_admin_customers_email
  ON public.admin_customers (LOWER(email))
  WHERE email IS NOT NULL;

ALTER TABLE public.admin_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage admin customers" ON public.admin_customers;
CREATE POLICY "Admins manage admin customers"
  ON public.admin_customers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS admin_customers_updated_at ON public.admin_customers;
CREATE TRIGGER admin_customers_updated_at BEFORE UPDATE ON public.admin_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.fast_invoice_links
  ADD COLUMN IF NOT EXISTS admin_only BOOLEAN NOT NULL DEFAULT FALSE;

-- Make signed-in non-admin profiles available to the selector immediately.
INSERT INTO public.admin_customers (user_id, name, email)
SELECT p.id, COALESCE(p.full_name, ''), NULLIF(p.email, '')
FROM public.profiles AS p
WHERE p.role NOT IN ('admin', 'super_admin', 'instructor')
ON CONFLICT DO NOTHING;

-- Existing finalized orders already had their stock applied by the previous
-- workflow. Mark them so the new confirmation action remains idempotent.
UPDATE public.orders
SET stock_deducted_at = COALESCE(stock_deducted_at, updated_at)
WHERE stock_deducted_at IS NULL
  AND (
    status IN ('payment_confirmed', 'processing', 'ready_to_dispatch', 'shipped', 'delivered')
    OR (payment_method = 'cod' AND status <> 'cancelled')
  );

UPDATE public.orders
SET finalized_at = COALESCE(finalized_at, updated_at)
WHERE finalized_at IS NULL
  AND status IN ('payment_confirmed', 'processing', 'ready_to_dispatch', 'shipped', 'delivered')
  AND document_type = 'invoice';

CREATE OR REPLACE FUNCTION public.finalize_order_for_admin(
  p_order_id UUID,
  p_admin_id UUID
)
RETURNS TABLE (
  order_id UUID,
  invoice_number TEXT,
  document_type TEXT,
  stock_was_deducted BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_invoice_number TEXT;
  v_stock_was_deducted BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled orders cannot be finalized';
  END IF;

  IF lower(COALESCE(v_order.payment_method, 'cod')) = 'cod' THEN
    v_order.status := 'delivered'::order_status;
  ELSE
    v_order.status := 'payment_confirmed'::order_status;
  END IF;

  IF v_order.stock_deducted_at IS NULL THEN
    PERFORM public.apply_order_stock_changes(v_order.id, v_order.items, 20);
    v_stock_was_deducted := TRUE;
  END IF;

  v_invoice_number := NULLIF(v_order.invoice_number, '');
  IF v_invoice_number IS NULL THEN
    v_invoice_number := public.next_invoice_number(CURRENT_DATE);
  END IF;

  UPDATE public.orders
  SET status = v_order.status,
      document_type = 'invoice',
      invoice_number = v_invoice_number,
      stock_deducted_at = COALESCE(stock_deducted_at, NOW()),
      stock_deducted_by = COALESCE(stock_deducted_by, p_admin_id),
      finalized_at = COALESCE(finalized_at, NOW()),
      finalized_by = COALESCE(finalized_by, p_admin_id),
      payment_confirmed_at = CASE
        WHEN lower(COALESCE(payment_method, 'cod')) = 'cod' THEN payment_confirmed_at
        ELSE COALESCE(payment_confirmed_at, NOW())
      END,
      payment_confirmed_by = CASE
        WHEN lower(COALESCE(payment_method, 'cod')) = 'cod' THEN payment_confirmed_by
        ELSE COALESCE(payment_confirmed_by, p_admin_id)
      END,
      requires_admin_confirmation = FALSE,
      admin_confirmation_reason = NULL,
      updated_at = NOW()
  WHERE id = v_order.id;

  RETURN QUERY SELECT v_order.id, v_invoice_number, 'invoice'::TEXT, v_stock_was_deducted;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_order_for_admin(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_order_for_admin(UUID, UUID) TO service_role;
