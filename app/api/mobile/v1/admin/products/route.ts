import { requireMobileAdminPermission } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobilePaginationSchema } from '@/lib/mobile-api/schemas'
import { buildSupabaseProductSearchOrFilter } from '@/lib/products/search'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function GET(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileAdminPermission(request, 'products.read')
    enforceMobileRateLimit(request, 'admin-products', {
      identifier: context.user.id,
      limit: 80,
      windowMs: 60_000,
    })

    const url = new URL(request.url)
    const pagination = mobilePaginationSchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
    })
    const search = url.searchParams.get('search')?.trim()
    const status = url.searchParams.get('status')?.trim()
    if (status && !['published', 'draft', 'all'].includes(status)) {
      throw new MobileApiError('INVALID_PRODUCT_STATUS', 'Product status filter is invalid.', 400)
    }

    const from = (pagination.page - 1) * pagination.pageSize
    const to = from + pagination.pageSize - 1
    let query = context.supabase
      .from('products')
      .select(
        'id, name, slug, description, product_number, sku, barcode, alternate_barcode, isbn, category, price, compare_at_price, sale_enabled, sale_price, stock, reserved_stock, low_stock_threshold, stock_management_enabled, backorder_policy, images, featured, published, metadata, updated_at',
        { count: 'exact' },
      )
      .order('updated_at', { ascending: false })
      .range(from, to)

    const searchFilter = search ? buildSupabaseProductSearchOrFilter(search) : null
    if (searchFilter) query = query.or(searchFilter)
    if (status === 'published') query = query.eq('published', true)
    if (status === 'draft') query = query.eq('published', false)

    const { data, error, count } = await query
    if (error) throw new MobileApiError('PRODUCTS_UNAVAILABLE', 'Products could not be loaded.', 500)

    return createMobileApiResponse(
      {
        products: data ?? [],
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
