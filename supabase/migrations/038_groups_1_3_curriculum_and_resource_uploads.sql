-- Restructure the children's Groups 1-3 course and broaden course resource uploads.

WITH new_curriculum AS (
  SELECT
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Sound Group 1 — s, a, t, i, p, n',
        'description', 'Children learn s, a, t, i, p, and n through the existing sound-group lesson structure.',
        'lessons', '[]'::jsonb
      ),
      jsonb_build_object(
        'title', 'Sound Group 2 — c/k, e, h, r, m, d',
        'description', 'Children practise the /k/ sound spellings with e, h, r, m, and d.',
        'lessons', '[]'::jsonb
      ),
      jsonb_build_object(
        'title', 'Sound Group 3 — g, o, u, l, f, b',
        'description', 'Children continue with g, o, u, l, f, and b before the review module.',
        'lessons', '[]'::jsonb
      ),
      jsonb_build_object(
        'title', 'Groups 1–3 Blending and Segmenting Review',
        'description', 'Children review Groups 1-3 sounds through blending and segmenting practice before the final quiz.',
        'lessons', '[]'::jsonb
      )
    ) AS curriculum
)
UPDATE public.courses
SET
  curriculum = new_curriculum.curriculum,
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'lessons', 42,
    'modules', 4,
    'sounds', 18,
    'quizzes', 1,
    'soundsIncluded', jsonb_build_array(
      's', 'a', 't', 'i', 'p', 'n',
      'c_k', 'e', 'h', 'r', 'm', 'd',
      'g', 'o', 'u', 'l', 'f', 'b'
    )
  ),
  updated_at = NOW()
FROM new_curriculum
WHERE slug = 'jolly-phonics-sounds-groups-1-3';

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-1-3'
),
desired_modules(new_sort, title, description) AS (
  VALUES
    (1, 'Sound Group 1 — s, a, t, i, p, n', 'Children learn s, a, t, i, p, and n through the existing sound-group lesson structure.'),
    (2, 'Sound Group 2 — c/k, e, h, r, m, d', 'Children practise the /k/ sound spellings with e, h, r, m, and d.'),
    (3, 'Sound Group 3 — g, o, u, l, f, b', 'Children continue with g, o, u, l, f, and b before the review module.'),
    (4, 'Groups 1–3 Blending and Segmenting Review', 'Children review Groups 1-3 sounds through blending and segmenting practice before the final quiz.')
)
INSERT INTO public.course_modules (course_id, title, description, sort_order)
SELECT target_course.id, desired_modules.title, desired_modules.description, 100 + desired_modules.new_sort
FROM target_course
CROSS JOIN desired_modules
WHERE NOT EXISTS (
  SELECT 1
  FROM public.course_modules existing
  WHERE existing.course_id = target_course.id
    AND existing.title = desired_modules.title
);

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-1-3'
),
module_map(old_sort, new_sort) AS (
  VALUES
    (2, 1),
    (3, 1),
    (4, 2),
    (5, 2),
    (6, 3),
    (7, 3),
    (8, 4),
    (9, 4)
),
desired_modules(new_sort, title) AS (
  VALUES
    (1, 'Sound Group 1 — s, a, t, i, p, n'),
    (2, 'Sound Group 2 — c/k, e, h, r, m, d'),
    (3, 'Sound Group 3 — g, o, u, l, f, b'),
    (4, 'Groups 1–3 Blending and Segmenting Review')
)
UPDATE public.course_lessons lesson
SET
  module_id = target_module.id,
  updated_at = NOW()
FROM target_course
JOIN public.course_modules source_module
  ON source_module.course_id = target_course.id
JOIN module_map
  ON module_map.old_sort = source_module.sort_order
JOIN desired_modules
  ON desired_modules.new_sort = module_map.new_sort
JOIN public.course_modules target_module
  ON target_module.course_id = target_course.id
 AND target_module.title = desired_modules.title
WHERE lesson.course_id = target_course.id
  AND lesson.module_id = source_module.id
  AND lesson.module_id <> target_module.id;

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-1-3'
),
module_map(old_sort, new_sort) AS (
  VALUES
    (2, 1),
    (3, 1),
    (4, 2),
    (5, 2),
    (6, 3),
    (7, 3),
    (8, 4),
    (9, 4)
),
desired_modules(new_sort, title) AS (
  VALUES
    (1, 'Sound Group 1 — s, a, t, i, p, n'),
    (2, 'Sound Group 2 — c/k, e, h, r, m, d'),
    (3, 'Sound Group 3 — g, o, u, l, f, b'),
    (4, 'Groups 1–3 Blending and Segmenting Review')
)
UPDATE public.course_resources resource
SET
  module_id = target_module.id,
  updated_at = NOW()
