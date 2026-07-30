-- Mobile backend security foundation: prevent signup role escalation and
-- replace broad profile reads with scoped policies and safe public structures.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_avatar_url TEXT;
BEGIN
  v_full_name := NULLIF(
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    ''
  );
  v_avatar_url := NULLIF(
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    ''
  );

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_full_name,
    v_avatar_url,
    'user'::user_role
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.prevent_unprivileged_profile_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jwt_role TEXT;
BEGIN
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  v_jwt_role := COALESCE(auth.role()::TEXT, '');

  IF v_jwt_role = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin', 'service_role')
    OR public.is_admin()
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Profile role can only be changed by a privileged backend operation.'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS prevent_unprivileged_profile_role_update ON public.profiles;
CREATE TRIGGER prevent_unprivileged_profile_role_update
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unprivileged_profile_role_update();

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins manage profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE VIEW public.public_instructor_profiles AS
SELECT
  p.id AS user_id,
  COALESCE(NULLIF(p.full_name, ''), 'Phonics Club Instructor') AS public_display_name,
  p.avatar_url AS public_avatar_url,
  NULL::TEXT AS biography,
  ARRAY[]::TEXT[] AS qualifications,
  CASE
    WHEN p.role::TEXT = 'admin' THEN 'Phonics Club Team'
    WHEN p.role::TEXT = 'instructor' THEN 'Instructor'
    ELSE 'Educator'
  END AS public_role_label,
  COALESCE(
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'slug', c.slug
      )
    ) FILTER (WHERE c.id IS NOT NULL),
    '[]'::jsonb
  ) AS assigned_published_courses
FROM public.profiles p
LEFT JOIN public.course_instructors ci
  ON ci.profile_id = p.id
LEFT JOIN public.courses c
  ON c.id = ci.course_id
  AND c.published = TRUE
WHERE p.role::TEXT IN ('admin', 'instructor')
GROUP BY p.id, p.full_name, p.avatar_url, p.role;

GRANT SELECT ON public.public_instructor_profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_course_student_public_profiles(p_course_id UUID)
RETURNS TABLE (
  course_id UUID,
  user_id UUID,
  public_display_name TEXT,
  public_avatar_url TEXT,
  enrollment_status TEXT,
  progress INTEGER,
  enrolled_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    e.course_id,
    p.id AS user_id,
    COALESCE(NULLIF(p.full_name, ''), split_part(p.email, '@', 1), 'Student') AS public_display_name,
    p.avatar_url AS public_avatar_url,
    COALESCE(e.status::TEXT, e.payment_status, 'active') AS enrollment_status,
    e.progress,
    e.enrolled_at
  FROM public.enrollments e
  JOIN public.profiles p ON p.id = e.user_id
  WHERE e.course_id = p_course_id
    AND (
      public.is_admin()
      OR public.can_manage_course(p_course_id)
      OR public.is_course_instructor(p_course_id)
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_course_student_public_profiles(UUID) TO authenticated;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates a profile for new auth users. Role metadata from clients is intentionally ignored; all normal signups become user.';

COMMENT ON FUNCTION public.prevent_unprivileged_profile_role_update() IS
  'Prevents users from changing their own profile role. Role changes require admin, service-role, or trusted SQL context.';

COMMENT ON VIEW public.public_instructor_profiles IS
  'Safe public instructor/team display data. Does not expose private emails, phone numbers, addresses, or administrative fields.';
