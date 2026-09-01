import { APP_URL } from '@/lib/constants'
import { COMPANY } from '@/lib/company'
import { formatCurrency, type CurrencyCode } from '@/lib/currency'
import { sendTransactionalEmail, type TransactionalEmailAttachment } from '@/lib/email/mailer'

type PaymentReceiptType = 'order' | 'course' | 'certificate'

export interface PaymentReceiptAdminEmailInput {
  type: PaymentReceiptType
  source?: string | null
  orderId?: string | null
  paymentId?: string | null
  courseId?: string | null
  reference?: string | null
  status?: string | null
  paymentMethod?: string | null
  transactionReference?: string | null
  amount?: number | string | null
  currency?: string | null
  customer?: {
    name?: string | null
    email?: string | null
    phone?: string | null
  }
  course?: {
    title?: string | null
    slug?: string | null
  } | null
  receipt: {
    filename?: string | null
    mimeType?: string | null
    sizeBytes?: number | string | null
    storageBucket?: string | null
    storagePath?: string | null
    viewUrl?: string | null
  }
  adminUrl?: string | null
  uploadedAt?: Date | string | null
  attachmentFile?: File | null
}

function baseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  return APP_URL.replace(/\/$/, '')
}

function adminEmailRecipients() {
  const configured = (
    process.env.PAYMENT_RECEIPT_ADMIN_EMAIL ||
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

function typeLabel(type: PaymentReceiptType) {
  if (type === 'certificate') return 'Certificate payment'
  if (type === 'course') return 'Course payment'
  return 'Shop order payment'
}

function formatStatus(value?: string | null) {
  return String(value || 'submitted')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDateTime(value?: Date | string | null) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return 'Not recorded'
  return date.toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Karachi',
  })
}

function formatFileSize(value?: number | string | null) {
  const bytes = Number(value ?? 0)
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Not recorded'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function formatAmount(amount?: number | string | null, currency?: string | null) {
  const value = Number(amount ?? 0)
  const normalizedCurrency: CurrencyCode = String(currency ?? 'PKR').toUpperCase() === 'USD' ? 'USD' : 'PKR'
  return formatCurrency(Number.isFinite(value) ? value : 0, normalizedCurrency, { freeLabel: false, useCode: true })
}

function detailRow(label: string, value: unknown) {
  return `
    <tr>
      <td style="border-bottom:1px solid #e5e7eb;color:#64748b;font-size:13px;padding:11px 0;">${escapeHtml(label)}</td>
      <td align="right" style="border-bottom:1px solid #e5e7eb;color:#0f172a;font-size:14px;font-weight:700;padding:11px 0;">${escapeHtml(value || 'Not provided')}</td>
    </tr>
  `
}