FROM target_course
JOIN public.course_modules source_module
  ON source_module.course_id = target_course.id
JOIN module_map
  ON module_map.old_sort = source_module.sort_order
JOIN desired_modules
  ON desired_modules.new_sort = module_map.new_sort
JOIN public.course_modules target_module
  ON target_module.course_id = target_course.id
 AND target_module.title = desired_modules.title
WHERE resource.course_id = target_course.id
  AND resource.module_id = source_module.id
  AND resource.module_id <> target_module.id;

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-1-3'
)
UPDATE public.course_lessons lesson
SET
  title = CASE lesson.title
    WHEN 'Sound c' THEN 'Sound c/k'
    WHEN 'Final Review and Assessment' THEN 'Groups 1-3 Review'
    ELSE lesson.title
  END,
  description = CASE lesson.title
    WHEN 'Sound c' THEN 'Content required: teach the /k/ sound with c and k spellings while adding approved media.'
    WHEN 'Final Review and Assessment' THEN 'Content required: add recognition, listening, matching, formation, blending and segmenting checks.'
    ELSE lesson.description
  END,
  updated_at = NOW()
FROM target_course
WHERE lesson.course_id = target_course.id
  AND lesson.title IN ('Sound c', 'Final Review and Assessment');

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-1-3'
)
DELETE FROM public.course_lessons lesson
USING target_course
WHERE lesson.course_id = target_course.id
  AND lesson.title IN ('Welcome Video', 'How Activities Work', 'Sound k');

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-1-3'
),
desired_titles(title) AS (
  VALUES
    ('Sound Group 1 — s, a, t, i, p, n'),
    ('Sound Group 2 — c/k, e, h, r, m, d'),
    ('Sound Group 3 — g, o, u, l, f, b'),
    ('Groups 1–3 Blending and Segmenting Review')
)
DELETE FROM public.course_modules module
USING target_course
WHERE module.course_id = target_course.id
  AND NOT EXISTS (
    SELECT 1
    FROM desired_titles
    WHERE desired_titles.title = module.title
  );

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-1-3'
),
desired_modules(new_sort, title, description) AS (
  VALUES
    (1, 'Sound Group 1 — s, a, t, i, p, n', 'Children learn s, a, t, i, p, and n through the existing sound-group lesson structure.'),
    (2, 'Sound Group 2 — c/k, e, h, r, m, d', 'Children practise the /k/ sound spellings with e, h, r, m, and d.'),
    (3, 'Sound Group 3 — g, o, u, l, f, b', 'Children continue with g, o, u, l, f, and b before the review module.'),
    (4, 'Groups 1–3 Blending and Segmenting Review', 'Children review Groups 1-3 sounds through blending and segmenting practice before the final quiz.')
)
UPDATE public.course_modules module
SET
  title = desired_modules.title,
  description = desired_modules.description,
  sort_order = desired_modules.new_sort,
  updated_at = NOW()
FROM target_course, desired_modules
WHERE module.course_id = target_course.id
  AND module.title = desired_modules.title;

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-1-3'
),
ranked_lessons AS (
  SELECT
    lesson.id,
    ROW_NUMBER() OVER (
      PARTITION BY lesson.module_id
      ORDER BY
        CASE lesson.title
          WHEN 'Sound s' THEN 1
          WHEN 'Sound a' THEN 2
          WHEN 'Sound t' THEN 3
          WHEN 'Sound i' THEN 4
          WHEN 'Sound p' THEN 5
          WHEN 'Sound n' THEN 6
          WHEN 'Group 1 Flashcard Review' THEN 7
          WHEN 'Group 1 Formation Practice' THEN 8
          WHEN 'Group 1 Listening Game' THEN 9
          WHEN 'Group 1 Blending Practice' THEN 10
          WHEN 'Group 1 Segmenting Practice' THEN 11
          WHEN 'Group 1 Checkpoint' THEN 12
          WHEN 'Group 1 Practice and Review' THEN 13
          WHEN 'Sound c/k' THEN 1
          WHEN 'Sound e' THEN 2
          WHEN 'Sound h' THEN 3
          WHEN 'Sound r' THEN 4
          WHEN 'Sound m' THEN 5
          WHEN 'Sound d' THEN 6
          WHEN 'Group 2 Flashcard Review' THEN 7
          WHEN 'Group 2 Formation Practice' THEN 8
          WHEN 'Group 2 Listening Game' THEN 9
          WHEN 'Groups 1-2 Blending' THEN 10
          WHEN 'Groups 1-2 Segmenting' THEN 11
          WHEN 'Group 2 Checkpoint' THEN 12
          WHEN 'Group 2 Practice and Review' THEN 13
          WHEN 'Sound g' THEN 1
          WHEN 'Sound o' THEN 2
          WHEN 'Sound u' THEN 3
          WHEN 'Sound l' THEN 4
          WHEN 'Sound f' THEN 5
          WHEN 'Sound b' THEN 6
          WHEN 'Group 3 Flashcard Review' THEN 7
          WHEN 'Group 3 Formation Practice' THEN 8
          WHEN 'Group 3 Listening Game' THEN 9
          WHEN 'Groups 1-3 Blending' THEN 10
          WHEN 'Groups 1-3 Segmenting' THEN 11
          WHEN 'Group 3 Checkpoint' THEN 12
          WHEN 'Group 3 Practice and Review' THEN 13
          WHEN 'Groups 1-3 Blending Activities' THEN 1
          WHEN 'Groups 1-3 Segmenting Activities' THEN 2
          WHEN 'Groups 1-3 Review' THEN 3
          ELSE 100 + lesson.sort_order
        END,
        lesson.sort_order,
        lesson.created_at,
        lesson.title
    ) AS new_sort
  FROM public.course_lessons lesson
  JOIN target_course
    ON target_course.id = lesson.course_id
)
UPDATE public.course_lessons lesson
SET
  sort_order = ranked_lessons.new_sort,
  updated_at = NOW()
