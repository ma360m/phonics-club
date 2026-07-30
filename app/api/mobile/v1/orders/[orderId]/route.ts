import { isMobileAdminRole, requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { orderId } = await params
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'orders-detail', { identifier: context.user.id, limit: 80, windowMs: 60_000 })

    const { data: order, error } = await context.supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (error || !order) throw new MobileApiError('ORDER_NOT_FOUND', 'Order could not be found.', 404)
    if (order.user_id !== context.user.id && !isMobileAdminRole(context.profile.role)) {
      throw new MobileApiError('ORDER_FORBIDDEN', 'You are not authorized to view this order.', 403)
    }

    return createMobileApiResponse(
      {
        order: {
          id: order.id,
          status: order.status,
          invoiceNumber: order.invoice_number,
          total: Number(order.total ?? 0),
          subtotal: Number(order.subtotal ?? 0),
          shippingFee: Number(order.shipping_fee ?? 0),
          discountAmount: Number(order.discount_amount ?? 0),
          couponCode: order.coupon_code,
          paymentMethod: order.payment_method,
          displayCurrency: order.display_currency,
          displayTotal: order.display_total,
          items: order.items ?? [],
          shippingAddress: order.shipping_address,
          notes: order.notes,
          receipt: {
            uploaded: Boolean(order.receipt_path || order.receipt_url),
            filename: order.receipt_filename,
            mimeType: order.receipt_mime_type,
            sizeBytes: order.receipt_size_bytes,
            uploadedAt: order.receipt_uploaded_at,
          },
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        },
      },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
