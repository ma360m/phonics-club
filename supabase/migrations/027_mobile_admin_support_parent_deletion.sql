-- Mobile admin, support, parent/child profile and account deletion foundation.
-- This migration is additive and intentionally follows 026.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'student';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'parent';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role::TEXT IN ('admin', 'super_admin')
  );
$$;

CREATE TABLE IF NOT EXISTS public.mobile_admin_role_permissions (
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role, permission)
);

ALTER TABLE public.mobile_admin_role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read mobile admin permissions" ON public.mobile_admin_role_permissions;
CREATE POLICY "Admins read mobile admin permissions"
  ON public.mobile_admin_role_permissions FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Super admins manage mobile admin permissions" ON public.mobile_admin_role_permissions;
CREATE POLICY "Super admins manage mobile admin permissions"
  ON public.mobile_admin_role_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::TEXT = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::TEXT = 'super_admin'
    )
  );

INSERT INTO public.mobile_admin_role_permissions (role, permission, description)
VALUES
  ('super_admin', '*', 'Full mobile administration access.'),
  ('admin', 'admin.overview.read', 'View mobile admin overview.'),
  ('admin', 'products.read', 'View product administration data.'),
  ('admin', 'products.write', 'Create and edit routine product fields.'),
  ('admin', 'products.price.write', 'Change product prices with audit history.'),
  ('admin', 'products.inventory.write', 'Adjust inventory with audit history.'),
  ('admin', 'orders.read', 'View orders and order details.'),
  ('admin', 'orders.write', 'Update order statuses and notes.'),
  ('admin', 'payments.review', 'Review product payment receipts and COD orders.'),
  ('admin', 'course_payments.review', 'Review course payment receipts.'),
  ('admin', 'courses.read', 'View course administration data.'),
  ('admin', 'courses.write', 'Edit routine course settings.'),
  ('admin', 'users.read', 'View user overview data.'),
  ('admin', 'users.write', 'Manage safe user account fields.'),
  ('admin', 'support.read', 'View support tickets.'),
  ('admin', 'support.write', 'Respond to support tickets.'),
  ('admin', 'children.read', 'View child profile administration data.'),
  ('admin', 'children.write', 'Manage child profile support cases.'),
  ('admin', 'deletion.read', 'View account deletion requests.'),
  ('admin', 'deletion.write', 'Review account deletion requests.'),
  ('admin', 'reviews.read', 'View review moderation queues.'),
  ('admin', 'reviews.write', 'Moderate reviews.'),
  ('admin', 'reports.read', 'View basic mobile reports.'),
  ('admin', 'settings.write', 'Update mobile-safe settings.'),
  ('admin', 'notifications.write', 'Send mobile-safe announcements.')
ON CONFLICT (role, permission) DO UPDATE
SET description = EXCLUDED.description;

CREATE OR REPLACE FUNCTION public.user_has_mobile_admin_permission(
  p_user_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    LEFT JOIN public.mobile_admin_role_permissions rp
      ON rp.role = p.role::TEXT
      AND (rp.permission = p_permission OR rp.permission = '*')
    WHERE p.id = p_user_id
      AND p.role::TEXT IN ('admin', 'super_admin')
      AND (p.role::TEXT = 'super_admin' OR rp.permission IS NOT NULL)
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_mobile_admin_permission(p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.user_has_mobile_admin_permission(auth.uid(), p_permission);
$$;

CREATE TABLE IF NOT EXISTS public.product_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_regular_price NUMERIC(12,2),
  new_regular_price NUMERIC(12,2),
  previous_sale_price NUMERIC(12,2),
  new_sale_price NUMERIC(12,2),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_price_history_product_created
  ON public.product_price_history (product_id, created_at DESC);

ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read product price history" ON public.product_price_history;
CREATE POLICY "Admins read product price history"
  ON public.product_price_history FOR SELECT
  USING (public.current_user_has_mobile_admin_permission('products.read'));

DROP POLICY IF EXISTS "Admins create product price history" ON public.product_price_history;
CREATE POLICY "Admins create product price history"
  ON public.product_price_history FOR INSERT
  WITH CHECK (public.current_user_has_mobile_admin_permission('products.price.write'));

CREATE TABLE IF NOT EXISTS public.purchase_enquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  normalized_email TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  enquiry_type TEXT NOT NULL CHECK (enquiry_type IN ('product', 'course', 'mixed', 'other')),
  product_ids UUID[] NOT NULL DEFAULT '{}',
  course_ids UUID[] NOT NULL DEFAULT '{}',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'under_review', 'responded', 'converted', 'closed')),
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  user_visible_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_enquiries_status_created
  ON public.purchase_enquiries (status, created_at DESC);

