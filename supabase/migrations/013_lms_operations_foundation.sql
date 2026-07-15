-- LMS operations foundation: course administration, protected resources,
-- paid course payments, assignments, online/offline time, completion rules,
-- certificate verification, audit logs, notifications and private storage.
--
-- Run after 012_courses_lms_jolly_phonics.sql. Non-destructive and idempotent
-- where practical: existing core LMS tables are extended, not recreated.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE course_payment_status AS ENUM ('pending', 'processing', 'submitted', 'paid', 'failed', 'cancelled', 'rejected', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE course_enrollment_status AS ENUM ('pending', 'active', 'completed', 'expired', 'cancelled', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE assignment_submission_status AS ENUM ('draft', 'submitted', 'under_review', 'graded', 'returned', 'resubmission_required', 'late');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE assignment_question_type AS ENUM ('short_text', 'long_text', 'multiple_choice', 'checkbox', 'true_false', 'numeric', 'file_upload');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE offline_activity_status AS ENUM ('draft', 'submitted', 'approved', 'partially_approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE lms_resource_scope AS ENUM ('course', 'module', 'lesson', 'quiz', 'assignment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE lms_resource_visibility AS ENUM ('public', 'enrolled', 'paid', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE lms_video_source_type AS ENUM ('external', 'storage');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE certificate_status AS ENUM ('issued', 'revoked', 'reissued');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rich_description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'English';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10,2);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'PKR';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS enrolment_opens_at TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS enrolment_closes_at TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS max_students INTEGER CHECK (max_students IS NULL OR max_students > 0);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS access_duration_days INTEGER NOT NULL DEFAULT 90 CHECK (access_duration_days > 0);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS required_online_minutes INTEGER NOT NULL DEFAULT 0 CHECK (required_online_minutes >= 0);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS required_offline_minutes INTEGER NOT NULL DEFAULT 0 CHECK (required_offline_minutes >= 0);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS passing_quiz_percentage INTEGER NOT NULL DEFAULT 70 CHECK (passing_quiz_percentage BETWEEN 0 AND 100);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS required_assignment_passes INTEGER NOT NULL DEFAULT 0 CHECK (required_assignment_passes >= 0);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS completion_requires_lessons BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS completion_requires_online_minutes BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS completion_requires_offline_minutes BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS completion_requires_quiz BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS completion_requires_assignments BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS completion_requires_active_enrollment BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS completion_requires_instructor_approval BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS daily_online_minutes_cap INTEGER NOT NULL DEFAULT 480 CHECK (daily_online_minutes_cap > 0);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS inactivity_timeout_seconds INTEGER NOT NULL DEFAULT 240 CHECK (inactivity_timeout_seconds BETWEEN 180 AND 300);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS max_offline_entry_minutes INTEGER NOT NULL DEFAULT 360 CHECK (max_offline_entry_minutes > 0);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS offline_evidence_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS expiry_warning_days INTEGER[] NOT NULL DEFAULT ARRAY[14,7,3,1];

ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS status course_enrollment_status NOT NULL DEFAULT 'active';
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS access_extended_until TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_id UUID;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS available_at TIMESTAMPTZ;
ALTER TABLE course_modules ADD COLUMN IF NOT EXISTS locked_until_previous_complete BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS rich_content TEXT;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS objectives TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS is_compulsory BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS is_optional BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS sequentially_locked BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS manual_completion_allowed BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS completion_mode TEXT NOT NULL DEFAULT 'manual' CHECK (completion_mode IN ('manual', 'content_threshold', 'video_threshold'));
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS required_completion_percentage INTEGER NOT NULL DEFAULT 80 CHECK (required_completion_percentage BETWEEN 0 AND 100);
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS downloadable BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS content_progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (content_progress_percentage BETWEEN 0 AND 100);
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS online_seconds INTEGER NOT NULL DEFAULT 0 CHECK (online_seconds >= 0);
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS video_seconds INTEGER NOT NULL DEFAULT 0 CHECK (video_seconds >= 0);
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS video_percentage INTEGER NOT NULL DEFAULT 0 CHECK (video_percentage BETWEEN 0 AND 100);
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS course_instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'instructor' CHECK (role IN ('owner', 'instructor', 'assistant')),
  can_manage_content BOOLEAN NOT NULL DEFAULT FALSE,
  can_grade BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_reports BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, profile_id)
);

CREATE OR REPLACE FUNCTION is_course_instructor(p_course_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM course_instructors ci
    WHERE ci.course_id = p_course_id AND ci.profile_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION has_active_course_enrollment(p_course_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM enrollments e
    WHERE e.course_id = p_course_id
      AND e.user_id = p_user_id
      AND e.status IN ('active', 'completed')
      AND (e.expires_at IS NULL OR e.expires_at > NOW())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION can_manage_course(p_course_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT is_admin() OR EXISTS (
    SELECT 1 FROM course_instructors ci
    WHERE ci.course_id = p_course_id
      AND ci.profile_id = p_user_id
      AND ci.can_manage_content = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE;
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS quiz_id UUID REFERENCES course_quizzes(id) ON DELETE CASCADE;
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS assignment_id UUID;
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS scope lms_resource_scope NOT NULL DEFAULT 'course';
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS storage_bucket TEXT;
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS original_filename TEXT;
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0);
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS visibility lms_resource_visibility NOT NULL DEFAULT 'enrolled';
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS is_compulsory BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS is_view_only BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS replaced_by_resource_id UUID REFERENCES course_resources(id) ON DELETE SET NULL;
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE course_resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS course_resource_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES course_resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash TEXT,
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS course_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_type lms_video_source_type NOT NULL DEFAULT 'external',
  external_url TEXT,
  storage_bucket TEXT,
  storage_path TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  thumbnail_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  compulsory BOOLEAN NOT NULL DEFAULT TRUE,
  required_completion_percentage INTEGER NOT NULL DEFAULT 80 CHECK (required_completion_percentage BETWEEN 0 AND 100),
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES course_videos(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (last_position_seconds >= 0),
  active_watch_seconds INTEGER NOT NULL DEFAULT 0 CHECK (active_watch_seconds >= 0),
  watched_percentage INTEGER NOT NULL DEFAULT 0 CHECK (watched_percentage BETWEEN 0 AND 100),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (video_id, user_id)
);

CREATE TABLE IF NOT EXISTS course_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'PKR',
  status course_payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'manual_bank_transfer',
  provider TEXT NOT NULL DEFAULT 'manual',
  gateway_session_id TEXT,
  gateway_reference TEXT,
  transaction_reference TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  receipt_bucket TEXT,
  receipt_path TEXT,
  receipt_url TEXT,
  receipt_filename TEXT,
  receipt_mime_type TEXT,
  receipt_size_bytes BIGINT CHECK (receipt_size_bytes IS NULL OR receipt_size_bytes >= 0),
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admin_note TEXT,
  rejection_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_payment_id_fkey'
  ) THEN
    ALTER TABLE enrollments
      ADD CONSTRAINT enrollments_payment_id_fkey
      FOREIGN KEY (payment_id) REFERENCES course_payments(id) ON DELETE SET NULL
      NOT VALID;
  END IF;
  ALTER TABLE enrollments VALIDATE CONSTRAINT enrollments_payment_id_fkey;
EXCEPTION WHEN undefined_object OR foreign_key_violation OR duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS course_payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES course_payments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  previous_status course_payment_status,
  new_status course_payment_status NOT NULL,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES course_payments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'PKR',
  pdf_bucket TEXT,
  pdf_path TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT,
  opens_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  total_marks DECIMAL(10,2) NOT NULL DEFAULT 100 CHECK (total_marks >= 0),
  passing_marks DECIMAL(10,2) NOT NULL DEFAULT 50 CHECK (passing_marks >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 1 CHECK (max_attempts > 0),
  allow_late_submissions BOOLEAN NOT NULL DEFAULT FALSE,
  late_penalty_percent INTEGER NOT NULL DEFAULT 0 CHECK (late_penalty_percent BETWEEN 0 AND 100),
  allow_drafts BOOLEAN NOT NULL DEFAULT TRUE,
  allow_text_submissions BOOLEAN NOT NULL DEFAULT TRUE,
  allow_file_submissions BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_mime_types TEXT[] NOT NULL DEFAULT '{}',
  max_upload_size_bytes BIGINT NOT NULL DEFAULT 10485760 CHECK (max_upload_size_bytes > 0),
  model_answer TEXT,
  marking_guide TEXT,
  allow_resubmission BOOLEAN NOT NULL DEFAULT FALSE,
  feedback_release_at TIMESTAMPTZ,
  feedback_released BOOLEAN NOT NULL DEFAULT FALSE,
  compulsory BOOLEAN NOT NULL DEFAULT TRUE,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (passing_marks <= total_marks)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'course_resources_assignment_id_fkey'
  ) THEN
    ALTER TABLE course_resources
      ADD CONSTRAINT course_resources_assignment_id_fkey
      FOREIGN KEY (assignment_id) REFERENCES course_assignments(id) ON DELETE CASCADE
      NOT VALID;
  END IF;
  ALTER TABLE course_resources VALIDATE CONSTRAINT course_resources_assignment_id_fkey;
EXCEPTION WHEN undefined_object OR foreign_key_violation OR duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS assignment_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES course_assignments(id) ON DELETE CASCADE,
  question_type assignment_question_type NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer JSONB,
  points DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (points >= 0),
  required BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES course_assignments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1 CHECK (attempt_number > 0),
  status assignment_submission_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  late BOOLEAN NOT NULL DEFAULT FALSE,
  total_awarded_marks DECIMAL(10,2) CHECK (total_awarded_marks IS NULL OR total_awarded_marks >= 0),
  passed BOOLEAN,
  overall_feedback TEXT,
  feedback_released BOOLEAN NOT NULL DEFAULT FALSE,
  released_at TIMESTAMPTZ,
  graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assignment_id, user_id, attempt_number)
);

CREATE TABLE IF NOT EXISTS assignment_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES assignment_questions(id) ON DELETE CASCADE,
  answer JSONB NOT NULL DEFAULT '{}',
  awarded_marks DECIMAL(10,2) CHECK (awarded_marks IS NULL OR awarded_marks >= 0),
  feedback TEXT,
  grading_draft JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, question_id)
);

