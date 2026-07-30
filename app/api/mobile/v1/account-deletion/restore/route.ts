import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function POST(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'account-deletion-restore', {
      identifier: context.user.id,
      limit: 5,
      windowMs: 60_000,
    })

    const { data: deletionRequest, error } = await context.supabase.rpc('restore_account_deletion', {
      p_user_id: context.user.id,
    })

    if (error) {
      throw new MobileApiError('ACCOUNT_RESTORE_FAILED', 'Account deletion request could not be cancelled.', 500)
    }

    return createMobileApiResponse(
      { deletionRequest: deletionRequest ?? null },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
