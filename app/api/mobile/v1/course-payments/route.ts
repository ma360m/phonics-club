import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobilePaginationSchema } from '@/lib/mobile-api/schemas'
import { getCourseBankDetails } from '@/lib/site-content'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
} from '@/lib/mobile-api/response'

export async function GET(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'course-payments-list', { identifier: context.user.id, limit: 60, windowMs: 60_000 })

    const url = new URL(request.url)
    const pagination = mobilePaginationSchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
    })
    const from = (pagination.page - 1) * pagination.pageSize
    const to = from + pagination.pageSize - 1

    const [courseBankDetails, paymentsResult] = await Promise.all([
      getCourseBankDetails(),
      context.supabase
        .from('course_payments')
        .select('id, course_id, enrollment_id, amount, currency, status, payment_method, transaction_reference, receipt_filename, receipt_mime_type, receipt_size_bytes, submitted_at, created_at, updated_at, courses(id, title, slug, thumbnail_url, image_url)', { count: 'exact' })
        .eq('user_id', context.user.id)
        .order('created_at', { ascending: false })
        .range(from, to),
    ])
    const { data, count, error } = paymentsResult

    if (error) throw error

    return createMobileApiResponse(
      {
        payments: (data ?? []).map((payment) => ({
          id: payment.id,
          courseId: payment.course_id,
          enrollmentId: payment.enrollment_id,
          amount: Number(payment.amount ?? 0),
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.payment_method,
          transactionReference: payment.transaction_reference,
          receipt: {
            uploaded: Boolean(payment.receipt_filename),
            filename: payment.receipt_filename,
            mimeType: payment.receipt_mime_type,
            sizeBytes: payment.receipt_size_bytes,
            submittedAt: payment.submitted_at,
          },
          course: payment.courses,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at,
        })),
        courseBankDetails: {
          bankName: courseBankDetails.bankName,
          accountTitle: courseBankDetails.accountTitle,
          accountNumber: courseBankDetails.accountNumber,
          iban: courseBankDetails.iban,
          instructions: courseBankDetails.instructions,
        },
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