CREATE TABLE IF NOT EXISTS assignment_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES assignment_questions(id) ON DELETE SET NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'assignment-submissions',
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES course_assignments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  total_marks DECIMAL(10,2) NOT NULL CHECK (total_marks >= 0),
  awarded_marks DECIMAL(10,2) NOT NULL CHECK (awarded_marks >= 0),
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  feedback TEXT,
  released BOOLEAN NOT NULL DEFAULT FALSE,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id)
);

CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  device_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  credited_seconds INTEGER NOT NULL DEFAULT 0 CHECK (credited_seconds >= 0),
  inactivity_seconds INTEGER NOT NULL DEFAULT 0 CHECK (inactivity_seconds >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended', 'flagged')),
  validation_flags TEXT[] NOT NULL DEFAULT '{}',
  suspicious BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_heartbeats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE SET NULL,
  heartbeat_id TEXT NOT NULL UNIQUE,
  client_sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  credited_seconds INTEGER NOT NULL DEFAULT 0 CHECK (credited_seconds >= 0),
  visible BOOLEAN NOT NULL DEFAULT FALSE,
  focused BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  route TEXT,
  validation_flags TEXT[] NOT NULL DEFAULT '{}',
  suspicious BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS lesson_time_totals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  approved_seconds INTEGER NOT NULL DEFAULT 0 CHECK (approved_seconds >= 0),
  last_activity_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS offline_activity_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES course_modules(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE SET NULL,
  activity_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  claimed_minutes INTEGER NOT NULL CHECK (claimed_minutes >= 0),
  approved_minutes INTEGER NOT NULL DEFAULT 0 CHECK (approved_minutes >= 0),
  activity_type TEXT NOT NULL,
  description TEXT,
  student_declaration BOOLEAN NOT NULL DEFAULT FALSE,
  status offline_activity_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  adjustment_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time),
  CHECK (approved_minutes <= claimed_minutes)
);

