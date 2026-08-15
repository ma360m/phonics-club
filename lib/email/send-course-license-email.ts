import { APP_URL } from '@/lib/constants'
import { COMPANY } from '@/lib/company'
import { sendTransactionalEmail } from '@/lib/email/mailer'
import { getContactSettings, getCourseBankDetails } from '@/lib/site-content'
import { getContactPhoneLinks } from '@/lib/contact-settings'
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

function detailRow(label: string, value: unknown) {
  return `
    <tr>
      <td style="border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;padding:12px 0;">${escapeHtml(label)}</td>
      <td align="right" style="border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:700;padding:12px 0;">${escapeHtml(value)}</td>
    </tr>
  `
}

function primaryButton(label: string, href: string) {
  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;border-radius:10px;background:#1D4ED8;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none;padding:14px 20px;">
      ${escapeHtml(label)}
    </a>
  `
}

function supportPhoneLinks(settings: Awaited<ReturnType<typeof getContactSettings>>) {
  const links = getContactPhoneLinks(settings)
  if (!links.length) return escapeHtml(COMPANY.phoneDisplay)

  return links
    .map(
      (phone) =>
        `<a href="${escapeHtml(phone.href)}" style="color:#1D4ED8;font-weight:700;text-decoration:none;">${escapeHtml(phone.display)}</a>`
    )
    .join(' or ')
}

export async function sendCourseEnrollmentInvoiceEmail({
  to,
  studentName,
  course,
  paymentId,
  invoiceNumber,
  amount,
  currency,
}: {
  to: string
  studentName?: string | null
  course: Course
  paymentId: string
  invoiceNumber: string
  amount: number
  currency?: string | null
}) {
  const from = process.env.COURSE_LICENSE_EMAIL_FROM?.trim() || COURSE_LICENSE_EMAIL_FROM
  const paymentUrl = `${baseUrl()}/courses/${course.slug}/payment?paymentId=${paymentId}`
  const safeName = studentName?.trim() || 'Student'
  const [bankDetails, contactSettings] = await Promise.all([getCourseBankDetails(), getContactSettings()])
  const supportPhones = supportPhoneLinks(contactSettings)
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Course invoice ${escapeHtml(invoiceNumber)}</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f6fb;color:#111827;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;width:100%;">
          <tr>
            <td align="center" style="padding:28px 14px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
                <tr>
                  <td style="background:#0F172A;color:#ffffff;padding:30px;">
                    <p style="font-size:13px;font-weight:800;letter-spacing:.08em;margin:0 0 14px;text-transform:uppercase;">Phonics Club course invoice</p>
                    <h1 style="font-size:30px;line-height:1.18;margin:0 0 12px;">Enrollment invoice created</h1>
                    <p style="color:#dbeafe;font-size:15px;line-height:1.6;margin:0;">Your enrollment invoice for ${escapeHtml(course.title)} is ready.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <p style="font-size:16px;line-height:1.7;margin:0 0 20px;">Hi ${escapeHtml(safeName)},</p>
                    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 22px;">
                      Please complete the manual payment and upload a clear payment screenshot from your course payment page. If you need help, contact us at
                      ${supportPhones}.
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
                      ${detailRow('Invoice number', invoiceNumber)}
                      ${detailRow('Course', course.title)}
                      ${detailRow('Amount due', formatPrice(Number(amount ?? 0), currency ?? course.currency ?? 'PKR'))}
                      ${detailRow('Status', 'Pending payment confirmation')}
                      ${detailRow('Bank', bankDetails.bankName)}
                      ${detailRow('Account title', bankDetails.accountTitle)}
                      ${detailRow('Account number', bankDetails.accountNumber)}
                      ${bankDetails.iban ? detailRow('IBAN', bankDetails.iban) : ''}
                    </table>
                    <p style="color:#4b5563;font-size:13px;line-height:1.7;margin:0 0 20px;">
                      ${escapeHtml(bankDetails.instructions)}
                    </p>
                    ${primaryButton('Open Payment Page', paymentUrl)}
                    <p style="color:#4b5563;font-size:13px;line-height:1.7;margin:20px 0 0;">
                      Already paid? Submit the screenshot on the payment page. Having issue with payment? Call
                      ${supportPhones}.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#111827;color:#d1d5db;font-size:12px;line-height:1.7;padding:22px 30px;text-align:center;">
                    This course invoice was issued by ${escapeHtml(COMPANY.name)} from ${escapeHtml(COURSE_LICENSE_EMAIL_ADDRESS)}.
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
    subject: `Course enrollment invoice ${invoiceNumber}`,
    html,
  })

  return { sent: result.ok, result, from }
}

export async function sendCoursePaymentPendingReminderEmail({
  to,
  studentName,
  course,
  paymentId,
  amount,
  currency,
  requestExpiry,
}: {
  to: string
  studentName?: string | null
  course: Course
  paymentId: string
  amount: number
  currency?: string | null
  requestExpiry: Date
}) {
  const from = process.env.COURSE_LICENSE_EMAIL_FROM?.trim() || COURSE_LICENSE_EMAIL_FROM
  const paymentUrl = `${baseUrl()}/courses/${course.slug}/payment?paymentId=${paymentId}`
  const safeName = studentName?.trim() || 'Student'
  const amountLabel = formatPrice(Number(amount ?? course.discounted_price ?? course.price ?? 0), currency ?? course.currency ?? 'PKR')
  const [bankDetails, contactSettings] = await Promise.all([getCourseBankDetails(), getContactSettings()])
  const supportPhones = supportPhoneLinks(contactSettings)
  const expiryLabel = requestExpiry.toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Karachi',
  })

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Action Required: Complete Your Course Registration</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f6fb;color:#111827;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;width:100%;">
          <tr>
            <td align="center" style="padding:28px 14px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
                <tr>
                  <td style="background:#0F172A;color:#ffffff;padding:30px;">
                    <p style="font-size:13px;font-weight:800;letter-spacing:.08em;margin:0 0 14px;text-transform:uppercase;">Phonics Club registration</p>
                    <h1 style="font-size:28px;line-height:1.2;margin:0;">Action Required: Complete Your Course Registration</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <p style="font-size:16px;line-height:1.7;margin:0 0 18px;">Dear ${escapeHtml(safeName)},</p>
                    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 18px;">
                      Thank you for registering for ${escapeHtml(course.title)} with Phonics Club.
                    </p>
                    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 20px;">
                      Your registration is currently pending because we have not yet received your payment slip/receipt.
                      Please complete the payment process to avoid expiry of your registration request.
                    </p>
                    <p style="font-size:15px;font-weight:700;line-height:1.7;margin:0 0 10px;">To complete your registration:</p>
                    <ol style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 22px;padding-left:22px;">
                      <li>Pay the course fee of ${escapeHtml(amountLabel)}.</li>
                      <li>Log in to your Phonics Club account and upload your payment slip/receipt.</li>
                      <li>Your payment will be reviewed and verified by our team.</li>
                      <li>After successful verification, your Course Licence will be generated and sent to your registered email address.</li>
                      <li>Your course will then be unlocked for access.</li>
                    </ol>
                    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;color:#9a3412;font-size:14px;line-height:1.7;margin:0 0 22px;padding:16px;">
                      <strong>Important:</strong><br />
                      Registration alone does not provide access to the course. Your Course Licence can only be issued after
                      your payment slip has been uploaded and your payment has been successfully verified.
                    </div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
                      ${detailRow('Course', course.title)}
                      ${detailRow('Amount', amountLabel)}
                      ${detailRow('Status', 'Payment Pending')}
                      ${detailRow('Request Expiry', expiryLabel)}
                      ${detailRow('Bank', bankDetails.bankName)}
                      ${detailRow('Account title', bankDetails.accountTitle)}
                      ${detailRow('Account number', bankDetails.accountNumber)}
                      ${bankDetails.iban ? detailRow('IBAN', bankDetails.iban) : ''}
                    </table>
                    <p style="color:#4b5563;font-size:13px;line-height:1.7;margin:0 0 20px;">
                      ${escapeHtml(bankDetails.instructions)}
                    </p>
                    ${primaryButton('Upload Payment Slip', paymentUrl)}
                    <p style="color:#4b5563;font-size:14px;line-height:1.7;margin:20px 0 0;">
                      If you have already made the payment, please upload your payment slip as soon as possible.
                    </p>
                    <p style="color:#4b5563;font-size:14px;line-height:1.7;margin:12px 0 0;">
                      For assistance, contact us at ${supportPhones}.
                    </p>
                    <p style="color:#111827;font-size:14px;line-height:1.7;margin:22px 0 0;">
                      Regards,<br />
                      <strong>Phonics Club Team</strong><br />
                      Empowering Literacy Through Synthetic Phonics
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
    to: [to],
    subject: 'Action Required: Complete Your Course Registration',
    html,
  })

  return { sent: result.ok, result, from }
}

export async function sendCourseLicenseEmail({
  to,
  studentName,
  course,
  paymentId,
  licenseKey,
  amount,
  currency,
  invoiceNumber,
}: {
  to: string
  studentName?: string | null
  course: Course
  paymentId: string
  licenseKey: string
  amount?: number | null
  currency?: string | null
  invoiceNumber?: string | null
}) {
  const from = process.env.COURSE_LICENSE_EMAIL_FROM?.trim() || COURSE_LICENSE_EMAIL_FROM
  const courseUrl = `${baseUrl()}/course/${course.id}/learn`
  const safeName = studentName?.trim() || 'Student'
  const amountLabel = formatPrice(Number(amount ?? course.discounted_price ?? course.price ?? 0), currency ?? course.currency ?? 'PKR')

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
                    <h1 style="font-size:30px;line-height:1.18;margin:0 0 12px;">Payment confirmed</h1>
                    <p style="color:#dbeafe;font-size:15px;line-height:1.6;margin:0;">Your licence key is ready for ${escapeHtml(course.title)}.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <p style="font-size:16px;line-height:1.7;margin:0 0 20px;">Hi ${escapeHtml(safeName)},</p>
                    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 22px;">
                      Your payment has been confirmed and your course access has been unlocked. Keep the licence key below for your records.
                    </p>
                    <div style="background:#f8fafc;border:1px dashed #93c5fd;border-radius:14px;padding:18px;text-align:center;margin:0 0 24px;">
                      <p style="color:#6b7280;font-size:12px;font-weight:800;letter-spacing:.08em;margin:0 0 8px;text-transform:uppercase;">Licence key</p>
                      <p style="color:#111827;font-family:Consolas,Monaco,monospace;font-size:24px;font-weight:800;letter-spacing:.08em;margin:0;">${escapeHtml(licenseKey)}</p>
                    </div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
                      ${invoiceNumber ? detailRow('Invoice number', invoiceNumber) : ''}
                      ${detailRow('Course', course.title)}
                      ${detailRow('Payment status', 'Confirmed')}
                      ${detailRow('Amount paid', amountLabel)}
                    </table>
                    ${primaryButton('Open Course', courseUrl)}
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
    subject: `Payment confirmed - licence key for ${course.title}`,
    html,
  })

  return { sent: result.ok, result, from }
}
