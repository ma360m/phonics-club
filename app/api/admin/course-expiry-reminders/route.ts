import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile, isAdminRole } from '@/lib/auth'
import { COMPANY } from '@/lib/company'
import { APP_URL } from '@/lib/constants'
import { DEFAULT_TRANSACTIONAL_EMAIL_FROM, sendTransactionalEmail } from '@/lib/email/mailer'

const DAY_MS = 86_400_000

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : APP_URL)
  ).replace(/\/$/, '')
}

function weekKey(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1)
  const day = Math.floor((date.getTime() - start.getTime()) / DAY_MS)
  return `${date.getFullYear()}-w${Math.ceil((day + start.getDay() + 1) / 7)}`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function sendReminderEmail(input: {
  to: string
  subject: string
  studentName: string
  courseTitle: string
  body: string
  courseUrl: string
}) {
  const from = process.env.ORDER_EMAIL_FROM?.trim() || DEFAULT_TRANSACTIONAL_EMAIL_FROM
  const result = await sendTransactionalEmail({
    from,
    to: [input.to],
    subject: input.subject,
    html: `
        <div style="margin:0;background:#f8fafc;padding:28px;font-family:Arial,sans-serif;color:#0f172a">
          <div style="margin:0 auto;max-width:640px;border:1px solid #dbeafe;border-radius:18px;background:#fff;overflow:hidden">
            <div style="background:#1D4ED8;padding:22px;color:#fff">
              <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Phonics Club LMS</p>
              <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3">${escapeHtml(input.subject)}</h1>
            </div>
            <div style="padding:24px">
              <p style="margin:0 0 12px">Dear ${escapeHtml(input.studentName)},</p>
              <p style="margin:0 0 16px;line-height:1.7">${escapeHtml(input.body)}</p>
              <p style="margin:0 0 18px"><strong>Course:</strong> ${escapeHtml(input.courseTitle)}</p>
              <a href="${input.courseUrl}" style="display:inline-block;border-radius:12px;background:#1D4ED8;color:#fff;padding:12px 18px;text-decoration:none;font-weight:700">Open Course</a>
            </div>
            <div style="border-top:1px solid #e2e8f0;background:#f8fafc;padding:16px 24px;font-size:12px;color:#64748b">
              ${escapeHtml(COMPANY.name)} - ${escapeHtml(COMPANY.email)}
            </div>
          </div>
        </div>
      `,
  })
  return { ok: result.ok, skipped: result.provider === 'log', detail: result.responseText ?? String(result.error ?? ''), status: result.status }
}

async function authorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  const profile = await getProfile()
  return isAdminRole(profile?.role)
}

export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: 'Admin or CRON_SECRET authorization is required.' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const now = new Date()
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select('*, courses(id, title, slug, access_duration_days, expiry_warning_days), profiles(full_name, email)')
    .in('status', ['active', 'completed'])
    .not('expires_at', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let queued = 0
  let sent = 0
  let skipped = 0
  let failed = 0

  for (const enrollment of enrollments ?? []) {
    const course = enrollment.courses as any
    const profile = enrollment.profiles as any
    if (!course || !profile?.email || !enrollment.expires_at) continue

    const expiresAt = new Date(enrollment.expires_at)
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS)
    const accessDays = Math.max(1, Number(course.access_duration_days ?? 90))
    const warningDays = new Set<number>([
      Math.ceil(accessDays / 2),
      3,
      ...((course.expiry_warning_days as number[] | null) ?? []),
    ])
    const candidates: Array<{ type: string; key: string; subject: string; body: string }> = []

    if (daysRemaining <= 0) {
      candidates.push({
        type: 'course_expired',
        key: 'expired',
        subject: `Course access expired: ${course.title}`,
        body: 'Your course access has expired. Your progress is preserved. Contact Phonics Club if you need an extension.',
      })
    } else if (warningDays.has(daysRemaining)) {
      candidates.push({
        type: 'course_expiry_warning',
        key: `${daysRemaining}-days`,
        subject: `${daysRemaining} day(s) left in your course`,
        body: `Your course access will expire in ${daysRemaining} day(s). Please continue your lessons and complete any required quizzes or activities.`,
      })
    }

    const activatedAt = enrollment.activated_at ? new Date(enrollment.activated_at) : null
    const lastAccessedAt = enrollment.last_accessed_at ? new Date(enrollment.last_accessed_at) : null
    const inactiveForWeek = activatedAt && !lastAccessedAt && now.getTime() - activatedAt.getTime() >= 7 * DAY_MS
    if (inactiveForWeek && daysRemaining > 3) {
      candidates.push({
        type: 'course_inactive_weekly',
        key: weekKey(now),
        subject: `Reminder to start: ${course.title}`,
        body: 'Your course is active but has not been started yet. Please open the course and begin before access expires.',
      })
    }

    for (const candidate of candidates) {
      const dedupeKey = `${enrollment.id}:${candidate.type}:${candidate.key}`
      const { data: event, error: eventError } = await supabase
        .from('notification_events')
        .insert({
          user_id: enrollment.user_id,
          course_id: enrollment.course_id,
          event_type: candidate.type,
          dedupe_key: dedupeKey,
          recipient_email: profile.email,
          subject: candidate.subject,
          payload: { enrollmentId: enrollment.id, daysRemaining, expiresAt: enrollment.expires_at },
        } as never)
        .select('id')
        .single()

      if (eventError) {
        if (eventError.code === '23505') skipped += 1
        else failed += 1
        continue
      }

      queued += 1
      const result = await sendReminderEmail({
        to: profile.email,
        subject: candidate.subject,
        studentName: profile.full_name ?? profile.email,
        courseTitle: course.title,
        body: candidate.body,
        courseUrl: `${baseUrl()}/course/${enrollment.course_id}/learn`,
      })

      if (result.ok) sent += 1
      else if (result.skipped) skipped += 1
      else failed += 1

      await supabase
        .from('notification_events')
        .update({
          status: result.ok ? 'sent' : result.skipped ? 'skipped' : 'failed',
          sent_at: result.ok ? new Date().toISOString() : null,
          payload: {
            enrollmentId: enrollment.id,
            daysRemaining,
            expiresAt: enrollment.expires_at,
            emailResponse: result.detail,
            status: result.status ?? null,
          },
        } as never)
        .eq('id', event.id)
    }
  }

  return NextResponse.json({ queued, sent, skipped, failed })
}

export async function GET(request: Request) {
  return POST(request)
}
