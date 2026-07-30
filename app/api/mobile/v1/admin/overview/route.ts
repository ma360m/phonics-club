import { requireMobileAdminPermission } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
} from '@/lib/mobile-api/response'

async function readCount(query: PromiseLike<{ count: number | null; error: unknown }>) {
  const { count, error } = await query
  if (error) return null
  return count ?? 0
}

export async function GET(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileAdminPermission(request, 'admin.overview.read')
    enforceMobileRateLimit(request, 'admin-overview', {
      identifier: context.user.id,
      limit: 60,
      windowMs: 60_000,
    })

    const [
      pendingOrders,
      paymentReviewOrders,
      pendingCoursePayments,
      openSupportTickets,
      pendingReviews,
      deletionRequests,
      productsLowStock,
    ] = await Promise.all([
      readCount(context.supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
      readCount(context.supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['payment_submitted', 'payment_review'])),
      readCount(context.supabase.from('course_payments').select('id', { count: 'exact', head: true }).in('status', ['pending', 'submitted', 'processing'])),
      readCount(context.supabase.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'under_review', 'waiting_for_user', 'in_progress'])),
      readCount(context.supabase.from('product_reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
      readCount(context.supabase.from('account_deletion_requests').select('id', { count: 'exact', head: true }).in('status', ['requested', 'under_review', 'scheduled', 'on_hold_for_security_review'])),
      readCount(context.supabase.from('products').select('id', { count: 'exact', head: true }).lt('stock', 10)),
    ])

    const { data: recentOrders } = await context.supabase
      .from('orders')
      .select('id, status, total, display_currency, display_total, invoice_number, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    return createMobileApiResponse(
      {
        permissions: {
          overview: true,
        },
        metrics: {
          pendingOrders,
          paymentReviewOrders,
          pendingCoursePayments,
          openSupportTickets,
          pendingReviews,
          deletionRequests,
          productsLowStock,
        },
        recentOrders: recentOrders ?? [],
      },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
