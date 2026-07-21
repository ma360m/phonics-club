-- Children phonics course shells and future-ready sound activity data.
-- This is intentionally content-safe: it seeds course/module/lesson structure,
-- sound identities and unpublished activity placeholders, but no poems,
-- stories, actions, recordings, images, formation paths or word lists.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS phonics_sound_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  sound_key TEXT NOT NULL,
  display_text TEXT NOT NULL,
  sound_group INTEGER NOT NULL,
  course_part INTEGER NOT NULL,
  sequence_order INTEGER NOT NULL,
  sound_variant TEXT,
  pronunciation_audio_url TEXT,
  pronunciation_video_url TEXT,
  poem_video_url TEXT,
  song_video_url TEXT,
  story_media_url TEXT,
  action_media_url TEXT,
  formation_video_url TEXT,
  flashcard_image_url TEXT,
  example_image_url TEXT,
  formation_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lesson_id),
  UNIQUE (course_part, sound_key)
);

CREATE TABLE IF NOT EXISTS phonics_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sound_profile_id UUID NOT NULL REFERENCES phonics_sound_profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  media_url TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sound_profile_id, activity_type)
);

CREATE TABLE IF NOT EXISTS phonics_word_examples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sound_profile_id UUID NOT NULL REFERENCES phonics_sound_profiles(id) ON DELETE CASCADE,
  example_type TEXT NOT NULL CHECK (example_type IN ('blending', 'segmenting', 'picture_match', 'initial_sound', 'final_sound')),
  word TEXT NOT NULL,
  sound_units JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_url TEXT,
  audio_url TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phonics_activity_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES phonics_activities(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  score INTEGER CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  last_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_phonics_sound_profiles_lesson ON phonics_sound_profiles(lesson_id);
CREATE INDEX IF NOT EXISTS idx_phonics_sound_profiles_course_part ON phonics_sound_profiles(course_part, sequence_order);
CREATE INDEX IF NOT EXISTS idx_phonics_activities_profile ON phonics_activities(sound_profile_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_phonics_word_examples_profile ON phonics_word_examples(sound_profile_id, example_type, sequence_order);
CREATE INDEX IF NOT EXISTS idx_phonics_activity_progress_user ON phonics_activity_progress(user_id, updated_at DESC);

ALTER TABLE phonics_sound_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE phonics_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE phonics_word_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE phonics_activity_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "LMS managers and enrolled users read phonics sound profiles" ON phonics_sound_profiles;
CREATE POLICY "LMS managers and enrolled users read phonics sound profiles"
  ON phonics_sound_profiles FOR SELECT
  USING (
    is_lms_manager()
    OR EXISTS (
      SELECT 1
      FROM course_lessons l
      WHERE l.id = phonics_sound_profiles.lesson_id
        AND has_active_course_enrollment(l.course_id)
    )
  );

DROP POLICY IF EXISTS "LMS managers manage phonics sound profiles" ON phonics_sound_profiles;
CREATE POLICY "LMS managers manage phonics sound profiles"
  ON phonics_sound_profiles FOR ALL
  USING (
    is_lms_manager()
    OR EXISTS (
      SELECT 1
      FROM course_lessons l
      WHERE l.id = phonics_sound_profiles.lesson_id
        AND can_manage_course(l.course_id)
    )
  )
  WITH CHECK (
    is_lms_manager()
    OR EXISTS (
      SELECT 1
      FROM course_lessons l
      WHERE l.id = phonics_sound_profiles.lesson_id
        AND can_manage_course(l.course_id)
    )
  );

DROP POLICY IF EXISTS "LMS managers and enrolled users read published phonics activities" ON phonics_activities;
CREATE POLICY "LMS managers and enrolled users read published phonics activities"
  ON phonics_activities FOR SELECT
  USING (
    is_lms_manager()
    OR (
      is_published = TRUE
      AND EXISTS (
        SELECT 1
        FROM phonics_sound_profiles sp
        JOIN course_lessons l ON l.id = sp.lesson_id
        WHERE sp.id = phonics_activities.sound_profile_id
          AND has_active_course_enrollment(l.course_id)
      )
    )
  );

DROP POLICY IF EXISTS "LMS managers manage phonics activities" ON phonics_activities;
CREATE POLICY "LMS managers manage phonics activities"
  ON phonics_activities FOR ALL
  USING (
    is_lms_manager()
    OR EXISTS (
      SELECT 1
      FROM phonics_sound_profiles sp
      JOIN course_lessons l ON l.id = sp.lesson_id
      WHERE sp.id = phonics_activities.sound_profile_id
        AND can_manage_course(l.course_id)
    )
  )
  WITH CHECK (
    is_lms_manager()
    OR EXISTS (
      SELECT 1
      FROM phonics_sound_profiles sp
      JOIN course_lessons l ON l.id = sp.lesson_id
      WHERE sp.id = phonics_activities.sound_profile_id
        AND can_manage_course(l.course_id)
    )
  );

DROP POLICY IF EXISTS "LMS managers and enrolled users read approved phonics examples" ON phonics_word_examples;
CREATE POLICY "LMS managers and enrolled users read approved phonics examples"
  ON phonics_word_examples FOR SELECT
  USING (
    is_lms_manager()
    OR (
      is_approved = TRUE
      AND EXISTS (
        SELECT 1
        FROM phonics_sound_profiles sp
        JOIN course_lessons l ON l.id = sp.lesson_id
        WHERE sp.id = phonics_word_examples.sound_profile_id
          AND has_active_course_enrollment(l.course_id)
      )
    )
  );

DROP POLICY IF EXISTS "LMS managers manage phonics examples" ON phonics_word_examples;
CREATE POLICY "LMS managers manage phonics examples"
  ON phonics_word_examples FOR ALL
  USING (
    is_lms_manager()
    OR EXISTS (
      SELECT 1
      FROM phonics_sound_profiles sp
      JOIN course_lessons l ON l.id = sp.lesson_id
      WHERE sp.id = phonics_word_examples.sound_profile_id
        AND can_manage_course(l.course_id)
    )
  )
  WITH CHECK (
    is_lms_manager()
    OR EXISTS (
      SELECT 1
      FROM phonics_sound_profiles sp
      JOIN course_lessons l ON l.id = sp.lesson_id
      WHERE sp.id = phonics_word_examples.sound_profile_id
        AND can_manage_course(l.course_id)
    )
  );

DROP POLICY IF EXISTS "Users manage own phonics activity progress" ON phonics_activity_progress;
CREATE POLICY "Users manage own phonics activity progress"
  ON phonics_activity_progress FOR ALL
  USING (auth.uid() = user_id OR is_lms_manager())
  WITH CHECK (auth.uid() = user_id);

INSERT INTO course_categories (name, slug, description, sort_order)
VALUES (
  'Children''s Courses',
  'children-courses',
  'Interactive phonics and early reading courses for children.',
  2
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

INSERT INTO courses (
  title,
  slug,
  subtitle,
  description,
  rich_description,
  excerpt,
  price,
  discounted_price,
  category,
  category_id,
  level,
  duration,
  instructor,
  instructor_bio,
  image_url,
  thumbnail_url,
  banner_url,
  curriculum,
  objectives,
  requirements,
  seo_title,
  seo_description,
  rating,
  students_count,
  is_free,
  certificate_enabled,
  featured,
  published,
  completion_requires_lessons,
  completion_requires_quiz,
  completion_requires_assignments,
  metadata
)
VALUES
(
  'Jolly Phonics Sounds: Groups 1-3',
  'jolly-phonics-sounds-groups-1-3',
  'Learn the first 18 letter sounds through songs, actions, flashcards, formation and interactive activities.',
  'Jolly Phonics Sounds: Groups 1-3 is an engaging, interactive phonics course designed for young learners beginning their literacy journey. Through songs, stories, actions, flashcards, letter formation, tracing activities, listening games, blending, and segmenting, children will learn the first 18 letter sounds of the Jolly Phonics programme in a fun and systematic way.

Each lesson is carefully structured to build confidence through hands-on practice and positive reinforcement, helping children develop strong foundations in early reading and writing while learning at their own pace.',
  'Jolly Phonics Sounds: Groups 1-3 is an engaging, interactive phonics course designed for young learners beginning their literacy journey. Through songs, stories, actions, flashcards, letter formation, tracing activities, listening games, blending, and segmenting, children will learn the first 18 letter sounds of the Jolly Phonics programme in a fun and systematic way.

Each lesson is carefully structured to build confidence through hands-on practice and positive reinforcement, helping children develop strong foundations in early reading and writing while learning at their own pace.',
  'A beginner children''s phonics course covering the first 18 Jolly Phonics sounds.',
  0,
  NULL,
  'children-courses',
  (SELECT id FROM course_categories WHERE slug = 'children-courses'),
  'beginner',
  'Self-paced',
  'Phonics Club',
  'Phonics Club supports young learners with structured, joyful synthetic phonics practice.',
  '/images/resources/My-First-Letter-Sounds.jpg',
  '/images/resources/My-First-Letter-Sounds.jpg',
  '/images/resources/My-First-Letter-Sounds.jpg',
  '[
    {"title":"Welcome to the Sound Adventure","description":"Children are introduced to the course, activity types, navigation and learning routines.","lessons":[]},
    {"title":"Sound Group 1 - s, a, t, i, p, n","description":"Learn the first six sounds through pronunciation, songs, stories, actions, flashcards, tracing, listening, blending and review games.","lessons":[]},
    {"title":"Group 1 Practice and Review","description":"Interactive revision using flashcards, sound matching, tracing, memory games, blending, segmenting and a mini checkpoint.","lessons":[]},
    {"title":"Sound Group 2 - c, k, e, h, r, m, d","description":"Practise pronunciation, formation, listening, blending and sound recognition through engaging activities.","lessons":[]},
    {"title":"Group 2 Practice and Review","description":"Consolidate learning through interactive games, word building, formation practice, listening activities and mini assessments.","lessons":[]},
    {"title":"Sound Group 3 - g, o, u, l, f, b","description":"Continue building reading confidence through stories, songs, tracing, blending and segmenting.","lessons":[]},
    {"title":"Group 3 Practice and Review","description":"Revision activities reinforce all sounds learned through games, picture matching, tracing and sound identification.","lessons":[]},
    {"title":"Groups 1-3 Blending and Segmenting","description":"Children begin reading simple words by combining learned sounds and developing phonemic awareness.","lessons":[]},
    {"title":"Final Review and Assessment","description":"Celebrate progress with review activities, a final assessment, achievement stars and practice recommendations.","lessons":[]}
  ]'::jsonb,
  ARRAY[
    'Recognise and pronounce the first 18 Jolly Phonics letter sounds.',
    'Associate each sound with its corresponding letter.',
    'Form letters correctly using guided demonstrations and tracing activities.',
    'Identify beginning sounds in familiar words.',
    'Blend simple sounds together to read short words.',
    'Segment simple words into individual sounds.',
    'Strengthen listening and sound discrimination skills.',
    'Build confidence through interactive games and activities.',
    'Develop early reading and writing readiness.'
  ],
  ARRAY[
    'Recommended for children aged 4 years and above.',
    'No previous phonics knowledge is required.',
    'Adult guidance is recommended for younger learners.',
    'A computer, tablet, or touchscreen device is recommended for tracing activities.',
    'Internet connection required for videos and interactive exercises.'
  ],
  'Jolly Phonics Sounds Groups 1-3 Children Course',
  'Beginner children''s phonics course covering the first 18 Jolly Phonics sounds with flashcards, songs, tracing, blending and segmenting.',
  4.9,
  0,
  TRUE,
  FALSE,
  TRUE,
  TRUE,
  TRUE,
  FALSE,
  FALSE,
  '{
    "lessons":45,
    "modules":9,
    "sounds":18,
    "quizzes":0,
    "format":"interactive",
    "certificateEnabled":false,
    "childSoundCourse":true,
    "coursePart":1,
    "soundGroups":["Group 1","Group 2","Group 3"],
    "soundsIncluded":["s","a","t","i","p","n","c","k","e","h","r","m","d","g","o","u","l","f","b"],
    "standardActivityTypes":["sound_introduction","pronunciation_video","poem_or_song","story","action","flashcard","formation_demo","trace_and_write","listen_and_choose","picture_match","blending","segmenting","quick_review"],
    "contentPolicy":"Instructor uploads approved pronunciation, poem, story, action, formation and practice media before children access activities.",
    "highlights":["First 18 Jolly Phonics sounds","Large flashcards and sound-pronunciation practice","Formation demo and trace-and-write activities","Listening, blending and segmenting games","Simple progress rewards for young learners"],
    "intendedAudience":["Children aged 4 years and above","Parents supporting early reading at home","Early years learners beginning synthetic phonics"],
    "faq":[
      {"question":"Are lesson details visible before enrollment?","answer":"No. The public page shows the course overview and module names. Lesson activities unlock after enrollment."},
      {"question":"Does this course include a certificate?","answer":"No. This children course uses stars and progress rewards instead of a certificate."}
    ]
  }'::jsonb
),
(
  'Jolly Phonics Sounds: Groups 4-7',
  'jolly-phonics-sounds-groups-4-7',
  'Continue the phonics journey with digraphs, alternative sounds, formation, songs, blending and interactive practice.',
  'Continue your phonics adventure with Jolly Phonics Sounds: Groups 4-7, where children expand their reading skills by learning digraphs, alternative vowel sounds, and more advanced phonics patterns. Through interactive videos, songs, stories, tracing activities, flashcards, blending, and segmenting exercises, learners strengthen their reading fluency while building confidence in independent literacy.

This course completes all 42 Jolly Phonics sounds, preparing children for more fluent reading, writing, and spelling.',
  'Continue your phonics adventure with Jolly Phonics Sounds: Groups 4-7, where children expand their reading skills by learning digraphs, alternative vowel sounds, and more advanced phonics patterns. Through interactive videos, songs, stories, tracing activities, flashcards, blending, and segmenting exercises, learners strengthen their reading fluency while building confidence in independent literacy.

This course completes all 42 Jolly Phonics sounds, preparing children for more fluent reading, writing, and spelling.',
  'A follow-on children''s phonics course covering Jolly Phonics sound groups 4-7.',
  0,
  NULL,
  'children-courses',
  (SELECT id FROM course_categories WHERE slug = 'children-courses'),
  'beginner',
  'Self-paced',
  'Phonics Club',
  'Phonics Club supports young learners with structured, joyful synthetic phonics practice.',
  '/images/resources/Jolly-Phonics-Picture-Flashcards.jpg',
  '/images/resources/Jolly-Phonics-Picture-Flashcards.jpg',
  '/images/resources/Jolly-Phonics-Picture-Flashcards.jpg',
  '[
    {"title":"Welcome Back","description":"A quick review of previous learning before introducing the remaining Jolly Phonics sounds.","lessons":[]},
    {"title":"Sound Group 4 - ai, j, oa, ie, ee, or","description":"Children explore vowel digraphs through songs, stories, tracing and interactive practice.","lessons":[]},
    {"title":"Group 4 Practice and Review","description":"Revision activities reinforce pronunciation, recognition, blending and writing.","lessons":[]},
    {"title":"Sound Group 5 - z, w, ng, v, oo, oo","description":"Develop confidence recognising new consonant sounds and vowel variations.","lessons":[]},
    {"title":"Group 5 Practice and Review","description":"Interactive revision using games, tracing, flashcards, listening exercises and sound practice.","lessons":[]},
    {"title":"Sound Group 6 - y, x, ch, sh, th, th","description":"Children practise important digraphs and common English sound patterns.","lessons":[]},
    {"title":"Group 6 Practice and Review","description":"Review activities strengthen recognition, pronunciation and application of newly learned sounds.","lessons":[]},
    {"title":"Sound Group 7 - qu, ou, oi, ue, er, ar","description":"Complete the final Jolly Phonics sound group through engaging multimedia activities.","lessons":[]},
    {"title":"Group 7 Practice and Review","description":"Fun review games, tracing, listening and word-building activities reinforce all newly introduced sounds.","lessons":[]},
    {"title":"Groups 4-7 Blending and Segmenting","description":"Children apply all learned sounds to read, build and spell increasingly complex words.","lessons":[]},
    {"title":"Complete 42-Sound Review","description":"Comprehensive revision covering every Jolly Phonics sound through interactive activities and games.","lessons":[]},
    {"title":"Final Assessment","description":"Children demonstrate their understanding of all 42 sounds and celebrate achievements with rewards and progress tracking.","lessons":[]}
  ]'::jsonb,
  ARRAY[
    'Recognise and pronounce the remaining Jolly Phonics sounds.',
    'Identify common digraphs and alternative vowel sounds.',
    'Correctly form letters and digraphs through guided practice.',
    'Blend increasingly complex words with confidence.',
    'Segment words into individual sounds for spelling.',
    'Strengthen listening and sound recognition skills.',
    'Read a wider range of words using synthetic phonics.',
    'Improve reading fluency and early writing confidence.',
    'Complete all 42 Jolly Phonics sounds.'
  ],
  ARRAY[
    'Recommended completion of Jolly Phonics Sounds: Groups 1-3.',
    'Suitable for children aged 4 years and above.',
    'Basic understanding of the first 18 Jolly Phonics sounds is recommended.',
    'Adult supervision may be helpful for younger learners.',
    'Internet connection required for interactive activities and videos.'
  ],
  'Jolly Phonics Sounds Groups 4-7 Children Course',
  'Children continue Jolly Phonics with sound groups 4-7, digraphs, tracing, songs, blending, segmenting and complete 42-sound review.',
  4.9,
  0,
  TRUE,
  FALSE,
  TRUE,
  TRUE,
  TRUE,
  FALSE,
  FALSE,
  '{
    "lessons":33,
    "modules":12,
    "sounds":24,
    "quizzes":0,
    "format":"interactive",
    "certificateEnabled":false,
    "childSoundCourse":true,
    "coursePart":2,
    "prerequisite":{"courseSlug":"jolly-phonics-sounds-groups-1-3","recommended":true,"adminConfigurable":true},
    "soundGroups":["Group 4","Group 5","Group 6","Group 7"],
    "soundsIncluded":["ai","j","oa","ie","ee","or","z","w","ng","v","oo_short","oo_long","y","x","ch","sh","th_unvoiced","th_voiced","qu","ou","oi","ue","er","ar"],
    "standardActivityTypes":["sound_introduction","pronunciation_video","poem_or_song","story","action","flashcard","formation_demo","trace_and_write","listen_and_choose","picture_match","blending","segmenting","quick_review"],
    "contentPolicy":"Instructor uploads approved pronunciation, poem, story, action, formation and practice media before children access activities.",
    "highlights":["Remaining Jolly Phonics sound groups 4-7","Digraphs treated as single sound units","Separate records for the two oo and two th sounds","Blending and segmenting practice with approved examples","Complete 42-sound review"],
    "intendedAudience":["Children aged 4 years and above","Learners who know the first 18 Jolly Phonics sounds","Parents supporting early reading and spelling at home"],
    "faq":[
      {"question":"Should children complete Groups 1-3 first?","answer":"It is recommended. Admin can configure whether this prerequisite is required."},
      {"question":"Are the two oo and two th sounds merged?","answer":"No. They are kept as separate learning entries with separate internal sound keys."}
    ]
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  rich_description = EXCLUDED.rich_description,
  excerpt = EXCLUDED.excerpt,
  category = EXCLUDED.category,
  category_id = EXCLUDED.category_id,
  level = EXCLUDED.level,
  duration = EXCLUDED.duration,
  instructor = EXCLUDED.instructor,
  instructor_bio = EXCLUDED.instructor_bio,
  image_url = EXCLUDED.image_url,
  thumbnail_url = EXCLUDED.thumbnail_url,
  banner_url = EXCLUDED.banner_url,
  curriculum = EXCLUDED.curriculum,
  objectives = EXCLUDED.objectives,
  requirements = EXCLUDED.requirements,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  certificate_enabled = EXCLUDED.certificate_enabled,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

WITH module_rows(course_slug, sort_order, title, description) AS (
  VALUES
    ('jolly-phonics-sounds-groups-1-3', 1, 'Welcome to the Sound Adventure', 'Children are introduced to the course, activity types, navigation and learning routines.'),
    ('jolly-phonics-sounds-groups-1-3', 2, 'Sound Group 1 - s, a, t, i, p, n', 'Learn the first six sounds through pronunciation, songs, stories, actions, flashcards, tracing, listening, blending and review games.'),
    ('jolly-phonics-sounds-groups-1-3', 3, 'Group 1 Practice and Review', 'Interactive revision using flashcards, sound matching, tracing, memory games, blending, segmenting and a mini checkpoint.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 'Sound Group 2 - c, k, e, h, r, m, d', 'Practise pronunciation, formation, listening, blending and sound recognition through engaging activities.'),
    ('jolly-phonics-sounds-groups-1-3', 5, 'Group 2 Practice and Review', 'Consolidate learning through interactive games, word building, formation practice, listening activities and mini assessments.'),
    ('jolly-phonics-sounds-groups-1-3', 6, 'Sound Group 3 - g, o, u, l, f, b', 'Continue building reading confidence through stories, songs, tracing, blending and segmenting.'),
    ('jolly-phonics-sounds-groups-1-3', 7, 'Group 3 Practice and Review', 'Revision activities reinforce all sounds learned through games, picture matching, tracing and sound identification.'),
    ('jolly-phonics-sounds-groups-1-3', 8, 'Groups 1-3 Blending and Segmenting', 'Children begin reading simple words by combining learned sounds and developing phonemic awareness.'),
    ('jolly-phonics-sounds-groups-1-3', 9, 'Final Review and Assessment', 'Celebrate progress with review activities, a final assessment, achievement stars and practice recommendations.'),
    ('jolly-phonics-sounds-groups-4-7', 1, 'Welcome Back', 'A quick review of previous learning before introducing the remaining Jolly Phonics sounds.'),
    ('jolly-phonics-sounds-groups-4-7', 2, 'Sound Group 4 - ai, j, oa, ie, ee, or', 'Children explore vowel digraphs through songs, stories, tracing and interactive practice.'),
    ('jolly-phonics-sounds-groups-4-7', 3, 'Group 4 Practice and Review', 'Revision activities reinforce pronunciation, recognition, blending and writing.'),
    ('jolly-phonics-sounds-groups-4-7', 4, 'Sound Group 5 - z, w, ng, v, oo, oo', 'Develop confidence recognising new consonant sounds and vowel variations.'),
    ('jolly-phonics-sounds-groups-4-7', 5, 'Group 5 Practice and Review', 'Interactive revision using games, tracing, flashcards, listening exercises and sound practice.'),
    ('jolly-phonics-sounds-groups-4-7', 6, 'Sound Group 6 - y, x, ch, sh, th, th', 'Children practise important digraphs and common English sound patterns.'),
    ('jolly-phonics-sounds-groups-4-7', 7, 'Group 6 Practice and Review', 'Review activities strengthen recognition, pronunciation and application of newly learned sounds.'),
    ('jolly-phonics-sounds-groups-4-7', 8, 'Sound Group 7 - qu, ou, oi, ue, er, ar', 'Complete the final Jolly Phonics sound group through engaging multimedia activities.'),
    ('jolly-phonics-sounds-groups-4-7', 9, 'Group 7 Practice and Review', 'Fun review games, tracing, listening and word-building activities reinforce all newly introduced sounds.'),
    ('jolly-phonics-sounds-groups-4-7', 10, 'Groups 4-7 Blending and Segmenting', 'Children apply all learned sounds to read, build and spell increasingly complex words.'),
    ('jolly-phonics-sounds-groups-4-7', 11, 'Complete 42-Sound Review', 'Comprehensive revision covering every Jolly Phonics sound through interactive activities and games.'),
    ('jolly-phonics-sounds-groups-4-7', 12, 'Final Assessment', 'Children demonstrate their understanding of all 42 sounds and celebrate achievements with rewards and progress tracking.')
)
UPDATE course_modules m
SET title = mr.title,
    description = mr.description,
    updated_at = NOW()
FROM module_rows mr
JOIN courses c ON c.slug = mr.course_slug
WHERE m.course_id = c.id
  AND m.sort_order = mr.sort_order;

WITH module_rows(course_slug, sort_order, title, description) AS (
  VALUES
    ('jolly-phonics-sounds-groups-1-3', 1, 'Welcome to the Sound Adventure', 'Children are introduced to the course, activity types, navigation and learning routines.'),
    ('jolly-phonics-sounds-groups-1-3', 2, 'Sound Group 1 - s, a, t, i, p, n', 'Learn the first six sounds through pronunciation, songs, stories, actions, flashcards, tracing, listening, blending and review games.'),
    ('jolly-phonics-sounds-groups-1-3', 3, 'Group 1 Practice and Review', 'Interactive revision using flashcards, sound matching, tracing, memory games, blending, segmenting and a mini checkpoint.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 'Sound Group 2 - c, k, e, h, r, m, d', 'Practise pronunciation, formation, listening, blending and sound recognition through engaging activities.'),
    ('jolly-phonics-sounds-groups-1-3', 5, 'Group 2 Practice and Review', 'Consolidate learning through interactive games, word building, formation practice, listening activities and mini assessments.'),
    ('jolly-phonics-sounds-groups-1-3', 6, 'Sound Group 3 - g, o, u, l, f, b', 'Continue building reading confidence through stories, songs, tracing, blending and segmenting.'),
    ('jolly-phonics-sounds-groups-1-3', 7, 'Group 3 Practice and Review', 'Revision activities reinforce all sounds learned through games, picture matching, tracing and sound identification.'),
    ('jolly-phonics-sounds-groups-1-3', 8, 'Groups 1-3 Blending and Segmenting', 'Children begin reading simple words by combining learned sounds and developing phonemic awareness.'),
    ('jolly-phonics-sounds-groups-1-3', 9, 'Final Review and Assessment', 'Celebrate progress with review activities, a final assessment, achievement stars and practice recommendations.'),
    ('jolly-phonics-sounds-groups-4-7', 1, 'Welcome Back', 'A quick review of previous learning before introducing the remaining Jolly Phonics sounds.'),
    ('jolly-phonics-sounds-groups-4-7', 2, 'Sound Group 4 - ai, j, oa, ie, ee, or', 'Children explore vowel digraphs through songs, stories, tracing and interactive practice.'),
    ('jolly-phonics-sounds-groups-4-7', 3, 'Group 4 Practice and Review', 'Revision activities reinforce pronunciation, recognition, blending and writing.'),
    ('jolly-phonics-sounds-groups-4-7', 4, 'Sound Group 5 - z, w, ng, v, oo, oo', 'Develop confidence recognising new consonant sounds and vowel variations.'),
    ('jolly-phonics-sounds-groups-4-7', 5, 'Group 5 Practice and Review', 'Interactive revision using games, tracing, flashcards, listening exercises and sound practice.'),
    ('jolly-phonics-sounds-groups-4-7', 6, 'Sound Group 6 - y, x, ch, sh, th, th', 'Children practise important digraphs and common English sound patterns.'),
    ('jolly-phonics-sounds-groups-4-7', 7, 'Group 6 Practice and Review', 'Review activities strengthen recognition, pronunciation and application of newly learned sounds.'),
    ('jolly-phonics-sounds-groups-4-7', 8, 'Sound Group 7 - qu, ou, oi, ue, er, ar', 'Complete the final Jolly Phonics sound group through engaging multimedia activities.'),
    ('jolly-phonics-sounds-groups-4-7', 9, 'Group 7 Practice and Review', 'Fun review games, tracing, listening and word-building activities reinforce all newly introduced sounds.'),
    ('jolly-phonics-sounds-groups-4-7', 10, 'Groups 4-7 Blending and Segmenting', 'Children apply all learned sounds to read, build and spell increasingly complex words.'),
    ('jolly-phonics-sounds-groups-4-7', 11, 'Complete 42-Sound Review', 'Comprehensive revision covering every Jolly Phonics sound through interactive activities and games.'),
    ('jolly-phonics-sounds-groups-4-7', 12, 'Final Assessment', 'Children demonstrate their understanding of all 42 sounds and celebrate achievements with rewards and progress tracking.')
)
INSERT INTO course_modules (course_id, title, description, sort_order)
SELECT c.id, mr.title, mr.description, mr.sort_order
FROM module_rows mr
JOIN courses c ON c.slug = mr.course_slug
WHERE NOT EXISTS (
  SELECT 1
  FROM course_modules existing
  WHERE existing.course_id = c.id
    AND existing.sort_order = mr.sort_order
);

WITH lesson_rows(course_slug, module_sort, sort_order, title, description) AS (
  VALUES
    ('jolly-phonics-sounds-groups-1-3', 1, 1, 'Welcome Video', 'Instructor uploads a short introductory video for children and families.'),
    ('jolly-phonics-sounds-groups-1-3', 1, 2, 'How Activities Work', 'Animated walkthrough for flashcards, listen-and-say, formation, tracing, blending, segmenting and review games.'),
    ('jolly-phonics-sounds-groups-1-3', 2, 1, 'Sound s', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 2, 2, 'Sound a', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 2, 3, 'Sound t', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 2, 4, 'Sound i', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 2, 5, 'Sound p', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 2, 6, 'Sound n', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 2, 7, 'Group 1 Flashcard Review', 'Content required: add instructor-approved review activity media.'),
    ('jolly-phonics-sounds-groups-1-3', 2, 8, 'Group 1 Formation Practice', 'Content required: add instructor-approved formation practice.'),
    ('jolly-phonics-sounds-groups-1-3', 2, 9, 'Group 1 Listening Game', 'Content required: add instructor-approved listening activity.'),
    ('jolly-phonics-sounds-groups-1-3', 2, 10, 'Group 1 Blending Practice', 'Content required: add approved blending examples using taught sounds.'),
    ('jolly-phonics-sounds-groups-1-3', 2, 11, 'Group 1 Segmenting Practice', 'Content required: add approved segmenting examples using taught sounds.'),
    ('jolly-phonics-sounds-groups-1-3', 2, 12, 'Group 1 Checkpoint', 'Content required: add a child-friendly checkpoint.'),
    ('jolly-phonics-sounds-groups-1-3', 3, 1, 'Group 1 Practice and Review', 'Content required: add flashcards, matching, tracing, blending, segmenting, memory pairs and mini-quiz activities.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 1, 'Sound c', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 2, 'Sound k', 'Content required: keep c and k separate while adding pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 3, 'Sound e', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 4, 'Sound h', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 5, 'Sound r', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 6, 'Sound m', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 7, 'Sound d', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 8, 'Group 2 Flashcard Review', 'Content required: add instructor-approved review activity media.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 9, 'Group 2 Formation Practice', 'Content required: add instructor-approved formation practice.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 10, 'Group 2 Listening Game', 'Content required: add instructor-approved listening activity.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 11, 'Groups 1-2 Blending', 'Content required: add approved blending examples using taught sounds.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 12, 'Groups 1-2 Segmenting', 'Content required: add approved segmenting examples using taught sounds.'),
    ('jolly-phonics-sounds-groups-1-3', 4, 13, 'Group 2 Checkpoint', 'Content required: add a child-friendly checkpoint.'),
    ('jolly-phonics-sounds-groups-1-3', 5, 1, 'Group 2 Practice and Review', 'Content required: add c/k distinction, formation, word building, listening and mini-assessment activities.'),
    ('jolly-phonics-sounds-groups-1-3', 6, 1, 'Sound g', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 6, 2, 'Sound o', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 6, 3, 'Sound u', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 6, 4, 'Sound l', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 6, 5, 'Sound f', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 6, 6, 'Sound b', 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.'),
    ('jolly-phonics-sounds-groups-1-3', 6, 7, 'Group 3 Flashcard Review', 'Content required: add instructor-approved review activity media.'),
    ('jolly-phonics-sounds-groups-1-3', 6, 8, 'Group 3 Formation Practice', 'Content required: add instructor-approved formation practice.'),
    ('jolly-phonics-sounds-groups-1-3', 6, 9, 'Group 3 Listening Game', 'Content required: add instructor-approved listening activity.'),
    ('jolly-phonics-sounds-groups-1-3', 6, 10, 'Groups 1-3 Blending', 'Content required: add approved blending examples using taught sounds.'),
    ('jolly-phonics-sounds-groups-1-3', 6, 11, 'Groups 1-3 Segmenting', 'Content required: add approved segmenting examples using taught sounds.'),
    ('jolly-phonics-sounds-groups-1-3', 6, 12, 'Group 3 Checkpoint', 'Content required: add a child-friendly checkpoint.'),
    ('jolly-phonics-sounds-groups-1-3', 7, 1, 'Group 3 Practice and Review', 'Content required: add sound sorting, picture matching, word building and mini-assessment activities.'),
    ('jolly-phonics-sounds-groups-1-3', 8, 1, 'Groups 1-3 Blending Activities', 'Content required: add approved blending examples using only introduced sounds.'),
    ('jolly-phonics-sounds-groups-1-3', 8, 2, 'Groups 1-3 Segmenting Activities', 'Content required: add approved segmenting examples using only introduced sounds.'),
    ('jolly-phonics-sounds-groups-1-3', 9, 1, 'Final Review and Assessment', 'Content required: add recognition, listening, matching, formation, blending and segmenting checks.'),
    ('jolly-phonics-sounds-groups-4-7', 1, 1, 'Welcome Back', 'Content required: add a quick review of Groups 1-3 before introducing the remaining sounds.'),
    ('jolly-phonics-sounds-groups-4-7', 2, 1, 'Sound ai', 'Content required: treat the digraph as one sound unit and add approved media.'),
    ('jolly-phonics-sounds-groups-4-7', 2, 2, 'Sound j', 'Content required: add approved media and practice activities.'),
    ('jolly-phonics-sounds-groups-4-7', 2, 3, 'Sound oa', 'Content required: treat the digraph as one sound unit and add approved media.'),
    ('jolly-phonics-sounds-groups-4-7', 2, 4, 'Sound ie', 'Content required: treat the digraph as one sound unit and add approved media.'),
    ('jolly-phonics-sounds-groups-4-7', 2, 5, 'Sound ee', 'Content required: treat the digraph as one sound unit and add approved media.'),
    ('jolly-phonics-sounds-groups-4-7', 2, 6, 'Sound or', 'Content required: treat the digraph as one sound unit and add approved media.'),
    ('jolly-phonics-sounds-groups-4-7', 3, 1, 'Group 4 Practice and Review', 'Content required: add pronunciation, recognition, blending and writing review activities.'),
    ('jolly-phonics-sounds-groups-4-7', 4, 1, 'Sound z', 'Content required: add approved media and practice activities.'),
    ('jolly-phonics-sounds-groups-4-7', 4, 2, 'Sound w', 'Content required: add approved media and practice activities.'),
    ('jolly-phonics-sounds-groups-4-7', 4, 3, 'Sound ng', 'Content required: treat the digraph as one sound unit and add approved media.'),
    ('jolly-phonics-sounds-groups-4-7', 4, 4, 'Sound v', 'Content required: add approved media and practice activities.'),
    ('jolly-phonics-sounds-groups-4-7', 4, 5, 'Sound oo (short)', 'Content required: keep this oo sound separate from oo_long and add distinct pronunciation examples.'),
    ('jolly-phonics-sounds-groups-4-7', 4, 6, 'Sound oo (long)', 'Content required: keep this oo sound separate from oo_short and add distinct pronunciation examples.'),
    ('jolly-phonics-sounds-groups-4-7', 5, 1, 'Group 5 Practice and Review', 'Content required: add games, tracing, flashcards, listening and sound practice activities.'),
    ('jolly-phonics-sounds-groups-4-7', 6, 1, 'Sound y', 'Content required: add approved media and practice activities.'),
    ('jolly-phonics-sounds-groups-4-7', 6, 2, 'Sound x', 'Content required: add approved media and practice activities.'),
    ('jolly-phonics-sounds-groups-4-7', 6, 3, 'Sound ch', 'Content required: treat the digraph as one sound unit and add approved media.'),
    ('jolly-phonics-sounds-groups-4-7', 6, 4, 'Sound sh', 'Content required: treat the digraph as one sound unit and add approved media.'),
    ('jolly-phonics-sounds-groups-4-7', 6, 5, 'Sound th (unvoiced)', 'Content required: keep this th sound separate from th_voiced and add distinct pronunciation examples.'),
    ('jolly-phonics-sounds-groups-4-7', 6, 6, 'Sound th (voiced)', 'Content required: keep this th sound separate from th_unvoiced and add distinct pronunciation examples.'),
    ('jolly-phonics-sounds-groups-4-7', 7, 1, 'Group 6 Practice and Review', 'Content required: add recognition, pronunciation and application activities.'),
    ('jolly-phonics-sounds-groups-4-7', 8, 1, 'Sound qu', 'Content required: treat the digraph as one sound unit and add approved media.'),
    ('jolly-phonics-sounds-groups-4-7', 8, 2, 'Sound ou', 'Content required: treat the digraph as one sound unit and add approved media.'),
    ('jolly-phonics-sounds-groups-4-7', 8, 3, 'Sound oi', 'Content required: treat the digraph as one sound unit and add approved media.'),
    ('jolly-phonics-sounds-groups-4-7', 8, 4, 'Sound ue', 'Content required: treat the digraph as one sound unit and add approved media.'),
    ('jolly-phonics-sounds-groups-4-7', 8, 5, 'Sound er', 'Content required: treat the digraph as one sound unit and add approved media.'),
    ('jolly-phonics-sounds-groups-4-7', 8, 6, 'Sound ar', 'Content required: treat the digraph as one sound unit and add approved media.'),
    ('jolly-phonics-sounds-groups-4-7', 9, 1, 'Group 7 Practice and Review', 'Content required: add games, tracing, listening and word-building activities.'),
    ('jolly-phonics-sounds-groups-4-7', 10, 1, 'Groups 4-7 Blending Activities', 'Content required: add approved blending examples and keep digraphs as one tile.'),
    ('jolly-phonics-sounds-groups-4-7', 10, 2, 'Groups 4-7 Segmenting Activities', 'Content required: add approved segmenting examples and keep digraphs as one tile.'),
    ('jolly-phonics-sounds-groups-4-7', 11, 1, 'Complete 42-Sound Review', 'Content required: add comprehensive 42-sound review activities.'),
    ('jolly-phonics-sounds-groups-4-7', 12, 1, 'Final Assessment', 'Content required: add a child-friendly final assessment.')
)
INSERT INTO course_lessons (
  course_id,
  module_id,
  title,
  description,
  lesson_type,
  reading_type,
  duration_minutes,
  sort_order,
  is_preview,
  is_compulsory,
  sequentially_locked,
  manual_completion_allowed,
  completion_mode,
  required_completion_percentage,
  published,
  activity_data
)
SELECT
  c.id,
  m.id,
  lr.title,
  lr.description,
  'interactive'::lesson_type,
  'interactive_presentation',
  8,
  lr.sort_order,
  FALSE,
  TRUE,
  TRUE,
  TRUE,
  'manual',
  80,
  TRUE,
  jsonb_build_object(
    'childActivityShell', TRUE,
    'contentStatus', 'content_required',
    'activityTypes', '["sound_introduction","pronunciation_video","poem_or_song","story","action","flashcard","formation_demo","trace_and_write","listen_and_choose","picture_match","blending","segmenting","quick_review"]'::jsonb
  )
FROM lesson_rows lr
JOIN courses c ON c.slug = lr.course_slug
JOIN course_modules m ON m.course_id = c.id AND m.sort_order = lr.module_sort
WHERE NOT EXISTS (
  SELECT 1
  FROM course_lessons existing
  WHERE existing.course_id = c.id
    AND existing.module_id = m.id
    AND existing.sort_order = lr.sort_order
);

WITH sound_rows(course_slug, module_sort, lesson_title, sound_key, display_text, sound_group, course_part, sequence_order, sound_variant) AS (
  VALUES
    ('jolly-phonics-sounds-groups-1-3', 2, 'Sound s', 's', 's', 1, 1, 1, NULL),
    ('jolly-phonics-sounds-groups-1-3', 2, 'Sound a', 'a', 'a', 1, 1, 2, NULL),
    ('jolly-phonics-sounds-groups-1-3', 2, 'Sound t', 't', 't', 1, 1, 3, NULL),
    ('jolly-phonics-sounds-groups-1-3', 2, 'Sound i', 'i', 'i', 1, 1, 4, NULL),
    ('jolly-phonics-sounds-groups-1-3', 2, 'Sound p', 'p', 'p', 1, 1, 5, NULL),
    ('jolly-phonics-sounds-groups-1-3', 2, 'Sound n', 'n', 'n', 1, 1, 6, NULL),
    ('jolly-phonics-sounds-groups-1-3', 4, 'Sound c', 'c', 'c', 2, 1, 7, NULL),
    ('jolly-phonics-sounds-groups-1-3', 4, 'Sound k', 'k', 'k', 2, 1, 8, NULL),
    ('jolly-phonics-sounds-groups-1-3', 4, 'Sound e', 'e', 'e', 2, 1, 9, NULL),
    ('jolly-phonics-sounds-groups-1-3', 4, 'Sound h', 'h', 'h', 2, 1, 10, NULL),
    ('jolly-phonics-sounds-groups-1-3', 4, 'Sound r', 'r', 'r', 2, 1, 11, NULL),
    ('jolly-phonics-sounds-groups-1-3', 4, 'Sound m', 'm', 'm', 2, 1, 12, NULL),
    ('jolly-phonics-sounds-groups-1-3', 4, 'Sound d', 'd', 'd', 2, 1, 13, NULL),
    ('jolly-phonics-sounds-groups-1-3', 6, 'Sound g', 'g', 'g', 3, 1, 14, NULL),
    ('jolly-phonics-sounds-groups-1-3', 6, 'Sound o', 'o', 'o', 3, 1, 15, NULL),
    ('jolly-phonics-sounds-groups-1-3', 6, 'Sound u', 'u', 'u', 3, 1, 16, NULL),
    ('jolly-phonics-sounds-groups-1-3', 6, 'Sound l', 'l', 'l', 3, 1, 17, NULL),
    ('jolly-phonics-sounds-groups-1-3', 6, 'Sound f', 'f', 'f', 3, 1, 18, NULL),
    ('jolly-phonics-sounds-groups-1-3', 6, 'Sound b', 'b', 'b', 3, 1, 19, NULL),
    ('jolly-phonics-sounds-groups-4-7', 2, 'Sound ai', 'ai', 'ai', 4, 2, 1, NULL),
    ('jolly-phonics-sounds-groups-4-7', 2, 'Sound j', 'j', 'j', 4, 2, 2, NULL),
    ('jolly-phonics-sounds-groups-4-7', 2, 'Sound oa', 'oa', 'oa', 4, 2, 3, NULL),
    ('jolly-phonics-sounds-groups-4-7', 2, 'Sound ie', 'ie', 'ie', 4, 2, 4, NULL),
    ('jolly-phonics-sounds-groups-4-7', 2, 'Sound ee', 'ee', 'ee', 4, 2, 5, NULL),
    ('jolly-phonics-sounds-groups-4-7', 2, 'Sound or', 'or', 'or', 4, 2, 6, NULL),
    ('jolly-phonics-sounds-groups-4-7', 4, 'Sound z', 'z', 'z', 5, 2, 7, NULL),
    ('jolly-phonics-sounds-groups-4-7', 4, 'Sound w', 'w', 'w', 5, 2, 8, NULL),
    ('jolly-phonics-sounds-groups-4-7', 4, 'Sound ng', 'ng', 'ng', 5, 2, 9, NULL),
    ('jolly-phonics-sounds-groups-4-7', 4, 'Sound v', 'v', 'v', 5, 2, 10, NULL),
    ('jolly-phonics-sounds-groups-4-7', 4, 'Sound oo (short)', 'oo_short', 'oo', 5, 2, 11, 'short'),
    ('jolly-phonics-sounds-groups-4-7', 4, 'Sound oo (long)', 'oo_long', 'oo', 5, 2, 12, 'long'),
    ('jolly-phonics-sounds-groups-4-7', 6, 'Sound y', 'y', 'y', 6, 2, 13, NULL),
    ('jolly-phonics-sounds-groups-4-7', 6, 'Sound x', 'x', 'x', 6, 2, 14, NULL),
    ('jolly-phonics-sounds-groups-4-7', 6, 'Sound ch', 'ch', 'ch', 6, 2, 15, NULL),
    ('jolly-phonics-sounds-groups-4-7', 6, 'Sound sh', 'sh', 'sh', 6, 2, 16, NULL),
    ('jolly-phonics-sounds-groups-4-7', 6, 'Sound th (unvoiced)', 'th_unvoiced', 'th', 6, 2, 17, 'unvoiced'),
    ('jolly-phonics-sounds-groups-4-7', 6, 'Sound th (voiced)', 'th_voiced', 'th', 6, 2, 18, 'voiced'),
    ('jolly-phonics-sounds-groups-4-7', 8, 'Sound qu', 'qu', 'qu', 7, 2, 19, NULL),
    ('jolly-phonics-sounds-groups-4-7', 8, 'Sound ou', 'ou', 'ou', 7, 2, 20, NULL),
    ('jolly-phonics-sounds-groups-4-7', 8, 'Sound oi', 'oi', 'oi', 7, 2, 21, NULL),
    ('jolly-phonics-sounds-groups-4-7', 8, 'Sound ue', 'ue', 'ue', 7, 2, 22, NULL),
    ('jolly-phonics-sounds-groups-4-7', 8, 'Sound er', 'er', 'er', 7, 2, 23, NULL),
    ('jolly-phonics-sounds-groups-4-7', 8, 'Sound ar', 'ar', 'ar', 7, 2, 24, NULL)
)
INSERT INTO phonics_sound_profiles (
  lesson_id,
  sound_key,
  display_text,
  sound_group,
  course_part,
  sequence_order,
  sound_variant,
  settings
)
SELECT
  l.id,
  sr.sound_key,
  sr.display_text,
  sr.sound_group,
  sr.course_part,
  sr.sequence_order,
  sr.sound_variant,
  jsonb_build_object(
    'contentStatus', 'content_required',
    'digraph', length(sr.display_text) > 1,
    'activityTypes', '["sound_introduction","pronunciation_video","poem_or_song","story","action","flashcard","formation_demo","trace_and_write","listen_and_choose","picture_match","blending","segmenting","quick_review"]'::jsonb,
    'adminNote', 'Upload approved media and examples before publishing this sound activity to children.'
  )
FROM sound_rows sr
JOIN courses c ON c.slug = sr.course_slug
JOIN course_modules m ON m.course_id = c.id AND m.sort_order = sr.module_sort
JOIN course_lessons l ON l.course_id = c.id AND l.module_id = m.id AND l.title = sr.lesson_title
WHERE NOT EXISTS (
  SELECT 1
  FROM phonics_sound_profiles existing
  WHERE existing.course_part = sr.course_part
    AND existing.sound_key = sr.sound_key
);

WITH activity_defs(activity_type, title, instructions, sequence_order, is_required) AS (
  VALUES
    ('sound_introduction', 'Sound Introduction', 'Show the sound and add pronunciation media before publishing.', 1, TRUE),
    ('pronunciation_video', 'Sound Pronunciation Video', 'Upload or link a pronunciation video.', 2, TRUE),
    ('poem_or_song', 'Poem or Song', 'Upload an approved poem, rhyme or song video.', 3, FALSE),
    ('story', 'Story', 'Add an approved child-friendly story or narrated media.', 4, FALSE),
    ('action', 'Action', 'Add action image, animation or video.', 5, FALSE),
    ('flashcard', 'Flashcard', 'Add a large flashcard image or use the display text fallback.', 6, TRUE),
    ('formation_demo', 'Formation Demo', 'Add verified formation video or stroke data. Do not invent stroke paths.', 7, FALSE),
    ('trace_and_write', 'Trace and Write', 'Add tracing guide data or worksheet media.', 8, FALSE),
    ('listen_and_choose', 'Listen and Choose', 'Add listening prompts and answer choices.', 9, FALSE),
    ('picture_match', 'Picture Match', 'Add approved example pictures.', 10, FALSE),
    ('blending', 'Blending', 'Add instructor-approved blending examples.', 11, FALSE),
    ('segmenting', 'Segmenting', 'Add instructor-approved segmenting examples.', 12, FALSE),
    ('quick_review', 'Quick Review', 'Add review prompts and child-friendly reward feedback.', 13, TRUE)
)
INSERT INTO phonics_activities (
  sound_profile_id,
  activity_type,
  title,
  instructions,
  content,
  sequence_order,
  is_required,
  is_published
)
SELECT
  sp.id,
  ad.activity_type,
  ad.title,
  ad.instructions,
  jsonb_build_object('status', 'content_required', 'safeSeed', TRUE),
  ad.sequence_order,
  ad.is_required,
  FALSE
FROM phonics_sound_profiles sp
CROSS JOIN activity_defs ad
WHERE NOT EXISTS (
  SELECT 1
  FROM phonics_activities existing
  WHERE existing.sound_profile_id = sp.id
    AND existing.activity_type = ad.activity_type
);
