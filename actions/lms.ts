'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import {
  evaluateCourseCompletion,
  courseRequiresCertificatePayment,
  getCourseById,
  getCourseCertificatePrice,
  getCourseEnrollmentAvailability,
  getCoursePrice,
  getUserCertificatePayment,
  getUserEnrollment,
  isCertificatePayment,
  isCertificatePaymentPaid,
  isEnrollmentActive,
} from '@/lib/lms'
import { buildCertificatePdf } from '@/lib/certificate-pdf'
import { getSignedCourseResourceUrl, LMS_BUCKETS, uploadLmsFile } from '@/lib/lms-storage'
import { friendlyErrorMessage, toError } from '@/lib/friendly-error'
import { APP_URL } from '@/lib/constants'
import { sendCourseCertificateIssuedEmail, sendCourseEnrollmentInvoiceEmail, sendCourseLicenseEmail } from '@/lib/email/send-course-license-email'
import { notifyAdminOfCourseEnrollment } from '@/lib/email/send-course-enrollment-admin-email'
import { notifyAdminOfCertificateRequest } from '@/lib/email/send-certificate-request-admin-email'
import { notifyAdminOfPaymentReceipt } from '@/lib/email/send-payment-receipt-admin-email'
import { COURSE_REGISTRATION_REMINDER_DAYS, getCoursePaymentWorkflowStatus } from '@/lib/course-payment-workflow'
import type { ActionResult } from '@/types'
import type { Course, CoursePaymentStatus, CourseResource, Profile, QuizQuestion } from '@/types/database'

async function requireCurrentUser() {
  const user = await getSession()
  if (!user) throw new Error('Please sign in to continue')
  return user
}

async function getServiceSupabase() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw toError('SUPABASE_SERVICE_ROLE_KEY is required for this LMS action', 'LMS action could not run.')
  }
  return createServiceClient()
}

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : APP_URL)
  ).replace(/\/$/, '')
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function normalizeLicenseKey(value: unknown) {
  return String(value ?? '').trim().toUpperCase().replace(/\s+/g, '-')
}

function compactLicenseKey(value: unknown) {
  return normalizeLicenseKey(value).replace(/[^A-Z0-9]/g, '')
}

function generateCourseLicenseKey(courseId: string, userId: string) {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
  return [
    'PC',
    new Date().getFullYear(),
    courseId.replace(/-/g, '').slice(0, 4).toUpperCase(),
    userId.replace(/-/g, '').slice(0, 4).toUpperCase(),
    random.slice(0, 4),
    random.slice(4, 8),
    random.slice(8, 12),
  ].join('-')
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const clean = String(value ?? '').trim()
    if (clean) return clean
  }
  return ''
}

