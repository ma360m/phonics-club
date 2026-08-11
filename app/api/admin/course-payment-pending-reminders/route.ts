import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile, isAdminRole } from '@/lib/auth'
import {
  getCoursePaymentRegistrationExpiry,
  getCoursePaymentWorkflowStatus,
  isCoursePaymentPendingReminderEligible,
} from '@/lib/course-payment-workflow'
import { sendCoursePaymentPendingReminderEmail } from '@/lib/email/send-course-license-email'
import type { Course } from '@/types/database'

const DAY_MS = 86_400_000
const REMINDER_SUBJECT = 'Action Required: Complete Your Course Registration'

async function authorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  const profile = await getProfile()
  return isAdminRole(profile?.role)
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const clean = String(value ?? '').trim()
    if (clean) return clean
  }
  return ''
}

export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: 'Admin or CRON_SECRET authorization is required.' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const now = new Date()
  const cutoff = new Date(now.getTime() - 2 * DAY_MS)
  const url = new URL(request.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 100), 1), 250)

  const { data: payments, error } = await supabase
    .from('course_payments')
    .select('*, courses(*), profiles(full_name, email)')
    .eq('status', 'pending')
    .is('receipt_path', null)
    .is('receipt_url', null)
    .is('submitted_at', null)
    .is('verified_at', null)
    .is('payment_pending_reminder_sent_at', null)
    .lte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let queued = 0
  let sent = 0
  let skipped = 0
  let failed = 0
  let expiredMarked = 0

  for (const payment of payments ?? []) {
    const workflowStatus = getCoursePaymentWorkflowStatus(payment)
    const requestExpiry = getCoursePaymentRegistrationExpiry(payment)
    const course = payment.courses as Course | null
    const profile = payment.profiles as { full_name?: string | null; email?: string | null } | null
    const metadata = payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)
      ? payment.metadata as Record<string, unknown>
      : {}
    const recipientEmail = firstText(profile?.email, metadata.studentEmail, metadata.student_email, metadata.customerEmail, metadata.email)
    const studentName = firstText(profile?.full_name, metadata.studentName, metadata.student_name, metadata.customerName, recipientEmail)

    if (workflowStatus !== payment.payment_workflow_status) {
      await supabase
        .from('course_payments')
        .update({ payment_workflow_status: workflowStatus } as never)
        .eq('id', payment.id)
    }

    const reminderEligible = isCoursePaymentPendingReminderEligible(payment, now) && workflowStatus === 'pending_payment'
    const registrationExpiredAt = requestExpiry.getTime() <= now.getTime()
      ? payment.registration_expired_at ?? requestExpiry.toISOString()
      : payment.registration_expired_at ?? null

    if (!reminderEligible) {
      skipped += 1
      continue
    }

    if (registrationExpiredAt && !payment.registration_expired_at) {
      const { error: expiryUpdateError } = await supabase
        .from('course_payments')
        .update({
          payment_workflow_status: 'pending_payment',
          registration_expires_at: payment.registration_expires_at ?? requestExpiry.toISOString(),
          registration_expired_at: registrationExpiredAt,
        } as never)
        .eq('id', payment.id)

      if (!expiryUpdateError) expiredMarked += 1
    }

    if (!course || !recipientEmail) {
      skipped += 1
      continue
    }

    const dedupeKey = `course-payment:${payment.id}:pending-payment-reminder`
    const { data: event, error: eventError } = await supabase
      .from('notification_events')
      .insert({
        user_id: payment.user_id,
        course_id: payment.course_id,
        event_type: 'course_payment_pending_reminder',
        dedupe_key: dedupeKey,
        recipient_email: recipientEmail,
        subject: REMINDER_SUBJECT,
        payload: {
          paymentId: payment.id,
          enrollmentId: payment.enrollment_id ?? null,
          amount: Number(payment.amount ?? 0),
          currency: payment.currency ?? 'PKR',
          requestExpiry: requestExpiry.toISOString(),
          workflowStatus,
        },
      } as never)
      .select('id')
      .single()

    if (eventError) {
      if (eventError.code === '23505') skipped += 1
      else failed += 1
      continue
    }

    queued += 1
    const emailResult = await sendCoursePaymentPendingReminderEmail({
      to: recipientEmail,
      studentName,
      course,
      paymentId: payment.id,
      amount: Number(payment.amount ?? 0),
      currency: payment.currency ?? 'PKR',
      requestExpiry,
    })
    const provider = emailResult.result.provider ?? 'smtp'
    const skippedSend = provider === 'log' && !emailResult.sent
    const eventStatus = emailResult.sent ? 'sent' : skippedSend ? 'skipped' : 'failed'
    const sentAt = emailResult.sent ? new Date().toISOString() : null

    if (emailResult.sent) sent += 1
    else if (skippedSend) skipped += 1
    else failed += 1

    await supabase
      .from('notification_events')
      .update({
        status: eventStatus,
        provider,
        sent_at: sentAt,
        payload: {
          paymentId: payment.id,
          enrollmentId: payment.enrollment_id ?? null,
          amount: Number(payment.amount ?? 0),
          currency: payment.currency ?? 'PKR',
          requestExpiry: requestExpiry.toISOString(),
          workflowStatus,
          emailResponse: emailResult.result.responseText ?? String(emailResult.result.error ?? ''),
          emailStatus: emailResult.result.status ?? null,
        },
      } as never)
      .eq('id', event.id)

    if (emailResult.sent) {
      const { error: paymentUpdateError } = await supabase
        .from('course_payments')
        .update({
          payment_workflow_status: 'pending_payment',
          payment_pending_reminder_sent_at: sentAt,
          payment_pending_reminder_event_id: event.id,
          registration_expires_at: payment.registration_expires_at ?? requestExpiry.toISOString(),
          registration_expired_at: registrationExpiredAt,
        } as never)
        .eq('id', payment.id)

      await supabase.from('course_payment_events').insert({
        payment_id: payment.id,
        course_id: payment.course_id,
        user_id: payment.user_id,
        previous_status: payment.status,
        new_status: payment.status,
        event_type: 'payment_pending_reminder_sent',
        payload: {
          notificationEventId: event.id,
          requestExpiry: requestExpiry.toISOString(),
          registrationExpired: Boolean(registrationExpiredAt),
        },
      } as never)
    }
  }

  return NextResponse.json({ queued, sent, skipped, failed, expiredMarked })
}

export async function GET(request: Request) {
  return POST(request)
}
