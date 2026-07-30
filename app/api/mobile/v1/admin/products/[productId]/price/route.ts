import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileAdminPermission } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileAdminProductPriceSchema, uuidSchema } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { productId: rawProductId } = await params
    const productId = uuidSchema.parse(rawProductId)
    const context = await requireMobileAdminPermission(request, 'products.price.write')
    enforceMobileRateLimit(request, 'admin-product-price', {
      identifier: context.user.id,
      limit: 20,
      windowMs: 60_000,
    })

    const parsed = mobileAdminProductPriceSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid price update.', 400)
    }

    const { data: product, error } = await context.supabase.rpc('mobile_admin_change_product_price', {
      p_admin_id: context.user.id,
      p_product_id: productId,
      p_regular_price: parsed.data.price,
      p_sale_price: parsed.data.salePrice ?? null,
      p_reason: parsed.data.reason,
    })

    if (error || !product) {
      throw new MobileApiError('PRODUCT_PRICE_UPDATE_FAILED', 'Product price could not be updated.', 400)
    }

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_admin_product_price_changed',
      entityType: 'product',
      entityId: productId,
      metadata: { reason: parsed.data.reason },
    })

    return createMobileApiResponse({ product }, { headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
