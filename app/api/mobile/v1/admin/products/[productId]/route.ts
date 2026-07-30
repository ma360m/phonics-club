import { requireMobileAdminPermission } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { uuidSchema } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { productId: rawProductId } = await params
    const productId = uuidSchema.parse(rawProductId)
    const context = await requireMobileAdminPermission(request, 'products.read')
    enforceMobileRateLimit(request, 'admin-product-detail', {
      identifier: context.user.id,
      limit: 80,
      windowMs: 60_000,
    })

    const { data: product, error } = await context.supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle()

    if (error || !product) throw new MobileApiError('PRODUCT_NOT_FOUND', 'Product could not be found.', 404)

    const [{ data: priceHistory }, { data: inventoryAdjustments }] = await Promise.all([
      context.supabase
        .from('product_price_history')
        .select('id, previous_regular_price, new_regular_price, previous_sale_price, new_sale_price, reason, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(10),
      context.supabase
        .from('inventory_adjustments')
        .select('id, previous_quantity, quantity_changed, new_quantity, adjustment_type, reason, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    return createMobileApiResponse(
      { product, priceHistory: priceHistory ?? [], inventoryAdjustments: inventoryAdjustments ?? [] },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
