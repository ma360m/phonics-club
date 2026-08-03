-- Rollback for LearnPress migration batch learnpress-2026-08-01T15-31-44-674Z
-- Generated before applying database changes.
-- Storage files created under course-media/learnpress/learnpress-2026-08-01T15-31-44-674Z,
-- course-videos/learnpress/learnpress-2026-08-01T15-31-44-674Z, and course-resources/learnpress/learnpress-2026-08-01T15-31-44-674Z
-- should be removed from Supabase Storage if this rollback is used.

BEGIN;

DELETE FROM course_resource_downloads
WHERE course_id IN (
  SELECT id FROM courses WHERE metadata->>'migration_batch' = 'learnpress-2026-08-01T15-31-44-674Z'
);

DELETE FROM quiz_attempts
WHERE course_id IN (
  SELECT id FROM courses WHERE metadata->>'migration_batch' = 'learnpress-2026-08-01T15-31-44-674Z'
);

DELETE FROM quiz_questions
WHERE quiz_id IN (
  SELECT id FROM course_quizzes WHERE course_id IN (
    SELECT id FROM courses WHERE metadata->>'migration_batch' = 'learnpress-2026-08-01T15-31-44-674Z'
  )
);

DELETE FROM course_quizzes
WHERE course_id IN (
  SELECT id FROM courses WHERE metadata->>'migration_batch' = 'learnpress-2026-08-01T15-31-44-674Z'
);

DELETE FROM course_resources
WHERE course_id IN (
  SELECT id FROM courses WHERE metadata->>'migration_batch' = 'learnpress-2026-08-01T15-31-44-674Z'
);

DELETE FROM lesson_progress
WHERE course_id IN (
  SELECT id FROM courses WHERE metadata->>'migration_batch' = 'learnpress-2026-08-01T15-31-44-674Z'
);

DELETE FROM course_lessons
WHERE course_id IN (
  SELECT id FROM courses WHERE metadata->>'migration_batch' = 'learnpress-2026-08-01T15-31-44-674Z'
);

DELETE FROM course_modules
WHERE course_id IN (
  SELECT id FROM courses WHERE metadata->>'migration_batch' = 'learnpress-2026-08-01T15-31-44-674Z'
);

DELETE FROM courses
WHERE metadata->>'migration_batch' = 'learnpress-2026-08-01T15-31-44-674Z';

COMMIT;
