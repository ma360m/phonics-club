import { APP_URL } from '@/lib/constants'
import { COMPANY } from '@/lib/company'
import { sendTransactionalEmail } from '@/lib/email/mailer'
import { formatPrice } from '@/utils/format'

type CourseEnrollmentStatus = 'active' | 'pending' | string

interface CourseEnrollmentAdminEmailInput {
  course: {
    id: string
    title: string
    slug?: string | null
    price?: number | string | null
    discounted_price?: number | string | null
    currency?: string | null
  }
  enrollmentId?: string | null
  paymentId?: string | null
  student: {
    id: string
    name?: string | null
    email?: string | null
  }
  status: CourseEnrollmentStatus
  paymentStatus?: string | null
  amount?: number | string | null
  currency?: string | null
  source?: string | null
  enrolledAt?: Date | string | null
}

interface CourseCompletionEmailChecklist {
  lessons: { completed: number; required: number; satisfied: boolean }
  online: { minutes: number; required: number; satisfied: boolean }
  offline: { minutes: number; required: number; satisfied: boolean }
  quiz: { score: number | null; required: number; satisfied: boolean }
  assignments: { passed: number; required: number; satisfied: boolean }
  activeAccess: { expiresAt: string | null; satisfied: boolean }
  eligible: boolean
  completed: boolean
  progress: number
}

interface CourseCompletionAdminEmailInput {
  course: CourseEnrollmentAdminEmailInput['course']
  enrollmentId?: string | null
  student: CourseEnrollmentAdminEmailInput['student']
  checklist: CourseCompletionEmailChecklist
  completedAt?: Date | string | null
  source?: string | null
}

function baseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  return APP_URL
}

function adminEmailRecipients() {
  const configured = (
    process.env.COURSE_ENROLLMENT_ADMIN_EMAIL ||
    process.env.ORDER_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    COMPANY.adminEmail
  )
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)

  return [...new Set(configured)]
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function detailRow(label: string, value: unknown) {
  return `
    <tr>
      <td style="border-bottom:1px solid #e5e7eb;color:#64748b;font-size:13px;padding:11px 0;">${escapeHtml(label)}</td>
      <td align="right" style="border-bottom:1px solid #e5e7eb;color:#0f172a;font-size:14px;font-weight:700;padding:11px 0;">${escapeHtml(value || 'Not provided')}</td>
    </tr>
  `
}

function formatDateTime(value?: Date | string | null) {
  const date = value ? new Date(value) : new Date()
  return date.toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Karachi',
  })
}

function moneyLabel(input: CourseEnrollmentAdminEmailInput) {
  const amount = Number(input.amount ?? input.course.discounted_price ?? input.course.price ?? 0)
  return formatPrice(Number.isFinite(amount) ? amount : 0, input.currency ?? input.course.currency ?? 'PKR')
}

