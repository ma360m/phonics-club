-- Mobile LMS/API safety refinements for idempotent quiz attempts and
-- duplicate-resistant training registrations.

ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS client_attempt_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz_client_attempt
  ON public.quiz_attempts (user_id, quiz_id, client_attempt_id)
  WHERE client_attempt_id IS NOT NULL;

ALTER TABLE public.training_registrations ADD COLUMN IF NOT EXISTS normalized_email TEXT;
UPDATE public.training_registrations
SET normalized_email = lower(trim(email))
WHERE normalized_email IS NULL AND email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_registrations_duplicate_guard
  ON public.training_registrations (
    normalized_email,
    training_type,
    event_title,
    (COALESCE(event_date, DATE '1900-01-01'))
  );

COMMENT ON COLUMN public.quiz_attempts.client_attempt_id IS
  'Optional mobile client attempt id used by secure API endpoints to reject duplicate quiz submissions.';

COMMENT ON INDEX public.idx_training_registrations_duplicate_guard IS
  'Lookup index for server-side duplicate training registration prevention. Kept non-unique to avoid breaking legacy rows.';
