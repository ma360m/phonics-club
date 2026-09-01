import { LMS_BUCKETS } from '@/lib/lms-storage'
import { evaluateCourseCompletion, getCourseById, isCertificatePayment } from '@/lib/lms'
import { notifyAdminOfPaymentReceipt } from '@/lib/email/send-payment-receipt-admin-email'
import { notifyAdminOfCertificateRequest } from '@/lib/email/send-certificate-request-admin-email'
import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileReceiptMetadataSchema } from '@/lib/mobile-api/schemas'
import { uploadPrivateReceiptFile } from '@/lib/mobile-api/storage'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

const editablePaymentStatuses = new Set(['pending', 'processing', 'submitted', 'rejected'])

export async function POST(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { paymentId } = await params
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'course-payment-receipt', { identifier: context.user.id, limit: 10, windowMs: 60_000 })

    const { data: payment, error: paymentError } = await context.supabase
      .from('course_payments')
      .select('*, courses(id, title, slug, currency)')
      .eq('id', paymentId)
      .maybeSingle()

    if (paymentError || !payment) {
      throw new MobileApiError('COURSE_PAYMENT_NOT_FOUND', 'Course payment could not be found.', 404)
    }
    if (payment.user_id !== context.user.id) {
      await recordMobileAuditEvent({
        request,
        requestId,
        userId: context.user.id,
        eventType: 'unauthorized_course_receipt_upload',
        entityType: 'course_payment',
        entityId: paymentId,
      })
      throw new MobileApiError('COURSE_PAYMENT_FORBIDDEN', 'You are not authorized to upload a receipt for this payment.', 403)
    }
    if (!editablePaymentStatuses.has(payment.status)) {
      throw new MobileApiError('COURSE_PAYMENT_LOCKED', 'This course payment can no longer accept receipts.', 409)
    }

    const formData = await request.formData()
    const file = formData.get('receipt')
    if (!(file instanceof File)) {
      throw new MobileApiError('FILE_REQUIRED', 'Choose a receipt file to upload.', 400)
    }
    const metadata = mobileReceiptMetadataSchema.parse({
      transactionReference: formData.get('transactionReference') || undefined,
    })
    const uploaded = await uploadPrivateReceiptFile({
      file,
      bucket: LMS_BUCKETS.paymentReceipts,
      pathPrefix: `course-payments/${context.user.id}/${payment.course_id}/${payment.id}`,
    })

    const now = new Date().toISOString()
    const { error: updateError } = await context.supabase
      .from('course_payments')
      .update({
        status: 'submitted',
        transaction_reference: metadata.transactionReference ?? null,
        receipt_bucket: uploaded.bucket,
        receipt_path: uploaded.path,
        receipt_url: null,
        receipt_filename: uploaded.filename,
        receipt_mime_type: uploaded.mimeType,
        receipt_size_bytes: uploaded.sizeBytes,
        submitted_at: now,
        registration_expired_at: null,
        payment_workflow_status: 'slip_uploaded',
      } as never)
      .eq('id', payment.id)
      .eq('user_id', context.user.id)

    if (updateError) {
      throw new MobileApiError('COURSE_RECEIPT_RECORD_FAILED', 'Receipt was uploaded, but the payment could not be updated.', 500)
    }

    await context.supabase.from('course_payment_events').insert({
      payment_id: payment.id,
      course_id: payment.course_id,
      user_id: context.user.id,
      previous_status: payment.status,
      new_status: 'submitted',
      event_type: 'mobile_receipt_submitted',
      payload: {
        transactionReference: metadata.transactionReference ?? null,
        receiptPath: uploaded.path,
      },
    } as never)

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_course_receipt_uploaded',
      entityType: 'course_payment',
      entityId: payment.id,
      metadata: { courseId: payment.course_id, mimeType: uploaded.mimeType, sizeBytes: uploaded.sizeBytes },
    })

    const course = payment.courses as { id?: string | null; title?: string | null; slug?: string | null; currency?: string | null } | null
    const certificatePayment = isCertificatePayment(payment)
    await notifyAdminOfPaymentReceipt({
      type: certificatePayment ? 'certificate' : 'course',
      source: certificatePayment ? 'Mobile certificate receipt upload' : 'Mobile course payment receipt upload',
      paymentId: payment.id,
      courseId: payment.course_id,
      reference: metadata.transactionReference || payment.id,
      status: 'submitted',
      paymentMethod: payment.payment_method,
      transactionReference: metadata.transactionReference ?? null,
      amount: Number(payment.amount ?? 0),
      currency: payment.currency ?? course?.currency ?? 'PKR',
      customer: {
        name: context.profile.full_name ?? context.user.email,
        email: context.profile.email ?? context.user.email,
      },
      course: course ? { title: course.title, slug: course.slug } : null,
      receipt: {
        filename: uploaded.filename,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        storageBucket: uploaded.bucket,
        storagePath: uploaded.path,
      },
      adminUrl: `${new URL('/admin/course-payments?status=submitted', request.url).toString()}`,
      uploadedAt: now,
      attachmentFile: file,
    })

    if (certificatePayment) {
      const fullCourse = await getCourseById(payment.course_id, { includeUnpublished: true })
      if (fullCourse) {
        const checklist = await evaluateCourseCompletion(fullCourse, context.user.id)
        await notifyAdminOfCertificateRequest({
          course: fullCourse,
          paymentId: payment.id,
          student: {
            id: context.user.id,
            name: context.profile.full_name ?? context.user.email,
            email: context.profile.email ?? context.user.email,
          },
          amount: Number(payment.amount ?? 0),
          currency: payment.currency ?? fullCourse.currency ?? 'PKR',
          status: 'receipt_uploaded',
          source: 'Mobile certificate receipt upload',
          requestedAt: now,
          checklist,
        })
      }
    }

    return createMobileApiResponse(
      {
        receipt: {
          uploaded: true,
          filename: uploaded.filename,
          mimeType: uploaded.mimeType,
          sizeBytes: uploaded.sizeBytes,
          submittedAt: now,
          reviewStatus: 'submitted',
        },
      },
      { status: 201, headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
