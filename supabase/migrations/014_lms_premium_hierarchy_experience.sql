-- Premium LMS hierarchy and lesson experience layer.
--
-- Run after 013_lms_operations_foundation.sql. This migration is additive and
-- idempotent where practical. It adds the Teaching of English hierarchy,
-- richer reading modes, student lesson tools, expanded quiz metadata, and
-- media fields for the admin course builder.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  ALTER TYPE lesson_type ADD VALUE IF NOT EXISTS 'reading';
  ALTER TYPE lesson_type ADD VALUE IF NOT EXISTS 'flipbook';
  ALTER TYPE lesson_type ADD VALUE IF NOT EXISTS 'presentation';
  ALTER TYPE lesson_type ADD VALUE IF NOT EXISTS 'interactive';
  ALTER TYPE lesson_type ADD VALUE IF NOT EXISTS 'download';
  ALTER TYPE lesson_type ADD VALUE IF NOT EXISTS 'live_class';
  ALTER TYPE lesson_type ADD VALUE IF NOT EXISTS 'external_link';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS course_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail_url TEXT,
  banner_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE course_categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES course_categories(id) ON DELETE SET NULL;
ALTER TABLE course_categories ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES course_tracks(id) ON DELETE SET NULL;
ALTER TABLE course_categories ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE course_categories ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE course_categories ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE course_categories ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE courses ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES course_tracks(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES course_categories(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS target_audience TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_image_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_background_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hero_video_url TEXT;

ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS transition_style TEXT NOT NULL DEFAULT 'fade' CHECK (transition_style IN ('fade', 'slide', 'unlock', 'progress'));
ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS unlock_animation TEXT NOT NULL DEFAULT 'progress-ring' CHECK (unlock_animation IN ('none', 'progress-ring', 'confetti', 'slide-unlock'));

ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS reading_type TEXT CHECK (
  reading_type IS NULL OR reading_type IN ('rich_article', 'pdf_viewer', 'flipbook', 'powerpoint_slides', 'interactive_presentation')
);
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS reading_storage_bucket TEXT;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS reading_storage_path TEXT;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS reading_external_url TEXT;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS article_content TEXT;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS presentation_data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS activity_data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS practice_prompt TEXT;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS discussion_prompt TEXT;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS live_session_url TEXT;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS external_link_url TEXT;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS bookmark_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS highlight_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS print_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS download_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS dark_mode_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS fullscreen_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS search_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS zoom_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS completion_animation TEXT NOT NULL DEFAULT 'progress-ring' CHECK (
  completion_animation IN ('none', 'progress-ring', 'confetti', 'unlock')
);
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS confetti_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE course_quizzes ADD COLUMN IF NOT EXISTS timer_minutes INTEGER CHECK (timer_minutes IS NULL OR timer_minutes > 0);
ALTER TABLE course_quizzes ADD COLUMN IF NOT EXISTS randomize_questions BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE course_quizzes ADD COLUMN IF NOT EXISTS randomize_options BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE course_quizzes ADD COLUMN IF NOT EXISTS show_explanations BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_quizzes ADD COLUMN IF NOT EXISTS allow_review BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_quizzes ADD COLUMN IF NOT EXISTS question_bank_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE course_quizzes ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (
  question_type IN ('mcq', 'multiple_select', 'true_false', 'matching', 'drag_drop', 'ordering', 'fill_blank', 'image', 'audio', 'scenario')
);
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS correct_options JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS acceptable_answers JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS matching_pairs JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 1 CHECK (points > 0);
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'standard' CHECK (difficulty IN ('easy', 'standard', 'hard'));
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS bank_id UUID;

CREATE TABLE IF NOT EXISTS question_banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, slug)
);

