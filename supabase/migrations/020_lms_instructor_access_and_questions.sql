-- LMS instructor access, richer quiz question types, and expiry notification support.
-- This migration keeps store/admin policies admin-only while allowing approved
-- instructors to manage LMS course content.

DO $$
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'instructor';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION is_lms_manager(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id AND role::text IN ('admin', 'instructor')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

DROP POLICY IF EXISTS "Published courses are viewable" ON courses;
CREATE POLICY "Published courses are viewable"
  ON courses FOR SELECT
  USING (published = true OR is_lms_manager());

DROP POLICY IF EXISTS "Admins manage courses" ON courses;
DROP POLICY IF EXISTS "LMS managers manage courses" ON courses;
CREATE POLICY "LMS managers manage courses"
  ON courses FOR ALL
  USING (is_lms_manager())
  WITH CHECK (is_lms_manager());

DROP POLICY IF EXISTS "Admins manage course modules" ON course_modules;
DROP POLICY IF EXISTS "LMS managers manage course modules" ON course_modules;
CREATE POLICY "LMS managers manage course modules"
  ON course_modules FOR ALL
  USING (is_lms_manager() OR can_manage_course(course_id))
  WITH CHECK (is_lms_manager() OR can_manage_course(course_id));

DROP POLICY IF EXISTS "Admins manage lessons" ON course_lessons;
DROP POLICY IF EXISTS "LMS managers manage lessons" ON course_lessons;
CREATE POLICY "LMS managers manage lessons"
  ON course_lessons FOR ALL
  USING (is_lms_manager() OR can_manage_course(course_id))
  WITH CHECK (is_lms_manager() OR can_manage_course(course_id));

DROP POLICY IF EXISTS "Admins manage course quizzes" ON course_quizzes;
DROP POLICY IF EXISTS "LMS managers manage course quizzes" ON course_quizzes;
CREATE POLICY "LMS managers manage course quizzes"
  ON course_quizzes FOR ALL
  USING (is_lms_manager() OR can_manage_course(course_id))
  WITH CHECK (is_lms_manager() OR can_manage_course(course_id));

DROP POLICY IF EXISTS "Admins manage quiz questions" ON quiz_questions;
DROP POLICY IF EXISTS "LMS managers manage quiz questions" ON quiz_questions;
CREATE POLICY "LMS managers manage quiz questions"
  ON quiz_questions FOR ALL
  USING (
    is_lms_manager()
    OR EXISTS (
      SELECT 1 FROM course_quizzes q
      WHERE q.id = quiz_questions.quiz_id AND can_manage_course(q.course_id)
    )
  )
  WITH CHECK (
    is_lms_manager()
    OR EXISTS (
      SELECT 1 FROM course_quizzes q
      WHERE q.id = quiz_questions.quiz_id AND can_manage_course(q.course_id)
    )
  );

DROP POLICY IF EXISTS "Admins manage premium LMS media" ON storage.objects;
CREATE POLICY "Admins manage premium LMS media"
  ON storage.objects FOR ALL
  USING (bucket_id IN ('course-media', 'lesson-content') AND is_lms_manager())
  WITH CHECK (bucket_id IN ('course-media', 'lesson-content') AND is_lms_manager());

DROP POLICY IF EXISTS "Admins manage lms protected storage" ON storage.objects;
CREATE POLICY "Admins manage lms protected storage"
  ON storage.objects FOR ALL
  USING (
    bucket_id IN (
      'course-videos',
      'course-materials',
      'course-resources',
      'assignment-submissions',
      'offline-activity-evidence',
      'payment-receipts',
      'certificate-templates',
      'generated-certificates'
    )
    AND is_lms_manager()
  )
  WITH CHECK (
    bucket_id IN (
      'course-videos',
      'course-materials',
      'course-resources',
      'assignment-submissions',
      'offline-activity-evidence',
      'payment-receipts',
      'certificate-templates',
      'generated-certificates'
    )
    AND is_lms_manager()
  );

DO $$
BEGIN
  ALTER TABLE quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_question_type_check;
  ALTER TABLE quiz_questions
    ADD CONSTRAINT quiz_questions_question_type_check
    CHECK (
      question_type IN (
        'mcq',
        'multiple_select',
        'true_false',
        'short_answer',
        'long_answer',
        'matching',
        'drag_drop',
        'ordering',
        'fill_blank',
        'image',
        'audio',
        'scenario'
      )
    );
END $$;

CREATE INDEX IF NOT EXISTS idx_notification_events_dedupe ON notification_events(dedupe_key);
