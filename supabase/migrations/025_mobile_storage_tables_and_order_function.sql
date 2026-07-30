-- Mobile API support: private receipt metadata, idempotent checkout,
-- mobile audit events, newsletter subscribers, device registrations and
-- service-role-only transactional order creation.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- New and future uploads should not rely on public receipt URLs. Existing
-- object paths remain in place; application routes can issue signed URLs.
UPDATE storage.buckets
SET public = FALSE
WHERE id = 'order-receipts';

DROP POLICY IF EXISTS "Public read order receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins read order receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage order receipts" ON storage.objects;
CREATE POLICY "Admins manage order receipts"
  ON storage.objects FOR ALL
  USING (bucket_id = 'order-receipts' AND public.is_admin())
  WITH CHECK (bucket_id = 'order-receipts' AND public.is_admin());

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web'
  CHECK (source IN ('web', 'mobile', 'admin', 'api'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mobile_idempotency_key TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_bucket TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_path TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_filename TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_mime_type TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_size_bytes BIGINT
  CHECK (receipt_size_bytes IS NULL OR receipt_size_bytes >= 0);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_mobile_idempotency
  ON public.orders (user_id, mobile_idempotency_key)
  WHERE user_id IS NOT NULL AND mobile_idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  previous_status order_status,
  new_status order_status,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_created
  ON public.order_events (order_id, created_at DESC);

ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own order events" ON public.order_events;
CREATE POLICY "Users read own order events"
  ON public.order_events FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_events.order_id
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage order events" ON public.order_events;
CREATE POLICY "Admins manage order events"
  ON public.order_events FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.mobile_audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  request_id TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_audit_events_created
  ON public.mobile_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mobile_audit_events_user
  ON public.mobile_audit_events (user_id, created_at DESC);

ALTER TABLE public.mobile_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read mobile audit events" ON public.mobile_audit_events;
CREATE POLICY "Admins read mobile audit events"
  ON public.mobile_audit_events FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage mobile audit events" ON public.mobile_audit_events;
CREATE POLICY "Admins manage mobile audit events"
  ON public.mobile_audit_events FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  normalized_email TEXT NOT NULL,
  full_name TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'mobile',
  status TEXT NOT NULL DEFAULT 'subscribed'
    CHECK (status IN ('subscribed', 'unsubscribed', 'bounced', 'complained')),
  subscribed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  consent_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT newsletter_subscribers_normalized_email_unique UNIQUE (normalized_email)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status
  ON public.newsletter_subscribers (status, created_at DESC);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins manage newsletter subscribers"
  ON public.newsletter_subscribers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS newsletter_subscribers_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER newsletter_subscribers_updated_at BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.mobile_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web', 'unknown')),
  app_version TEXT NOT NULL DEFAULT '',
  device_name TEXT,
  locale TEXT,
  timezone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT mobile_devices_expo_push_token_unique UNIQUE (expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_mobile_devices_user_active
  ON public.mobile_devices (user_id, is_active, last_seen_at DESC);

ALTER TABLE public.mobile_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own mobile devices" ON public.mobile_devices;
CREATE POLICY "Users manage own mobile devices"
  ON public.mobile_devices FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read mobile devices" ON public.mobile_devices;
CREATE POLICY "Admins read mobile devices"
  ON public.mobile_devices FOR SELECT
  USING (public.is_admin());

DROP TRIGGER IF EXISTS mobile_devices_updated_at ON public.mobile_devices;
CREATE TRIGGER mobile_devices_updated_at BEFORE UPDATE ON public.mobile_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.mobile_app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  minimum_supported_version TEXT NOT NULL DEFAULT '1.0.0',
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_message TEXT,
  feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mobile_app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read mobile app settings" ON public.mobile_app_settings;
CREATE POLICY "Public read mobile app settings"
  ON public.mobile_app_settings FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admins manage mobile app settings" ON public.mobile_app_settings;
CREATE POLICY "Admins manage mobile app settings"
  ON public.mobile_app_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS mobile_app_settings_updated_at ON public.mobile_app_settings;
CREATE TRIGGER mobile_app_settings_updated_at BEFORE UPDATE ON public.mobile_app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.mobile_app_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.create_mobile_order(
  p_user_id UUID,
  p_idempotency_key TEXT,
  p_order_payload JSONB,
  p_items JSONB,
  p_coupon_code TEXT DEFAULT NULL,
  p_stock_threshold INTEGER DEFAULT 20
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.orders%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_status order_status;
  v_coupon_code TEXT;
  v_item JSONB;
  v_product RECORD;
  v_product_id UUID;
  v_quantity INTEGER;
  v_available INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Authenticated user is required.' USING ERRCODE = '22023';
  END IF;

  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 12 THEN
    RAISE EXCEPTION 'A valid idempotency key is required.' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.orders
  WHERE user_id = p_user_id
    AND mobile_idempotency_key = p_idempotency_key
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.order_events (order_id, user_id, actor_id, event_type, new_status, payload)
    VALUES (
      v_existing.id,
      p_user_id,
      p_user_id,
      'mobile_checkout_idempotent_replay',
      v_existing.status,
      jsonb_build_object('idempotencyKey', p_idempotency_key)
    );
    RETURN v_existing;
  END IF;

  v_status := COALESCE(NULLIF(p_order_payload->>'status', '')::order_status, 'pending'::order_status);
  v_coupon_code := NULLIF(UPPER(COALESCE(p_coupon_code, p_order_payload->>'coupon_code', '')), '');

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order items are required.' USING ERRCODE = '22023';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_product_id := NULLIF(v_item->>'product_id', '')::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Order contains an invalid product.' USING ERRCODE = '22023';
    END;

    v_quantity := GREATEST(COALESCE((v_item->>'quantity')::INTEGER, 0), 0);
    IF v_product_id IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Order contains an invalid quantity.' USING ERRCODE = '22023';
    END IF;

    SELECT
      id,
      name,
      published,
      stock,
      reserved_stock,
      stock_management_enabled,
      backorder_policy,
      max_backorder_quantity,
      max_purchase_quantity
    INTO v_product
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND OR v_product.published IS NOT TRUE THEN
      RAISE EXCEPTION 'One or more products are unavailable.' USING ERRCODE = '22023';
    END IF;

    IF v_product.max_purchase_quantity IS NOT NULL AND v_quantity > v_product.max_purchase_quantity THEN
      RAISE EXCEPTION 'One or more quantities exceed the purchase limit.' USING ERRCODE = '22023';
    END IF;

    IF COALESCE(v_product.stock_management_enabled, TRUE) THEN
      v_available := GREATEST(COALESCE(v_product.stock, 0) - COALESCE(v_product.reserved_stock, 0), 0);
      IF v_quantity > v_available
        AND (
          COALESCE(v_product.backorder_policy, 'disabled') = 'disabled'
          OR v_quantity > v_available + COALESCE(v_product.max_backorder_quantity, 0)
        )
      THEN
        RAISE EXCEPTION 'One or more products do not have enough stock.' USING ERRCODE = '22023';
      END IF;
    END IF;
  END LOOP;

  BEGIN
    INSERT INTO public.orders (
      user_id,
      status,
      total,
      subtotal,
      shipping_fee,
      discount_amount,
      coupon_code,
      member_id,
      payment_method,
      phone,
      invoice_number,
      items,
      shipping_address,
      notes,
      display_currency,
      exchange_rate,
      exchange_rate_timestamp,
      display_subtotal,
      display_shipping_fee,
      display_discount_amount,
      display_total,
      source,
      mobile_idempotency_key
    )
    VALUES (
      p_user_id,
      v_status,
      COALESCE((p_order_payload->>'total')::NUMERIC, 0),
      COALESCE((p_order_payload->>'subtotal')::NUMERIC, 0),
      COALESCE((p_order_payload->>'shipping_fee')::NUMERIC, 0),
      COALESCE((p_order_payload->>'discount_amount')::NUMERIC, 0),
      v_coupon_code,
      NULLIF(p_order_payload->>'member_id', ''),
      COALESCE(NULLIF(p_order_payload->>'payment_method', ''), 'cod'),
      NULLIF(p_order_payload->>'phone', ''),
      NULLIF(p_order_payload->>'invoice_number', ''),
      p_items,
      COALESCE(p_order_payload->'shipping_address', '{}'::jsonb),
      NULLIF(p_order_payload->>'notes', ''),
      COALESCE(NULLIF(p_order_payload->>'display_currency', ''), 'PKR'),
      NULLIF(p_order_payload->>'exchange_rate', '')::NUMERIC,
      NULLIF(p_order_payload->>'exchange_rate_timestamp', '')::TIMESTAMPTZ,
      NULLIF(p_order_payload->>'display_subtotal', '')::NUMERIC,
      NULLIF(p_order_payload->>'display_shipping_fee', '')::NUMERIC,
      NULLIF(p_order_payload->>'display_discount_amount', '')::NUMERIC,
      NULLIF(p_order_payload->>'display_total', '')::NUMERIC,
      'mobile',
      p_idempotency_key
    )
    RETURNING * INTO v_order;
  EXCEPTION WHEN unique_violation THEN
    SELECT *
    INTO v_existing
    FROM public.orders
    WHERE user_id = p_user_id
      AND mobile_idempotency_key = p_idempotency_key
    LIMIT 1;

    IF FOUND THEN
      RETURN v_existing;
    END IF;

    RAISE;
  END;

  PERFORM *
  FROM public.apply_order_stock_changes(v_order.id, p_items, p_stock_threshold);

  IF v_coupon_code IS NOT NULL THEN
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE code = v_coupon_code
      AND active = TRUE;
  END IF;

  INSERT INTO public.order_events (order_id, user_id, actor_id, event_type, new_status, payload)
  VALUES (
    v_order.id,
    p_user_id,
    p_user_id,
    'mobile_order_created',
    v_order.status,
    jsonb_build_object(
      'idempotencyKey', p_idempotency_key,
      'paymentMethod', v_order.payment_method,
      'displayCurrency', v_order.display_currency
    )
  );

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.create_mobile_order(UUID, TEXT, JSONB, JSONB, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_mobile_order(UUID, TEXT, JSONB, JSONB, TEXT, INTEGER) TO service_role;

COMMENT ON TABLE public.newsletter_subscribers IS
  'Private subscriber table used by mobile/web subscription endpoints. Not publicly readable.';

COMMENT ON TABLE public.mobile_devices IS
  'Private Expo push-token registry. Tokens are never exposed through public APIs.';

COMMENT ON FUNCTION public.create_mobile_order(UUID, TEXT, JSONB, JSONB, TEXT, INTEGER) IS
  'Service-role-only mobile checkout function. Handles idempotency, order creation, stock application, coupon usage and audit events in one database transaction.';