function courseInvoiceNumber(paymentId: string) {
  return `COURSE-${new Date().getFullYear()}-${paymentId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

async function ensureCourseInvoice(
  supabase: Awaited<ReturnType<typeof getServiceSupabase>>,
  payment: { id: string; user_id: string; course_id: string; amount: number | string | null; currency?: string | null },
) {
  const { data: existing, error: existingError } = await supabase
    .from('course_invoices')
    .select('*')
    .eq('payment_id', payment.id)
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) {
    console.error('[Course invoice] Could not load invoice', { paymentId: payment.id, error: existingError.message })
    return null
  }
  if (existing) return existing as { invoice_number: string }

  const { data: invoice, error } = await supabase
    .from('course_invoices')
    .insert({
      payment_id: payment.id,
      course_id: payment.course_id,
      user_id: payment.user_id,
      invoice_number: courseInvoiceNumber(payment.id),
      amount: Number(payment.amount ?? 0),
      currency: payment.currency ?? 'PKR',
    } as never)
    .select('*')
    .single()

  if (error) {
    console.error('[Course invoice] Could not create invoice', { paymentId: payment.id, error: error.message })
    return null
  }

  return invoice as { invoice_number: string }
}

async function sendEnrollmentInvoiceEmailIfNeeded({
  supabase,
  payment,
  course,
  to,
  studentName,
}: {
  supabase: Awaited<ReturnType<typeof getServiceSupabase>>
  payment: any
  course: Course
  to?: string | null
  studentName?: string | null
}) {
  const invoice = await ensureCourseInvoice(supabase, payment)
  if (!invoice || !to) return { sent: false, invoiceNumber: invoice?.invoice_number ?? null }

  const metadata = objectRecord(payment.metadata)
  if (metadata.courseInvoiceEmailedAt) {
    return { sent: false, invoiceNumber: invoice.invoice_number }
  }

  try {
    const emailResult = await sendCourseEnrollmentInvoiceEmail({
      to,
      studentName,
      course,
      paymentId: payment.id,
      invoiceNumber: invoice.invoice_number,
      amount: Number(payment.amount ?? 0),
      currency: payment.currency ?? 'PKR',
    })

    if (emailResult.sent) {
      const nextMetadata = {
        ...metadata,
        courseInvoiceNumber: invoice.invoice_number,
        courseInvoiceEmailedAt: new Date().toISOString(),
        courseInvoiceEmailFrom: emailResult.from,
      }
      const { error } = await supabase
        .from('course_payments')
        .update({ metadata: nextMetadata } as never)
        .eq('id', payment.id)
      if (error) console.error('[Course invoice] Could not record invoice email', { paymentId: payment.id, error: error.message })
    }

    return { sent: emailResult.sent, invoiceNumber: invoice.invoice_number }
  } catch (error) {
    console.error('[Course invoice] Invoice email failed', { paymentId: payment.id, error })
    return { sent: false, invoiceNumber: invoice.invoice_number }
  }
}

export async function markLessonCompleteAction(
  courseId: string,
  lessonId: string
): Promise<ActionResult<{ progress: number }>> {
  try {
    const user = await requireCurrentUser()
    if (lessonId.startsWith('curriculum-')) {
      return { success: false, error: 'This course needs lesson rows in Supabase before progress can persist.' }
    }

    const supabase = await createClient()
    const [{ data: lesson }, enrollment] = await Promise.all([
      supabase
        .from('course_lessons')
        .select('id, course_id')
        .eq('id', lessonId)
        .eq('course_id', courseId)
        .maybeSingle(),
      getUserEnrollment(user.id, courseId),
    ])

    if (!lesson) return { success: false, error: 'Lesson not found' }
    if (!enrollment) return { success: false, error: 'You must be enrolled to update progress' }

    const now = new Date().toISOString()
    const { error } = await supabase.from('lesson_progress').upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        course_id: courseId,
        completed: true,
        completed_at: now,
        updated_at: now,
      } as never,
      { onConflict: 'user_id,lesson_id' },
    )
    if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }

    const [{ count: totalLessons }, { count: completedLessons }] = await Promise.all([
      supabase
        .from('course_lessons')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId),
      supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('completed', true),
    ])

    const progress = totalLessons ? Math.min(Math.round(((completedLessons ?? 0) / totalLessons) * 100), 100) : 0
    await supabase
      .from('enrollments')
      .update({
        progress,
        completed_at: progress >= 100 ? now : null,
      } as never)
      .eq('user_id', user.id)
      .eq('course_id', courseId)

    revalidatePath(`/course/${courseId}/learn`)
    revalidatePath('/dashboard/my-courses')
    return { success: true, data: { progress } }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to update progress.') }
  }
}

export async function toggleCourseWishlistAction(
  courseId: string
): Promise<ActionResult<{ wishlisted: boolean }>> {
  try {
    const user = await requireCurrentUser()
    const supabase = await createClient()
    const { data: existing } = await supabase
      .from('course_wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await supabase.from('course_wishlists').delete().eq('id', existing.id)
      if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }
      revalidatePath('/dashboard/my-courses')
      return { success: true, data: { wishlisted: false } }
    }

    const { error } = await supabase.from('course_wishlists').insert({
      user_id: user.id,
      course_id: courseId,
    } as never)
    if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }

    revalidatePath('/dashboard/my-courses')
    return { success: true, data: { wishlisted: true } }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to update wishlist.') }
  }
}

export async function createCourseCheckoutAction(
  courseId: string
): Promise<ActionResult<{ paymentId?: string; enrollmentId?: string; redirectTo: string }>> {
  try {
    const user = await requireCurrentUser()
    const supabase = await getServiceSupabase()
    const { data: course } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('published', true)
      .in('visibility_status', ['published', 'unlisted'])
      .eq('archived', false)
      .maybeSingle()

    if (!course) return { success: false, error: 'Course not found' }
    const currentCourse = course as Course
    const price = getCoursePrice(currentCourse)
    const now = new Date()

    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existingEnrollment && isEnrollmentActive(existingEnrollment as never)) {
      return { success: true, data: { enrollmentId: existingEnrollment.id, redirectTo: `/course/${courseId}/learn` } }
    }

    const availability = getCourseEnrollmentAvailability(currentCourse)
    if (!availability.canEnroll) return { success: false, error: availability.message }

    if (price <= 0 || currentCourse.is_free) {
      const expiresAt = addDays(now, Number(currentCourse.access_duration_days ?? 90)).toISOString()
      const { data: enrollment, error } = await supabase
        .from('enrollments')
        .upsert(
          {
            user_id: user.id,
            course_id: courseId,
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
        .select('id')
        .single()
      if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .maybeSingle()
      await notifyAdminOfCourseEnrollment({
        course: currentCourse,
        enrollmentId: enrollment.id,
        student: {
          id: user.id,
          name: firstString((profile as { full_name?: string | null } | null)?.full_name, user.email),
          email: firstString((profile as { email?: string | null } | null)?.email, user.email),
        },
        status: 'active',
        paymentStatus: 'free',
        amount: 0,
        currency: currentCourse.currency ?? 'PKR',
        source: 'Website free enrollment',
        enrolledAt: now,
      })
      revalidatePath('/dashboard/my-courses')
      revalidatePath(`/courses/${currentCourse.slug}`)
      return { success: true, data: { enrollmentId: enrollment.id, redirectTo: `/course/${courseId}/learn` } }
    }

    const idempotencyKey = `course:${courseId}:user:${user.id}:manual`
    const paymentPagePath = `/courses/${currentCourse.slug}/payment`
    const { data: existingPayment } = await supabase
      .from('course_payments')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    let payment = existingPayment
    if (!payment) {
      const registrationExpiresAt = addDays(now, COURSE_REGISTRATION_REMINDER_DAYS).toISOString()
      const { data: newPayment, error: paymentError } = await supabase
        .from('course_payments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          amount: price,
          currency: currentCourse.currency ?? 'PKR',
          status: 'pending',
          payment_method: 'manual_bank_transfer',
          provider: 'manual',
          idempotency_key: idempotencyKey,
          registration_expires_at: registrationExpiresAt,
          payment_workflow_status: 'pending_payment',
        } as never)
        .select('*')
        .single()

      if (paymentError) return { success: false, error: paymentError.message }
      payment = newPayment
    } else if (!payment.registration_expires_at || !payment.payment_workflow_status) {
      await supabase
        .from('course_payments')
        .update({
          registration_expires_at: payment.registration_expires_at ?? addDays(new Date(payment.created_at), COURSE_REGISTRATION_REMINDER_DAYS).toISOString(),
          payment_workflow_status: payment.payment_workflow_status ?? getCoursePaymentWorkflowStatus(payment),
        } as never)
        .eq('id', payment.id)
    }

    if (!payment) return { success: false, error: 'Payment could not be created' }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          progress: existingEnrollment?.progress ?? 0,
          status: 'pending',
          payment_status: payment.status,
          payment_id: payment.id,
        } as never,
        { onConflict: 'user_id,course_id' },
      )
      .select('id')
      .single()

    if (enrollmentError) return { success: false, error: enrollmentError.message }

    await supabase.from('course_payments').update({ enrollment_id: enrollment.id } as never).eq('id', payment.id)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .maybeSingle()
    const invoiceEmail = await sendEnrollmentInvoiceEmailIfNeeded({
      supabase,
      payment,
      course: currentCourse,
      to: firstString((profile as { email?: string | null } | null)?.email, user.email),
      studentName: firstString((profile as { full_name?: string | null } | null)?.full_name, user.email),
    })
    if (!existingPayment) {
      await notifyAdminOfCourseEnrollment({
        course: currentCourse,
        enrollmentId: enrollment.id,
        paymentId: payment.id,
        student: {
          id: user.id,
          name: firstString((profile as { full_name?: string | null } | null)?.full_name, user.email),
          email: firstString((profile as { email?: string | null } | null)?.email, user.email),
        },
        status: 'pending',
        paymentStatus: payment.status,
        amount: price,
        currency: currentCourse.currency ?? 'PKR',
        source: 'Website paid checkout',
        enrolledAt: now,
      })
    }
    if (!existingPayment) {
      await supabase.from('course_payment_events').insert({
        payment_id: payment.id,
        course_id: courseId,
        user_id: user.id,
        new_status: payment.status,
        event_type: 'checkout_created',
        payload: {
          amount: price,
          currency: currentCourse.currency ?? 'PKR',
          invoiceNumber: invoiceEmail.invoiceNumber,
          invoiceEmailSent: invoiceEmail.sent,
        },
      } as never)
    }

    revalidatePath('/dashboard/my-courses')
    revalidatePath(paymentPagePath)
    return {
      success: true,
      data: {
        paymentId: payment.id,
        enrollmentId: enrollment.id,
        redirectTo: `${paymentPagePath}?paymentId=${payment.id}`,
      },
    }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to start checkout.') }
  }
}

export async function createCertificatePaymentAction(
  courseId: string
): Promise<ActionResult<{ paymentId?: string; redirectTo: string }>> {
  try {
    const user = await requireCurrentUser()
    const course = await getCourseById(courseId)
    if (!course) return { success: false, error: 'Course not found' }

    const enrollment = await getUserEnrollment(user.id, courseId)
    if (!isEnrollmentActive(enrollment)) return { success: false, error: 'Your course access is not active' }

    const checklist = await evaluateCourseCompletion(course, user.id)
    if (!checklist.eligible) return { success: false, error: 'Complete all enabled course requirements before paying for a certificate' }
    if (!courseRequiresCertificatePayment(course)) {
      return { success: true, data: { redirectTo: `/course/${courseId}/certificate` } }
    }

    const supabase = await getServiceSupabase()
    const price = getCourseCertificatePrice(course)
    const now = new Date()
    const idempotencyKey = `certificate:${courseId}:user:${user.id}:manual`
    const { data: existingPayment } = await supabase
      .from('course_payments')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    let payment = existingPayment
    const paymentMetadata = {
      paymentPurpose: 'certificate',
      courseTitle: course.title,
      certificatePrice: price,
      certificateRequiresPayment: true,
    }

    if (!payment) {
      const { data: newPayment, error: paymentError } = await supabase
        .from('course_payments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          amount: price,
          currency: course.currency ?? 'PKR',
          status: 'pending',
          payment_method: 'manual_bank_transfer',
          provider: 'manual',
          idempotency_key: idempotencyKey,
          registration_expires_at: addDays(now, COURSE_REGISTRATION_REMINDER_DAYS).toISOString(),
          payment_workflow_status: 'pending_payment',
          metadata: paymentMetadata,
        } as never)
        .select('*')
        .single()

      if (paymentError) return { success: false, error: friendlyErrorMessage(paymentError, 'Certificate payment could not be created.') }
      payment = newPayment

      await supabase.from('course_payment_events').insert({
        payment_id: payment.id,
        course_id: courseId,
        user_id: user.id,
        new_status: payment.status,
        event_type: 'certificate_checkout_created',
        payload: { amount: price, currency: course.currency ?? 'PKR' },
      } as never)

      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .maybeSingle()
      await notifyAdminOfCertificateRequest({
        course,
        paymentId: payment.id,
        student: {
          id: user.id,
          name: firstString((profile as { full_name?: string | null } | null)?.full_name, user.email),
          email: firstString((profile as { email?: string | null } | null)?.email, user.email),
        },
        amount: price,
        currency: course.currency ?? 'PKR',
        status: 'payment_started',
        source: 'Certificate bank transfer request',
        requestedAt: now,
      })
    } else if (!isCertificatePaymentPaid(payment) && (Number(payment.amount ?? 0) !== price || payment.currency !== (course.currency ?? 'PKR'))) {
      await supabase
        .from('course_payments')
        .update({
          amount: price,
          currency: course.currency ?? 'PKR',
          metadata: { ...objectRecord(payment.metadata), ...paymentMetadata },
        } as never)
        .eq('id', payment.id)
    }

    if (!payment) return { success: false, error: 'Certificate payment could not be created' }

    revalidatePath('/dashboard/my-courses')
    revalidatePath(`/course/${courseId}/certificate`)
    return { success: true, data: { paymentId: payment.id, redirectTo: `/course/${courseId}/certificate?paymentId=${payment.id}` } }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to start certificate payment.') }
  }
}

export async function submitCoursePaymentReceiptAction(
  paymentId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await requireCurrentUser()
    const supabase = await getServiceSupabase()
    const { data: payment } = await supabase
      .from('course_payments')
      .select('*, courses(slug)')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!payment) return { success: false, error: 'Payment not found' }
    if (!['pending', 'processing', 'submitted', 'rejected'].includes(payment.status)) {
      return { success: false, error: 'This payment can no longer be updated' }
    }
    const certificatePayment = isCertificatePayment(payment)

    const receipt = formData.get('receipt') as File | null
    if (!receipt || receipt.size <= 0) return { success: false, error: 'Upload a receipt file' }
    const uploaded = await uploadLmsFile(LMS_BUCKETS.paymentReceipts, receipt, `${user.id}/${payment.course_id}`, {
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      maxBytes: 10 * 1024 * 1024,
    })
    const transactionReference = String(formData.get('transaction_reference') ?? '').trim() || null

    const { error } = await supabase
      .from('course_payments')
      .update({
        status: 'submitted',
        transaction_reference: transactionReference,
        receipt_bucket: uploaded.bucket,
        receipt_path: uploaded.path,
        receipt_filename: uploaded.filename,
        receipt_mime_type: uploaded.mimeType,
        receipt_size_bytes: uploaded.sizeBytes,
        submitted_at: new Date().toISOString(),
        registration_expired_at: null,
        payment_workflow_status: 'slip_uploaded',
      } as never)
      .eq('id', paymentId)
    if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }

    await supabase.from('course_payment_events').insert({
      payment_id: paymentId,
      course_id: payment.course_id,
      user_id: user.id,
      previous_status: payment.status,
      new_status: 'submitted',
      event_type: certificatePayment ? 'certificate_receipt_submitted' : 'manual_receipt_submitted',
      payload: { transactionReference, receiptPath: uploaded.path },
    } as never)

    const [{ data: profile }, course] = await Promise.all([
      supabase.from('profiles').select('email, full_name').eq('id', user.id).maybeSingle(),
      getCourseById(payment.course_id, { includeUnpublished: true }),
    ])
    const student = {
      id: user.id,
      name: firstString((profile as { full_name?: string | null } | null)?.full_name, user.email),
      email: firstString((profile as { email?: string | null } | null)?.email, user.email),
    }

    await notifyAdminOfPaymentReceipt({
      type: certificatePayment ? 'certificate' : 'course',
      source: certificatePayment ? 'Certificate receipt upload' : 'Course payment receipt upload',
      paymentId,
      courseId: payment.course_id,
      reference: transactionReference || paymentId,
      status: 'submitted',
      paymentMethod: payment.payment_method,
      transactionReference,
      amount: Number(payment.amount ?? 0),
      currency: payment.currency ?? course?.currency ?? 'PKR',
      customer: student,
      course: course ? { title: course.title, slug: course.slug } : null,
      receipt: {
        filename: uploaded.filename,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        storageBucket: uploaded.bucket,
        storagePath: uploaded.path,
      },
      adminUrl: `${appBaseUrl()}/admin/course-payments?status=submitted`,
      uploadedAt: new Date(),
      attachmentFile: receipt,
    })

    if (certificatePayment) {
      if (course) {
        await notifyAdminOfCertificateRequest({
          course,
          paymentId,
          student,
          amount: Number(payment.amount ?? 0),
          currency: payment.currency ?? course.currency ?? 'PKR',
          status: 'receipt_uploaded',
          source: 'Certificate receipt upload',
          requestedAt: new Date(),
        })
      }
    }

    revalidatePath('/dashboard/my-courses')
    const courseSlug = (payment.courses as { slug?: string } | null)?.slug
    if (certificatePayment) revalidatePath(`/course/${payment.course_id}/certificate`)
    else if (courseSlug) revalidatePath(`/courses/${courseSlug}/payment`)
    return { success: true }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to submit receipt.') }
  }
}

export async function submitCoursePaymentReceiptFormAction(
  _state: ActionResult<{ redirectTo?: string }>,
  formData: FormData
): Promise<ActionResult<{ redirectTo?: string }>> {
  const paymentId = String(formData.get('payment_id') ?? '')
  if (!paymentId) return { success: false, error: 'Payment is missing' }

  const result = await submitCoursePaymentReceiptAction(paymentId, formData)
  if (!result.success) return { success: false, error: result.error }
  return { success: true, data: { redirectTo: String(formData.get('redirect_to') ?? '') || undefined } }
}

export async function unlockCourseWithLicenseKeyFormAction(
  _state: ActionResult<{ redirectTo?: string }>,
  formData: FormData
): Promise<ActionResult<{ redirectTo?: string }>> {
  try {
    const user = await requireCurrentUser()
    const paymentId = String(formData.get('payment_id') ?? '')
    const submittedKey = normalizeLicenseKey(formData.get('license_key'))
    if (!paymentId) return { success: false, error: 'Payment is missing' }
    if (!submittedKey) return { success: false, error: 'Enter the licence key sent by admin.' }

    const supabase = await getServiceSupabase()
    const { data: payment } = await supabase
      .from('course_payments')
      .select('*, courses(*)')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!payment) return { success: false, error: 'Payment not found' }
    if (payment.status !== 'paid') return { success: false, error: 'Admin must confirm the payment before this key can unlock the course.' }
    if (!payment.license_key) return { success: false, error: 'Admin has not issued a licence key yet.' }
    if (compactLicenseKey(submittedKey) !== compactLicenseKey(payment.license_key)) {
      return { success: false, error: 'That licence key does not match this course payment.' }
    }

    const course = payment.courses as Course
    const now = new Date()
    const expiresAt = addDays(now, Number(course.access_duration_days ?? 90)).toISOString()
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .upsert(
        {
          user_id: user.id,
          course_id: payment.course_id,
          progress: 0,
          status: 'active',
          payment_status: 'paid',
          payment_id: payment.id,
          purchase_date: now.toISOString(),
          activated_at: now.toISOString(),
          expires_at: expiresAt,
          last_accessed_at: now.toISOString(),
          license_key: payment.license_key,
          license_unlocked_at: now.toISOString(),
        } as never,
        { onConflict: 'user_id,course_id' },
      )
      .select('id')
      .single()

    if (enrollmentError) return { success: false, error: enrollmentError.message }

    await supabase
      .from('course_payments')
      .update({
        enrollment_id: enrollment.id,
        license_unlocked_at: now.toISOString(),
        payment_workflow_status: 'licence_issued',
      } as never)
      .eq('id', payment.id)

    await supabase.from('course_payment_events').insert({
      payment_id: payment.id,
      course_id: payment.course_id,
      user_id: user.id,
      previous_status: payment.status,
      new_status: 'paid',
      event_type: 'license_key_unlocked',
      payload: { enrollmentId: enrollment.id },
    } as never)

    revalidatePath('/dashboard/my-courses')
    revalidatePath(`/courses/${course.slug}`)
    revalidatePath(`/courses/${course.slug}/payment`)
    revalidatePath(`/course/${course.id}/learn`)
    return { success: true, data: { redirectTo: `/course/${course.id}/learn` } }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to unlock this course.') }
  }
}

export async function approveCoursePaymentAction(
  paymentId: string,
  options: { licenseKey?: string; forceNewLicenseKey?: boolean; resendEmail?: boolean } = {},
): Promise<ActionResult> {
  try {
    const admin = await import('@/lib/auth').then((mod) => mod.requireAdmin())
    const supabase = await getServiceSupabase()
    const { data: payment, error: paymentError } = await supabase
      .from('course_payments')
      .select('*')
      .eq('id', paymentId)
      .maybeSingle()
    if (paymentError) return { success: false, error: friendlyErrorMessage(paymentError, 'Payment could not be loaded.') }
    if (!payment) return { success: false, error: 'Payment not found' }

    const [{ data: course, error: courseError }, { data: profile }] = await Promise.all([
      supabase.from('courses').select('*').eq('id', payment.course_id).maybeSingle(),
      supabase.from('profiles').select('email, full_name').eq('id', payment.user_id).maybeSingle(),
    ])
    if (courseError) return { success: false, error: friendlyErrorMessage(courseError, 'Course could not be loaded.') }
    if (!course) return { success: false, error: 'Course not found' }

    const currentCourse = course as Course
    const now = new Date()
    const paymentMetadata = objectRecord(payment.metadata)
    if (isCertificatePayment(payment)) {
      const { error } = await supabase
        .from('course_payments')
        .update({
          status: 'paid',
          verified_at: now.toISOString(),
          approved_by: admin.id,
          registration_expired_at: null,
          payment_workflow_status: 'payment_verified',
          metadata: {
            ...paymentMetadata,
            paymentPurpose: 'certificate',
            certificateApprovedAt: now.toISOString(),
          },
        } as never)
        .eq('id', paymentId)
      if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }

      await supabase.from('course_payment_events').insert({
        payment_id: paymentId,
        course_id: payment.course_id,
        user_id: payment.user_id,
        previous_status: payment.status,
        new_status: 'paid',
        event_type: 'certificate_payment_approved',
        actor_id: admin.id,
        payload: { amount: Number(payment.amount ?? 0), currency: payment.currency ?? 'PKR' },
      } as never)

      const studentProfile = profile as { email?: string | null; full_name?: string | null } | null
      const issueResult = await issueCourseCertificateForUser({
        supabase,
        course: currentCourse,
        userId: payment.user_id,
        userEmail: firstString(
          studentProfile?.email,
          paymentMetadata.studentEmail,
          paymentMetadata.student_email,
          paymentMetadata.customerEmail,
          paymentMetadata.email,
        ),
        source: 'Certificate payment approved',
      })
      if (!issueResult.success) {
        console.error('[Certificate payment] Automatic certificate issue failed after approval', {
          paymentId,
          courseId: payment.course_id,
          userId: payment.user_id,
          error: issueResult.error,
        })
      }

      revalidatePath('/admin/course-payments')
      revalidatePath('/dashboard/my-courses')
      revalidatePath(`/course/${payment.course_id}/certificate`)
      return { success: true }
    }

    const customLicenseKey = normalizeLicenseKey(options.licenseKey)
    const licenseKey = customLicenseKey || (options.forceNewLicenseKey || !payment.license_key
      ? generateCourseLicenseKey(payment.course_id, payment.user_id)
      : payment.license_key)
    const existingEnrollment = payment.enrollment_id
      ? await supabase.from('enrollments').select('*').eq('id', payment.enrollment_id).maybeSingle()
      : await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', payment.user_id)
          .eq('course_id', payment.course_id)
          .maybeSingle()
    const keepActive = isEnrollmentActive(existingEnrollment.data as never)
    const activationTime = now.toISOString()
    const expiresAt = keepActive && existingEnrollment.data?.expires_at
      ? existingEnrollment.data.expires_at
      : addDays(now, Number(currentCourse.access_duration_days ?? 90)).toISOString()

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .upsert(
        {
          user_id: payment.user_id,
          course_id: payment.course_id,
          progress: existingEnrollment.data?.progress ?? 0,
          status: 'active',
          payment_status: 'paid',
          payment_id: payment.id,
          purchase_date: existingEnrollment.data?.purchase_date ?? activationTime,
          activated_at: keepActive ? existingEnrollment.data?.activated_at ?? activationTime : activationTime,
          expires_at: expiresAt,
          last_accessed_at: existingEnrollment.data?.last_accessed_at ?? activationTime,
          license_key: licenseKey,
          license_unlocked_at: activationTime,
        } as never,
        { onConflict: 'user_id,course_id' },
      )
      .select('id')
      .single()
    if (enrollmentError) return { success: false, error: enrollmentError.message }

    const { error } = await supabase
      .from('course_payments')
      .update({
        status: 'paid',
        enrollment_id: enrollment.id,
        verified_at: now.toISOString(),
        approved_by: admin.id,
        license_key: licenseKey,
        license_unlocked_at: activationTime,
        registration_expired_at: null,
        payment_workflow_status: 'licence_issued',
      } as never)
      .eq('id', paymentId)
    if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }

    const invoice = await ensureCourseInvoice(supabase, payment)
    const studentProfile = profile as { email?: string | null; full_name?: string | null } | null
    const studentEmail = firstString(
      studentProfile?.email,
      paymentMetadata.studentEmail,
      paymentMetadata.student_email,
      paymentMetadata.customerEmail,
      paymentMetadata.email,
    )
    const studentName = firstString(
      studentProfile?.full_name,
      paymentMetadata.studentName,
      paymentMetadata.student_name,
      paymentMetadata.customerName,
      studentEmail,
    )
    let licenseEmailSent = false
    let licenseEmailFrom: string | null = null
    if (studentEmail && (options.resendEmail || !payment.license_emailed_at)) {
      try {
        const emailResult = await sendCourseLicenseEmail({
          to: studentEmail,
          studentName,
          course: currentCourse,
          paymentId,
          licenseKey,
          amount: Number(payment.amount ?? 0),
          currency: payment.currency ?? 'PKR',
          invoiceNumber: invoice?.invoice_number ?? String(paymentMetadata.courseInvoiceNumber ?? ''),
        })
        licenseEmailSent = emailResult.sent
        licenseEmailFrom = emailResult.from
        if (emailResult.sent) {
          const { error: emailRecordError } = await supabase
            .from('course_payments')
            .update({ license_emailed_at: new Date().toISOString() } as never)
            .eq('id', paymentId)
          if (emailRecordError) {
            console.error('[Course payment] Could not record licence email timestamp', {
              paymentId,
              error: emailRecordError.message,
            })
          }
        }
      } catch (emailError) {
        console.error('[Course payment] Licence email failed after approval', { paymentId, error: emailError })
      }
    }

    await supabase.from('course_payment_events').insert({
      payment_id: paymentId,
      course_id: payment.course_id,
      user_id: payment.user_id,
      previous_status: payment.status,
      new_status: 'paid',
      event_type: 'manual_payment_approved',
      actor_id: admin.id,
      payload: {
        licenseEmailSent,
        licenseEmailFrom,
        invoiceNumber: invoice?.invoice_number ?? null,
      },
    } as never)

    revalidatePath('/admin/course-payments')
    revalidatePath('/dashboard/my-courses')
    revalidatePath(`/courses/${currentCourse.slug}/payment`)
    return { success: true }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to approve payment.') }
  }
}

export async function rejectCoursePaymentAction(paymentId: string, reason: string): Promise<ActionResult> {
  try {
    const admin = await import('@/lib/auth').then((mod) => mod.requireAdmin())
    const supabase = await getServiceSupabase()
    const { data: payment } = await supabase.from('course_payments').select('*, courses(slug)').eq('id', paymentId).maybeSingle()
    if (!payment) return { success: false, error: 'Payment not found' }
    const certificatePayment = isCertificatePayment(payment)

    const { error } = await supabase
      .from('course_payments')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        approved_by: admin.id,
        rejection_reason: reason.trim() || 'Payment could not be verified',
      } as never)
      .eq('id', paymentId)
    if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }

    if (!certificatePayment) {
      await supabase
        .from('enrollments')
        .update({ status: 'pending', payment_status: 'rejected' } as never)
        .eq('payment_id', paymentId)
    }

    await supabase.from('course_payment_events').insert({
      payment_id: paymentId,
      course_id: payment.course_id,
      user_id: payment.user_id,
      previous_status: payment.status,
      new_status: 'rejected',
      event_type: certificatePayment ? 'certificate_payment_rejected' : 'manual_payment_rejected',
      actor_id: admin.id,
      payload: { reason },
    } as never)

    revalidatePath('/admin/course-payments')
    const courseSlug = (payment.courses as { slug?: string } | null)?.slug
    if (certificatePayment) revalidatePath(`/course/${payment.course_id}/certificate`)
    else if (courseSlug) revalidatePath(`/courses/${courseSlug}/payment`)
    revalidatePath('/dashboard/my-courses')
    return { success: true }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to reject payment.') }
  }
}

export async function getSignedCourseResourceAction(resourceId: string): Promise<ActionResult<{ url: string }>> {
  try {
    const supabase = await createClient()
    const { data: resource } = await supabase.from('course_resources').select('*').eq('id', resourceId).maybeSingle()
    if (!resource) return { success: false, error: 'Resource not found' }
    const user = await getSession()
    if (resource.visibility !== 'public' && !user) return { success: false, error: 'Please sign in to open this resource' }
    const signed = await getSignedCourseResourceUrl(resource as CourseResource, user?.id ?? '')
    if (!signed.success) return { success: false, error: signed.error }

    if (user) {
      const service = await getServiceSupabase()
      await service.from('course_resource_downloads').insert({
        resource_id: resourceId,
        user_id: user.id,
        course_id: resource.course_id,
      } as never)
    }

    return { success: true, data: { url: signed.url } }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to open resource.') }
  }
}

type QuizAnswer = number | number[] | string

function normalizeNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item))
    .sort((a, b) => a - b)
}

function quizAnswerIsCorrect(question: QuizQuestion, answer: QuizAnswer | undefined): boolean {
  const questionType = question.question_type ?? 'mcq'

  if (questionType === 'multiple_select') {
    const expected = normalizeNumberArray(question.correct_options?.length ? question.correct_options : [question.correct_option])
    const submitted = normalizeNumberArray(answer)
    return expected.length > 0 && expected.length === submitted.length && expected.every((item, index) => item === submitted[index])
  }

  if (questionType === 'fill_blank' || questionType === 'short_answer' || questionType === 'long_answer') {
    if (typeof answer !== 'string') return false
    const submitted = answer.trim().toLowerCase()
    const acceptable = Array.isArray(question.acceptable_answers) ? question.acceptable_answers : []
    return acceptable.map((item) => String(item).trim().toLowerCase()).includes(submitted)
  }

  return typeof answer === 'number' && answer === question.correct_option
}

export async function submitQuizAttemptAction(
  courseId: string,
  quizId: string,
  answers: Record<string, QuizAnswer>
): Promise<ActionResult<{ score: number; passed: boolean; correct: number; total: number }>> {
  try {
    const user = await requireCurrentUser()
    const enrollment = await getUserEnrollment(user.id, courseId)
    if (!enrollment) return { success: false, error: 'You must be enrolled before taking this quiz' }

    const supabase = await getServiceSupabase()
    const [{ data: quiz }, { data: questions }, { count: attempts }] = await Promise.all([
      supabase
        .from('course_quizzes')
        .select('*')
        .eq('id', quizId)
        .eq('course_id', courseId)
        .eq('published', true)
        .maybeSingle(),
      supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId)
        .eq('user_id', user.id),
    ])

    if (!quiz) return { success: false, error: 'Quiz not found' }
    if ((attempts ?? 0) >= Number(quiz.max_attempts ?? 3)) {
      return { success: false, error: 'You have reached the retry limit for this quiz' }
    }

    const quizQuestions = (questions as QuizQuestion[]) ?? []
    if (!quizQuestions.length) return { success: false, error: 'This quiz does not have questions yet' }

    const correct = quizQuestions.reduce((total, question) => {
      return total + (quizAnswerIsCorrect(question, answers[question.id]) ? 1 : 0)
    }, 0)
    const earnedPoints = quizQuestions.reduce((total, question) => {
      const points = Math.max(Number(question.points ?? 1), 1)
      return total + (quizAnswerIsCorrect(question, answers[question.id]) ? points : 0)
    }, 0)
    const availablePoints = quizQuestions.reduce((total, question) => total + Math.max(Number(question.points ?? 1), 1), 0)
    const score = Math.round((earnedPoints / Math.max(availablePoints, 1)) * 100)
    const passed = score >= Number(quiz.passing_score ?? 70)

    const { error } = await supabase.from('quiz_attempts').insert({
      quiz_id: quizId,
      course_id: courseId,
      user_id: user.id,
      score,
      passed,
      answers,
      attempt_number: (attempts ?? 0) + 1,
    } as never)
    if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }

    const course = await getCourseById(courseId)
    if (course) await evaluateCourseCompletion(course, user.id)

    revalidatePath(`/course/${courseId}/quiz`)
    return { success: true, data: { score, passed, correct, total: quizQuestions.length } }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to submit quiz.') }
  }
}

export async function startLearningSessionAction(input: {
  courseId: string
  lessonId?: string | null
  deviceId: string
}): Promise<ActionResult<{ sessionId: string }>> {
  try {
    const user = await requireCurrentUser()
    const enrollment = await getUserEnrollment(user.id, input.courseId)
    if (!isEnrollmentActive(enrollment)) return { success: false, error: 'Your course access is not active' }

    const supabase = await getServiceSupabase()
    const { data, error } = await supabase
      .from('learning_sessions')
      .insert({
        user_id: user.id,
        course_id: input.courseId,
        lesson_id: input.lessonId ?? null,
        enrollment_id: enrollment?.id ?? null,
        device_id: input.deviceId.slice(0, 120),
        started_at: new Date().toISOString(),
        status: 'active',
      } as never)
      .select('id')
      .single()

    if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }
    return { success: true, data: { sessionId: data.id } }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to start learning session.') }
  }
}

export async function recordLearningHeartbeatAction(input: {
  sessionId: string
  heartbeatId: string
  courseId: string
  lessonId?: string | null
  visible: boolean
  focused: boolean
  active: boolean
  route: string
  clientSentAt?: string | null
}): Promise<ActionResult<{ creditedSeconds: number; totalSeconds: number; flags: string[] }>> {
  try {
    const user = await requireCurrentUser()
    const enrollment = await getUserEnrollment(user.id, input.courseId)
    if (!isEnrollmentActive(enrollment)) return { success: false, error: 'Your course access is not active' }

    const supabase = await getServiceSupabase()
    const { data: session } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('id', input.sessionId)
      .eq('user_id', user.id)
      .eq('course_id', input.courseId)
      .maybeSingle()
    if (!session) return { success: false, error: 'Learning session not found' }

    const now = new Date()
    const flags: string[] = []
    const last = session.last_heartbeat_at ? new Date(session.last_heartbeat_at) : new Date(session.started_at)
    let elapsed = Math.max(0, Math.floor((now.getTime() - last.getTime()) / 1000))
    if (elapsed > 90) flags.push('heartbeat_gap_capped')
    elapsed = Math.min(elapsed, 60)
    if (!input.visible) flags.push('tab_hidden')
    if (!input.focused) flags.push('window_unfocused')
    if (!input.active) flags.push('inactive')
    if (!input.route.includes(`/course/${input.courseId}/learn`)) flags.push('non_learning_route')
    const creditedSeconds = flags.length ? 0 : elapsed
    const suspicious = flags.includes('heartbeat_gap_capped') || flags.includes('non_learning_route')

    const { error: heartbeatError } = await supabase.from('learning_heartbeats').insert({
      session_id: input.sessionId,
      user_id: user.id,
      course_id: input.courseId,
      lesson_id: input.lessonId ?? null,
      heartbeat_id: input.heartbeatId,
      client_sent_at: input.clientSentAt ?? null,
      credited_seconds: creditedSeconds,
      visible: input.visible,
      focused: input.focused,
      active: input.active,
      route: input.route,
      validation_flags: flags,
      suspicious,
    } as never)
    if (heartbeatError) {
      if (heartbeatError.code === '23505') return { success: false, error: 'Duplicate heartbeat ignored' }
      return { success: false, error: heartbeatError.message }
    }

    const totalSeconds = Number(session.credited_seconds ?? 0) + creditedSeconds
    await supabase
      .from('learning_sessions')
      .update({
        last_heartbeat_at: now.toISOString(),
        credited_seconds: totalSeconds,
        status: suspicious ? 'flagged' : 'active',
        suspicious,
        validation_flags: Array.from(new Set([...(session.validation_flags ?? []), ...flags])),
      } as never)
      .eq('id', input.sessionId)

    if (input.lessonId && creditedSeconds > 0) {
      const { data: existing } = await supabase
        .from('lesson_time_totals')
        .select('id, approved_seconds')
        .eq('user_id', user.id)
        .eq('course_id', input.courseId)
        .eq('lesson_id', input.lessonId)
        .maybeSingle()
      await supabase.from('lesson_time_totals').upsert(
        {
          id: existing?.id,
          user_id: user.id,
          course_id: input.courseId,
          lesson_id: input.lessonId,
          approved_seconds: Number(existing?.approved_seconds ?? 0) + creditedSeconds,
          last_activity_at: now.toISOString(),
          updated_at: now.toISOString(),
        } as never,
        { onConflict: 'user_id,course_id,lesson_id' },
      )
    }

    const course = await getCourseById(input.courseId)
    if (course && creditedSeconds > 0) await evaluateCourseCompletion(course, user.id)

    return { success: true, data: { creditedSeconds, totalSeconds, flags } }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to record learning time.') }
  }
}

function parseOfflineMinutes(activityDate: string, startTime: string, endTime: string) {
  const start = new Date(`${activityDate}T${startTime}`)
  const end = new Date(`${activityDate}T${endTime}`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error('End time must be later than start time')
  }
  if (start > new Date()) throw new Error('Future offline activities cannot be submitted')
  return Math.round((end.getTime() - start.getTime()) / 60_000)
}

export async function submitOfflineActivityAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireCurrentUser()
    const courseId = String(formData.get('course_id') ?? '')
    const activityDate = String(formData.get('activity_date') ?? '')
    const startTime = String(formData.get('start_time') ?? '')
    const endTime = String(formData.get('end_time') ?? '')
    const activityType = String(formData.get('activity_type') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const status = formData.get('save_draft') === 'on' ? 'draft' : 'submitted'
    const evidenceFile = formData.get('evidence_file') as File | null
    const evidence = evidenceFile && evidenceFile.size > 0 ? evidenceFile : null
    if (!courseId || !activityDate || !startTime || !endTime || !activityType) {
      return { success: false, error: 'Fill the offline activity details' }
    }

    const enrollment = await getUserEnrollment(user.id, courseId)
    if (!isEnrollmentActive(enrollment)) return { success: false, error: 'Your course access is not active' }

    const course = await getCourseById(courseId)
    const claimedMinutes = parseOfflineMinutes(activityDate, startTime, endTime)
    const maxEntry = Number(course?.max_offline_entry_minutes ?? 360)
    if (claimedMinutes > maxEntry) return { success: false, error: `One entry cannot exceed ${maxEntry} minutes` }
    if (course?.offline_evidence_required && !evidence) {
      return { success: false, error: 'Upload evidence for this offline activity' }
    }

    const supabase = await getServiceSupabase()
    const { data: overlaps } = await supabase
      .from('offline_activity_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('activity_date', activityDate)
      .neq('status', 'rejected')
    if ((overlaps ?? []).length > 0) {
      return { success: false, error: 'Check existing entries for this date before adding another activity' }
    }

    const uploadedEvidence = evidence
      ? await uploadLmsFile(LMS_BUCKETS.offlineEvidence, evidence, `${user.id}/${courseId}/offline`, {
          maxBytes: 50 * 1024 * 1024,
        })
      : null

    const { data: entry, error } = await supabase.from('offline_activity_entries').insert({
      user_id: user.id,
      course_id: courseId,
      activity_date: activityDate,
      start_time: startTime,
      end_time: endTime,
      claimed_minutes: claimedMinutes,
      activity_type: activityType,
      description,
      student_declaration: formData.get('student_declaration') === 'on',
      status,
      submitted_at: status === 'submitted' ? new Date().toISOString() : null,
    } as never).select('id').single()
    if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }

    if (uploadedEvidence && entry?.id) {
      const { error: fileError } = await supabase.from('offline_activity_files').insert({
        entry_id: entry.id,
        storage_bucket: uploadedEvidence.bucket,
        storage_path: uploadedEvidence.path,
        original_filename: uploadedEvidence.filename,
        mime_type: uploadedEvidence.mimeType,
        file_size_bytes: uploadedEvidence.sizeBytes,
      } as never)
      if (fileError) return { success: false, error: friendlyErrorMessage(fileError, 'The evidence file could not be attached.') }
    }

    revalidatePath('/dashboard/my-courses')
    revalidatePath(`/course/${courseId}/learn`)
    return { success: true }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to submit offline activity.') }
  }
}

export async function reviewOfflineActivityAction(
  entryId: string,
  approvedMinutes: number,
  status: 'approved' | 'partially_approved' | 'rejected',
  notes = ''
): Promise<ActionResult> {
  try {
    const admin = await import('@/lib/auth').then((mod) => mod.requireAdmin())
    const supabase = await getServiceSupabase()
    const { data: entry } = await supabase.from('offline_activity_entries').select('*').eq('id', entryId).maybeSingle()
    if (!entry) return { success: false, error: 'Offline entry not found' }

    const minutes = status === 'rejected' ? 0 : Math.min(Math.max(0, approvedMinutes), Number(entry.claimed_minutes ?? 0))
    const { error } = await supabase
      .from('offline_activity_entries')
      .update({
        status,
        approved_minutes: minutes,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        adjustment_reason: notes,
      } as never)
      .eq('id', entryId)
    if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }

    await supabase.from('offline_activity_reviews').insert({
      entry_id: entryId,
      reviewer_id: admin.id,
      previous_status: entry.status,
      new_status: status,
      approved_minutes: minutes,
      notes,
    } as never)

    const course = await getCourseById(entry.course_id)
    if (course) await evaluateCourseCompletion(course, entry.user_id)

    revalidatePath('/admin/lms-reports')
    revalidatePath('/dashboard/my-courses')
    return { success: true }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to review offline activity.') }
  }
}

async function issueCourseCertificateForUser({
  supabase,
  course,
  userId,
  userEmail,
  source = 'Certificate generated',
}: {
  supabase: Awaited<ReturnType<typeof getServiceSupabase>>
  course: Course
  userId: string
  userEmail?: string | null
  source?: string
}): Promise<ActionResult<{ created: boolean }>> {
  const checklist = await evaluateCourseCompletion(course, userId)
  if (!checklist.eligible) {
    return { success: false, error: 'Complete all enabled course requirements before requesting a certificate' }
  }

  const [{ data: profile }, { data: existing }, { data: completion }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .neq('status', 'revoked')
      .maybeSingle(),
    supabase
      .from('course_completion_status')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', course.id)
      .maybeSingle(),
  ])

  if (existing) return { success: true, data: { created: false } }

  const profileRow = profile as Profile | null
  const certificateNumber = `PC-${new Date().getFullYear()}-${course.id.slice(0, 4).toUpperCase()}-${userId.slice(0, 6).toUpperCase()}`
  const verificationCode = crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()
  const verificationUrl = `${appBaseUrl()}/certificates/verify/${verificationCode}`
  const studentName = profileRow?.full_name || profileRow?.email || userEmail || 'Phonics Club Student'
  const pdfBytes = await buildCertificatePdf({
    certificateNumber,
    studentName,
    course,
    issuedAt: new Date(),
    onlineMinutes: checklist.online.minutes,
    offlineMinutes: checklist.offline.minutes,
    finalScore: checklist.quiz.score,
    verificationUrl,
  })
  const pdfPath = `${course.id}/${userId}/${certificateNumber.toLowerCase()}.pdf`
  const { error: uploadError } = await supabase.storage
    .from(LMS_BUCKETS.generatedCertificates)
    .upload(pdfPath, Buffer.from(pdfBytes), { contentType: 'application/pdf', upsert: false })
  if (uploadError) return { success: false, error: uploadError.message }

  const { error } = await supabase.from('certificates').insert({
    user_id: userId,
    course_id: course.id,
    certificate_number: certificateNumber,
    student_name: studentName,
    course_title: course.title,
    instructor_name: course.instructor,
    completion_status_id: completion?.id ?? null,
    online_minutes: checklist.online.minutes,
    offline_minutes: checklist.offline.minutes,
    final_score: checklist.quiz.score,
    verification_code: verificationCode,
    verification_url: verificationUrl,
    pdf_bucket: LMS_BUCKETS.generatedCertificates,
    pdf_path: pdfPath,
    status: 'issued',
  } as never)

  if (error) return { success: false, error: friendlyErrorMessage(error, 'Certificate request could not be saved.') }

  const studentEmail = firstString(profileRow?.email, userEmail)
  if (studentEmail) {
    try {
      await sendCourseCertificateIssuedEmail({
        to: studentEmail,
        studentName,
        course,
        certificateNumber,
        verificationUrl,
        pdfBytes,
      })
    } catch (emailError) {
      console.error('[Certificate request] Student certificate email failed', {
        courseId: course.id,
        userId,
        error: emailError,
      })
    }
  }

  await notifyAdminOfCertificateRequest({
    course,
    student: {
      id: userId,
      name: studentName,
      email: studentEmail,
    },
    amount: courseRequiresCertificatePayment(course) ? getCourseCertificatePrice(course) : 0,
    currency: course.currency ?? 'PKR',
    status: 'certificate_issued',
    source,
    requestedAt: new Date(),
  })

  return { success: true, data: { created: true } }
}

export async function requestCertificateAction(courseId: string): Promise<ActionResult> {
  try {
    const user = await requireCurrentUser()
    const course = await getCourseById(courseId)
    const enrollment = await getUserEnrollment(user.id, courseId)
    if (!course) return { success: false, error: 'Course not found' }
    if (!isEnrollmentActive(enrollment)) return { success: false, error: 'Your course access is not active' }

    const checklist = await evaluateCourseCompletion(course, user.id)
    if (!checklist.eligible) return { success: false, error: 'Complete all enabled course requirements before requesting a certificate' }
    if (courseRequiresCertificatePayment(course)) {
      const certificatePayment = await getUserCertificatePayment(user.id, courseId)
      if (!isCertificatePaymentPaid(certificatePayment)) {
        return { success: false, error: 'Certificate payment must be approved before requesting this certificate' }
      }
    }

    const supabase = await getServiceSupabase()
    const issueResult = await issueCourseCertificateForUser({
      supabase,
      course: course as Course,
      userId: user.id,
      userEmail: user.email,
      source: 'Certificate requested by learner',
    })
    if (!issueResult.success) return { success: false, error: issueResult.error }

    revalidatePath(`/course/${courseId}/certificate`)
    revalidatePath('/dashboard/my-courses')
    return { success: true }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to request certificate.') }
  }
}

export async function saveCourseReviewAction(courseId: string, formData: FormData): Promise<void> {
  const user = await requireCurrentUser()
  const enrollment = await getUserEnrollment(user.id, courseId)
  if (!enrollment) throw new Error('Only enrolled students can review this course')

  const rating = Number(formData.get('rating'))
  const comment = String(formData.get('comment') ?? '').trim()
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Choose a rating from 1 to 5')

  const supabase = await getServiceSupabase()
  const { error } = await supabase.from('course_reviews').upsert(
    {
      course_id: courseId,
      user_id: user.id,
      rating,
      comment,
    } as never,
    { onConflict: 'course_id,user_id' },
  )
  if (error) throw toError(error, 'Course review could not be saved.')
  revalidatePath('/courses')
}
