-- Courses/LMS completion layer: quiz schema, resources, course wishlists,
-- safer lesson RLS, and an idempotent Jolly Phonics free-course seed.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS course_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  resource_url TEXT,
  resource_type TEXT NOT NULL DEFAULT 'link',
  is_downloadable BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER NOT NULL DEFAULT 70 CHECK (passing_score BETWEEN 0 AND 100),
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option INTEGER NOT NULL CHECK (correct_option >= 0),
  explanation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_resources_course ON course_resources(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_quizzes_course ON course_quizzes(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_course ON quiz_attempts(user_id, course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_wishlists_user ON course_wishlists(user_id, created_at DESC);

DROP TRIGGER IF EXISTS course_quizzes_updated_at ON course_quizzes;
CREATE TRIGGER course_quizzes_updated_at BEFORE UPDATE ON course_quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_wishlists ENABLE ROW LEVEL SECURITY;

-- Correct the older policy that exposed every lesson for published courses.
DROP POLICY IF EXISTS "Public read published lessons preview" ON course_lessons;
DROP POLICY IF EXISTS "Public read preview lessons" ON course_lessons;
CREATE POLICY "Public read preview lessons"
  ON course_lessons FOR SELECT
  USING (is_preview = true OR is_admin());

DROP POLICY IF EXISTS "Public read course level resources" ON course_resources;
CREATE POLICY "Public read course level resources"
  ON course_resources FOR SELECT
  USING (
    lesson_id IS NULL
    AND EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.published = true)
  );

DROP POLICY IF EXISTS "Enrolled users read course resources" ON course_resources;
CREATE POLICY "Enrolled users read course resources"
  ON course_resources FOR SELECT
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = course_resources.course_id AND e.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM course_lessons l
      WHERE l.id = course_resources.lesson_id AND l.is_preview = true
    )
  );

DROP POLICY IF EXISTS "Admins manage course resources" ON course_resources;
CREATE POLICY "Admins manage course resources"
  ON course_resources FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Public read published course quizzes" ON course_quizzes;
CREATE POLICY "Public read published course quizzes"
  ON course_quizzes FOR SELECT
  USING (
    published = true
    AND EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.published = true)
  );

DROP POLICY IF EXISTS "Admins manage course quizzes" ON course_quizzes;
CREATE POLICY "Admins manage course quizzes"
  ON course_quizzes FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins manage quiz questions" ON quiz_questions;
CREATE POLICY "Admins manage quiz questions"
  ON quiz_questions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Users read own quiz attempts" ON quiz_attempts;
CREATE POLICY "Users read own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users insert own quiz attempts" ON quiz_attempts;
CREATE POLICY "Users insert own quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own course wishlist" ON course_wishlists;
CREATE POLICY "Users manage own course wishlist"
  ON course_wishlists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

INSERT INTO course_categories (name, slug, description, sort_order)
VALUES
  ('Teacher Courses', 'teacher-courses', 'Professional development for English and phonics teachers.', 1),
  ('Phonics', 'phonics', 'Synthetic phonics, decoding and early reading courses.', 2),
  ('Reading', 'reading', 'Reading fluency, comprehension and literacy support.', 3),
  ('Preschool', 'preschool', 'Early childhood and foundational classroom practice.', 4)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