ALTER TABLE public.purchase_enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own purchase enquiries" ON public.purchase_enquiries;
CREATE POLICY "Users read own purchase enquiries"
  ON public.purchase_enquiries FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.current_user_has_mobile_admin_permission('support.read')
  );

DROP POLICY IF EXISTS "Users create purchase enquiries" ON public.purchase_enquiries;
CREATE POLICY "Users create purchase enquiries"
  ON public.purchase_enquiries FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage purchase enquiries" ON public.purchase_enquiries;
CREATE POLICY "Admins manage purchase enquiries"
  ON public.purchase_enquiries FOR ALL
  USING (public.current_user_has_mobile_admin_permission('support.write'))
  WITH CHECK (public.current_user_has_mobile_admin_permission('support.write'));

DROP TRIGGER IF EXISTS purchase_enquiries_updated_at ON public.purchase_enquiries;
CREATE TRIGGER purchase_enquiries_updated_at BEFORE UPDATE ON public.purchase_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  related_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  related_course_payment_id UUID REFERENCES public.course_payments(id) ON DELETE SET NULL,
  preferred_contact_method TEXT NOT NULL DEFAULT 'email'
    CHECK (preferred_contact_method IN ('email', 'phone', 'whatsapp', 'app')),
  urgency TEXT NOT NULL DEFAULT 'normal'
    CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'under_review', 'waiting_for_user', 'in_progress', 'resolved', 'closed')),
  assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_user_reply_at TIMESTAMPTZ,
  last_admin_reply_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_created
  ON public.support_tickets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_urgency
  ON public.support_tickets (status, urgency, created_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own support tickets" ON public.support_tickets;
CREATE POLICY "Users read own support tickets"
  ON public.support_tickets FOR SELECT
  USING (user_id = auth.uid() OR public.current_user_has_mobile_admin_permission('support.read'));

DROP POLICY IF EXISTS "Users create own support tickets" ON public.support_tickets;
CREATE POLICY "Users create own support tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own open support tickets" ON public.support_tickets;
CREATE POLICY "Users update own open support tickets"
  ON public.support_tickets FOR UPDATE
  USING (user_id = auth.uid() AND status IN ('submitted', 'waiting_for_user', 'in_progress', 'resolved'))
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage support tickets" ON public.support_tickets;
CREATE POLICY "Admins manage support tickets"
  ON public.support_tickets FOR ALL
  USING (public.current_user_has_mobile_admin_permission('support.write'))
  WITH CHECK (public.current_user_has_mobile_admin_permission('support.write'));

DROP TRIGGER IF EXISTS support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'user'
    CHECK (visibility IN ('user', 'internal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_created
  ON public.support_ticket_messages (ticket_id, created_at);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read visible support messages" ON public.support_ticket_messages;
CREATE POLICY "Users read visible support messages"
  ON public.support_ticket_messages FOR SELECT
  USING (
    public.current_user_has_mobile_admin_permission('support.read')
    OR (
      visibility = 'user'
      AND EXISTS (
        SELECT 1 FROM public.support_tickets t
        WHERE t.id = support_ticket_messages.ticket_id
          AND t.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users create own visible support messages" ON public.support_ticket_messages;
CREATE POLICY "Users create own visible support messages"
  ON public.support_ticket_messages FOR INSERT
  WITH CHECK (
    visibility = 'user'
    AND author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_ticket_messages.ticket_id
        AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage support messages" ON public.support_ticket_messages;
CREATE POLICY "Admins manage support messages"
  ON public.support_ticket_messages FOR ALL
  USING (public.current_user_has_mobile_admin_permission('support.write'))
  WITH CHECK (public.current_user_has_mobile_admin_permission('support.write'));

CREATE TABLE IF NOT EXISTS public.support_ticket_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  bucket TEXT NOT NULL DEFAULT 'support-attachments',
  path TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT,
  size_bytes BIGINT CHECK (size_bytes IS NULL OR size_bytes >= 0),
  visibility TEXT NOT NULL DEFAULT 'user' CHECK (visibility IN ('user', 'internal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bucket, path)
);

ALTER TABLE public.support_ticket_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read visible support attachments" ON public.support_ticket_attachments;
CREATE POLICY "Users read visible support attachments"
  ON public.support_ticket_attachments FOR SELECT
  USING (
    public.current_user_has_mobile_admin_permission('support.read')
    OR (
      visibility = 'user'
      AND EXISTS (
        SELECT 1 FROM public.support_tickets t
        WHERE t.id = support_ticket_attachments.ticket_id
          AND t.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Admins manage support attachments" ON public.support_ticket_attachments;
CREATE POLICY "Admins manage support attachments"
  ON public.support_ticket_attachments FOR ALL
  USING (public.current_user_has_mobile_admin_permission('support.write'))
  WITH CHECK (public.current_user_has_mobile_admin_permission('support.write'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

DROP POLICY IF EXISTS "Admins manage support attachments storage" ON storage.objects;
CREATE POLICY "Admins manage support attachments storage"
  ON storage.objects FOR ALL
  USING (bucket_id = 'support-attachments' AND public.current_user_has_mobile_admin_permission('support.write'))
  WITH CHECK (bucket_id = 'support-attachments' AND public.current_user_has_mobile_admin_permission('support.write'));

CREATE TABLE IF NOT EXISTS public.child_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  age_range TEXT NOT NULL CHECK (age_range IN ('under_5', '5_7', '8_10', '11_13', '14_plus', 'prefer_not_to_say')),
  avatar_url TEXT,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_child_profiles_parent_status
  ON public.child_profiles (parent_user_id, status, created_at DESC);

ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents manage own child profiles" ON public.child_profiles;
CREATE POLICY "Parents manage own child profiles"
  ON public.child_profiles FOR ALL
  USING (parent_user_id = auth.uid())
  WITH CHECK (parent_user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage child profiles" ON public.child_profiles;
CREATE POLICY "Admins manage child profiles"
  ON public.child_profiles FOR ALL
  USING (public.current_user_has_mobile_admin_permission('children.write'))
  WITH CHECK (public.current_user_has_mobile_admin_permission('children.write'));

DROP TRIGGER IF EXISTS child_profiles_updated_at ON public.child_profiles;
CREATE TRIGGER child_profiles_updated_at BEFORE UPDATE ON public.child_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.child_course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_profile_id UUID NOT NULL REFERENCES public.child_profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (child_profile_id, course_id)
);

ALTER TABLE public.child_course_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents read own child course assignments" ON public.child_course_assignments;
CREATE POLICY "Parents read own child course assignments"
  ON public.child_course_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = child_course_assignments.child_profile_id
        AND cp.parent_user_id = auth.uid()
    )
    OR public.current_user_has_mobile_admin_permission('children.read')
  );

DROP POLICY IF EXISTS "Parents manage own child course assignments" ON public.child_course_assignments;
CREATE POLICY "Parents manage own child course assignments"
  ON public.child_course_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = child_course_assignments.child_profile_id
        AND cp.parent_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.child_profiles cp
      WHERE cp.id = child_course_assignments.child_profile_id
        AND cp.parent_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage child course assignments" ON public.child_course_assignments;
CREATE POLICY "Admins manage child course assignments"
  ON public.child_course_assignments FOR ALL
  USING (public.current_user_has_mobile_admin_permission('children.write'))
  WITH CHECK (public.current_user_has_mobile_admin_permission('children.write'));

DROP TRIGGER IF EXISTS child_course_assignments_updated_at ON public.child_course_assignments;
CREATE TRIGGER child_course_assignments_updated_at BEFORE UPDATE ON public.child_course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selected_reason TEXT NOT NULL,
  other_reason_details TEXT,
  additional_details TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_deletion_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 days'),
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'under_review', 'scheduled', 'cancelled_by_user', 'on_hold_for_security_review', 'completed', 'rejected')),
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'reviewing', 'scheduled', 'on_hold', 'completed', 'cancelled')),
  reviewing_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  user_visible_notes TEXT,
  cancellation_timestamp TIMESTAMPTZ,
  completion_timestamp TIMESTAMPTZ,
  data_deletion_result_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  retention_exceptions JSONB NOT NULL DEFAULT '{}'::jsonb,
  security_hold_reason TEXT,
  security_hold_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  security_hold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_deletion_active_user
  ON public.account_deletion_requests (user_id)
  WHERE status IN ('requested', 'under_review', 'scheduled', 'on_hold_for_security_review');

CREATE INDEX IF NOT EXISTS idx_account_deletion_status_schedule
  ON public.account_deletion_requests (status, scheduled_deletion_at);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Users read own deletion requests"
  ON public.account_deletion_requests FOR SELECT
  USING (user_id = auth.uid() OR public.current_user_has_mobile_admin_permission('deletion.read'));

DROP POLICY IF EXISTS "Users create own deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Users create own deletion requests"
  ON public.account_deletion_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users cancel own deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Users cancel own deletion requests"
  ON public.account_deletion_requests FOR UPDATE
  USING (user_id = auth.uid() AND status IN ('requested', 'under_review', 'scheduled'))
  WITH CHECK (user_id = auth.uid() AND status = 'cancelled_by_user');

DROP POLICY IF EXISTS "Admins manage deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Admins manage deletion requests"
  ON public.account_deletion_requests FOR ALL
  USING (public.current_user_has_mobile_admin_permission('deletion.write'))
  WITH CHECK (public.current_user_has_mobile_admin_permission('deletion.write'));

DROP TRIGGER IF EXISTS account_deletion_requests_updated_at ON public.account_deletion_requests;
CREATE TRIGGER account_deletion_requests_updated_at BEFORE UPDATE ON public.account_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
  moderation_reason TEXT,
  admin_response TEXT,
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read approved product reviews" ON public.product_reviews;
CREATE POLICY "Public read approved product reviews"
  ON public.product_reviews FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid() OR public.current_user_has_mobile_admin_permission('reviews.read'));

DROP POLICY IF EXISTS "Users create own product reviews" ON public.product_reviews;
CREATE POLICY "Users create own product reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own pending product reviews" ON public.product_reviews;
CREATE POLICY "Users update own pending product reviews"
  ON public.product_reviews FOR UPDATE
  USING (user_id = auth.uid() AND status IN ('pending', 'rejected'))
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Admins moderate product reviews" ON public.product_reviews;
CREATE POLICY "Admins moderate product reviews"
  ON public.product_reviews FOR ALL
  USING (public.current_user_has_mobile_admin_permission('reviews.write'))
  WITH CHECK (public.current_user_has_mobile_admin_permission('reviews.write'));

DROP TRIGGER IF EXISTS product_reviews_updated_at ON public.product_reviews;
CREATE TRIGGER product_reviews_updated_at BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.mobile_admin_change_product_price(
  p_admin_id UUID,
  p_product_id UUID,
  p_regular_price NUMERIC,
  p_sale_price NUMERIC DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous public.products%ROWTYPE;
  v_updated public.products%ROWTYPE;
BEGIN
  IF NOT public.user_has_mobile_admin_permission(p_admin_id, 'products.price.write') THEN
    RAISE EXCEPTION 'Admin permission is required.' USING ERRCODE = '42501';
  END IF;

  IF p_regular_price IS NULL OR p_regular_price < 0 THEN
    RAISE EXCEPTION 'Regular price must be non-negative.' USING ERRCODE = '22023';
  END IF;

  IF p_sale_price IS NOT NULL AND p_sale_price < 0 THEN
    RAISE EXCEPTION 'Sale price must be non-negative.' USING ERRCODE = '22023';
  END IF;

  IF p_sale_price IS NOT NULL AND p_sale_price > p_regular_price THEN
    RAISE EXCEPTION 'Sale price cannot exceed regular price.' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_previous
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.products
  SET
    price = p_regular_price,
    sale_price = p_sale_price,
    sale_enabled = p_sale_price IS NOT NULL,
    updated_at = NOW()
  WHERE id = p_product_id
  RETURNING * INTO v_updated;

  INSERT INTO public.product_price_history (
    product_id,
    admin_id,
    previous_regular_price,
    new_regular_price,
    previous_sale_price,
    new_sale_price,
    reason
  )
  VALUES (
    p_product_id,
    p_admin_id,
    v_previous.price,
    v_updated.price,
    v_previous.sale_price,
    v_updated.sale_price,
    NULLIF(trim(COALESCE(p_reason, '')), '')
  );

  INSERT INTO public.mobile_audit_events (user_id, event_type, entity_type, entity_id, metadata)
  VALUES (
    p_admin_id,
    'mobile_admin_product_price_changed',
    'product',
    p_product_id,
    jsonb_build_object(
      'previousRegularPrice', v_previous.price,
      'newRegularPrice', v_updated.price,
      'previousSalePrice', v_previous.sale_price,
      'newSalePrice', v_updated.sale_price
    )
  );

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.mobile_admin_change_product_price(UUID, UUID, NUMERIC, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mobile_admin_change_product_price(UUID, UUID, NUMERIC, NUMERIC, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.mobile_admin_adjust_product_inventory(
  p_admin_id UUID,
  p_product_id UUID,
  p_mode TEXT,
  p_quantity INTEGER,
  p_reason TEXT
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous INTEGER;
  v_new INTEGER;
  v_updated public.products%ROWTYPE;
BEGIN
  IF NOT public.user_has_mobile_admin_permission(p_admin_id, 'products.inventory.write') THEN
    RAISE EXCEPTION 'Admin permission is required.' USING ERRCODE = '42501';
  END IF;

  IF p_mode NOT IN ('increase', 'reduce', 'set') THEN
    RAISE EXCEPTION 'Inventory adjustment mode is invalid.' USING ERRCODE = '22023';
  END IF;

  IF p_quantity IS NULL OR p_quantity < 0 THEN
    RAISE EXCEPTION 'Inventory quantity must be non-negative.' USING ERRCODE = '22023';
  END IF;

  IF NULLIF(trim(COALESCE(p_reason, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Inventory adjustment reason is required.' USING ERRCODE = '22023';
  END IF;

  SELECT stock
  INTO v_previous
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found.' USING ERRCODE = 'P0002';
  END IF;

  v_new := CASE
    WHEN p_mode = 'increase' THEN v_previous + p_quantity
    WHEN p_mode = 'reduce' THEN v_previous - p_quantity
    ELSE p_quantity
  END;

  IF v_new < 0 THEN
    RAISE EXCEPTION 'Inventory cannot be negative.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.products
  SET stock = v_new, updated_at = NOW()
  WHERE id = p_product_id
  RETURNING * INTO v_updated;

  INSERT INTO public.inventory_adjustments (
    product_id,
    previous_quantity,
    quantity_changed,
    new_quantity,
    adjustment_type,
    reason,
    admin_user_id
  )
  VALUES (
    p_product_id,
    v_previous,
    v_new - v_previous,
    v_new,
    'manual_adjustment',
    p_reason,
    p_admin_id
  );

  INSERT INTO public.mobile_audit_events (user_id, event_type, entity_type, entity_id, metadata)
  VALUES (
    p_admin_id,
    'mobile_admin_product_inventory_adjusted',
    'product',
    p_product_id,
    jsonb_build_object('mode', p_mode, 'previousStock', v_previous, 'newStock', v_new)
  );

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.mobile_admin_adjust_product_inventory(UUID, UUID, TEXT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mobile_admin_adjust_product_inventory(UUID, UUID, TEXT, INTEGER, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.request_account_deletion(
  p_user_id UUID,
  p_selected_reason TEXT,
  p_other_reason_details TEXT DEFAULT NULL,
  p_additional_details TEXT DEFAULT NULL
)
RETURNS public.account_deletion_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.account_deletion_requests%ROWTYPE;
  v_request public.account_deletion_requests%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Authenticated user is required.' USING ERRCODE = '42501';
  END IF;

  IF NULLIF(trim(COALESCE(p_selected_reason, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Deletion reason is required.' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.account_deletion_requests
  WHERE user_id = p_user_id
    AND status IN ('requested', 'under_review', 'scheduled', 'on_hold_for_security_review')
  ORDER BY requested_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN v_existing;
  END IF;

  INSERT INTO public.account_deletion_requests (
    user_id,
    selected_reason,
    other_reason_details,
    additional_details,
    status,
    review_status
  )
  VALUES (
    p_user_id,
    p_selected_reason,
    NULLIF(trim(COALESCE(p_other_reason_details, '')), ''),
    NULLIF(trim(COALESCE(p_additional_details, '')), ''),
    'requested',
    'pending'
  )
  RETURNING * INTO v_request;

  INSERT INTO public.mobile_audit_events (user_id, event_type, entity_type, entity_id, metadata)
  VALUES (
    p_user_id,
    'mobile_account_deletion_requested',
    'account_deletion_request',
    v_request.id,
    jsonb_build_object('scheduledDeletionAt', v_request.scheduled_deletion_at)
  );

  RETURN v_request;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_account_deletion(UUID, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.restore_account_deletion(p_user_id UUID)
RETURNS public.account_deletion_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.account_deletion_requests%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Authenticated user is required.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.account_deletion_requests
  SET
    status = 'cancelled_by_user',
    review_status = 'cancelled',
    cancellation_timestamp = COALESCE(cancellation_timestamp, NOW()),
    user_visible_notes = COALESCE(user_visible_notes, 'Account deletion request cancelled by user.')
  WHERE user_id = p_user_id
    AND status IN ('requested', 'under_review', 'scheduled', 'on_hold_for_security_review')
  RETURNING * INTO v_request;

  IF NOT FOUND THEN
    SELECT *
    INTO v_request
    FROM public.account_deletion_requests
    WHERE user_id = p_user_id
    ORDER BY requested_at DESC
    LIMIT 1;
  END IF;

  IF v_request.id IS NOT NULL THEN
    INSERT INTO public.mobile_audit_events (user_id, event_type, entity_type, entity_id)
    VALUES (p_user_id, 'mobile_account_deletion_restored', 'account_deletion_request', v_request.id);
  END IF;

  RETURN v_request;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_account_deletion(UUID) TO authenticated;

COMMENT ON TABLE public.mobile_admin_role_permissions IS
  'Database-backed permission allowlist for mobile admin APIs. Clients never submit roles as proof of authorization.';
COMMENT ON TABLE public.support_tickets IS
  'Support issue tracking for mobile and web users. Internal notes live in messages with internal visibility.';
COMMENT ON TABLE public.child_profiles IS
  'Parent-managed child profiles. Children do not need independent passwords.';
COMMENT ON TABLE public.account_deletion_requests IS
  'Five-day account deletion requests. Deletion reasons are private and not stored in public profile data.';
COMMENT ON FUNCTION public.mobile_admin_change_product_price(UUID, UUID, NUMERIC, NUMERIC, TEXT) IS
  'Service-role-only transactional product price change with validation and audit history.';
COMMENT ON FUNCTION public.mobile_admin_adjust_product_inventory(UUID, UUID, TEXT, INTEGER, TEXT) IS
  'Service-role-only transactional stock adjustment with inventory history and audit events.';
COMMENT ON FUNCTION public.request_account_deletion(UUID, TEXT, TEXT, TEXT) IS
  'Authenticated user function for creating an idempotent five-day account deletion request.';
COMMENT ON FUNCTION public.restore_account_deletion(UUID) IS
  'Authenticated user function for idempotently cancelling a pending account deletion request during recovery period.';