CREATE TABLE IF NOT EXISTS offline_activity_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES offline_activity_entries(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL DEFAULT 'offline-activity-evidence',
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offline_activity_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES offline_activity_entries(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  previous_status offline_activity_status,
  new_status offline_activity_status NOT NULL,
  approved_minutes INTEGER NOT NULL DEFAULT 0 CHECK (approved_minutes >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_completion_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  lessons_completed INTEGER NOT NULL DEFAULT 0 CHECK (lessons_completed >= 0),
  lessons_required INTEGER NOT NULL DEFAULT 0 CHECK (lessons_required >= 0),
  online_minutes INTEGER NOT NULL DEFAULT 0 CHECK (online_minutes >= 0),
  offline_minutes INTEGER NOT NULL DEFAULT 0 CHECK (offline_minutes >= 0),
  final_quiz_score INTEGER CHECK (final_quiz_score IS NULL OR final_quiz_score BETWEEN 0 AND 100),
  required_assignments_passed INTEGER NOT NULL DEFAULT 0 CHECK (required_assignments_passed >= 0),
  required_assignments_total INTEGER NOT NULL DEFAULT 0 CHECK (required_assignments_total >= 0),
  instructor_approved BOOLEAN NOT NULL DEFAULT FALSE,
  eligible_for_certificate BOOLEAN NOT NULL DEFAULT FALSE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  checklist JSONB NOT NULL DEFAULT '{}',
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS lms_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  previous_values JSONB,
  new_values JSONB,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMPTZ,
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE certificate_templates ADD COLUMN IF NOT EXISTS template_bucket TEXT;
ALTER TABLE certificate_templates ADD COLUMN IF NOT EXISTS template_path TEXT;
ALTER TABLE certificate_templates ADD COLUMN IF NOT EXISTS fields JSONB NOT NULL DEFAULT '{}';
ALTER TABLE certificate_templates ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE certificates ADD COLUMN IF NOT EXISTS status certificate_status NOT NULL DEFAULT 'issued';
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES certificate_templates(id) ON DELETE SET NULL;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS completion_status_id UUID REFERENCES course_completion_status(id) ON DELETE SET NULL;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS online_minutes INTEGER NOT NULL DEFAULT 0 CHECK (online_minutes >= 0);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS offline_minutes INTEGER NOT NULL DEFAULT 0 CHECK (offline_minutes >= 0);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS final_score INTEGER CHECK (final_score IS NULL OR final_score BETWEEN 0 AND 100);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS verification_code TEXT UNIQUE;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS verification_url TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS pdf_bucket TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS pdf_path TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS revoke_reason TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS reissued_from_certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON enrollments(user_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_course_instructors_profile ON course_instructors(profile_id);
CREATE INDEX IF NOT EXISTS idx_course_resources_scope ON course_resources(course_id, scope, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_resources_lesson ON course_resources(lesson_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_videos_lesson ON course_videos(lesson_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_video_progress_user_course ON video_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_course_payments_user_status ON course_payments(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_payments_course_status ON course_payments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_course_payment_events_payment ON course_payment_events(payment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_assignments_course ON course_assignments(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_assignment_questions_assignment ON assignment_questions(assignment_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user_status ON assignment_submissions(user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_course ON learning_sessions(user_id, course_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_heartbeats_session ON learning_heartbeats(session_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_time_totals_user_course ON lesson_time_totals(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_offline_entries_user_status ON offline_activity_entries(user_id, course_id, status, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_completion_status_user_course ON course_completion_status(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_course_entity ON lms_audit_logs(course_id, entity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_events_status ON notification_events(status, created_at);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON certificates(verification_code);

DROP TRIGGER IF EXISTS course_resources_updated_at ON course_resources;
CREATE TRIGGER course_resources_updated_at BEFORE UPDATE ON course_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS course_videos_updated_at ON course_videos;
CREATE TRIGGER course_videos_updated_at BEFORE UPDATE ON course_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS course_payments_updated_at ON course_payments;
CREATE TRIGGER course_payments_updated_at BEFORE UPDATE ON course_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS course_assignments_updated_at ON course_assignments;
CREATE TRIGGER course_assignments_updated_at BEFORE UPDATE ON course_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS assignment_submissions_updated_at ON assignment_submissions;
CREATE TRIGGER assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS assignment_answers_updated_at ON assignment_answers;
CREATE TRIGGER assignment_answers_updated_at BEFORE UPDATE ON assignment_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS assignment_grades_updated_at ON assignment_grades;
CREATE TRIGGER assignment_grades_updated_at BEFORE UPDATE ON assignment_grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS offline_activity_entries_updated_at ON offline_activity_entries;
CREATE TRIGGER offline_activity_entries_updated_at BEFORE UPDATE ON offline_activity_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE course_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_resource_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_time_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_activity_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_activity_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_activity_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_completion_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrolled users read course videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage lms protected storage" ON storage.objects;
CREATE POLICY "Admins manage lms protected storage"
  ON storage.objects FOR ALL
  USING (
    bucket_id IN (
      'course-resources',
      'course-videos',
      'assignment-submissions',
      'offline-activity-evidence',
      'payment-receipts',
      'certificate-templates',
      'generated-certificates'
    )
    AND is_admin()
  )
  WITH CHECK (
    bucket_id IN (
      'course-resources',
      'course-videos',
      'assignment-submissions',
      'offline-activity-evidence',
      'payment-receipts',
      'certificate-templates',
      'generated-certificates'
    )
    AND is_admin()
  );

DROP POLICY IF EXISTS "Users enroll themselves" ON enrollments;
DROP POLICY IF EXISTS "Users create own free enrollments" ON enrollments;
CREATE POLICY "Users create own free enrollments"
  ON enrollments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'active'
    AND payment_status = 'free'
    AND EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_id
        AND c.published = TRUE
        AND (c.is_free = TRUE OR c.price = 0)
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('course-resources', 'course-resources', false, 104857600, ARRAY[
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
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/webm',
    'application/zip'
  ]),
  ('assignment-submissions', 'assignment-submissions', false, 52428800, ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'application/zip'
  ]),
  ('offline-activity-evidence', 'offline-activity-evidence', false, 52428800, ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/zip'
  ]),
  ('payment-receipts', 'payment-receipts', false, 10485760, ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]),
  ('certificate-templates', 'certificate-templates', false, 20971520, ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png'
  ]),
  ('generated-certificates', 'generated-certificates', false, 20971520, ARRAY[
    'application/pdf'
  ])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Course instructors are readable by course members" ON course_instructors;
CREATE POLICY "Course instructors are readable by course members"
  ON course_instructors FOR SELECT
  USING (is_admin() OR profile_id = auth.uid() OR has_active_course_enrollment(course_id));

DROP POLICY IF EXISTS "Admins manage course instructors" ON course_instructors;
CREATE POLICY "Admins manage course instructors"
  ON course_instructors FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Public read course level resources" ON course_resources;
DROP POLICY IF EXISTS "Enrolled users read course resources" ON course_resources;
DROP POLICY IF EXISTS "Active enrolled users read protected resources" ON course_resources;
CREATE POLICY "Active enrolled users read protected resources"
  ON course_resources FOR SELECT
  USING (
    is_admin()
    OR visibility = 'public'
    OR (visibility IN ('enrolled', 'paid') AND has_active_course_enrollment(course_id))
    OR EXISTS (
      SELECT 1 FROM course_lessons l
      WHERE l.id = course_resources.lesson_id AND l.is_preview = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins manage course resources" ON course_resources;
CREATE POLICY "Admins manage course resources"
  ON course_resources FOR ALL
  USING (is_admin() OR can_manage_course(course_id))
  WITH CHECK (is_admin() OR can_manage_course(course_id));

DROP POLICY IF EXISTS "Users read own resource downloads" ON course_resource_downloads;
CREATE POLICY "Users read own resource downloads"
  ON course_resource_downloads FOR SELECT
  USING (auth.uid() = user_id OR is_admin() OR is_course_instructor(course_id));

DROP POLICY IF EXISTS "Service inserts resource downloads" ON course_resource_downloads;
CREATE POLICY "Service inserts resource downloads"
  ON course_resource_downloads FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Active enrolled users read course videos" ON course_videos;
CREATE POLICY "Active enrolled users read course videos"
  ON course_videos FOR SELECT
  USING (is_admin() OR published = TRUE AND (has_active_course_enrollment(course_id) OR EXISTS (
    SELECT 1 FROM course_lessons l WHERE l.id = course_videos.lesson_id AND l.is_preview = TRUE
  )));

DROP POLICY IF EXISTS "Admins manage course videos" ON course_videos;
CREATE POLICY "Admins manage course videos"
  ON course_videos FOR ALL
  USING (is_admin() OR can_manage_course(course_id))
  WITH CHECK (is_admin() OR can_manage_course(course_id));

DROP POLICY IF EXISTS "Users manage own video progress" ON video_progress;
CREATE POLICY "Users manage own video progress"
  ON video_progress FOR ALL
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users read own course payments" ON course_payments;
CREATE POLICY "Users read own course payments"
  ON course_payments FOR SELECT
  USING (auth.uid() = user_id OR is_admin() OR is_course_instructor(course_id));

DROP POLICY IF EXISTS "Users create own pending course payments" ON course_payments;
CREATE POLICY "Users create own pending course payments"
  ON course_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'submitted'));

DROP POLICY IF EXISTS "Admins manage course payments" ON course_payments;
CREATE POLICY "Admins manage course payments"
  ON course_payments FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Users read own payment events" ON course_payment_events;
CREATE POLICY "Users read own payment events"
  ON course_payment_events FOR SELECT
  USING (auth.uid() = user_id OR is_admin() OR is_course_instructor(course_id));

DROP POLICY IF EXISTS "Admins manage payment events" ON course_payment_events;
CREATE POLICY "Admins manage payment events"
  ON course_payment_events FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Users read own course invoices" ON course_invoices;
CREATE POLICY "Users read own course invoices"
  ON course_invoices FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Admins manage course invoices" ON course_invoices;
CREATE POLICY "Admins manage course invoices"
  ON course_invoices FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Course assignment visibility" ON course_assignments;
CREATE POLICY "Course assignment visibility"
  ON course_assignments FOR SELECT
  USING (is_admin() OR published = TRUE AND has_active_course_enrollment(course_id));

DROP POLICY IF EXISTS "Admins manage course assignments" ON course_assignments;
CREATE POLICY "Admins manage course assignments"
  ON course_assignments FOR ALL
  USING (is_admin() OR can_manage_course(course_id))
  WITH CHECK (is_admin() OR can_manage_course(course_id));

DROP POLICY IF EXISTS "Assignment questions visible with assignment" ON assignment_questions;
CREATE POLICY "Assignment questions visible with assignment"
  ON assignment_questions FOR SELECT
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM course_assignments a
      WHERE a.id = assignment_questions.assignment_id
        AND a.published = TRUE
        AND has_active_course_enrollment(a.course_id)
    )
  );

DROP POLICY IF EXISTS "Admins manage assignment questions" ON assignment_questions;
CREATE POLICY "Admins manage assignment questions"
  ON assignment_questions FOR ALL
  USING (is_admin() OR EXISTS (
    SELECT 1 FROM course_assignments a WHERE a.id = assignment_questions.assignment_id AND can_manage_course(a.course_id)
  ))
  WITH CHECK (is_admin() OR EXISTS (
    SELECT 1 FROM course_assignments a WHERE a.id = assignment_questions.assignment_id AND can_manage_course(a.course_id)
  ));

DROP POLICY IF EXISTS "Users read own assignment submissions" ON assignment_submissions;
CREATE POLICY "Users read own assignment submissions"
  ON assignment_submissions FOR SELECT
  USING (auth.uid() = user_id OR is_admin() OR is_course_instructor(course_id));

DROP POLICY IF EXISTS "Users create own assignment submissions" ON assignment_submissions;
CREATE POLICY "Users create own assignment submissions"
  ON assignment_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_active_course_enrollment(course_id));

DROP POLICY IF EXISTS "Users update draft assignment submissions" ON assignment_submissions;
CREATE POLICY "Users update draft assignment submissions"
  ON assignment_submissions FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('draft', 'returned', 'resubmission_required'))
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins grade assignment submissions" ON assignment_submissions;
CREATE POLICY "Admins grade assignment submissions"
  ON assignment_submissions FOR UPDATE
  USING (is_admin() OR is_course_instructor(course_id))
  WITH CHECK (is_admin() OR is_course_instructor(course_id));

DROP POLICY IF EXISTS "Users manage own assignment answers" ON assignment_answers;
CREATE POLICY "Users manage own assignment answers"
  ON assignment_answers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM assignment_submissions s
    WHERE s.id = assignment_answers.submission_id AND (s.user_id = auth.uid() OR is_admin() OR is_course_instructor(s.course_id))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM assignment_submissions s
    WHERE s.id = assignment_answers.submission_id AND (s.user_id = auth.uid() OR is_admin() OR is_course_instructor(s.course_id))
  ));

DROP POLICY IF EXISTS "Users read own assignment files" ON assignment_files;
CREATE POLICY "Users read own assignment files"
  ON assignment_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assignment_submissions s
    WHERE s.id = assignment_files.submission_id AND (s.user_id = auth.uid() OR is_admin() OR is_course_instructor(s.course_id))
  ));

DROP POLICY IF EXISTS "Users read released assignment grades" ON assignment_grades;
CREATE POLICY "Users read released assignment grades"
  ON assignment_grades FOR SELECT
  USING ((auth.uid() = user_id AND released = TRUE) OR is_admin() OR is_course_instructor(course_id));

DROP POLICY IF EXISTS "Admins manage assignment grades" ON assignment_grades;
CREATE POLICY "Admins manage assignment grades"
  ON assignment_grades FOR ALL
  USING (is_admin() OR is_course_instructor(course_id))
  WITH CHECK (is_admin() OR is_course_instructor(course_id));

DROP POLICY IF EXISTS "Users read own learning sessions" ON learning_sessions;
CREATE POLICY "Users read own learning sessions"
  ON learning_sessions FOR SELECT
  USING (auth.uid() = user_id OR is_admin() OR is_course_instructor(course_id));

DROP POLICY IF EXISTS "Users create own active learning sessions" ON learning_sessions;
CREATE POLICY "Users create own active learning sessions"
  ON learning_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_active_course_enrollment(course_id));

DROP POLICY IF EXISTS "Users update own learning sessions" ON learning_sessions;
CREATE POLICY "Users update own learning sessions"
  ON learning_sessions FOR UPDATE
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Users read own learning heartbeats" ON learning_heartbeats;
CREATE POLICY "Users read own learning heartbeats"
  ON learning_heartbeats FOR SELECT
  USING (auth.uid() = user_id OR is_admin() OR is_course_instructor(course_id));

DROP POLICY IF EXISTS "Users insert own learning heartbeats" ON learning_heartbeats;
CREATE POLICY "Users insert own learning heartbeats"
  ON learning_heartbeats FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_active_course_enrollment(course_id));

DROP POLICY IF EXISTS "Users read own lesson time totals" ON lesson_time_totals;
CREATE POLICY "Users read own lesson time totals"
  ON lesson_time_totals FOR SELECT
  USING (auth.uid() = user_id OR is_admin() OR is_course_instructor(course_id));

DROP POLICY IF EXISTS "Admins manage lesson time totals" ON lesson_time_totals;
CREATE POLICY "Admins manage lesson time totals"
  ON lesson_time_totals FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Users manage own offline entries" ON offline_activity_entries;
CREATE POLICY "Users manage own offline entries"
  ON offline_activity_entries FOR ALL
  USING (auth.uid() = user_id OR is_admin() OR is_course_instructor(course_id))
  WITH CHECK (auth.uid() = user_id OR is_admin() OR is_course_instructor(course_id));

DROP POLICY IF EXISTS "Users read own offline files" ON offline_activity_files;
CREATE POLICY "Users read own offline files"
  ON offline_activity_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM offline_activity_entries e
    WHERE e.id = offline_activity_files.entry_id AND (e.user_id = auth.uid() OR is_admin() OR is_course_instructor(e.course_id))
  ));

DROP POLICY IF EXISTS "Users read own offline reviews" ON offline_activity_reviews;
CREATE POLICY "Users read own offline reviews"
  ON offline_activity_reviews FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM offline_activity_entries e
    WHERE e.id = offline_activity_reviews.entry_id AND (e.user_id = auth.uid() OR is_admin() OR is_course_instructor(e.course_id))
  ));

