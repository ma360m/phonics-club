import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileAccountDeletionRequestSchema } from '@/lib/mobile-api/schemas'
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
    enforceMobileRateLimit(request, 'account-deletion-request', {
      identifier: context.user.id,
      limit: 3,
      windowMs: 60_000,
    })

    const parsed = mobileAccountDeletionRequestSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid deletion request.', 400)
    }

    const { data: deletionRequest, error } = await context.supabase.rpc('request_account_deletion', {
      p_user_id: context.user.id,
      p_selected_reason: parsed.data.selectedReason,
      p_other_reason_details: parsed.data.otherReasonDetails ?? null,
      p_additional_details: parsed.data.additionalDetails ?? null,
    })

    if (error || !deletionRequest) {
      throw new MobileApiError('ACCOUNT_DELETION_REQUEST_FAILED', 'Account deletion could not be requested.', 500)
    }

    return createMobileApiResponse(
      { deletionRequest },
      { status: 201, headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
