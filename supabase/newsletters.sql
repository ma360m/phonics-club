-- Newsletter PDF archive setup
-- Run this in the Supabase SQL Editor for the project used by this site.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.newsletter_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_issues_archive
  ON public.newsletter_issues (year DESC, month DESC, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS newsletter_issues_updated_at ON public.newsletter_issues;
CREATE TRIGGER newsletter_issues_updated_at
  BEFORE UPDATE ON public.newsletter_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.newsletter_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published newsletter issues" ON public.newsletter_issues;
CREATE POLICY "Public read published newsletter issues"
  ON public.newsletter_issues FOR SELECT
  USING (published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage newsletter issues" ON public.newsletter_issues;
CREATE POLICY "Admins manage newsletter issues"
  ON public.newsletter_issues FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'newsletters',
  'newsletters',
  true,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read newsletters" ON storage.objects;
CREATE POLICY "Public read newsletters"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'newsletters');

DROP POLICY IF EXISTS "Admins upload newsletters" ON storage.objects;
CREATE POLICY "Admins upload newsletters"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'newsletters' AND public.is_admin());

DROP POLICY IF EXISTS "Admins update newsletters" ON storage.objects;
CREATE POLICY "Admins update newsletters"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'newsletters' AND public.is_admin())
  WITH CHECK (bucket_id = 'newsletters' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete newsletters" ON storage.objects;
CREATE POLICY "Admins delete newsletters"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'newsletters' AND public.is_admin());
