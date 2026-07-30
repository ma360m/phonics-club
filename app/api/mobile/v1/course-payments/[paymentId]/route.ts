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
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { paymentId } = await params
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'course-payments-detail', { identifier: context.user.id, limit: 80, windowMs: 60_000 })

    const { data: payment, error } = await context.supabase
      .from('course_payments')
      .select('*, courses(id, title, slug, thumbnail_url, image_url)')
      .eq('id', paymentId)
      .maybeSingle()

    if (error || !payment) throw new MobileApiError('COURSE_PAYMENT_NOT_FOUND', 'Course payment could not be found.', 404)
    if (payment.user_id !== context.user.id && !isMobileAdminRole(context.profile.role)) {
      throw new MobileApiError('COURSE_PAYMENT_FORBIDDEN', 'You are not authorized to view this payment.', 403)
    }

    return createMobileApiResponse(
      {
        payment: {
          id: payment.id,
          courseId: payment.course_id,
          enrollmentId: payment.enrollment_id,
          amount: Number(payment.amount ?? 0),
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.payment_method,
          provider: payment.provider,
          transactionReference: payment.transaction_reference,
          receipt: {
            uploaded: Boolean(payment.receipt_path || payment.receipt_url),
            filename: payment.receipt_filename,
            mimeType: payment.receipt_mime_type,
            sizeBytes: payment.receipt_size_bytes,
            submittedAt: payment.submitted_at,
          },
          rejectionReason: payment.rejection_reason,
          course: payment.courses,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at,
        },
      },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
