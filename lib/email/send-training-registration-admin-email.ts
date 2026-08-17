import { APP_URL } from '@/lib/constants'
import { COMPANY } from '@/lib/company'
import { sendTransactionalEmail } from '@/lib/email/mailer'

type TrainingType = 'online_webinar' | 'onsite_classroom' | string

interface TrainingRegistrationAdminEmailInput {
  registrationId?: string | null
  userId?: string | null
  trainingType: TrainingType
  eventTitle: string
  eventDate?: string | null
  preferredMonth?: string | null
  approxParticipants?: number | string | null
  fullName: string
  email: string
  phone?: string | null
  organization?: string | null
  message?: string | null
  source?: string | null
  requestedAt?: Date | string | null
}

function baseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  return APP_URL
}

function adminEmailRecipients() {
  const configured = (
    process.env.TRAINING_REGISTRATION_ADMIN_EMAIL ||
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
  if (Number.isNaN(date.getTime())) return 'Not provided'
  return date.toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Karachi',
  })
}

function formatTrainingType(value: TrainingType) {
  return value === 'online_webinar' ? 'Online webinar' : 'Onsite training'
}

export async function sendTrainingRegistrationAdminEmail(input: TrainingRegistrationAdminEmailInput) {
  const to = adminEmailRecipients()
  if (!to.length) return { sent: false, reason: 'No admin email configured.' }

  const from = process.env.COURSE_LICENSE_EMAIL_FROM?.trim() || process.env.ORDER_EMAIL_FROM?.trim() || 'Phonics Club <info@phonicsclub.com>'
  const adminTrainingsUrl = `${baseUrl()}/admin/trainings`
  const trainingTypeLabel = formatTrainingType(input.trainingType)
  const requesterName = input.fullName.trim() || 'Training requester'

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>New training registration</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f6fb;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;width:100%;">
          <tr>
            <td align="center" style="padding:28px 14px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
                <tr>
                  <td style="background:#0f172a;color:#ffffff;padding:30px;">
                    <p style="font-size:13px;font-weight:800;letter-spacing:.08em;margin:0 0 14px;text-transform:uppercase;">${escapeHtml(trainingTypeLabel)} request</p>
                    <h1 style="font-size:28px;line-height:1.2;margin:0 0 10px;">${escapeHtml(requesterName)} requested training</h1>
                    <p style="color:#dbeafe;font-size:15px;line-height:1.6;margin:0;">${escapeHtml(input.eventTitle)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
                      ${detailRow('Name', requesterName)}
                      ${detailRow('Email', input.email)}
                      ${detailRow('Phone', input.phone)}
                      ${detailRow('Organization', input.organization)}
                      ${detailRow('Type', trainingTypeLabel)}
                      ${detailRow('Training / webinar', input.eventTitle)}
                      ${detailRow('Event date', input.eventDate)}
                      ${detailRow('Preferred month', input.preferredMonth)}
                      ${detailRow('Approx participants', input.approxParticipants)}
                      ${detailRow('Message', input.message)}
                      ${detailRow('Source', input.source || 'Website trainings page')}
                      ${detailRow('Requested at', formatDateTime(input.requestedAt))}
                      ${input.registrationId ? detailRow('Registration ID', input.registrationId) : ''}
                      ${input.userId ? detailRow('User ID', input.userId) : ''}
                    </table>
                    <p style="margin:0 0 18px;">
                      <a href="${escapeHtml(adminTrainingsUrl)}" style="display:inline-block;border-radius:10px;background:#1D4ED8;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none;padding:14px 20px;">Open Training Registrations</a>
                    </p>
                    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0;">
                      This notification was sent automatically when the training/webinar request was received.
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
    subject: `New ${trainingTypeLabel.toLowerCase()} request - ${input.eventTitle}`,
    html,
  })

  return { sent: result.ok, result, from, to }
}

export async function notifyAdminOfTrainingRegistration(input: TrainingRegistrationAdminEmailInput) {
  try {
    return await sendTrainingRegistrationAdminEmail(input)
  } catch (error) {
    console.error('[Training registration] Admin email failed', {
      registrationId: input.registrationId,
      userId: input.userId,
      email: input.email,
      error,
    })
    return { sent: false, error }
  }
}
