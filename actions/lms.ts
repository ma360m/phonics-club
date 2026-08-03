'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import {
  evaluateCourseCompletion,
  getCourseById,
  getCoursePrice,
  getUserEnrollment,
  isEnrollmentActive,
} from '@/lib/lms'
import { buildCertificatePdf } from '@/lib/certificate-pdf'
import { getSignedCourseResourceUrl, LMS_BUCKETS, uploadLmsFile } from '@/lib/lms-storage'
import { friendlyErrorMessage, toError } from '@/lib/friendly-error'
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
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ).replace(/\/$/, '')
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
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
      revalidatePath('/dashboard/my-courses')
      revalidatePath(`/courses/${currentCourse.slug}`)
      return { success: true, data: { enrollmentId: enrollment.id, redirectTo: `/course/${courseId}/learn` } }
    }

    const idempotencyKey = `course:${courseId}:user:${user.id}:manual`
    const { data: payment, error: paymentError } = await supabase
      .from('course_payments')
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          amount: price,
          currency: currentCourse.currency ?? 'PKR',
          status: 'pending',
          payment_method: 'manual_bank_transfer',
          provider: 'manual',
          idempotency_key: idempotencyKey,
        } as never,
        { onConflict: 'idempotency_key' },
      )
      .select('*')
      .single()

    if (paymentError) return { success: false, error: paymentError.message }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          progress: 0,
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
    await supabase.from('course_payment_events').insert({
      payment_id: payment.id,
      course_id: courseId,
      user_id: user.id,
      new_status: payment.status,
      event_type: 'checkout_created',
      payload: { amount: price, currency: currentCourse.currency ?? 'PKR' },
    } as never)

    revalidatePath('/dashboard/my-courses')
    return { success: true, data: { paymentId: payment.id, enrollmentId: enrollment.id, redirectTo: '/dashboard/my-courses?tab=payments' } }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to start checkout.') }
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
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!payment) return { success: false, error: 'Payment not found' }
    if (!['pending', 'processing', 'submitted', 'rejected'].includes(payment.status)) {
      return { success: false, error: 'This payment can no longer be updated' }
    }

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
      } as never)
      .eq('id', paymentId)
    if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }

    await supabase.from('course_payment_events').insert({
      payment_id: paymentId,
      course_id: payment.course_id,
      user_id: user.id,
      previous_status: payment.status,
      new_status: 'submitted',
      event_type: 'manual_receipt_submitted',
      payload: { transactionReference, receiptPath: uploaded.path },
    } as never)

    revalidatePath('/dashboard/my-courses')
    return { success: true }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to submit receipt.') }
  }
}

export async function approveCoursePaymentAction(paymentId: string): Promise<ActionResult> {
  try {
    const admin = await import('@/lib/auth').then((mod) => mod.requireAdmin())
    const supabase = await getServiceSupabase()
    const { data: payment } = await supabase.from('course_payments').select('*, courses(*)').eq('id', paymentId).maybeSingle()
    if (!payment) return { success: false, error: 'Payment not found' }
    if (payment.status === 'paid') return { success: true }

    const course = payment.courses as Course
    const now = new Date()
    const expiresAt = addDays(now, Number(course.access_duration_days ?? 90)).toISOString()

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .upsert(
        {
          user_id: payment.user_id,
          course_id: payment.course_id,
          progress: 0,
          status: 'active',
          payment_status: 'paid',
          payment_id: payment.id,
          purchase_date: now.toISOString(),
          activated_at: now.toISOString(),
          expires_at: expiresAt,
          last_accessed_at: now.toISOString(),
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
      } as never)
      .eq('id', paymentId)
    if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }

    await supabase.from('course_payment_events').insert({
      payment_id: paymentId,
      course_id: payment.course_id,
      user_id: payment.user_id,
      previous_status: payment.status,
      new_status: 'paid',
      event_type: 'manual_payment_approved',
      actor_id: admin.id,
    } as never)

    revalidatePath('/admin/course-payments')
    revalidatePath('/dashboard/my-courses')
    return { success: true }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Unable to approve payment.') }
  }
}

