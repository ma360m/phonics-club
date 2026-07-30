import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileChildProfileCreateSchema } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function GET(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'children-list', {
      identifier: context.user.id,
      limit: 80,
      windowMs: 60_000,
    })

    const { data: children, error } = await context.supabase
      .from('child_profiles')
      .select('id, display_name, age_range, avatar_url, preferences, status, created_at, updated_at')
      .eq('parent_user_id', context.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw new MobileApiError('CHILDREN_UNAVAILABLE', 'Child profiles could not be loaded.', 500)

    return createMobileApiResponse({ children: children ?? [] }, { headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}

export async function POST(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'children-create', {
      identifier: context.user.id,
      limit: 8,
      windowMs: 60_000,
    })

    const parsed = mobileChildProfileCreateSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid child profile.', 400)
    }

    const { data: child, error } = await context.supabase
      .from('child_profiles')
      .insert({
        parent_user_id: context.user.id,
        display_name: parsed.data.displayName,
        age_range: parsed.data.ageRange,
        avatar_url: parsed.data.avatarUrl ?? null,
        preferences: parsed.data.preferences ?? {},
        status: 'active',
      } as never)
      .select('id, display_name, age_range, avatar_url, preferences, status, created_at, updated_at')
      .single()

    if (error || !child) {
      throw new MobileApiError('CHILD_CREATE_FAILED', 'Child profile could not be created.', 500)
    }

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_child_profile_created',
      entityType: 'child_profile',
      entityId: child.id,
    })

    return createMobileApiResponse({ child }, { status: 201, headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
