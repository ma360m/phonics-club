import { APP_URL } from '@/lib/constants'
import { COMPANY } from '@/lib/company'
import { DEFAULT_TRANSACTIONAL_EMAIL_FROM, sendTransactionalEmail } from '@/lib/email/mailer'
import { formatPrice } from '@/utils/format'
import type { Course } from '@/types/database'

interface CertificateRequestAdminEmailInput {
  course: Pick<Course, 'id' | 'title' | 'slug' | 'currency'>
  student: {
    id: string
    name?: string | null
    email?: string | null
  }
  amount?: number | string | null
  currency?: string | null
  paymentId?: string | null
  status?: string | null
  source?: string | null
  requestedAt?: Date | string | null
  checklist?: {
    lessons: { completed: number; required: number; satisfied: boolean }
    online: { minutes: number; required: number; satisfied: boolean }
    offline: { minutes: number; required: number; satisfied: boolean }
    quiz: { score: number | null; required: number; satisfied: boolean }
    assignments: { passed: number; required: number; satisfied: boolean }
    activeAccess: { expiresAt: string | null; satisfied: boolean }
    eligible: boolean
    completed: boolean
    progress: number
  } | null
}

function baseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  return APP_URL
}

function adminEmailRecipients() {
  const configured = (
    process.env.CERTIFICATE_REQUEST_ADMIN_EMAIL ||
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

function completionCheck(value: boolean) {
  return value ? 'Satisfied' : 'Required'
}

function quizScoreLabel(checklist: NonNullable<CertificateRequestAdminEmailInput['checklist']>) {
  return checklist.quiz.score === null
    ? `Pending / ${checklist.quiz.required}% required`
    : `${checklist.quiz.score}% / ${checklist.quiz.required}% required`
}

export async function sendCertificateRequestAdminEmail(input: CertificateRequestAdminEmailInput) {
  const to = adminEmailRecipients()
  if (!to.length) return { sent: false, reason: 'No admin email configured.' }

  const from =
    process.env.CERTIFICATE_REQUEST_EMAIL_FROM?.trim() ||
    process.env.ORDER_EMAIL_FROM?.trim() ||
    process.env.COURSE_LICENSE_EMAIL_FROM?.trim() ||
    DEFAULT_TRANSACTIONAL_EMAIL_FROM
  const studentName = input.student.name?.trim() || 'Student'
  const amount = Number(input.amount ?? 0)
  const amountLabel = formatPrice(Number.isFinite(amount) ? amount : 0, input.currency ?? input.course.currency ?? 'PKR')
  const adminPaymentsUrl = `${baseUrl()}/admin/course-payments`
  const certificatePageUrl = `${baseUrl()}/course/${input.course.id}/certificate?preview=admin`
  const checklist = input.checklist ?? null
  const adminNextStep = amount > 0
    ? 'Review certificate payment status, confirm the paid amount, and use the course payment screen to approve or reject the certificate request.'
    : `Confirm the learner's full certificate name if needed, then issue or reissue the certificate. Customer support replies should come from ${COMPANY.adminEmail}.`

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Certificate requested</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f6fb;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;width:100%;">
          <tr>
            <td align="center" style="padding:28px 14px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
                <tr>
                  <td style="background:#0f172a;color:#ffffff;padding:30px;">
                    <p style="font-size:13px;font-weight:800;letter-spacing:.08em;margin:0 0 14px;text-transform:uppercase;">Certificate request</p>
                    <h1 style="font-size:28px;line-height:1.2;margin:0 0 10px;">${escapeHtml(studentName)} requested a certificate</h1>
                    <p style="color:#dbeafe;font-size:15px;line-height:1.6;margin:0;">${escapeHtml(input.course.title)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
                      ${detailRow('Student name', studentName)}
                      ${detailRow('Student email', input.student.email)}
                      ${detailRow('Course', input.course.title)}
                      ${detailRow('Amount', amountLabel)}
                      ${detailRow('Status', input.status?.replace(/_/g, ' ') || 'Certificate requested')}
                      ${detailRow('Source', input.source || 'Website certificate page')}
                      ${detailRow('Requested at', formatDateTime(input.requestedAt))}
                      ${input.paymentId ? detailRow('Payment ID', input.paymentId) : ''}
                      ${checklist ? detailRow('Progress', `${checklist.progress}%`) : ''}
                      ${checklist ? detailRow('Lessons', `${checklist.lessons.completed}/${checklist.lessons.required} - ${completionCheck(checklist.lessons.satisfied)}`) : ''}
                      ${checklist ? detailRow('Online minutes', `${checklist.online.minutes}/${checklist.online.required} - ${completionCheck(checklist.online.satisfied)}`) : ''}
                      ${checklist ? detailRow('Offline minutes', `${checklist.offline.minutes}/${checklist.offline.required} - ${completionCheck(checklist.offline.satisfied)}`) : ''}
                      ${checklist ? detailRow('Quiz score', `${quizScoreLabel(checklist)} - ${completionCheck(checklist.quiz.satisfied)}`) : ''}
                      ${checklist ? detailRow('Assignments', `${checklist.assignments.passed}/${checklist.assignments.required} - ${completionCheck(checklist.assignments.satisfied)}`) : ''}
                      ${checklist ? detailRow('Certificate eligible', checklist.eligible ? 'Yes' : 'No') : ''}
                    </table>
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;color:#334155;font-size:14px;line-height:1.7;margin:0 0 22px;padding:16px;">
                      <strong>Admin next step:</strong><br />
                      ${escapeHtml(adminNextStep)}
                    </div>
                    <p style="margin:0 0 18px;">
                      <a href="${escapeHtml(adminPaymentsUrl)}" style="display:inline-block;border-radius:10px;background:#1D4ED8;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none;padding:14px 20px;">Open Course Payments</a>
                    </p>
                    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0;">
                      Certificate preview page: <a href="${escapeHtml(certificatePageUrl)}" style="color:#1D4ED8;font-weight:700;text-decoration:none;">${escapeHtml(certificatePageUrl)}</a>
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
    subject: `Certificate requested - ${input.course.title}`,
    html,
  })

  return { sent: result.ok, result, from, to }
}

export async function notifyAdminOfCertificateRequest(input: CertificateRequestAdminEmailInput) {
  try {
    return await sendCertificateRequestAdminEmail(input)
  } catch (error) {
    console.error('[Certificate request] Admin email failed', {
      courseId: input.course.id,
      paymentId: input.paymentId,
      userId: input.student.id,
      error,
    })
    return { sent: false, error }
  }
}
