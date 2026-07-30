import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileAdminPermission } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileAdminProductReviewUpdateSchema, uuidSchema } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { reviewId: rawReviewId } = await params
    const reviewId = uuidSchema.parse(rawReviewId)
    const context = await requireMobileAdminPermission(request, 'reviews.write')
    enforceMobileRateLimit(request, 'admin-review-update', {
      identifier: context.user.id,
      limit: 50,
      windowMs: 60_000,
    })

    const parsed = mobileAdminProductReviewUpdateSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid review update.', 400)
    }

    const { data: review, error } = await context.supabase
      .from('product_reviews')
      .update({
        status: parsed.data.status,
        moderation_reason: parsed.data.moderationReason ?? null,
        admin_response: parsed.data.adminResponse ?? null,
        moderated_by: context.user.id,
        moderated_at: new Date().toISOString(),
      } as never)
      .eq('id', reviewId)
      .select('id, product_id, user_id, rating, comment, status, moderation_reason, admin_response, moderated_by, moderated_at, created_at, updated_at')
      .maybeSingle()

    if (error || !review) {
      throw new MobileApiError('REVIEW_UPDATE_FAILED', 'Review could not be updated.', 500)
    }

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_admin_product_review_moderated',
      entityType: 'product_review',
      entityId: reviewId,
      metadata: { status: parsed.data.status },
    })

    return createMobileApiResponse({ review }, { headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