function button(label: string, href: string, color = '#1D4ED8') {
  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;border-radius:10px;background:${color};color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none;padding:14px 20px;margin:6px 8px 6px 0;">
      ${escapeHtml(label)}
    </a>
  `
}

async function receiptAttachmentFromFile(file?: File | null): Promise<TransactionalEmailAttachment[] | undefined> {
  if (!file || file.size <= 0) return undefined
  try {
    const content = Buffer.from(await file.arrayBuffer()).toString('base64')
    return [{
      filename: file.name || 'payment-receipt',
      content,
      contentType: file.type || 'application/octet-stream',
    }]
  } catch (error) {
    console.error('[Payment receipt] Receipt attachment could not be prepared', { error })
    return undefined
  }
}

function paymentSubject(input: PaymentReceiptAdminEmailInput) {
  const label = typeLabel(input.type)
  const reference = input.reference || input.paymentId || input.orderId || input.courseId || 'new receipt'
  return `${label} receipt uploaded - ${reference}`
}

function adminUrlFor(input: PaymentReceiptAdminEmailInput) {
  if (input.adminUrl) return input.adminUrl
  if (input.type === 'order') return `${baseUrl()}/admin/orders${input.orderId ? `#order-${input.orderId}` : ''}`
  return `${baseUrl()}/admin/course-payments?status=submitted`
}

function htmlFor(input: PaymentReceiptAdminEmailInput, hasAttachment: boolean) {
  const label = typeLabel(input.type)
  const customerName = input.customer?.name?.trim() || 'Customer'
  const title = input.type === 'order'
    ? `${customerName} uploaded a payment receipt`
    : `${customerName} uploaded a ${input.type === 'certificate' ? 'certificate' : 'course'} receipt`
  const adminUrl = adminUrlFor(input)
  const receiptViewUrl = input.receipt.viewUrl || null
  const courseTitle = input.course?.title || null
  const storageLocation = [input.receipt.storageBucket, input.receipt.storagePath].filter(Boolean).join('/')

  return `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>${escapeHtml(label)} receipt uploaded</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f6fb;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;width:100%;">
          <tr>
            <td align="center" style="padding:28px 14px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:700px;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
                <tr>
                  <td style="background:#0f172a;color:#ffffff;padding:30px;">
                    <p style="font-size:13px;font-weight:800;letter-spacing:.08em;margin:0 0 14px;text-transform:uppercase;">${escapeHtml(label)}</p>
                    <h1 style="font-size:28px;line-height:1.2;margin:0 0 10px;">${escapeHtml(title)}</h1>
                    <p style="color:#dbeafe;font-size:15px;line-height:1.6;margin:0;">Open the matching admin page to verify the transfer and approve or reject the payment.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
                      ${detailRow('Customer / student', customerName)}
                      ${detailRow('Email', input.customer?.email)}
                      ${input.customer?.phone ? detailRow('Phone', input.customer.phone) : ''}
                      ${detailRow('Payment type', label)}
                      ${courseTitle ? detailRow('Course', courseTitle) : ''}
                      ${detailRow('Reference', input.reference || input.paymentId || input.orderId)}
                      ${input.orderId ? detailRow('Order ID', input.orderId) : ''}
                      ${input.paymentId ? detailRow('Payment ID', input.paymentId) : ''}
                      ${input.courseId ? detailRow('Course ID', input.courseId) : ''}
                      ${detailRow('Amount', formatAmount(input.amount, input.currency))}
                      ${detailRow('Status', formatStatus(input.status))}
                      ${input.paymentMethod ? detailRow('Payment method', input.paymentMethod) : ''}
                      ${input.transactionReference ? detailRow('Transaction reference', input.transactionReference) : ''}
                      ${detailRow('Source', input.source || 'Website')}
                      ${detailRow('Uploaded at', formatDateTime(input.uploadedAt))}
                      ${detailRow('Receipt filename', input.receipt.filename)}
                      ${detailRow('Receipt type', input.receipt.mimeType)}
                      ${detailRow('Receipt size', formatFileSize(input.receipt.sizeBytes))}
                      ${storageLocation ? detailRow('Storage path', storageLocation) : ''}
                      ${detailRow('Receipt attached', hasAttachment ? 'Yes' : 'No - open it from admin')}
                    </table>
                    <p style="margin:0 0 18px;">
                      ${button(input.type === 'order' ? 'Open Admin Order' : 'Open Payment Review', adminUrl)}
                      ${receiptViewUrl ? button('Open Receipt', receiptViewUrl, '#111827') : ''}
                    </p>
                    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0;">
                      This notification was sent automatically after a customer uploaded a payment receipt.
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
}

export async function sendPaymentReceiptAdminEmail(input: PaymentReceiptAdminEmailInput) {
  const to = adminEmailRecipients()
  if (!to.length) return { sent: false, reason: 'No admin email configured.' }

  const from = process.env.PAYMENT_RECEIPT_EMAIL_FROM?.trim()
    || process.env.ORDER_EMAIL_FROM?.trim()
    || process.env.COURSE_LICENSE_EMAIL_FROM?.trim()
    || 'Phonics Club <info@phonicsclub.com>'
  const attachments = await receiptAttachmentFromFile(input.attachmentFile)
  const result = await sendTransactionalEmail({
    from,
    to,
    subject: paymentSubject(input),
    html: htmlFor(input, Boolean(attachments?.length)),
    attachments,
  })

  return { sent: result.ok, result, from, to }
}

export async function notifyAdminOfPaymentReceipt(input: PaymentReceiptAdminEmailInput) {
  try {
    const result = await sendPaymentReceiptAdminEmail(input)
    if (!result.sent) {
      console.error('[Payment receipt] Admin email was not sent', {
        type: input.type,
        orderId: input.orderId,
        paymentId: input.paymentId,
        courseId: input.courseId,
        reference: input.reference,
        reason: 'reason' in result ? result.reason : undefined,
        provider: 'result' in result ? result.result?.provider : undefined,
        error: 'result' in result ? result.result?.error : undefined,
      })
    }
    return result
  } catch (error) {
    console.error('[Payment receipt] Admin email failed', {
      type: input.type,
      orderId: input.orderId,
      paymentId: input.paymentId,
      courseId: input.courseId,
      error,
    })
    return { sent: false, error }
  }
}
