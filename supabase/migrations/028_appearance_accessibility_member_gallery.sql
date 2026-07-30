-- Appearance & Accessibility, member discounts, fast updates, and blog gallery support.
-- Additive migration after 027.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.user_display_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'phonics-classic'
    CHECK (theme IN ('phonics-classic', 'neon-learning', 'midnight-focus', 'minimal-white', 'high-contrast')),
  accent_color TEXT NOT NULL DEFAULT 'phonics-red'
    CHECK (accent_color IN ('phonics-red', 'royal-blue', 'golden-yellow', 'cyan', 'purple', 'emerald-green')),
  greyscale_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  high_visibility_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  negative_contrast_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  light_background_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  highlight_links_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  underline_links_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  strong_focus_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  text_size TEXT NOT NULL DEFAULT 'default' CHECK (text_size IN ('small', 'default', 'large', 'extra-large')),
  reading_width TEXT NOT NULL DEFAULT 'normal' CHECK (reading_width IN ('normal', 'narrow', 'wide')),
  line_spacing TEXT NOT NULL DEFAULT 'normal' CHECK (line_spacing IN ('normal', 'relaxed', 'spacious')),
  letter_spacing TEXT NOT NULL DEFAULT 'normal' CHECK (letter_spacing IN ('normal', 'medium', 'large')),
  font_mode TEXT NOT NULL DEFAULT 'default' CHECK (font_mode IN ('default', 'readable', 'dyslexia-friendly')),
  motion_mode TEXT NOT NULL DEFAULT 'system' CHECK (motion_mode IN ('system', 'full', 'reduced', 'none')),
  larger_buttons_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  larger_targets_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  simplified_interface_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reduce_decorations_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reading_focus_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  children_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_display_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own display preferences" ON public.user_display_preferences;
CREATE POLICY "Users read own display preferences"
  ON public.user_display_preferences FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users create own display preferences" ON public.user_display_preferences;
CREATE POLICY "Users create own display preferences"
  ON public.user_display_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own display preferences" ON public.user_display_preferences;
CREATE POLICY "Users update own display preferences"
  ON public.user_display_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS user_display_preferences_updated_at ON public.user_display_preferences;
CREATE TRIGGER user_display_preferences_updated_at BEFORE UPDATE ON public.user_display_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.appearance_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_theme TEXT NOT NULL DEFAULT 'phonics-classic'
    CHECK (default_theme IN ('phonics-classic', 'neon-learning', 'midnight-focus', 'minimal-white', 'high-contrast')),
  enabled_themes TEXT[] NOT NULL DEFAULT ARRAY['phonics-classic', 'midnight-focus', 'minimal-white', 'high-contrast'],
  neon_learning_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  children_mode_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  default_accent_color TEXT NOT NULL DEFAULT 'phonics-red'
    CHECK (default_accent_color IN ('phonics-red', 'royal-blue', 'golden-yellow', 'cyan', 'purple', 'emerald-green')),
  theme_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  draft_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  draft_updated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published appearance settings" ON public.appearance_settings;

DROP POLICY IF EXISTS "Admins manage appearance settings" ON public.appearance_settings;
CREATE POLICY "Admins manage appearance settings"
  ON public.appearance_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.appearance_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE VIEW public.public_appearance_settings AS
SELECT
  id,
  default_theme,
  enabled_themes,
  neon_learning_enabled,
  children_mode_enabled,
  default_accent_color,
  theme_config,
  published_at,
  updated_at
FROM public.appearance_settings
WHERE id = 1;

GRANT SELECT ON public.public_appearance_settings TO anon, authenticated;

DROP TRIGGER IF EXISTS appearance_settings_updated_at ON public.appearance_settings;
CREATE TRIGGER appearance_settings_updated_at BEFORE UPDATE ON public.appearance_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.member_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id TEXT NOT NULL UNIQUE,
  label TEXT,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_discounts_active_member
  ON public.member_discounts (member_id, active);

ALTER TABLE public.member_discounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage member discounts" ON public.member_discounts;
CREATE POLICY "Admins manage member discounts"
  ON public.member_discounts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS member_discounts_updated_at ON public.member_discounts;
CREATE TRIGGER member_discounts_updated_at BEFORE UPDATE ON public.member_discounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-gallery',
  'blog-gallery',
  TRUE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = TRUE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read blog gallery images" ON storage.objects;
CREATE POLICY "Public read blog gallery images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-gallery');

DROP POLICY IF EXISTS "Admins manage blog gallery images" ON storage.objects;
CREATE POLICY "Admins manage blog gallery images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'blog-gallery' AND public.is_admin())
  WITH CHECK (bucket_id = 'blog-gallery' AND public.is_admin());

COMMENT ON TABLE public.user_display_preferences IS
  'Per-user Appearance & Accessibility preferences. Logged-out users use localStorage.';
COMMENT ON TABLE public.appearance_settings IS
  'Global public appearance defaults and admin-controlled enabled theme list.';
COMMENT ON TABLE public.member_discounts IS
  'Member ID fixed discounts for checkout, with usage limits similar to coupon codes.';
COMMENT ON COLUMN public.blog_posts.gallery_images IS
  'Ordered blog gallery image metadata, stored as JSON objects with src, alt, and caption fields.';