export async function sendCourseEnrollmentAdminEmail(input: CourseEnrollmentAdminEmailInput) {
  const to = adminEmailRecipients()
  if (!to.length) return { sent: false, reason: 'No admin email configured.' }

  const from =
    process.env.COURSE_ENROLLMENT_EMAIL_FROM?.trim() ||
    process.env.ORDER_EMAIL_FROM?.trim() ||
    process.env.COURSE_LICENSE_EMAIL_FROM?.trim() ||
    'Phonics Club <info@phonicsclub.com>'
  const adminCourseUrl = `${baseUrl()}/admin/courses/${input.course.id}`
  const courseUrl = input.course.slug ? `${baseUrl()}/courses/${input.course.slug}` : `${baseUrl()}/course/${input.course.id}/learn`
  const studentName = input.student.name?.trim() || 'Student'
  const statusLabel = input.status.replace(/_/g, ' ')
  const paymentStatusLabel = input.paymentStatus?.replace(/_/g, ' ') || (input.status === 'active' ? 'free' : 'pending')

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>New course enrollment</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f6fb;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;width:100%;">
          <tr>
            <td align="center" style="padding:28px 14px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
                <tr>
                  <td style="background:#0f172a;color:#ffffff;padding:30px;">
                    <p style="font-size:13px;font-weight:800;letter-spacing:.08em;margin:0 0 14px;text-transform:uppercase;">Course enrollment</p>
                    <h1 style="font-size:28px;line-height:1.2;margin:0 0 10px;">${escapeHtml(studentName)} enrolled in a course</h1>
                    <p style="color:#dbeafe;font-size:15px;line-height:1.6;margin:0;">${escapeHtml(input.course.title)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
                      ${detailRow('Student name', studentName)}
                      ${detailRow('Student email', input.student.email)}
                      ${detailRow('Course', input.course.title)}
                      ${detailRow('Enrollment status', statusLabel)}
                      ${detailRow('Payment status', paymentStatusLabel)}
                      ${detailRow('Amount', moneyLabel(input))}
                      ${detailRow('Source', input.source || 'Website')}
                      ${detailRow('Enrolled at', formatDateTime(input.enrolledAt))}
                      ${input.enrollmentId ? detailRow('Enrollment ID', input.enrollmentId) : ''}
                      ${input.paymentId ? detailRow('Payment ID', input.paymentId) : ''}
                    </table>
                    <p style="margin:0 0 18px;">
                      <a href="${escapeHtml(adminCourseUrl)}" style="display:inline-block;border-radius:10px;background:#1D4ED8;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none;padding:14px 20px;">Open Admin Course</a>
                    </p>
                    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0;">
                      Public course page: <a href="${escapeHtml(courseUrl)}" style="color:#1D4ED8;font-weight:700;text-decoration:none;">${escapeHtml(courseUrl)}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  const result = await sendTransactionalEmail({
    from,
    to,
    subject: `New course enrollment - ${input.course.title}`,
    html,
  })

  return { sent: result.ok, result, from, to }
}

export async function notifyAdminOfCourseEnrollment(input: CourseEnrollmentAdminEmailInput) {
  try {
    return await sendCourseEnrollmentAdminEmail(input)
  } catch (error) {
    console.error('[Course enrollment] Admin email failed', {
      courseId: input.course.id,
      enrollmentId: input.enrollmentId,
      userId: input.student.id,
      error,
    })
    return { sent: false, error }
  }
}

function completionCheck(value: boolean) {
  return value ? 'Satisfied' : 'Required'
}

function quizScoreLabel(checklist: CourseCompletionEmailChecklist) {
  return checklist.quiz.score === null
    ? `Pending / ${checklist.quiz.required}% required`
    : `${checklist.quiz.score}% / ${checklist.quiz.required}% required`
}

export async function sendCourseCompletionAdminEmail(input: CourseCompletionAdminEmailInput) {
  const to = adminEmailRecipients()
  if (!to.length) return { sent: false, reason: 'No admin email configured.' }

  const from =
    process.env.COURSE_COMPLETION_EMAIL_FROM?.trim() ||
    process.env.COURSE_ENROLLMENT_EMAIL_FROM?.trim() ||
    process.env.COURSE_LICENSE_EMAIL_FROM?.trim() ||
    'Phonics Club <noreply@phonicsclub.com>'
  const adminCourseUrl = `${baseUrl()}/admin/courses/${input.course.id}`
  const certificateUrl = `${baseUrl()}/course/${input.course.id}/certificate?preview=admin`
  const studentName = input.student.name?.trim() || 'Student'

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Course completed</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f6fb;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;width:100%;">
          <tr>
            <td align="center" style="padding:28px 14px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
                <tr>
                  <td style="background:#0f172a;color:#ffffff;padding:30px;">
                    <p style="font-size:13px;font-weight:800;letter-spacing:.08em;margin:0 0 14px;text-transform:uppercase;">Course completion</p>
                    <h1 style="font-size:28px;line-height:1.2;margin:0 0 10px;">${escapeHtml(studentName)} completed a course</h1>
                    <p style="color:#dbeafe;font-size:15px;line-height:1.6;margin:0;">${escapeHtml(input.course.title)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
                      ${detailRow('Student name', studentName)}
                      ${detailRow('Student email', input.student.email)}
                      ${detailRow('Course', input.course.title)}
                      ${detailRow('Completed at', formatDateTime(input.completedAt))}
                      ${detailRow('Progress', `${input.checklist.progress}%`)}
                      ${detailRow('Lessons', `${input.checklist.lessons.completed}/${input.checklist.lessons.required} - ${completionCheck(input.checklist.lessons.satisfied)}`)}
                      ${detailRow('Online minutes', `${input.checklist.online.minutes}/${input.checklist.online.required} - ${completionCheck(input.checklist.online.satisfied)}`)}
                      ${detailRow('Offline minutes', `${input.checklist.offline.minutes}/${input.checklist.offline.required} - ${completionCheck(input.checklist.offline.satisfied)}`)}
                      ${detailRow('Quiz score', `${quizScoreLabel(input.checklist)} - ${completionCheck(input.checklist.quiz.satisfied)}`)}
                      ${detailRow('Assignments', `${input.checklist.assignments.passed}/${input.checklist.assignments.required} - ${completionCheck(input.checklist.assignments.satisfied)}`)}
                      ${detailRow('Active access', completionCheck(input.checklist.activeAccess.satisfied))}
                      ${detailRow('Certificate eligible', input.checklist.eligible ? 'Yes' : 'No')}
                      ${detailRow('Source', input.source || 'Course completion evaluator')}
                      ${input.enrollmentId ? detailRow('Enrollment ID', input.enrollmentId) : ''}
                    </table>
                    <p style="margin:0 0 18px;">
                      <a href="${escapeHtml(adminCourseUrl)}" style="display:inline-block;border-radius:10px;background:#1D4ED8;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none;padding:14px 20px;">Open Admin Course</a>
                    </p>
                    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0;">
                      Certificate page: <a href="${escapeHtml(certificateUrl)}" style="color:#1D4ED8;font-weight:700;text-decoration:none;">${escapeHtml(certificateUrl)}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  const result = await sendTransactionalEmail({
    from,
    to,
    subject: `Course completed - ${input.course.title}`,
    html,
  })

  return { sent: result.ok, result, from, to }
}

export async function notifyAdminOfCourseCompletion(input: CourseCompletionAdminEmailInput) {
  try {
    return await sendCourseCompletionAdminEmail(input)
  } catch (error) {
    console.error('[Course completion] Admin email failed', {
      courseId: input.course.id,
      enrollmentId: input.enrollmentId,
      userId: input.student.id,
      error,
    })
    return { sent: false, error }
  }
}
