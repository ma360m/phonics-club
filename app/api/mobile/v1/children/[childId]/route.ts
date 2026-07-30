import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { mobileUserHasAdminPermission, requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileChildProfileUpdateSchema, uuidSchema } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

async function assertCanAccessChild(
  context: Awaited<ReturnType<typeof requireMobileUser>>,
  childId: string,
  permission: 'children.read' | 'children.write' = 'children.read',
) {
  const { data: child, error } = await context.supabase
    .from('child_profiles')
    .select('*')
    .eq('id', childId)
    .maybeSingle()

  if (error || !child) throw new MobileApiError('CHILD_NOT_FOUND', 'Child profile could not be found.', 404)

  const canAdminAccess = await mobileUserHasAdminPermission(context, permission)
  if (child.parent_user_id !== context.user.id && !canAdminAccess) {
    throw new MobileApiError('CHILD_FORBIDDEN', 'You are not authorized to access this child profile.', 403)
  }

  return child
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { childId: rawChildId } = await params
    const childId = uuidSchema.parse(rawChildId)
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'children-detail', {
      identifier: context.user.id,
      limit: 80,
      windowMs: 60_000,
    })

    const child = await assertCanAccessChild(context, childId)
    const { data: assignments } = await context.supabase
      .from('child_course_assignments')
      .select('id, course_id, enrollment_id, status, created_at, updated_at')
      .eq('child_profile_id', childId)
      .order('created_at', { ascending: false })

    return createMobileApiResponse(
      { child, assignments: assignments ?? [] },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { childId: rawChildId } = await params
    const childId = uuidSchema.parse(rawChildId)
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'children-update', {
      identifier: context.user.id,
      limit: 20,
      windowMs: 60_000,
    })

    await assertCanAccessChild(context, childId, 'children.write')
    const parsed = mobileChildProfileUpdateSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid child profile update.', 400)
    }

    const update: Record<string, unknown> = {}
    if (parsed.data.displayName) update.display_name = parsed.data.displayName
    if (parsed.data.ageRange) update.age_range = parsed.data.ageRange
    if ('avatarUrl' in parsed.data) update.avatar_url = parsed.data.avatarUrl ?? null
    if (parsed.data.preferences) update.preferences = parsed.data.preferences

    const { data: child, error } = await context.supabase
      .from('child_profiles')
      .update(update as never)
      .eq('id', childId)
      .select('id, display_name, age_range, avatar_url, preferences, status, created_at, updated_at')
      .maybeSingle()

    if (error || !child) throw new MobileApiError('CHILD_UPDATE_FAILED', 'Child profile could not be updated.', 500)

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_child_profile_updated',
      entityType: 'child_profile',
      entityId: childId,
    })

    return createMobileApiResponse({ child }, { headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { childId: rawChildId } = await params
    const childId = uuidSchema.parse(rawChildId)
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'children-remove', {
      identifier: context.user.id,
      limit: 12,
      windowMs: 60_000,
    })

    await assertCanAccessChild(context, childId, 'children.write')
    const { data: child, error } = await context.supabase
      .from('child_profiles')
      .update({ status: 'removed', removed_at: new Date().toISOString() } as never)
      .eq('id', childId)
      .select('id, status, removed_at')
      .maybeSingle()

    if (error || !child) throw new MobileApiError('CHILD_REMOVE_FAILED', 'Child profile could not be removed.', 500)

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_child_profile_removed',
      entityType: 'child_profile',
      entityId: childId,
    })

    return createMobileApiResponse({ child }, { headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
