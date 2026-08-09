import { APP_URL } from '@/lib/constants'
import { COMPANY } from '@/lib/company'
import { sendTransactionalEmail } from '@/lib/email/mailer'
import { formatPrice } from '@/utils/format'
import type { Course } from '@/types/database'

export const COURSE_LICENSE_EMAIL_ADDRESS = 'noreply@phonicsclub.com'
export const COURSE_LICENSE_EMAIL_FROM = `Phonics Club <${COURSE_LICENSE_EMAIL_ADDRESS}>`

function baseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  return APP_URL
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendCourseLicenseEmail({
  to,
  studentName,
  course,
  paymentId,
  licenseKey,
}: {
  to: string
  studentName?: string | null
  course: Course
  paymentId: string
  licenseKey: string
}) {
  const from = process.env.COURSE_LICENSE_EMAIL_FROM?.trim() || COURSE_LICENSE_EMAIL_FROM
  const paymentUrl = `${baseUrl()}/courses/${course.slug}/payment?paymentId=${paymentId}`
  const safeName = studentName?.trim() || 'Student'

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>${escapeHtml(course.title)} licence key</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f6fb;color:#111827;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;width:100%;">
          <tr>
            <td align="center" style="padding:28px 14px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
                <tr>
                  <td style="background:#1D4ED8;color:#ffffff;padding:30px;">
                    <p style="font-size:13px;font-weight:800;letter-spacing:.08em;margin:0 0 14px;text-transform:uppercase;">Phonics Club course access</p>
                    <h1 style="font-size:30px;line-height:1.18;margin:0 0 12px;">Your licence key is ready</h1>
                    <p style="color:#dbeafe;font-size:15px;line-height:1.6;margin:0;">Payment has been approved for ${escapeHtml(course.title)}.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <p style="font-size:16px;line-height:1.7;margin:0 0 20px;">Hi ${escapeHtml(safeName)},</p>
                    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 22px;">
                      Use the licence key below on your course payment page to unlock the course.
                    </p>
                    <div style="background:#f8fafc;border:1px dashed #93c5fd;border-radius:14px;padding:18px;text-align:center;margin:0 0 24px;">
                      <p style="color:#6b7280;font-size:12px;font-weight:800;letter-spacing:.08em;margin:0 0 8px;text-transform:uppercase;">Licence key</p>
                      <p style="color:#111827;font-family:Consolas,Monaco,monospace;font-size:24px;font-weight:800;letter-spacing:.08em;margin:0;">${escapeHtml(licenseKey)}</p>
                    </div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
                      <tr>
                        <td style="border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;padding:12px 0;">Course</td>
                        <td align="right" style="border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:700;padding:12px 0;">${escapeHtml(course.title)}</td>
                      </tr>
                      <tr>
                        <td style="border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;padding:12px 0;">Amount</td>
                        <td align="right" style="border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:700;padding:12px 0;">${escapeHtml(formatPrice(Number(course.discounted_price ?? course.price ?? 0), course.currency ?? 'PKR'))}</td>
                      </tr>
                    </table>
                    <a href="${escapeHtml(paymentUrl)}" style="display:inline-block;border-radius:10px;background:#1D4ED8;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none;padding:14px 20px;">
                      Unlock Course
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="background:#111827;color:#d1d5db;font-size:12px;line-height:1.7;padding:22px 30px;text-align:center;">
                    This licence key was issued by ${escapeHtml(COMPANY.name)}.
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
    to: [to],
    subject: `Licence key for ${course.title}`,
    html,
  })

  return { sent: result.ok, result, from }
}
