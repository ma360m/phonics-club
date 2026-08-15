import { getCoursePrice, isEnrollmentActive } from '@/lib/lms'
import { COURSE_REGISTRATION_REMINDER_DAYS } from '@/lib/course-payment-workflow'
import { getCurrencySettings } from '@/lib/currency-settings'
import { convertCurrency, normalizeCurrency } from '@/lib/currency'
import { getCourseBankDetails } from '@/lib/site-content'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileCoursePaymentCheckoutSchema } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'
import type { Course } from '@/types/database'

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export async function POST(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'course-payments-checkout', { identifier: context.user.id, limit: 10, windowMs: 60_000 })

    const parsed = mobileCoursePaymentCheckoutSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid course payment request.', 400)
    }

    const { data: course } = await context.supabase
      .from('courses')
      .select('*')
      .eq('id', parsed.data.courseId)
      .eq('published', true)
      .maybeSingle()

    if (!course) throw new MobileApiError('COURSE_NOT_FOUND', 'Course could not be found.', 404)

    const currentCourse = course as Course
    const now = new Date()
    if (currentCourse.enrolment_closes_at && new Date(currentCourse.enrolment_closes_at).getTime() < now.getTime()) {
      throw new MobileApiError('COURSE_ENROLLMENT_CLOSED', 'Enrollment for this course is closed.', 409)
    }
    if (currentCourse.enrolment_opens_at && new Date(currentCourse.enrolment_opens_at).getTime() > now.getTime()) {
      throw new MobileApiError('COURSE_NOT_OPEN', 'Enrollment for this course is not open yet.', 409)
    }

    const { data: existingEnrollment } = await context.supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', context.user.id)
      .eq('course_id', currentCourse.id)
      .maybeSingle()

    if (existingEnrollment && isEnrollmentActive(existingEnrollment as never)) {
      return createMobileApiResponse({
        enrollment: {
          id: existingEnrollment.id,
          status: existingEnrollment.status,
          expiresAt: existingEnrollment.expires_at,
        },
        payment: null,
      })
    }

    const amount = getCoursePrice(currentCourse)
    if (amount <= 0 || currentCourse.is_free) {
      const expiresAt = addDays(now, Number(currentCourse.access_duration_days ?? 90)).toISOString()
      const { data: enrollment, error: enrollmentError } = await context.supabase
        .from('enrollments')
        .upsert(
          {
            user_id: context.user.id,
            course_id: currentCourse.id,
            progress: 0,
            status: 'active',
            payment_status: 'free',
            purchase_date: now.toISOString(),
            activated_at: now.toISOString(),
            expires_at: expiresAt,
            last_accessed_at: now.toISOString(),
          } as never,
          { onConflict: 'user_id,course_id' },
        )
        .select('id, status, expires_at')
        .single()

      if (enrollmentError) {
        throw new MobileApiError('FREE_ENROLLMENT_FAILED', 'Course enrollment could not be created.', 500)
      }

      return createMobileApiResponse({
        enrollment: {
          id: enrollment.id,
          status: enrollment.status,
          expiresAt: enrollment.expires_at,
        },
        payment: null,
      }, { status: 201 })
    }

    const [currencySettings, courseBankDetails] = await Promise.all([
      getCurrencySettings(),
      getCourseBankDetails(),
    ])
    const displayCurrency = normalizeCurrency(parsed.data.selectedDisplayCurrency, currencySettings.usdEnabled)
    const idempotencyKey = `mobile:${context.user.id}:${parsed.data.idempotencyKey}`

    const { data: existingPayment } = await context.supabase
      .from('course_payments')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (existingPayment) {
      return createMobileApiResponse({
        payment: {
          id: existingPayment.id,
          status: existingPayment.status,
          amount: Number(existingPayment.amount ?? 0),
          currency: existingPayment.currency,
          courseId: existingPayment.course_id,
          createdAt: existingPayment.created_at,
        },
        courseBankDetails: {
          bankName: courseBankDetails.bankName,
          accountTitle: courseBankDetails.accountTitle,
          accountNumber: courseBankDetails.accountNumber,
          iban: courseBankDetails.iban,
          instructions: courseBankDetails.instructions,
        },
      })
    }

    const { data: payment, error: paymentError } = await context.supabase
      .from('course_payments')
      .insert({
        user_id: context.user.id,
        course_id: currentCourse.id,
        amount,
        currency: currentCourse.currency ?? 'PKR',
        status: 'pending',
        payment_method: parsed.data.paymentMethodId || 'manual_bank_transfer',
        provider: 'manual',
        idempotency_key: idempotencyKey,
        registration_expires_at: addDays(now, COURSE_REGISTRATION_REMINDER_DAYS).toISOString(),
        payment_workflow_status: 'pending_payment',
        metadata: {
          source: 'mobile',
          displayCurrency,
          displayAmount: convertCurrency(amount, displayCurrency, currencySettings.usdToPkrRate),
          exchangeRate: currencySettings.usdToPkrRate,
          exchangeRateTimestamp: currencySettings.lastUpdatedAt,
        },
      } as never)
      .select('*')
      .single()

    if (paymentError || !payment) {
      throw new MobileApiError('COURSE_PAYMENT_FAILED', 'Course payment could not be created.', 500)
    }

    const { data: enrollment } = await context.supabase
      .from('enrollments')
      .upsert(
        {
          user_id: context.user.id,
          course_id: currentCourse.id,
          progress: 0,
          status: 'pending',
          payment_status: payment.status,
          payment_id: payment.id,
        } as never,
        { onConflict: 'user_id,course_id' },
      )
      .select('id')
      .single()

    if (enrollment?.id) {
      await context.supabase.from('course_payments').update({ enrollment_id: enrollment.id } as never).eq('id', payment.id)
    }

    await context.supabase.from('course_payment_events').insert({
      payment_id: payment.id,
      course_id: currentCourse.id,
      user_id: context.user.id,
      new_status: payment.status,
      event_type: 'mobile_checkout_created',
      payload: { amount, currency: currentCourse.currency ?? 'PKR' },
    } as never)

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_course_payment_created',
      entityType: 'course_payment',
      entityId: payment.id,
      metadata: { courseId: currentCourse.id },
    })

    return createMobileApiResponse(
      {
        payment: {
          id: payment.id,
          status: payment.status,
          amount: Number(payment.amount ?? amount),
          currency: payment.currency,
          courseId: payment.course_id,
          enrollmentId: enrollment?.id ?? null,
          receiptRequired: true,
          createdAt: payment.created_at,
        },
        courseBankDetails: {
          bankName: courseBankDetails.bankName,
          accountTitle: courseBankDetails.accountTitle,
          accountNumber: courseBankDetails.accountNumber,
          iban: courseBankDetails.iban,
          instructions: courseBankDetails.instructions,
        },
      },
      { status: 201, headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
