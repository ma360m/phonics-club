-- Optional separate payment for course certificates.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS certificate_requires_payment BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS certificate_price DECIMAL(10,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'courses_certificate_price_nonnegative_check'
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_certificate_price_nonnegative_check
      CHECK (certificate_price >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'courses_certificate_paid_price_check'
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_certificate_paid_price_check
      CHECK (certificate_requires_payment = FALSE OR certificate_price > 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_courses_certificate_payment
  ON public.courses (certificate_requires_payment, certificate_enabled);

COMMENT ON COLUMN public.courses.certificate_requires_payment IS
  'When true, eligible learners must submit and receive approval for a certificate payment before a certificate can be generated.';

COMMENT ON COLUMN public.courses.certificate_price IS
  'Separate certificate payment amount in the course currency.';
