-- Orders enhancements, site CMS, trainers

-- Extend order status
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_review';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ready_to_dispatch';

-- Order fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10,2) DEFAULT 5500;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS member_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES profiles(id);

-- Site CMS (announcements, testimonials, social reels, vortex, invoice template, bank details)
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trainers (admin CRUD)
CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Admins manage site content" ON site_content FOR ALL USING (is_admin());

CREATE POLICY "Public read published trainers" ON trainers FOR SELECT USING (published = true);
CREATE POLICY "Admins manage trainers" ON trainers FOR ALL USING (is_admin());

-- Seed trainers (only if empty)
INSERT INTO trainers (name, title, sort_order)
SELECT v.name, v.title, v.sort_order FROM (VALUES
  ('Fatima Tuz Zahra', 'Certified Jolly Phonics Trainer', 1),
  ('Anum Zehra Zaidi', 'Certified Trainer', 2),
  ('Erum Tehreem', 'Certified Trainer', 3),
  ('Zaibunnissa Sadozai', 'Certified Trainer', 4),
  ('Tahira Sheikh', 'Certified Trainer', 5)
) AS v(name, title, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM trainers LIMIT 1);

-- Default site content
INSERT INTO site_content (key, content) VALUES
  ('announcements', '[{"id":"1","message":"Official Jolly Phonics & Grammar distributor — PCTB approved books","linkUrl":"/shop","linkText":"Shop Now","active":true}]'::jsonb),
  ('testimonials', '[{"id":"1","content":"Phonics Club transformed our school reading program. Jolly Phonics implementation was seamless.","author":"Beaconhouse School","role":"Lahore","rating":5},{"id":"2","content":"The training and materials from Phonics Club are exceptional. Our teachers are confident teaching synthetic phonics.","author":"LGS Faculty","role":"Lahore Grammar School","rating":5},{"id":"3","content":"Best phonics resources in Pakistan. Authorized dealer with full PCTB NOC support.","author":"Froebels International","role":"Islamabad","rating":5}]'::jsonb),
  ('social_reels', '[{"id":"1","thumbnail":"/images/schools/partners-strip-1.png","videoUrl":"","title":"Classroom phonics"},{"id":"2","thumbnail":"","videoUrl":"","title":"Jolly Phonics training"},{"id":"3","thumbnail":"","videoUrl":"","title":"Reading success"},{"id":"4","thumbnail":"","videoUrl":"","title":"Teacher workshop"},{"id":"5","thumbnail":"","videoUrl":"","title":"Student progress"},{"id":"6","thumbnail":"","videoUrl":"","title":"Phonics Club"}]'::jsonb),
  ('vortex_learning', '{"title":"Vortex Learning Partnership","description":"In collaboration with Vortex Learning — a leading online education platform offering live teachers, interactive courses, and professional development for students and educators across Pakistan.","websiteUrl":"https://vortexlearning.com","courses":[{"title":"Live Online Tutoring","description":"One-on-one and group sessions with certified teachers","href":"/courses"},{"title":"Professional Development","description":"CPD courses for educators","href":"/courses?category=teacher-courses"},{"title":"Student Programs","description":"Structured learning paths for all ages","href":"/courses"}]}'::jsonb),
  ('invoice_template', '{"header":"PHONICS CLUB PVT LTD","tagline":"Official Jolly Phonics & Grammar Distributor","footer":"Thank you for your order. Phonics Club reserves the right to increase or decrease shipping fees based on quantity, distance, and product weight. Current standard shipping: PKR 5,500.","bankDetails":{"bankName":"Meezan Bank","accountTitle":"Phonics Club Pvt Ltd","accountNumber":"01234567890123","iban":"PK00MEZN0001234567890123"}}'::jsonb),
  ('bank_details', '{"bankName":"Meezan Bank","accountTitle":"Phonics Club Pvt Ltd","accountNumber":"01234567890123","iban":"PK00MEZN0001234567890123","instructions":"Transfer the exact order total and upload your payment receipt at checkout. Orders process after admin confirms payment."}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('order-receipts', 'order-receipts', true, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;
