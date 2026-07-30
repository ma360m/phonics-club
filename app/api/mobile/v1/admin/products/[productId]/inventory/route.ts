import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileAdminPermission } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileAdminInventoryAdjustmentSchema, uuidSchema } from '@/lib/mobile-api/schemas'
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
    const context = await requireMobileAdminPermission(request, 'products.inventory.write')
    enforceMobileRateLimit(request, 'admin-product-inventory', {
      identifier: context.user.id,
      limit: 30,
      windowMs: 60_000,
    })

    const parsed = mobileAdminInventoryAdjustmentSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid inventory update.', 400)
    }

    const { data: product, error } = await context.supabase.rpc('mobile_admin_adjust_product_inventory', {
      p_admin_id: context.user.id,
      p_product_id: productId,
      p_adjustment_type: parsed.data.adjustmentType,
      p_quantity: parsed.data.quantity,
      p_reason: parsed.data.reason,
    })

    if (error || !product) {
      throw new MobileApiError('PRODUCT_INVENTORY_UPDATE_FAILED', 'Product inventory could not be updated.', 400)
    }

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_admin_product_inventory_changed',
      entityType: 'product',
      entityId: productId,
      metadata: {
        adjustmentType: parsed.data.adjustmentType,
        quantity: parsed.data.quantity,
        reason: parsed.data.reason,
      },
    })

    return createMobileApiResponse({ product }, { headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
