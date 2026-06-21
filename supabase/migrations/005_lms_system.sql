-- LMS System: modules, lessons, progress, reviews, certificates, chatbot, storage

-- Extend courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS objectives TEXT[] DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS requirements TEXT[] DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS students_count INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_bio TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_avatar TEXT;

-- Extend enrollments for payment-ready structure
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'free';
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Course categories
CREATE TABLE IF NOT EXISTS course_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Course modules
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Course lessons
CREATE TYPE lesson_type AS ENUM ('video', 'pdf', 'notes', 'quiz', 'assignment');

CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lesson_type lesson_type NOT NULL DEFAULT 'video',
  video_url TEXT,
  material_url TEXT,
  content TEXT,
  duration_minutes INTEGER DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_preview BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lesson progress
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  watch_position INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

-- Course reviews
CREATE TABLE IF NOT EXISTS course_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, user_id)
);

-- Issued certificates
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  course_title TEXT NOT NULL,
  instructor_name TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pdf_url TEXT,
  UNIQUE (user_id, course_id)
);

-- Blog categories
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Blog comments
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name TEXT,
  content TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Training packages
CREATE TABLE IF NOT EXISTS training_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration TEXT,
  included_courses UUID[] DEFAULT '{}',
  included_products UUID[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  certificate BOOLEAN DEFAULT TRUE,
  support_level TEXT DEFAULT 'standard',
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chatbot knowledge base
CREATE TABLE IF NOT EXISTS chatbot_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL DEFAULT 'faq',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('course-videos', 'course-videos', false, 524288000, ARRAY['video/mp4', 'video/webm']),
  ('course-materials', 'course-materials', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('course-images', 'course-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public read course images" ON storage.objects;
CREATE POLICY "Public read course images"
  ON storage.objects FOR SELECT USING (bucket_id = 'course-images');

DROP POLICY IF EXISTS "Admins manage course storage" ON storage.objects;
CREATE POLICY "Admins manage course storage"
  ON storage.objects FOR ALL
  USING (bucket_id IN ('course-videos', 'course-materials', 'course-images') AND is_admin());

DROP POLICY IF EXISTS "Enrolled users read course videos" ON storage.objects;
CREATE POLICY "Enrolled users read course videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id IN ('course-videos', 'course-materials')
    AND EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.user_id = auth.uid()
    )
  );

-- RLS
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published course modules"
  ON course_modules FOR SELECT
  USING (EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.published = true));

CREATE POLICY "Admins manage course modules"
  ON course_modules FOR ALL USING (is_admin());

CREATE POLICY "Public read published lessons preview"
  ON course_lessons FOR SELECT
  USING (
    is_preview = true
    OR EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.published = true)
  );

CREATE POLICY "Enrolled users read lessons"
  ON course_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.course_id = course_lessons.course_id AND e.user_id = auth.uid()
    )
    OR is_preview = true
    OR is_admin()
  );

CREATE POLICY "Admins manage lessons"
  ON course_lessons FOR ALL USING (is_admin());

CREATE POLICY "Users manage own progress"
  ON lesson_progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read approved reviews"
  ON course_reviews FOR SELECT USING (true);

CREATE POLICY "Users create own reviews"
  ON course_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own certificates"
  ON certificates FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins manage certificates"
  ON certificates FOR ALL USING (is_admin());

CREATE POLICY "Public read approved comments"
  ON blog_comments FOR SELECT USING (approved = true OR is_admin());

CREATE POLICY "Users submit comments"
  ON blog_comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read published packages"
  ON training_packages FOR SELECT USING (published = true);

CREATE POLICY "Admins manage packages"
  ON training_packages FOR ALL USING (is_admin());

CREATE POLICY "Public read active knowledge"
  ON chatbot_knowledge FOR SELECT USING (active = true);

CREATE POLICY "Admins manage knowledge"
  ON chatbot_knowledge FOR ALL USING (is_admin());

CREATE POLICY "Users manage own chat sessions"
  ON chat_sessions FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Public read course categories"
  ON course_categories FOR SELECT USING (true);

CREATE POLICY "Admins manage course categories"
  ON course_categories FOR ALL USING (is_admin());

-- Seed default chatbot knowledge
INSERT INTO chatbot_knowledge (category, question, answer, keywords)
SELECT * FROM (VALUES
  ('faq', 'What courses do you offer?', 'We offer Jolly Phonics teacher training, Preschool Professional, and free introductory courses. Visit /courses to browse all programs.', ARRAY['courses', 'training', 'offer']::TEXT[]),
  ('faq', 'How do I enroll?', 'Browse /courses, select a course, and click Enroll. Create an account if needed.', ARRAY['enroll', 'register', 'sign up']::TEXT[]),
  ('faq', 'Payment methods?', 'We accept bank transfer, JazzCash, EasyPaisa, and card payments.', ARRAY['payment', 'jazzcash', 'easypaisa']::TEXT[]),
  ('faq', 'Where are you located?', 'Phonics Club is based in Pakistan, Lahore (LHR).', ARRAY['location', 'lahore', 'pakistan']::TEXT[])
) AS v(category, question, answer, keywords)
WHERE NOT EXISTS (SELECT 1 FROM chatbot_knowledge LIMIT 1);
