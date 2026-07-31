-- Add safe user-managed usernames and update the two children's course titles/media.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_username_format_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_username_format_check
      CHECK (
        username IS NULL
        OR username = ''
        OR username ~ '^[a-z0-9_]{3,30}$'
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_lower_idx
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL AND username <> '';

COMMENT ON COLUMN public.profiles.username IS
  'Optional user-managed public username. Passwords are never stored in profiles.';

UPDATE public.courses
SET
  title = 'Blending and Segmenting Group 1-3',
  seo_title = 'Blending and Segmenting Group 1-3',
  image_url = '/images/courses/Blending_Segmenting_Group_1-3.png',
  thumbnail_url = '/images/courses/Blending_Segmenting_Group_1-3.png',
  banner_url = '/images/courses/Blending_Segmenting_Group_1-3.png',
  updated_at = NOW()
WHERE slug = 'jolly-phonics-sounds-groups-1-3';

UPDATE public.courses
SET
  title = 'Blending and Segmenting Group 4-7',
  seo_title = 'Blending and Segmenting Group 4-7',
  image_url = '/images/courses/Blending_Segmenting_Group_4-7.png',
  thumbnail_url = '/images/courses/Blending_Segmenting_Group_4-7.png',
  banner_url = '/images/courses/Blending_Segmenting_Group_4-7.png',
  updated_at = NOW()
WHERE slug = 'jolly-phonics-sounds-groups-4-7';
