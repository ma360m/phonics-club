-- Restructure the children's Groups 4-7 course to five modules plus one final quiz.

WITH new_curriculum AS (
  SELECT
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Sound Group 4 — ai, j, oa, ie, ee, or',
        'description', 'Children explore ai, j, oa, ie, ee, and or through the existing sound-group lesson structure.',
        'lessons', '[]'::jsonb
      ),
      jsonb_build_object(
        'title', 'Sound Group 5 — z, w, ng, v, oo (moon), oo (book)',
        'description', 'Children develop confidence with z, w, ng, v, oo as in moon, and oo as in book.',
        'lessons', '[]'::jsonb
      ),
      jsonb_build_object(
        'title', 'Sound Group 6 — y, x, ch, sh, th (unvoiced), th (voiced)',
        'description', 'Children practise y, x, ch, sh, and the two th sounds in the existing lesson structure.',
        'lessons', '[]'::jsonb
      ),
      jsonb_build_object(
        'title', 'Sound Group 7 — qu, ou, oi, ue, er, ar',
        'description', 'Children complete the final Jolly Phonics sound group: qu, ou, oi, ue, er, and ar.',
        'lessons', '[]'::jsonb
      ),
      jsonb_build_object(
        'title', 'Groups 4–7 Blending and Segmenting Review',
        'description', 'Children review Groups 4-7 sounds through blending and segmenting practice before the final quiz.',
        'lessons', '[]'::jsonb
      )
    ) AS curriculum
)
UPDATE public.courses
SET
  curriculum = new_curriculum.curriculum,
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'lessons', 31,
    'modules', 5,
    'sounds', 24,
    'quizzes', 1,
    'soundsIncluded', jsonb_build_array(
      'ai', 'j', 'oa', 'ie', 'ee', 'or',
      'z', 'w', 'ng', 'v', 'oo_long', 'oo_short',
      'y', 'x', 'ch', 'sh', 'th_unvoiced', 'th_voiced',
      'qu', 'ou', 'oi', 'ue', 'er', 'ar'
    )
  ),
  updated_at = NOW()
FROM new_curriculum
WHERE slug = 'jolly-phonics-sounds-groups-4-7';

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-4-7'
),
desired_modules(new_sort, title, description) AS (
  VALUES
    (1, 'Sound Group 4 — ai, j, oa, ie, ee, or', 'Children explore ai, j, oa, ie, ee, and or through the existing sound-group lesson structure.'),
    (2, 'Sound Group 5 — z, w, ng, v, oo (moon), oo (book)', 'Children develop confidence with z, w, ng, v, oo as in moon, and oo as in book.'),
    (3, 'Sound Group 6 — y, x, ch, sh, th (unvoiced), th (voiced)', 'Children practise y, x, ch, sh, and the two th sounds in the existing lesson structure.'),
    (4, 'Sound Group 7 — qu, ou, oi, ue, er, ar', 'Children complete the final Jolly Phonics sound group: qu, ou, oi, ue, er, and ar.'),
    (5, 'Groups 4–7 Blending and Segmenting Review', 'Children review Groups 4-7 sounds through blending and segmenting practice before the final quiz.')
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
  WHERE slug = 'jolly-phonics-sounds-groups-4-7'
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
    (9, 4),
    (10, 5),
    (11, 5)
),
desired_modules(new_sort, title) AS (
  VALUES
    (1, 'Sound Group 4 — ai, j, oa, ie, ee, or'),
    (2, 'Sound Group 5 — z, w, ng, v, oo (moon), oo (book)'),
    (3, 'Sound Group 6 — y, x, ch, sh, th (unvoiced), th (voiced)'),
    (4, 'Sound Group 7 — qu, ou, oi, ue, er, ar'),
    (5, 'Groups 4–7 Blending and Segmenting Review')
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
  WHERE slug = 'jolly-phonics-sounds-groups-4-7'
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
    (9, 4),
    (10, 5),
    (11, 5)
),
desired_modules(new_sort, title) AS (
  VALUES
    (1, 'Sound Group 4 — ai, j, oa, ie, ee, or'),
    (2, 'Sound Group 5 — z, w, ng, v, oo (moon), oo (book)'),
    (3, 'Sound Group 6 — y, x, ch, sh, th (unvoiced), th (voiced)'),
    (4, 'Sound Group 7 — qu, ou, oi, ue, er, ar'),
    (5, 'Groups 4–7 Blending and Segmenting Review')
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
  WHERE slug = 'jolly-phonics-sounds-groups-4-7'
)
UPDATE public.course_lessons lesson
SET
  title = CASE lesson.title
    WHEN 'Sound oo (long)' THEN 'Sound oo (moon)'
    WHEN 'Sound oo (short)' THEN 'Sound oo (book)'
    WHEN 'Complete 42-Sound Review' THEN 'Groups 4-7 Review'
    ELSE lesson.title
  END,
  description = CASE lesson.title
    WHEN 'Sound oo (long)' THEN 'Content required: keep this oo sound separate from oo_book and add distinct pronunciation examples.'
    WHEN 'Sound oo (short)' THEN 'Content required: keep this oo sound separate from oo_moon and add distinct pronunciation examples.'
    WHEN 'Complete 42-Sound Review' THEN 'Content required: add comprehensive Groups 4-7 review activities.'
    ELSE lesson.description
  END,
  updated_at = NOW()
