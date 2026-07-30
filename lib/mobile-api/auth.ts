import { createServiceClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types/database'
import { MobileApiError } from './response'

export interface MobileAuthContext {
  user: User
  profile: Profile
  token: string
  supabase: Awaited<ReturnType<typeof createServiceClient>>
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

export async function requireMobileUser(request: Request): Promise<MobileAuthContext> {
  const token = readBearerToken(request)
  if (!token) {
    throw new MobileApiError('AUTH_TOKEN_REQUIRED', 'Sign in is required.', 401)
  }

  const supabase = await createServiceClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new MobileApiError('AUTH_TOKEN_INVALID', 'Your session has expired. Please sign in again.', 401)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, role, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    throw new MobileApiError('PROFILE_NOT_FOUND', 'Your account profile could not be found.', 403)
  }

  return {
    user,
    profile: profile as Profile,
    token,
    supabase,
  }
}

export async function requireMobileAdmin(request: Request): Promise<MobileAuthContext> {
  return requireMobileAdminPermission(request, 'admin.overview.read')
}

export async function requireMobileAdminPermission(
  request: Request,
  permission: string,
): Promise<MobileAuthContext> {
  const context = await requireMobileUser(request)
  const allowed = await mobileUserHasAdminPermission(context, permission)

  if (!allowed) {
    throw new MobileApiError('ADMIN_REQUIRED', 'You are not authorized to perform this action.', 403)
  }

  return context
}

export async function requireMobileInstructor(request: Request): Promise<MobileAuthContext> {
  const context = await requireMobileUser(request)
  if (!isMobileLmsRole(context.profile.role)) {
    throw new MobileApiError('INSTRUCTOR_REQUIRED', 'You are not authorized to perform this action.', 403)
  }
  return context
}

export function isMobileLmsRole(role: UserRole | null | undefined) {
  return isMobileAdminRole(role) || role === 'instructor'
}

export function isMobileAdminRole(role: UserRole | null | undefined) {
  return role === 'admin' || role === 'super_admin'
}

export async function mobileUserHasAdminPermission(context: MobileAuthContext, permission: string) {
  if (context.profile.role === 'super_admin') return true
  if (context.profile.role !== 'admin') return false

  const { data, error } = await context.supabase.rpc('user_has_mobile_admin_permission', {
    p_user_id: context.user.id,
    p_permission: permission,
  })

  if (error) return false
  return data === true
}

export async function mobileUserCanManageCourse(context: MobileAuthContext, courseId: string) {
  if (isMobileAdminRole(context.profile.role)) return true
  if (context.profile.role !== 'instructor') return false

  const { data } = await context.supabase
    .from('course_instructors')
    .select('id')
    .eq('course_id', courseId)
    .eq('profile_id', context.user.id)
    .or('can_manage_content.eq.true,can_grade.eq.true,can_view_reports.eq.true')
    .maybeSingle()

  return Boolean(data?.id)
}
