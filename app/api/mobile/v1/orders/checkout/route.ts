import { createMobileCheckoutOrder } from '@/lib/mobile-api/orders'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileCheckoutSchema } from '@/lib/mobile-api/schemas'
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
    enforceMobileRateLimit(request, 'orders-checkout', { identifier: context.user.id, limit: 8, windowMs: 60_000 })

    const parsed = mobileCheckoutSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid checkout request.', 400)
    }

    const order = await createMobileCheckoutOrder(context, parsed.data)
    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_order_created',
      entityType: 'order',
      entityId: String(order.id),
      metadata: { idempotencyKey: parsed.data.idempotencyKey },
    })

    return createMobileApiResponse({ order }, { status: 201, headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