INSERT INTO courses (
  title,
  slug,
  description,
  excerpt,
  price,
  category,
  level,
  duration,
  instructor,
  instructor_bio,
  image_url,
  curriculum,
  objectives,
  requirements,
  seo_title,
  seo_description,
  rating,
  students_count,
  is_free,
  featured,
  published,
  metadata
)
VALUES (
  'Teaching of English through Jolly Phonics - Free Version',
  'teaching-english-through-jolly-phonics-free-version',
  'Jolly Phonics Intensive Course uses fast-track teaching strategies and materials to give teachers a strong foundation for implementing the Jolly Phonics programme.',
  'A 12-week intermediate teacher course introducing Jolly Phonics methodology, classroom stages, language assessment and decodable readers.',
  0,
  'teacher-courses',
  'intermediate',
  '12 weeks',
  'Dr. Fatima Tuz Zahra',
  'Dr. Fatima Tuz Zahra is a Phonics Club trainer supporting teachers with practical Jolly Phonics implementation, reading instruction and classroom assessment.',
  '/images/resources/Jolly-Phonics-Handbook.jpg',
  '[
    {"title":"Teaching of English","duration":"2 weeks","lessons":[{"title":"Teaching English through programme providers"},{"title":"Elicitation of course objectives and content"},{"title":"Teaching listening and speaking"},{"title":"Teaching reading and writing"},{"title":"Reading and writing difficulties"}]},
    {"title":"Learning the Letter Sounds","duration":"3 weeks","lessons":[{"title":"Groups 1-3 sounds"},{"title":"Long and short vowels"},{"title":"Groups 4-7 sounds"},{"title":"Alternative spellings of vowels"}]},
    {"title":"Five Basic Skills","duration":"3 weeks","lessons":[{"title":"Teaching tricky words"},{"title":"Independent writing"},{"title":"Language assessment"}]},
    {"title":"Teaching Steps and Stages","duration":"3 weeks","lessons":[{"title":"Teaching sounds from Groups 1-3"},{"title":"Teaching sounds from Groups 4-7"},{"title":"Teaching advanced spelling codes and alternative spellings"},{"title":"Dictation using words, phrases and sentences"},{"title":"Reading through decodable readers"}]},
    {"title":"Materials and Methodology","duration":"1 week","lessons":[{"title":"Books and teaching resources"},{"title":"How to design a book list"},{"title":"Digital resources"}]}
  ]'::jsonb,
  ARRAY[
    'Teach 42 letter sounds through actions',
    'Use the five basic Jolly Phonics skills',
    'Plan reading and writing teaching stages',
    'Use schemes of decodable readers',
    'Support independent writing',
    'Apply language assessments'
  ],
  ARRAY[
    'A stable internet connection',
    'Notebook for lesson-planning activities',
    'Interest in early reading and English teaching'
  ],
  'Teaching of English through Jolly Phonics Free Course',
  'Free 12-week Jolly Phonics teacher course by Dr. Fatima Tuz Zahra for English, reading and writing instruction.',
  4.9,
  240,
  true,
  true,
  true,
  '{
    "previewVideoUrl":"https://youtu.be/rEF-BMA30Vg",
    "quizzes":1,
    "certificateEnabled":true,
    "highlights":[
      "Learning 42 letter sounds through actions",
      "Five basic skills of the Jolly Phonics programme",
      "Teaching steps and stages for reading and writing",
      "Using schemes of decodable readers",
      "Independent writing",
      "Language assessments",
      "Teaching alternative spellings of vowels",
      "Pakistan Single National Curriculum and British Foundation Stage links"
    ],
    "coreMaterials":[
      "Jolly Phonics Pupil Books 1 and 2, black-and-white editions",
      "My Word Book",
      "Reader Levels 1 and 2"
    ],
    "intendedAudience":[
      "English teachers",
      "Early years and primary teachers",
      "School literacy coordinators",
      "Parents supporting structured phonics at home"
    ],
    "faq":[
      {"question":"Is this course free?","answer":"Yes. This version is free and enrolment is handled through your Phonics Club account."},
      {"question":"Do I receive a certificate?","answer":"Certificate status is checked after lesson completion and quiz requirements are met."},
      {"question":"Can I preview the course?","answer":"Yes. The course page includes a preview video before enrolment."}
    ]
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  excerpt = EXCLUDED.excerpt,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  level = EXCLUDED.level,
  duration = EXCLUDED.duration,
  instructor = EXCLUDED.instructor,
  instructor_bio = EXCLUDED.instructor_bio,
  image_url = EXCLUDED.image_url,
  curriculum = EXCLUDED.curriculum,
  objectives = EXCLUDED.objectives,
  requirements = EXCLUDED.requirements,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  rating = EXCLUDED.rating,
  students_count = EXCLUDED.students_count,
  is_free = EXCLUDED.is_free,
  featured = EXCLUDED.featured,
  published = EXCLUDED.published,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'teaching-english-through-jolly-phonics-free-version'
),
module_seed(sort_order, title, description) AS (
  VALUES
    (1, 'Teaching of English', 'Teaching English foundations, programme objectives and language skills.'),
    (2, 'Learning the Letter Sounds', 'Sound groups, vowels and alternative spellings.'),
    (3, 'Five Basic Skills', 'Tricky words, independent writing and language assessment.'),
    (4, 'Teaching Steps and Stages', 'Classroom sequencing, dictation and decodable readers.'),
    (5, 'Materials and Methodology', 'Books, book lists and digital resources.')
)
INSERT INTO course_modules (course_id, title, description, sort_order)
SELECT course_ref.id, module_seed.title, module_seed.description, module_seed.sort_order
FROM course_ref, module_seed
WHERE NOT EXISTS (
  SELECT 1 FROM course_modules m
  WHERE m.course_id = course_ref.id AND m.sort_order = module_seed.sort_order
);

WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'teaching-english-through-jolly-phonics-free-version'
),
lesson_seed(module_order, sort_order, title, description, duration_minutes, is_preview) AS (
  VALUES
    (1, 1, 'Teaching English through programme providers', 'How structured programmes support English teaching in early and primary classrooms.', 35, true),
    (1, 2, 'Elicitation of course objectives and content', 'Clarify course outcomes and connect them to classroom implementation.', 25, false),
    (1, 3, 'Teaching listening and speaking', 'Develop oral language routines before formal reading and writing tasks.', 30, false),
    (1, 4, 'Teaching reading and writing', 'Connect decoding, blending, segmenting and early sentence writing.', 35, false),
    (1, 5, 'Reading and writing difficulties', 'Recognise common barriers and plan timely classroom support.', 30, false),
    (2, 1, 'Groups 1-3 sounds', 'Introduce the first sound groups with actions and blending routines.', 40, false),
    (2, 2, 'Long and short vowels', 'Teach vowel contrasts with examples and practice words.', 35, false),
    (2, 3, 'Groups 4-7 sounds', 'Extend sound knowledge across later Jolly Phonics groups.', 40, false),
    (2, 4, 'Alternative spellings of vowels', 'Teach vowel alternatives through spelling patterns and examples.', 35, false),
    (3, 1, 'Teaching tricky words', 'Build routines for irregular high-frequency words.', 30, false),
    (3, 2, 'Independent writing', 'Move from guided practice to independent sentence writing.', 35, false),
    (3, 3, 'Language assessment', 'Use assessment checks to understand reading and writing growth.', 35, false),
    (4, 1, 'Teaching sounds from Groups 1-3', 'Plan early sound lessons with actions, words and dictation.', 40, false),
    (4, 2, 'Teaching sounds from Groups 4-7', 'Sequence later sounds and consolidate earlier groups.', 40, false),
    (4, 3, 'Teaching advanced spelling codes and alternative spellings', 'Introduce advanced codes with explicit examples.', 45, false),
    (4, 4, 'Dictation using words, phrases and sentences', 'Use dictation to connect sounds, spelling and writing fluency.', 35, false),
    (4, 5, 'Reading through decodable readers', 'Select and use decodable readers for supported reading practice.', 35, false),
    (5, 1, 'Books and teaching resources', 'Review core course books and classroom teaching resources.', 30, false),
    (5, 2, 'How to design a book list', 'Create an age-appropriate list for school implementation.', 30, false),
    (5, 3, 'Digital resources', 'Use digital resources to reinforce classroom teaching.', 25, false)
),
module_lookup AS (
  SELECT m.id AS module_id, m.course_id, m.sort_order
  FROM course_modules m
  JOIN course_ref c ON c.id = m.course_id
)
INSERT INTO course_lessons (
  module_id,
  course_id,
  title,
  description,
  lesson_type,
  duration_minutes,
  sort_order,
  is_preview
)
SELECT
  module_lookup.module_id,
  module_lookup.course_id,
  lesson_seed.title,
  lesson_seed.description,
  'video',
  lesson_seed.duration_minutes,
  lesson_seed.sort_order,
  lesson_seed.is_preview
