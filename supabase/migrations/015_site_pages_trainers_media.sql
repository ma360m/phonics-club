-- Site pages, trainer profiles, public site media uploads, and invoice defaults.

ALTER TABLE trainers ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS achievements TEXT[] DEFAULT '{}';
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS credentials TEXT[] DEFAULT '{}';
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS profile_details TEXT;

UPDATE trainers
SET slug = regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g')
WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS trainers_slug_unique_idx
  ON trainers (slug)
  WHERE slug IS NOT NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  true,
  104857600,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read site media" ON storage.objects;
CREATE POLICY "Public read site media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-media');

DROP POLICY IF EXISTS "Admins upload site media" ON storage.objects;
CREATE POLICY "Admins upload site media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-media' AND is_admin());

DROP POLICY IF EXISTS "Admins update site media" ON storage.objects;
CREATE POLICY "Admins update site media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-media' AND is_admin());

DROP POLICY IF EXISTS "Admins delete site media" ON storage.objects;
CREATE POLICY "Admins delete site media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-media' AND is_admin());

UPDATE site_content
SET content = jsonb_set(content, '{tagline}', '""'::jsonb, true)
WHERE key = 'invoice_template'
  AND COALESCE(content->>'tagline', '') ILIKE '%official%jolly%distributor%';

UPDATE site_content
SET content = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(content, '{bankDetails,bankName}', '"MEEZAN BANK"'::jsonb, true),
      '{bankDetails,accountTitle}',
      '"Phonics Club PVT. LTD"'::jsonb,
      true
    ),
    '{bankDetails,accountNumber}',
    '"02590104584267"'::jsonb,
    true
  ),
  '{bankDetails,iban}',
  '""'::jsonb,
  true
)
WHERE key = 'invoice_template'
  AND COALESCE(content->'bankDetails'->>'bankName', '') IN ('Meezan Bank', 'Allied Bank', '');

INSERT INTO site_content (key, content)
VALUES (
  'bank_details',
  '{
    "bankName":"MEEZAN BANK",
    "accountTitle":"Phonics Club PVT. LTD",
    "accountNumber":"02590104584267",
    "iban":"",
    "instructions":"Having issue with payment? Contact us at 0308 4432015 or 0300 8079480."
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET content = EXCLUDED.content,
    updated_at = NOW()
WHERE COALESCE(site_content.content->>'bankName', '') IN ('Meezan Bank', 'Allied Bank', '');

INSERT INTO chatbot_knowledge (category, question, answer, keywords)
VALUES
  (
    'faq',
    'What is Vortex Learning?',
    'Vortex Learning is a company focused on providing students with different courses and online classes all over the world.',
    ARRAY['vortex', 'vortex learning', 'online classes', 'online courses']::TEXT[]
  ),
  (
    'faq',
    'How do I contact Phonics Club support?',
    'For account-specific, order-specific, or complex questions, contact Phonics Club at info@phonicsclub.com, phonicscclub@gmail.com, +92 300 8079480, or +92 3022220448.',
    ARRAY['contact', 'support', 'help', 'phone', 'email']::TEXT[]
  )
ON CONFLICT DO NOTHING;
