-- Training registrations, coupons, certificate templates

CREATE TYPE training_type AS ENUM ('online_webinar', 'onsite_classroom');
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE IF NOT EXISTS training_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  training_type training_type NOT NULL,
  event_title TEXT NOT NULL,
  event_date DATE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  organization TEXT,
  message TEXT,
  status registration_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount DECIMAL(10, 2),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  template_url TEXT,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE training_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit training registration"
  ON training_registrations FOR INSERT WITH CHECK (true);

CREATE POLICY "Users view own registrations"
  ON training_registrations FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins manage registrations"
  ON training_registrations FOR ALL USING (is_admin());

CREATE POLICY "Admins manage coupons"
  ON coupons FOR ALL USING (is_admin());

CREATE POLICY "Active coupons readable"
  ON coupons FOR SELECT USING (active = true OR is_admin());

CREATE POLICY "Admins manage certificate templates"
  ON certificate_templates FOR ALL USING (is_admin());

CREATE POLICY "Published certificate templates viewable"
  ON certificate_templates FOR SELECT USING (is_admin());