FROM ranked_lessons
WHERE lesson.id = ranked_lessons.id;

WITH sound_order(title, sound_key, display_text, sound_group, sequence_order) AS (
  VALUES
    ('Sound s', 's', 's', 1, 1),
    ('Sound a', 'a', 'a', 1, 2),
    ('Sound t', 't', 't', 1, 3),
    ('Sound i', 'i', 'i', 1, 4),
    ('Sound p', 'p', 'p', 1, 5),
    ('Sound n', 'n', 'n', 1, 6),
    ('Sound c/k', 'c_k', 'c/k', 2, 7),
    ('Sound e', 'e', 'e', 2, 8),
    ('Sound h', 'h', 'h', 2, 9),
    ('Sound r', 'r', 'r', 2, 10),
    ('Sound m', 'm', 'm', 2, 11),
    ('Sound d', 'd', 'd', 2, 12),
    ('Sound g', 'g', 'g', 3, 13),
    ('Sound o', 'o', 'o', 3, 14),
    ('Sound u', 'u', 'u', 3, 15),
    ('Sound l', 'l', 'l', 3, 16),
    ('Sound f', 'f', 'f', 3, 17),
    ('Sound b', 'b', 'b', 3, 18)
)
UPDATE public.phonics_sound_profiles profile
SET
  sound_key = sound_order.sound_key,
  display_text = sound_order.display_text,
  sound_group = sound_order.sound_group,
  course_part = 1,
  sequence_order = sound_order.sequence_order,
  updated_at = NOW()
FROM public.course_lessons lesson
JOIN public.courses course
  ON course.id = lesson.course_id
JOIN sound_order
  ON sound_order.title = lesson.title
WHERE profile.lesson_id = lesson.id
  AND course.slug = 'jolly-phonics-sounds-groups-1-3';

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-1-3'
)
UPDATE public.course_quizzes quiz
SET
  title = 'Final Quiz',
  description = 'Final quiz for the Groups 1-3 blending and segmenting course. Add approved questions before publishing.',
  lesson_id = NULL,
  sort_order = 1,
  updated_at = NOW()
FROM target_course
WHERE quiz.course_id = target_course.id
  AND quiz.title IN ('Final Quiz', 'Final Assessment');

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-1-3'
)
INSERT INTO public.course_quizzes (
  course_id,
  lesson_id,
  title,
  description,
  passing_score,
  max_attempts,
  sort_order,
  published
)
SELECT
  target_course.id,
  NULL,
  'Final Quiz',
  'Final quiz for the Groups 1-3 blending and segmenting course. Add approved questions before publishing.',
  70,
  3,
  1,
  FALSE
FROM target_course
WHERE NOT EXISTS (
  SELECT 1
  FROM public.course_quizzes existing
  WHERE existing.course_id = target_course.id
    AND existing.title = 'Final Quiz'
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('course-resources', 'course-resources', false, 524288000, ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/aac',
    'audio/m4a',
    'audio/mp4',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/wave',
    'audio/webm',
    'audio/x-m4a',
    'audio/x-wav',
    'video/mp4',
    'video/mov',
    'video/quicktime',
    'video/webm',
    'application/zip',
    'application/x-zip-compressed'
  ])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
