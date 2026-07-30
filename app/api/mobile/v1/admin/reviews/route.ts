import { requireMobileAdminPermission } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobilePaginationSchema } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

const reviewStatuses = new Set(['pending', 'approved', 'rejected', 'hidden'])

export async function GET(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileAdminPermission(request, 'reviews.read')
    enforceMobileRateLimit(request, 'admin-reviews', {
      identifier: context.user.id,
      limit: 80,
      windowMs: 60_000,
    })

    const url = new URL(request.url)
    const pagination = mobilePaginationSchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
    })
    const status = url.searchParams.get('status')?.trim()
    if (status && !reviewStatuses.has(status)) {
      throw new MobileApiError('INVALID_REVIEW_STATUS', 'Review status filter is invalid.', 400)
    }

    const from = (pagination.page - 1) * pagination.pageSize
    const to = from + pagination.pageSize - 1
    let query = context.supabase
      .from('product_reviews')
      .select('id, product_id, user_id, rating, comment, status, moderation_reason, admin_response, moderated_by, moderated_at, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) query = query.eq('status', status)
    const { data, error, count } = await query
    if (error) throw new MobileApiError('REVIEWS_UNAVAILABLE', 'Reviews could not be loaded.', 500)

    return createMobileApiResponse(
      {
        reviews: data ?? [],
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