FROM lesson_seed
JOIN module_lookup ON module_lookup.sort_order = lesson_seed.module_order
WHERE NOT EXISTS (
  SELECT 1 FROM course_lessons l
  WHERE l.module_id = module_lookup.module_id
    AND l.course_id = module_lookup.course_id
    AND l.sort_order = lesson_seed.sort_order
);

WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'teaching-english-through-jolly-phonics-free-version'
)
INSERT INTO course_resources (course_id, title, resource_type, resource_url, sort_order)
SELECT course_ref.id, seed.title, 'material', seed.resource_url, seed.sort_order
FROM course_ref,
(VALUES
  ('Jolly Phonics Pupil Books 1 and 2, black-and-white editions', NULL, 1),
  ('My Word Book', NULL, 2),
  ('Reader Levels 1 and 2', NULL, 3)
) AS seed(title, resource_url, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM course_resources r
  WHERE r.course_id = course_ref.id AND r.title = seed.title
);

WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'teaching-english-through-jolly-phonics-free-version'
)
INSERT INTO course_quizzes (course_id, title, description, passing_score, max_attempts, sort_order, published)
SELECT course_ref.id, 'Jolly Phonics Foundations Quiz', 'Check your understanding of core sounds, skills and classroom implementation.', 70, 3, 1, true
FROM course_ref
WHERE NOT EXISTS (
  SELECT 1 FROM course_quizzes q
  WHERE q.course_id = course_ref.id AND q.sort_order = 1
);

WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'teaching-english-through-jolly-phonics-free-version'
),
quiz_ref AS (
  SELECT q.id FROM course_quizzes q
  JOIN course_ref c ON c.id = q.course_id
  WHERE q.sort_order = 1
  LIMIT 1
),
question_seed(sort_order, question, options, correct_option, explanation) AS (
  VALUES
    (1, 'How many letter sounds are introduced in Jolly Phonics?', '["26","36","42","52"]'::jsonb, 2, 'Jolly Phonics introduces 42 main letter sounds.'),
    (2, 'Which activity helps children read unfamiliar decodable words?', '["Memorising whole pages","Blending sounds","Skipping vowels","Guessing from pictures only"]'::jsonb, 1, 'Blending sounds is a core reading skill.'),
    (3, 'What should decodable readers match?', '["Only the cover design","Previously taught sound knowledge","The longest available books","Random vocabulary lists"]'::jsonb, 1, 'Decodable readers should align with sounds and spellings learners have been taught.'),
    (4, 'Which skill supports early spelling and writing?', '["Segmenting words into sounds","Avoiding dictation","Copying without sound work","Reading only silently"]'::jsonb, 0, 'Segmenting helps children hear and write the sounds in words.'),
    (5, 'Why are language assessments useful?', '["They replace teaching","They identify progress and support needs","They are only for final grades","They remove the need for readers"]'::jsonb, 1, 'Assessments help teachers plan next steps and timely support.')
)
INSERT INTO quiz_questions (quiz_id, question, options, correct_option, explanation, sort_order)
SELECT quiz_ref.id, question_seed.question, question_seed.options, question_seed.correct_option, question_seed.explanation, question_seed.sort_order
FROM quiz_ref, question_seed
WHERE NOT EXISTS (
  SELECT 1 FROM quiz_questions qq
  WHERE qq.quiz_id = quiz_ref.id AND qq.sort_order = question_seed.sort_order
);
