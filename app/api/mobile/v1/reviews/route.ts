import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileProductReviewCreateSchema } from '@/lib/mobile-api/schemas'
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
    enforceMobileRateLimit(request, 'product-review-create', {
      identifier: context.user.id,
      limit: 8,
      windowMs: 60_000,
    })

    const parsed = mobileProductReviewCreateSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid review.', 400)
    }

    const { data: product } = await context.supabase
      .from('products')
      .select('id, published')
      .eq('id', parsed.data.productId)
      .maybeSingle()

    if (!product || !product.published) {
      throw new MobileApiError('PRODUCT_NOT_FOUND', 'Product could not be found.', 404)
    }

    if (parsed.data.orderId) {
      const { data: order } = await context.supabase
        .from('orders')
        .select('id, user_id, items')
        .eq('id', parsed.data.orderId)
        .maybeSingle()

      const orderItems = Array.isArray(order?.items) ? order.items : []
      const orderContainsProduct = orderItems.some((item) => item?.product_id === parsed.data.productId)
      if (!order || order.user_id !== context.user.id || !orderContainsProduct) {
        throw new MobileApiError('REVIEW_ORDER_INVALID', 'This order cannot be used for this review.', 403)
      }
    }

    const { data: review, error } = await context.supabase
      .from('product_reviews')
      .upsert(
        {
          product_id: parsed.data.productId,
          user_id: context.user.id,
          rating: parsed.data.rating,
          comment: parsed.data.comment ?? null,
          status: 'pending',
          moderation_reason: null,
          admin_response: null,
        } as never,
        { onConflict: 'product_id,user_id' },
      )
      .select('id, product_id, rating, comment, status, created_at, updated_at')
      .single()

    if (error || !review) {
      throw new MobileApiError('REVIEW_SAVE_FAILED', 'Review could not be saved.', 500)
    }

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_product_review_submitted',
      entityType: 'product_review',
      entityId: review.id,
      metadata: { productId: parsed.data.productId, rating: parsed.data.rating },
    })

    return createMobileApiResponse({ review }, { status: 201, headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
