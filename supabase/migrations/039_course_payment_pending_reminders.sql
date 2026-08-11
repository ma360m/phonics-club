-- Track pending-payment course registration reminders and workflow status.

ALTER TABLE public.course_payments
  ADD COLUMN IF NOT EXISTS registration_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_workflow_status TEXT NOT NULL DEFAULT 'pending_payment',
  ADD COLUMN IF NOT EXISTS payment_pending_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_pending_reminder_event_id UUID REFERENCES public.notification_events(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'course_payments_workflow_status_check'
  ) THEN
    ALTER TABLE public.course_payments
      ADD CONSTRAINT course_payments_workflow_status_check
      CHECK (payment_workflow_status IN ('pending_payment', 'slip_uploaded', 'payment_verified', 'licence_issued'));
  END IF;
END $$;

UPDATE public.course_payments
SET registration_expires_at = created_at + INTERVAL '2 days'
WHERE registration_expires_at IS NULL;

UPDATE public.course_payments
SET payment_workflow_status = CASE
  WHEN license_key IS NOT NULL OR license_emailed_at IS NOT NULL OR license_unlocked_at IS NOT NULL THEN 'licence_issued'
  WHEN status = 'paid' OR verified_at IS NOT NULL THEN 'payment_verified'
  WHEN status IN ('submitted', 'processing')
    OR receipt_path IS NOT NULL
    OR receipt_url IS NOT NULL
    OR receipt_filename IS NOT NULL
    OR submitted_at IS NOT NULL THEN 'slip_uploaded'
  ELSE 'pending_payment'
END;

UPDATE public.course_payments
SET registration_expired_at = COALESCE(registration_expired_at, registration_expires_at)
WHERE payment_workflow_status = 'pending_payment'
  AND registration_expires_at <= NOW()
  AND status = 'pending';

CREATE INDEX IF NOT EXISTS idx_course_payments_pending_reminder_due
  ON public.course_payments (status, payment_pending_reminder_sent_at, created_at)
  WHERE payment_workflow_status = 'pending_payment';

CREATE INDEX IF NOT EXISTS idx_course_payments_registration_expiry
  ON public.course_payments (registration_expires_at, registration_expired_at);

COMMENT ON COLUMN public.course_payments.registration_expires_at IS
  'Deadline for a pending paid-course registration request before it is considered expired.';

COMMENT ON COLUMN public.course_payments.registration_expired_at IS
  'Timestamp when the pending paid-course registration request crossed its expiry deadline without a valid slip or verification.';

COMMENT ON COLUMN public.course_payments.payment_workflow_status IS
  'Derived course payment workflow state: pending_payment, slip_uploaded, payment_verified, or licence_issued.';

COMMENT ON COLUMN public.course_payments.payment_pending_reminder_sent_at IS
  'Timestamp when the automatic payment-pending reminder email was sent.';

COMMENT ON COLUMN public.course_payments.payment_pending_reminder_event_id IS
  'Notification event row for the payment-pending reminder email.';

NOTIFY pgrst, 'reload schema';
