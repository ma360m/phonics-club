import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobilePaginationSchema } from '@/lib/mobile-api/schemas'
import { toMobileOrderSummary } from '@/lib/mobile-api/orders'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'
import { ORDER_STATUSES } from '@/lib/commerce'

export async function GET(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'orders-list', { identifier: context.user.id, limit: 60, windowMs: 60_000 })

    const url = new URL(request.url)
    const pagination = mobilePaginationSchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
    })
    const status = url.searchParams.get('status')
    if (status && !(ORDER_STATUSES as readonly string[]).includes(status)) {
      throw new MobileApiError('INVALID_STATUS', 'Order status filter is invalid.', 400)
    }

    const from = (pagination.page - 1) * pagination.pageSize
    const to = from + pagination.pageSize - 1
    let query = context.supabase
      .from('orders')
      .select('id, status, total, subtotal, shipping_fee, discount_amount, payment_method, invoice_number, display_currency, display_total, created_at', { count: 'exact' })
      .eq('user_id', context.user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) query = query.eq('status', status)
    const { data, error, count } = await query

    if (error) throw new MobileApiError('ORDERS_UNAVAILABLE', 'Orders could not be loaded.', 500)

    return createMobileApiResponse(
      {
        orders: ((data ?? []) as Record<string, unknown>[]).map(toMobileOrderSummary),
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: count ?? 0,
          totalPages: Math.max(Math.ceil((count ?? 0) / pagination.pageSize), 1),
        },
      },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