DO $$
BEGIN
  ALTER TABLE quiz_questions
    ADD CONSTRAINT quiz_questions_bank_fk FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS lesson_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS lesson_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Bookmark',
  position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (position_seconds >= 0),
  page_number INTEGER CHECK (page_number IS NULL OR page_number > 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  quote TEXT NOT NULL,
  note TEXT,
  color TEXT NOT NULL DEFAULT '#FBBF24',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES lesson_discussions(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_tracks_published ON course_tracks(published, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_categories_track_parent ON course_categories(track_id, parent_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_courses_track_category ON courses(track_id, category_id, published);
CREATE INDEX IF NOT EXISTS idx_course_lessons_reading_type ON course_lessons(reading_type);
CREATE INDEX IF NOT EXISTS idx_question_banks_course ON question_banks(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_type_bank ON quiz_questions(question_type, bank_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_user_lesson ON lesson_notes(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_bookmarks_user_lesson ON lesson_bookmarks(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_highlights_user_lesson ON lesson_highlights(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_discussions_lesson ON lesson_discussions(lesson_id, created_at);

DROP TRIGGER IF EXISTS course_tracks_updated_at ON course_tracks;
CREATE TRIGGER course_tracks_updated_at BEFORE UPDATE ON course_tracks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS course_categories_updated_at ON course_categories;
CREATE TRIGGER course_categories_updated_at BEFORE UPDATE ON course_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS question_banks_updated_at ON question_banks;
CREATE TRIGGER question_banks_updated_at BEFORE UPDATE ON question_banks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS lesson_notes_updated_at ON lesson_notes;
CREATE TRIGGER lesson_notes_updated_at BEFORE UPDATE ON lesson_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS lesson_highlights_updated_at ON lesson_highlights;
CREATE TRIGGER lesson_highlights_updated_at BEFORE UPDATE ON lesson_highlights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS lesson_discussions_updated_at ON lesson_discussions;
CREATE TRIGGER lesson_discussions_updated_at BEFORE UPDATE ON lesson_discussions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE course_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published course tracks" ON course_tracks;
CREATE POLICY "Public read published course tracks"
  ON course_tracks FOR SELECT
  USING (published = true OR is_admin());

DROP POLICY IF EXISTS "Admins manage course tracks" ON course_tracks;
CREATE POLICY "Admins manage course tracks"
  ON course_tracks FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Public read published course categories" ON course_categories;
CREATE POLICY "Public read published course categories"
  ON course_categories FOR SELECT
  USING (published = true OR is_admin());

DROP POLICY IF EXISTS "Admins manage question banks" ON question_banks;
CREATE POLICY "Admins manage question banks"
  ON question_banks FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Users manage own lesson notes" ON lesson_notes;
CREATE POLICY "Users manage own lesson notes"
  ON lesson_notes FOR ALL
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users manage own lesson bookmarks" ON lesson_bookmarks;
CREATE POLICY "Users manage own lesson bookmarks"
  ON lesson_bookmarks FOR ALL
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users manage own lesson highlights" ON lesson_highlights;
CREATE POLICY "Users manage own lesson highlights"
  ON lesson_highlights FOR ALL
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Enrolled users read lesson discussions" ON lesson_discussions;
CREATE POLICY "Enrolled users read lesson discussions"
  ON lesson_discussions FOR SELECT
  USING (
    hidden = false
    AND (
      is_admin()
      OR has_active_course_enrollment(course_id, auth.uid())
      OR EXISTS (
        SELECT 1 FROM course_lessons l
        WHERE l.id = lesson_discussions.lesson_id AND l.is_preview = true
      )
    )
  );

DROP POLICY IF EXISTS "Enrolled users create lesson discussions" ON lesson_discussions;
CREATE POLICY "Enrolled users create lesson discussions"
  ON lesson_discussions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND has_active_course_enrollment(course_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users update own lesson discussions" ON lesson_discussions;
CREATE POLICY "Users update own lesson discussions"
  ON lesson_discussions FOR UPDATE
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('course-media', 'course-media', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('lesson-content', 'lesson-content', false, 104857600, ARRAY[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/html',
    'text/markdown'
  ])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read course media" ON storage.objects;
CREATE POLICY "Public read course media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-media');

DROP POLICY IF EXISTS "Admins manage premium LMS media" ON storage.objects;
CREATE POLICY "Admins manage premium LMS media"
  ON storage.objects FOR ALL
  USING (bucket_id IN ('course-media', 'lesson-content') AND is_admin())
  WITH CHECK (bucket_id IN ('course-media', 'lesson-content') AND is_admin());

INSERT INTO course_tracks (title, slug, description, sort_order, published)
VALUES (
  'Teaching of English',
  'teaching-of-english',
  'A complete learning pathway for phonics, literacy, Cambridge preparation, teacher training and professional development.',
  1,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  published = EXCLUDED.published;

INSERT INTO course_categories (name, slug, description, icon, sort_order, track_id, stage, published)
VALUES
  ('Early Years', 'early-years', 'Early reading, phonics and foundational classroom practice.', 'book-open', 1, (SELECT id FROM course_tracks WHERE slug = 'teaching-of-english'), 'Early Years', true),
  ('Junior School', 'junior-school', 'Literacy, reading, writing and hybrid teaching for junior learners.', 'graduation-cap', 2, (SELECT id FROM course_tracks WHERE slug = 'teaching-of-english'), 'Junior School', true),
  ('High School / Pre O-Level', 'high-school-pre-o-level', 'Cambridge Key Stage, metric and pre O-Level English pathways.', 'layers', 3, (SELECT id FROM course_tracks WHERE slug = 'teaching-of-english'), 'High School / Pre O-Level', true),
  ('A Level', 'a-level', 'Advanced English, exam support and teacher preparation.', 'award', 4, (SELECT id FROM course_tracks WHERE slug = 'teaching-of-english'), 'A Level', true),
  ('Higher Education', 'higher-education', 'Professional development, teacher certification, webinars and recorded workshops.', 'users', 5, (SELECT id FROM course_tracks WHERE slug = 'teaching-of-english'), 'Higher Education', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  track_id = EXCLUDED.track_id,
  stage = EXCLUDED.stage,
  published = EXCLUDED.published;

INSERT INTO course_categories (name, slug, description, icon, sort_order, track_id, parent_id, stage, published)
VALUES
  ('Jolly Phonics', 'jolly-phonics', 'Interactive Jolly Phonics courses, reading material, activities, quizzes and certificates.', 'book-open-check', 1, (SELECT id FROM course_tracks WHERE slug = 'teaching-of-english'), (SELECT id FROM course_categories WHERE slug = 'early-years'), 'Early Years', true),
  ('Hybrid Teaching Models', 'hybrid-teaching-models', 'Blended and hybrid English teaching routines for schools.', 'monitor-play', 2, (SELECT id FROM course_tracks WHERE slug = 'teaching-of-english'), (SELECT id FROM course_categories WHERE slug = 'early-years'), 'Early Years', true),
  ('SNC Curriculum', 'snc-curriculum', 'Pakistan Single National Curriculum alignment and lesson planning.', 'clipboard-list', 3, (SELECT id FROM course_tracks WHERE slug = 'teaching-of-english'), (SELECT id FROM course_categories WHERE slug = 'early-years'), 'Early Years', true),
  ('Jolly Literacy', 'jolly-literacy', 'Junior school literacy, grammar, reading and writing practice.', 'library', 1, (SELECT id FROM course_tracks WHERE slug = 'teaching-of-english'), (SELECT id FROM course_categories WHERE slug = 'junior-school'), 'Junior School', true),
  ('Cambridge Key Stage / Metric', 'cambridge-key-stage-metric', 'Cambridge Key Stage and metric English preparation.', 'school', 1, (SELECT id FROM course_tracks WHERE slug = 'teaching-of-english'), (SELECT id FROM course_categories WHERE slug = 'high-school-pre-o-level'), 'High School / Pre O-Level', true),
  ('Teacher Certifications', 'teacher-certifications', 'Professional teacher certifications, webinars and recorded workshops.', 'badge-check', 1, (SELECT id FROM course_tracks WHERE slug = 'teaching-of-english'), (SELECT id FROM course_categories WHERE slug = 'higher-education'), 'Higher Education', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  track_id = EXCLUDED.track_id,
  parent_id = EXCLUDED.parent_id,
  stage = EXCLUDED.stage,
  published = EXCLUDED.published;

UPDATE courses
SET
  track_id = (SELECT id FROM course_tracks WHERE slug = 'teaching-of-english'),
  category_id = (SELECT id FROM course_categories WHERE slug = 'jolly-phonics'),
  target_audience = ARRAY['Early years teachers', 'Junior school teachers', 'School literacy coordinators', 'Parents supporting phonics at home'],
  metadata = COALESCE(metadata, '{}'::jsonb) || '{
    "pathway":"Teaching of English",
    "stage":"Early Years",
    "courseFamily":"Jolly Phonics",
    "readingModes":["rich_article","pdf_viewer","flipbook","powerpoint_slides","interactive_presentation"],
    "lessonTabs":["Overview","Video","Reading","Practice","Downloads","Notes","Discussion"],
    "moduleTransition":"fade",
    "completionAnimation":"progress-ring",
    "certificateEnabled":true
  }'::jsonb
WHERE slug = 'teaching-english-through-jolly-phonics-free-version';

UPDATE course_modules
SET
  title = 'Introduction to Jolly Phonics',
  description = 'Welcome, foundations, five core skills, first-nine-week aims, summary, quiz and certificate readiness.',
  thumbnail_url = COALESCE(thumbnail_url, '/images/resources/Jolly-Phonics-Handbook.jpg'),
  transition_style = 'fade',
  unlock_animation = 'progress-ring'
WHERE course_id = (SELECT id FROM courses WHERE slug = 'teaching-english-through-jolly-phonics-free-version')
  AND sort_order = 1;

INSERT INTO course_modules (course_id, title, description, sort_order, thumbnail_url, transition_style, unlock_animation)
SELECT
  c.id,
  'Introduction to Jolly Phonics',
  'Welcome, foundations, five core skills, first-nine-week aims, summary, quiz and certificate readiness.',
  1,
  '/images/resources/Jolly-Phonics-Handbook.jpg',
  'fade',
  'progress-ring'
FROM courses c
WHERE c.slug = 'teaching-english-through-jolly-phonics-free-version'
  AND NOT EXISTS (
    SELECT 1 FROM course_modules m WHERE m.course_id = c.id AND m.sort_order = 1
  );

WITH module_ref AS (
  SELECT m.id AS module_id, m.course_id
  FROM course_modules m
  JOIN courses c ON c.id = m.course_id
  WHERE c.slug = 'teaching-english-through-jolly-phonics-free-version' AND m.sort_order = 1
  LIMIT 1
),
lesson_seed AS (
  SELECT * FROM (VALUES
    (1, 'Welcome', 'Start the course, understand the learning flow, and prepare your notes and downloads.', 'video'::lesson_type, 'rich_article'),
    (2, 'What is Jolly Phonics?', 'Understand the Jolly Phonics approach and where it sits inside early English teaching.', 'notes'::lesson_type, 'rich_article'),
    (3, 'Learning the Letter Sounds', 'Study the letter-sound routine with reading, video, practice and downloadable support.', 'notes'::lesson_type, 'flipbook'),
    (4, 'Learning Letter Formation', 'Connect sound learning with handwriting routines and classroom modelling.', 'notes'::lesson_type, 'pdf_viewer'),
    (5, 'Blending', 'Practise blending routines that help children move from sounds into words.', 'video'::lesson_type, 'rich_article'),
    (6, 'Identifying Sounds in Words', 'Use oral segmenting and sound-identification routines for early reading and spelling.', 'notes'::lesson_type, 'interactive_presentation'),
    (7, 'Tricky Words', 'Teach irregular and high-frequency words through repetition, actions and meaningful context.', 'notes'::lesson_type, 'powerpoint_slides'),
    (8, 'Aims of the First Nine Weeks', 'Plan early implementation goals and classroom milestones.', 'notes'::lesson_type, 'rich_article'),
    (9, 'What Comes After the First Nine Weeks', 'Move from first routines into readers, dictation, writing and ongoing assessment.', 'notes'::lesson_type, 'rich_article'),
    (10, 'Course Summary', 'Review the first module and confirm the completion checklist before the quiz.', 'notes'::lesson_type, 'rich_article'),
    (11, 'Quiz', 'Attempt the module quiz when you have completed the compulsory lessons.', 'quiz'::lesson_type, NULL),
    (12, 'Certificate', 'Check certificate eligibility after course requirements are complete.', 'notes'::lesson_type, 'rich_article')
  ) AS seed(sort_order, title, description, lesson_type, reading_type)
)
UPDATE course_lessons l
SET
  title = s.title,
  description = s.description,
  lesson_type = s.lesson_type,
  reading_type = s.reading_type,
  article_content = CASE
    WHEN s.reading_type IS NULL THEN l.article_content
    ELSE COALESCE(l.article_content, 'Paste the licensed official reading content for this lesson here. The learner view will render it as the selected reading mode without summarising it.')
  END,
  practice_prompt = COALESCE(l.practice_prompt, 'Add a short classroom practice task or reflection for this lesson.'),
  discussion_prompt = COALESCE(l.discussion_prompt, 'Invite learners to share classroom examples, questions or reflections for this lesson.'),
  is_compulsory = s.sort_order <= 10,
  sequentially_locked = true,
  manual_completion_allowed = true,
  required_completion_percentage = 80,
  published = true
FROM lesson_seed s, module_ref mr
WHERE l.course_id = mr.course_id
  AND l.module_id = mr.module_id
  AND l.sort_order = s.sort_order;

WITH module_ref AS (
  SELECT m.id AS module_id, m.course_id
  FROM course_modules m
  JOIN courses c ON c.id = m.course_id
  WHERE c.slug = 'teaching-english-through-jolly-phonics-free-version' AND m.sort_order = 1
  LIMIT 1
),
lesson_seed AS (
  SELECT * FROM (VALUES
    (1, 'Welcome', 'Start the course, understand the learning flow, and prepare your notes and downloads.', 'video'::lesson_type, 'rich_article'),
    (2, 'What is Jolly Phonics?', 'Understand the Jolly Phonics approach and where it sits inside early English teaching.', 'notes'::lesson_type, 'rich_article'),
    (3, 'Learning the Letter Sounds', 'Study the letter-sound routine with reading, video, practice and downloadable support.', 'notes'::lesson_type, 'flipbook'),
    (4, 'Learning Letter Formation', 'Connect sound learning with handwriting routines and classroom modelling.', 'notes'::lesson_type, 'pdf_viewer'),
    (5, 'Blending', 'Practise blending routines that help children move from sounds into words.', 'video'::lesson_type, 'rich_article'),
    (6, 'Identifying Sounds in Words', 'Use oral segmenting and sound-identification routines for early reading and spelling.', 'notes'::lesson_type, 'interactive_presentation'),
    (7, 'Tricky Words', 'Teach irregular and high-frequency words through repetition, actions and meaningful context.', 'notes'::lesson_type, 'powerpoint_slides'),
    (8, 'Aims of the First Nine Weeks', 'Plan early implementation goals and classroom milestones.', 'notes'::lesson_type, 'rich_article'),
    (9, 'What Comes After the First Nine Weeks', 'Move from first routines into readers, dictation, writing and ongoing assessment.', 'notes'::lesson_type, 'rich_article'),
    (10, 'Course Summary', 'Review the first module and confirm the completion checklist before the quiz.', 'notes'::lesson_type, 'rich_article'),
    (11, 'Quiz', 'Attempt the module quiz when you have completed the compulsory lessons.', 'quiz'::lesson_type, NULL),
    (12, 'Certificate', 'Check certificate eligibility after course requirements are complete.', 'notes'::lesson_type, 'rich_article')
  ) AS seed(sort_order, title, description, lesson_type, reading_type)
)
INSERT INTO course_lessons (
  course_id,
  module_id,
  title,
  description,
  lesson_type,
  reading_type,
  article_content,
  practice_prompt,
  discussion_prompt,
  duration_minutes,
  sort_order,
  is_preview,
  is_compulsory,
  sequentially_locked,
  manual_completion_allowed,
  required_completion_percentage,
  published
)
SELECT
  mr.course_id,
  mr.module_id,
  s.title,
  s.description,
  s.lesson_type,
  s.reading_type,
  CASE
    WHEN s.reading_type IS NULL THEN NULL
    ELSE 'Paste the licensed official reading content for this lesson here. The learner view will render it as the selected reading mode without summarising it.'
  END,
  'Add a short classroom practice task or reflection for this lesson.',
  'Invite learners to share classroom examples, questions or reflections for this lesson.',
  20,
  s.sort_order,
  s.sort_order = 1,
  s.sort_order <= 10,
  true,
  true,
  80,
  true
FROM lesson_seed s
CROSS JOIN module_ref mr
WHERE NOT EXISTS (
  SELECT 1 FROM course_lessons l
  WHERE l.course_id = mr.course_id AND l.module_id = mr.module_id AND l.sort_order = s.sort_order
);