FROM target_course
WHERE lesson.course_id = target_course.id
  AND lesson.title IN ('Sound oo (long)', 'Sound oo (short)', 'Complete 42-Sound Review');

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-4-7'
)
DELETE FROM public.course_lessons lesson
USING target_course
WHERE lesson.course_id = target_course.id
  AND lesson.title IN ('Welcome Back', 'Final Assessment');

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-4-7'
),
desired_titles(title) AS (
  VALUES
    ('Sound Group 4 — ai, j, oa, ie, ee, or'),
    ('Sound Group 5 — z, w, ng, v, oo (moon), oo (book)'),
    ('Sound Group 6 — y, x, ch, sh, th (unvoiced), th (voiced)'),
    ('Sound Group 7 — qu, ou, oi, ue, er, ar'),
    ('Groups 4–7 Blending and Segmenting Review')
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
  WHERE slug = 'jolly-phonics-sounds-groups-4-7'
),
desired_modules(new_sort, title, description) AS (
  VALUES
    (1, 'Sound Group 4 — ai, j, oa, ie, ee, or', 'Children explore ai, j, oa, ie, ee, and or through the existing sound-group lesson structure.'),
    (2, 'Sound Group 5 — z, w, ng, v, oo (moon), oo (book)', 'Children develop confidence with z, w, ng, v, oo as in moon, and oo as in book.'),
    (3, 'Sound Group 6 — y, x, ch, sh, th (unvoiced), th (voiced)', 'Children practise y, x, ch, sh, and the two th sounds in the existing lesson structure.'),
    (4, 'Sound Group 7 — qu, ou, oi, ue, er, ar', 'Children complete the final Jolly Phonics sound group: qu, ou, oi, ue, er, and ar.'),
    (5, 'Groups 4–7 Blending and Segmenting Review', 'Children review Groups 4-7 sounds through blending and segmenting practice before the final quiz.')
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
  WHERE slug = 'jolly-phonics-sounds-groups-4-7'
),
ranked_lessons AS (
  SELECT
    lesson.id,
    ROW_NUMBER() OVER (
      PARTITION BY lesson.module_id
      ORDER BY
        CASE lesson.title
          WHEN 'Sound ai' THEN 1
          WHEN 'Sound j' THEN 2
          WHEN 'Sound oa' THEN 3
          WHEN 'Sound ie' THEN 4
          WHEN 'Sound ee' THEN 5
          WHEN 'Sound or' THEN 6
          WHEN 'Group 4 Practice and Review' THEN 7
          WHEN 'Sound z' THEN 1
          WHEN 'Sound w' THEN 2
          WHEN 'Sound ng' THEN 3
          WHEN 'Sound v' THEN 4
          WHEN 'Sound oo (moon)' THEN 5
          WHEN 'Sound oo (book)' THEN 6
          WHEN 'Group 5 Practice and Review' THEN 7
          WHEN 'Sound y' THEN 1
          WHEN 'Sound x' THEN 2
          WHEN 'Sound ch' THEN 3
          WHEN 'Sound sh' THEN 4
          WHEN 'Sound th (unvoiced)' THEN 5
          WHEN 'Sound th (voiced)' THEN 6
          WHEN 'Group 6 Practice and Review' THEN 7
          WHEN 'Sound qu' THEN 1
          WHEN 'Sound ou' THEN 2
          WHEN 'Sound oi' THEN 3
          WHEN 'Sound ue' THEN 4
          WHEN 'Sound er' THEN 5
          WHEN 'Sound ar' THEN 6
          WHEN 'Group 7 Practice and Review' THEN 7
          WHEN 'Groups 4-7 Blending Activities' THEN 1
          WHEN 'Groups 4-7 Segmenting Activities' THEN 2
          WHEN 'Groups 4-7 Review' THEN 3
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

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-4-7'
)
UPDATE public.course_quizzes quiz
SET
  title = 'Final Quiz',
  description = 'Final quiz for the Groups 4-7 blending and segmenting course. Add approved questions before publishing.',
  lesson_id = NULL,
  sort_order = 1,
  updated_at = NOW()
FROM target_course
WHERE quiz.course_id = target_course.id
  AND quiz.title IN ('Final Quiz', 'Final Assessment');

WITH target_course AS (
  SELECT id
  FROM public.courses
  WHERE slug = 'jolly-phonics-sounds-groups-4-7'
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
  'Final quiz for the Groups 4-7 blending and segmenting course. Add approved questions before publishing.',
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
