import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
} from '@/lib/mobile-api/response'

export async function GET(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'account-deletion-status', {
      identifier: context.user.id,
      limit: 30,
      windowMs: 60_000,
    })

    const { data: requestRow } = await context.supabase
      .from('account_deletion_requests')
      .select('id, status, review_status, selected_reason, scheduled_deletion_at, cancellation_timestamp, user_visible_notes, requested_at, created_at, updated_at')
      .eq('user_id', context.user.id)
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return createMobileApiResponse(
      { deletionRequest: requestRow ?? null },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