export async function rejectCoursePaymentAction(paymentId: string, reason: string): Promise<ActionResult> {
  try {
    const admin = await import('@/lib/auth').then((mod) => mod.requireAdmin())
    const supabase = await getServiceSupabase()
    const { data: payment } = await supabase.from('course_payments').select('*').eq('id', paymentId).maybeSingle()
    if (!payment) return { success: false, error: 'Payment not found' }

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

    await supabase
      .from('enrollments')
      .update({ status: 'pending', payment_status: 'rejected' } as never)
      .eq('payment_id', paymentId)

    await supabase.from('course_payment_events').insert({
      payment_id: paymentId,
      course_id: payment.course_id,
      user_id: payment.user_id,
      previous_status: payment.status,
      new_status: 'rejected',
      event_type: 'manual_payment_rejected',
      actor_id: admin.id,
      payload: { reason },
    } as never)

    revalidatePath('/admin/course-payments')
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
    if (!courseId || !activityDate || !startTime || !endTime || !activityType) {
      return { success: false, error: 'Fill the offline activity details' }
    }

    const enrollment = await getUserEnrollment(user.id, courseId)
    if (!isEnrollmentActive(enrollment)) return { success: false, error: 'Your course access is not active' }

    const course = await getCourseById(courseId)
    const claimedMinutes = parseOfflineMinutes(activityDate, startTime, endTime)
    const maxEntry = Number(course?.max_offline_entry_minutes ?? 360)
    if (claimedMinutes > maxEntry) return { success: false, error: `One entry cannot exceed ${maxEntry} minutes` }

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

    const { error } = await supabase.from('offline_activity_entries').insert({
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
    } as never)
    if (error) return { success: false, error: friendlyErrorMessage(error, 'The LMS request could not be saved.') }

    revalidatePath('/dashboard/my-courses')
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

export async function requestCertificateAction(courseId: string): Promise<ActionResult> {
  try {
    const user = await requireCurrentUser()
    const course = await getCourseById(courseId)
    const enrollment = await getUserEnrollment(user.id, courseId)
    if (!course) return { success: false, error: 'Course not found' }
    if (!isEnrollmentActive(enrollment)) return { success: false, error: 'Your course access is not active' }

    const checklist = await evaluateCourseCompletion(course, user.id)
    if (!checklist.eligible) return { success: false, error: 'Complete all enabled course requirements before requesting a certificate' }

    const supabase = await getServiceSupabase()
    const [{ data: profile }, { data: existing }, { data: completion }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .neq('status', 'revoked')
        .maybeSingle(),
      supabase
        .from('course_completion_status')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle(),
    ])

    if (existing) return { success: true }

    const profileRow = profile as Profile | null
    const certificateNumber = `PC-${new Date().getFullYear()}-${courseId.slice(0, 4).toUpperCase()}-${user.id.slice(0, 6).toUpperCase()}`
    const verificationCode = crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()
    const verificationUrl = `${appBaseUrl()}/certificates/verify/${verificationCode}`
    const studentName = profileRow?.full_name || profileRow?.email || user.email || 'Phonics Club Student'
    const pdfBytes = await buildCertificatePdf({
      certificateNumber,
      studentName,
      course: course as Course,
      issuedAt: new Date(),
      onlineMinutes: checklist.online.minutes,
      offlineMinutes: checklist.offline.minutes,
      finalScore: checklist.quiz.score,
      verificationUrl,
    })
    const pdfPath = `${courseId}/${user.id}/${certificateNumber.toLowerCase()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from(LMS_BUCKETS.generatedCertificates)
      .upload(pdfPath, Buffer.from(pdfBytes), { contentType: 'application/pdf', upsert: false })
    if (uploadError) return { success: false, error: uploadError.message }

    const { error } = await supabase.from('certificates').insert({
      user_id: user.id,
      course_id: courseId,
      certificate_number: certificateNumber,
      student_name: studentName,
      course_title: (course as Course).title,
      instructor_name: (course as Course).instructor,
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
