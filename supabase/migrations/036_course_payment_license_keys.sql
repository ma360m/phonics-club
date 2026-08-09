-- Add licence-key unlock tracking for paid online courses.
-- Admin approval records a key and emails it to the learner; the learner enters
-- the key before the enrollment becomes active.

ALTER TABLE public.course_payments
  ADD COLUMN IF NOT EXISTS license_key TEXT,
  ADD COLUMN IF NOT EXISTS license_emailed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS license_unlocked_at TIMESTAMPTZ;

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS license_key TEXT,
  ADD COLUMN IF NOT EXISTS license_unlocked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.course_payments.license_key IS
  'Licence key issued by admin after payment approval. The learner uses this key to unlock paid course access.';

COMMENT ON COLUMN public.course_payments.license_emailed_at IS
  'Timestamp when the licence-key email was successfully sent to the learner.';

COMMENT ON COLUMN public.course_payments.license_unlocked_at IS
  'Timestamp when the learner entered the licence key and unlocked access.';

COMMENT ON COLUMN public.enrollments.license_key IS
  'Licence key used to activate this paid-course enrollment.';

COMMENT ON COLUMN public.enrollments.license_unlocked_at IS
  'Timestamp when the licence key activated the enrollment.';
