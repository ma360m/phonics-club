-- Member ID percentage discounts and global Appearance & Accessibility controls.
-- Additive migration after 028. Do not run before 028 in a normal migration chain.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.member_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id TEXT NOT NULL UNIQUE,
  label TEXT,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.member_discounts
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER NOT NULL DEFAULT 0
    CHECK (discount_percent >= 0 AND discount_percent <= 100);

UPDATE public.member_discounts
SET discount_percent = 0
WHERE discount_percent IS NULL;

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

ALTER TABLE public.appearance_settings
  ADD COLUMN IF NOT EXISTS accessibility_controls_enabled BOOLEAN NOT NULL DEFAULT TRUE;

DROP VIEW IF EXISTS public.public_appearance_settings;
CREATE VIEW public.public_appearance_settings AS
SELECT
  id,
  default_theme,
  enabled_themes,
  neon_learning_enabled,
  children_mode_enabled,
  accessibility_controls_enabled,
  default_accent_color,
  theme_config,
  published_at,
  updated_at
FROM public.appearance_settings
WHERE id = 1;

GRANT SELECT ON public.public_appearance_settings TO anon, authenticated;

COMMENT ON COLUMN public.member_discounts.discount_percent IS
  'Percentage discount applied by Member ID checkout validation. Fixed amount is retained only for backwards compatibility.';

COMMENT ON COLUMN public.appearance_settings.accessibility_controls_enabled IS
  'When false, public Appearance & Accessibility floating buttons and footer links are hidden for all users.';
