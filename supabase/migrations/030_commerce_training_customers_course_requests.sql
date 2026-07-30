-- Commerce, training events, and learner course request support.
-- Additive migration after 029. Does not rewrite earlier migrations.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (discount_percent >= 0 AND discount_percent <= 100),
  ADD COLUMN IF NOT EXISTS coupon_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (coupon_discount_percent >= 0 AND coupon_discount_percent <= 100),
  ADD COLUMN IF NOT EXISTS member_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (member_discount_percent >= 0 AND member_discount_percent <= 100),
  ADD COLUMN IF NOT EXISTS shipping_discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (shipping_discount_amount >= 0),
  ADD COLUMN IF NOT EXISTS shipping_discount_reason TEXT;

ALTER TABLE public.member_discounts
  ADD COLUMN IF NOT EXISTS free_shipping_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.orders.discount_percent IS
  'Aggregate product discount percentage applied at checkout. For display/audit only; order totals remain authoritative.';
COMMENT ON COLUMN public.orders.coupon_discount_percent IS
  'Coupon percentage or effective coupon percentage applied at checkout.';
COMMENT ON COLUMN public.orders.member_discount_percent IS
  'Member ID percentage applied at checkout.';
COMMENT ON COLUMN public.orders.shipping_discount_amount IS
  'Shipping amount waived or discounted by a privileged server-side rule.';
COMMENT ON COLUMN public.member_discounts.free_shipping_enabled IS
  'When enabled, this Member ID waives the configured shop shipping fee during checkout.';

CREATE TABLE IF NOT EXISTS public.training_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('onsite_training', 'online_webinar')),
  event_date DATE,
  season TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'upcoming', 'closed', 'cancelled')),
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 100,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_training_events_unique_event
  ON public.training_events (LOWER(title), event_type, COALESCE(event_date, DATE '1900-01-01'));
CREATE INDEX IF NOT EXISTS idx_training_events_public
  ON public.training_events (published, event_type, event_date, sort_order);

ALTER TABLE public.training_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published training events" ON public.training_events;
CREATE POLICY "Public read published training events"
  ON public.training_events FOR SELECT
  USING (published = TRUE AND status <> 'draft');

DROP POLICY IF EXISTS "Admins manage training events" ON public.training_events;
CREATE POLICY "Admins manage training events"
  ON public.training_events FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS training_events_updated_at ON public.training_events;
CREATE TRIGGER training_events_updated_at BEFORE UPDATE ON public.training_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.training_events (title, event_type, event_date, season, status, sort_order, published)
VALUES
  ('Jolly Phonics', 'onsite_training', DATE '2026-08-08', 'August Cohort', 'open', 10, TRUE),
  ('Jolly Literacy Training', 'onsite_training', DATE '2026-08-22', 'August Cohort', 'open', 20, TRUE),
  ('Jolly Phonics', 'onsite_training', DATE '2026-09-12', 'September Cohort', 'upcoming', 30, TRUE),
  ('Jolly Literacy Training', 'onsite_training', DATE '2026-10-10', 'October Cohort', 'upcoming', 40, TRUE),
  ('Learning to Read & Write', 'online_webinar', DATE '2026-08-15', 'August Webinar', 'open', 10, TRUE),
  ('Synthetic Phonics for Early Years', 'online_webinar', DATE '2026-09-05', 'September Webinar', 'open', 20, TRUE),
  ('Jolly Literacy Training Webinar', 'online_webinar', DATE '2026-10-17', 'October Webinar', 'upcoming', 30, TRUE),
  ('Supporting Struggling Readers', 'online_webinar', DATE '2026-11-14', 'November Webinar', 'upcoming', 40, TRUE)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.course_cancellation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled_by_user')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_course_cancellation_requests_one_pending
  ON public.course_cancellation_requests (user_id, course_id)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_course_cancellation_requests_admin
  ON public.course_cancellation_requests (status, created_at DESC);

ALTER TABLE public.course_cancellation_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own course cancellation requests" ON public.course_cancellation_requests;
CREATE POLICY "Users manage own course cancellation requests"
  ON public.course_cancellation_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own course cancellation requests" ON public.course_cancellation_requests;
CREATE POLICY "Users create own course cancellation requests"
  ON public.course_cancellation_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage course cancellation requests" ON public.course_cancellation_requests;
CREATE POLICY "Admins manage course cancellation requests"
  ON public.course_cancellation_requests FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS course_cancellation_requests_updated_at ON public.course_cancellation_requests;
CREATE TRIGGER course_cancellation_requests_updated_at BEFORE UPDATE ON public.course_cancellation_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.training_events IS
  'Admin-managed upcoming onsite trainings and online webinars displayed on the Trainings page.';
COMMENT ON TABLE public.course_cancellation_requests IS
  'Learner course-cancellation requests. Admin review remains required for refunds, access changes, or payment cleanup.';
