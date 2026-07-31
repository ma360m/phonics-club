import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminRole, requireAdminOrInstructor } from '@/lib/auth'
import type { Profile } from '@/types/database'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export function canManageEveryCourse(profile: Pick<Profile, 'role'> | null | undefined) {
  return isAdminRole(profile?.role)
}

export async function getManagedCourseIds(
  profile: Pick<Profile, 'id' | 'role'>,
  supabase?: SupabaseServerClient,
) {
  if (canManageEveryCourse(profile)) return null
  const client = supabase ?? await createClient()
  const { data } = await client
    .from('course_instructors')
    .select('course_id')
    .eq('profile_id', profile.id)
    .eq('can_manage_content', true)

  return [...new Set((data ?? []).map((row: { course_id?: string | null }) => row.course_id).filter(Boolean) as string[])]
}

export async function canManageCourseId(
  profile: Pick<Profile, 'id' | 'role'> | null | undefined,
  courseId: string,
  supabase?: SupabaseServerClient,
) {
  if (!profile) return false
  if (canManageEveryCourse(profile)) return true
  const client = supabase ?? await createClient()
  const { data } = await client
    .from('course_instructors')
    .select('id')
    .eq('course_id', courseId)
    .eq('profile_id', profile.id)
    .eq('can_manage_content', true)
    .maybeSingle()

  return Boolean(data)
}

export async function requireManagedCourse(courseId: string) {
  const profile = await requireAdminOrInstructor()
  const allowed = await canManageCourseId(profile, courseId)
  if (!allowed) throw new Error('You can only manage courses assigned to your instructor account.')
  return profile
}

export async function assignInstructorCourseOwner(courseId: string, profile: Pick<Profile, 'id' | 'role'>) {
  if (canManageEveryCourse(profile)) return
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Instructor course ownership requires SUPABASE_SERVICE_ROLE_KEY on the server.')
  }

  const service = await createServiceClient()
  const { error } = await service.from('course_instructors').upsert({
    course_id: courseId,
    profile_id: profile.id,
    role: 'owner',
    can_manage_content: true,
    can_grade: true,
    can_view_reports: true,
  } as never, { onConflict: 'course_id,profile_id' })

  if (error) throw new Error('Course was created, but instructor ownership could not be assigned.')
}