DROP POLICY IF EXISTS "Admins manage offline reviews" ON offline_activity_reviews;
CREATE POLICY "Admins manage offline reviews"
  ON offline_activity_reviews FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Users read own completion status" ON course_completion_status;
CREATE POLICY "Users read own completion status"
  ON course_completion_status FOR SELECT
  USING (auth.uid() = user_id OR is_admin() OR is_course_instructor(course_id));

DROP POLICY IF EXISTS "Admins manage completion status" ON course_completion_status;
CREATE POLICY "Admins manage completion status"
  ON course_completion_status FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins read audit logs" ON lms_audit_logs;
CREATE POLICY "Admins read audit logs"
  ON lms_audit_logs FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins manage audit logs" ON lms_audit_logs;
CREATE POLICY "Admins manage audit logs"
  ON lms_audit_logs FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Users read own notification events" ON notification_events;
CREATE POLICY "Users read own notification events"
  ON notification_events FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Admins manage notification events" ON notification_events;
CREATE POLICY "Admins manage notification events"
  ON notification_events FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

UPDATE courses
SET
  subtitle = COALESCE(subtitle, 'Fast-track Jolly Phonics methodology for English teachers'),
  rich_description = COALESCE(rich_description, description),
  thumbnail_url = COALESCE(thumbnail_url, image_url),
  banner_url = COALESCE(banner_url, image_url),
  language = COALESCE(language, 'English'),
  currency = COALESCE(currency, 'PKR'),
  is_free = TRUE,
  certificate_enabled = TRUE,
  access_duration_days = 90,
  required_online_minutes = 420,
  required_offline_minutes = 600,
  passing_quiz_percentage = 70,
  required_assignment_passes = 0,
  completion_requires_lessons = TRUE,
  completion_requires_online_minutes = TRUE,
  completion_requires_offline_minutes = TRUE,
  completion_requires_quiz = TRUE,
  completion_requires_assignments = FALSE,
  completion_requires_active_enrollment = TRUE,
  metadata = COALESCE(metadata, '{}'::jsonb) || '{
    "accessDurationDays": 90,
    "requiredOnlineMinutes": 420,
    "requiredOfflineMinutes": 600,
    "passingQuizPercentage": 70,
    "completionRequiresLessons": true,
    "completionRequiresOnlineMinutes": true,
    "completionRequiresOfflineMinutes": true,
    "completionRequiresQuiz": true
  }'::jsonb
WHERE slug = 'teaching-english-through-jolly-phonics-free-version';
