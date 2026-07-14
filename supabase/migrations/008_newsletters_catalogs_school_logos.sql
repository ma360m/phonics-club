-- Newsletter archive, catalog storage bucket, and editable school logo defaults

CREATE TABLE IF NOT EXISTS newsletter_issues (
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
  ON newsletter_issues (year DESC, month DESC, created_at DESC);

ALTER TABLE newsletter_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published newsletter issues" ON newsletter_issues;
CREATE POLICY "Public read published newsletter issues"
  ON newsletter_issues FOR SELECT
  USING (published = true OR is_admin());

DROP POLICY IF EXISTS "Admins manage newsletter issues" ON newsletter_issues;
CREATE POLICY "Admins manage newsletter issues"
  ON newsletter_issues FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS newsletter_issues_updated_at ON newsletter_issues;
CREATE TRIGGER newsletter_issues_updated_at BEFORE UPDATE ON newsletter_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'shop-catalogs',
    'shop-catalogs',
    true,
    52428800,
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
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

DROP POLICY IF EXISTS "Public read shop catalogs" ON storage.objects;
CREATE POLICY "Public read shop catalogs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-catalogs');

DROP POLICY IF EXISTS "Admins upload shop catalogs" ON storage.objects;
CREATE POLICY "Admins upload shop catalogs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'shop-catalogs' AND is_admin());

DROP POLICY IF EXISTS "Admins update shop catalogs" ON storage.objects;
CREATE POLICY "Admins update shop catalogs"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'shop-catalogs' AND is_admin());

DROP POLICY IF EXISTS "Admins delete shop catalogs" ON storage.objects;
CREATE POLICY "Admins delete shop catalogs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'shop-catalogs' AND is_admin());

DROP POLICY IF EXISTS "Public read newsletters" ON storage.objects;
CREATE POLICY "Public read newsletters"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'newsletters');

DROP POLICY IF EXISTS "Admins upload newsletters" ON storage.objects;
CREATE POLICY "Admins upload newsletters"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'newsletters' AND is_admin());

DROP POLICY IF EXISTS "Admins update newsletters" ON storage.objects;
CREATE POLICY "Admins update newsletters"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'newsletters' AND is_admin());

DROP POLICY IF EXISTS "Admins delete newsletters" ON storage.objects;
CREATE POLICY "Admins delete newsletters"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'newsletters' AND is_admin());

INSERT INTO site_content (key, content)
VALUES (
  'school_logos',
  '[
    {"id":"tns","name":"TNS","imageUrl":"/images/logos/tns.jpg","sortOrder":1},
    {"id":"froebels","name":"Froebel''s International","imageUrl":"/images/logos/froebels.jpg","sortOrder":2},
    {"id":"starfish","name":"Starfish School","imageUrl":"/images/logos/starfish.jpg","sortOrder":3},
    {"id":"quixotic","name":"Quixotic Academy","imageUrl":"/images/logos/quixotic.jpg","sortOrder":4},
    {"id":"lgs","name":"LGS","imageUrl":"/images/logos/lgs.jpg","sortOrder":5},
    {"id":"beaconhouse","name":"Beaconhouse","imageUrl":"/images/logos/beaconhouse.png","sortOrder":6},
    {"id":"rwis","name":"RWIS","imageUrl":"/images/logos/RWIS.jpg","sortOrder":7},
    {"id":"dynamic","name":"Dynamic International","imageUrl":"","sortOrder":8},
    {"id":"academus","name":"Academus","imageUrl":"/images/logos/ACADEMUS.png","sortOrder":9},
    {"id":"alda","name":"ALDA","imageUrl":"/images/logos/ALDA.png","sortOrder":10},
    {"id":"horizon","name":"Horizon School System","imageUrl":"/images/logos/HORIZON.jpg","sortOrder":11},
    {"id":"aksp","name":"AKSP","imageUrl":"/images/logos/AKSP.png","sortOrder":12},
    {"id":"akrsp","name":"AKRSP","imageUrl":"/images/logos/AKRSP.jpg","sortOrder":13}
  ]'::jsonb
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_content (key, content)
VALUES (
  'hero_video',
  '{"videoUrl":"https://youtu.be/8Tjs_Z1I0cM?si=jlpQPO-_UfeqUwVa","demoButtonUrl":"https://youtu.be/AyZdFB8s2IA?si=NeSy2O37jZCVQdmf"}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

UPDATE site_content
SET content = '{"videoUrl":"https://youtu.be/8Tjs_Z1I0cM?si=jlpQPO-_UfeqUwVa","demoButtonUrl":"https://youtu.be/AyZdFB8s2IA?si=NeSy2O37jZCVQdmf"}'::jsonb
WHERE key = 'hero_video';

UPDATE site_content
SET content = jsonb_set(
  content,
  '{websiteUrl}',
  '"https://officialvortexlear.wixsite.com/vortex-learning"'::jsonb,
  true
)
WHERE key = 'vortex_learning';
