-- Restrict instructor course management to assigned courses and add
-- certificate delivery tracking for training and webinar registrations.

ALTER TABLE public.training_registrations
  ADD COLUMN IF NOT EXISTS certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS certificate_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS certificate_emailed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS certificate_notes TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'training_registrations_certificate_url_http_check'
  ) THEN
    ALTER TABLE public.training_registrations
      ADD CONSTRAINT training_registrations_certificate_url_http_check
      CHECK (certificate_url IS NULL OR certificate_url ~* '^https?://');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_training_registrations_user_certificate
  ON public.training_registrations (user_id, certificate_uploaded_at, certificate_emailed_at);

DROP POLICY IF EXISTS "Published courses are viewable" ON public.courses;
DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
DROP POLICY IF EXISTS "LMS managers manage courses" ON public.courses;
DROP POLICY IF EXISTS "Published and assigned courses are viewable" ON public.courses;
CREATE POLICY "Published and assigned courses are viewable"
  ON public.courses FOR SELECT
  USING (
    published = TRUE
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.course_instructors ci
      WHERE ci.course_id = courses.id
        AND ci.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage courses"
  ON public.courses FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Instructors create courses" ON public.courses;
CREATE POLICY "Instructors create courses"
  ON public.courses FOR INSERT
  WITH CHECK (public.is_lms_manager());

DROP POLICY IF EXISTS "Assigned instructors update courses" ON public.courses;
CREATE POLICY "Assigned instructors update courses"
  ON public.courses FOR UPDATE
  USING (public.can_manage_course(id))
  WITH CHECK (public.can_manage_course(id));

DROP POLICY IF EXISTS "Admins manage course modules" ON public.course_modules;
DROP POLICY IF EXISTS "LMS managers manage course modules" ON public.course_modules;
CREATE POLICY "Assigned managers manage course modules"
  ON public.course_modules FOR ALL
  USING (public.is_admin() OR public.can_manage_course(course_id))
  WITH CHECK (public.is_admin() OR public.can_manage_course(course_id));

DROP POLICY IF EXISTS "Admins manage lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "LMS managers manage lessons" ON public.course_lessons;
CREATE POLICY "Assigned managers manage lessons"
  ON public.course_lessons FOR ALL
  USING (public.is_admin() OR public.can_manage_course(course_id))
  WITH CHECK (public.is_admin() OR public.can_manage_course(course_id));

DROP POLICY IF EXISTS "Admins manage course quizzes" ON public.course_quizzes;
DROP POLICY IF EXISTS "LMS managers manage course quizzes" ON public.course_quizzes;
CREATE POLICY "Assigned managers manage course quizzes"
  ON public.course_quizzes FOR ALL
  USING (public.is_admin() OR public.can_manage_course(course_id))
  WITH CHECK (public.is_admin() OR public.can_manage_course(course_id));

DROP POLICY IF EXISTS "Admins manage quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "LMS managers manage quiz questions" ON public.quiz_questions;
CREATE POLICY "Assigned managers manage quiz questions"
  ON public.quiz_questions FOR ALL
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.course_quizzes q
      WHERE q.id = quiz_questions.quiz_id
        AND public.can_manage_course(q.course_id)
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.course_quizzes q
      WHERE q.id = quiz_questions.quiz_id
        AND public.can_manage_course(q.course_id)
    )
  );

COMMENT ON COLUMN public.training_registrations.certificate_url IS
  'Optional admin-provided URL for a training or webinar certificate delivered to the registrant.';
COMMENT ON COLUMN public.training_registrations.certificate_emailed_at IS
  'Set when the certificate has been emailed outside the website.';
