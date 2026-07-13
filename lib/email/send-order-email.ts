import { COMPANY } from '@/lib/company'
import { invoiceFileBaseName } from '@/lib/invoice'

interface EmailAttachment {
  filename: string
  content: string
}

interface EmailPayload {
  to: string[]
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

export interface LowStockEmailAlert {
  product_id: string
  product_name: string
  previous_stock: number
  new_stock: number
  quantity_sold: number
}

function getBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/$/, '')

  const withProtocol = (url: string) => {
    const clean = url.replace(/\/$/, '')
    return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`
  }

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProduction) return withProtocol(vercelProduction)

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return withProtocol(vercelUrl)

  return 'http://localhost:3000'
}

async function sendResendEmail(apiKey: string, from: string, payload: EmailPayload): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `PHONICS CLUB <${from}>`,
        ...payload,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[Email] Failed to send "${payload.subject}": ${res.status} ${body}`)
    }

    return res.ok
  } catch (error) {
    console.error(`[Email] Failed to send "${payload.subject}"`, error)
    return false
  }
}

export async function sendOrderConfirmationEmail(
  to: string,
  orderId: string,
  invoiceNumber: string,
  _invoiceHtml: string,
  options?: { accessToken?: string; pdfBase64?: string }
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.ORDER_EMAIL_FROM ?? 'orders@phonicsclub.com'
  const adminEmail = process.env.ORDER_ADMIN_EMAIL ?? COMPANY.adminEmail
  const baseUrl = getBaseUrl()
  const tokenParam = options?.accessToken ? `&token=${options.accessToken}` : ''
  const invoicePdfUrl = `${baseUrl}/api/orders/${orderId}/invoice?format=pdf${tokenParam}`
  const invoiceHtmlUrl = `${baseUrl}/api/orders/${orderId}/invoice${options?.accessToken ? `?token=${options.accessToken}` : ''}`
  const attachment = options?.pdfBase64
    ? [{ filename: `${invoiceFileBaseName(invoiceNumber)}.pdf`, content: options.pdfBase64 }]
    : undefined

  if (!apiKey) {
    console.info(`[Order email] To: ${to} and ${adminEmail} | Invoice: ${invoiceNumber} | Order: ${orderId}`)
    return { sent: false }
  }

  const customerEmail: EmailPayload = {
    to: [to],
    subject: `Order Confirmation - Invoice ${invoiceNumber}`,
    html: `
      <p>Thank you for your order with Phonics Club.</p>
      <p>Your invoice number is <strong>${invoiceNumber}</strong>.</p>
      <p>
        <a href="${invoicePdfUrl}">Download invoice (PDF)</a> |
        <a href="${invoiceHtmlUrl}">View invoice (HTML)</a>
      </p>
      <p>Contact us: ${COMPANY.adminEmail} | ${COMPANY.phoneDisplay}</p>
    `,
    attachments: attachment,
  }

  const adminEmailPayload: EmailPayload = {
    to: [adminEmail],
    subject: `New order placed - Invoice ${invoiceNumber}`,
    html: `
      <p>A new order has been placed on Phonics Club.</p>
      <p><strong>Invoice:</strong> ${invoiceNumber}</p>
      <p><strong>Customer email:</strong> ${to}</p>
      <p>
        <a href="${invoicePdfUrl}">Download invoice (PDF)</a> |
        <a href="${invoiceHtmlUrl}">View invoice (HTML)</a>
      </p>
    `,
    attachments: attachment,
  }

  const [customerSent, adminSent] = await Promise.all([
    sendResendEmail(apiKey, from, customerEmail),
    sendResendEmail(apiKey, from, adminEmailPayload),
  ])

  return { sent: customerSent && adminSent }
}

export async function sendLowStockAlertEmail(
  alerts: LowStockEmailAlert[],
  orderId: string,
  invoiceNumber: string
): Promise<{ sent: boolean }> {
  if (!alerts.length) return { sent: false }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.ORDER_EMAIL_FROM ?? 'orders@phonicsclub.com'
  const adminEmail = process.env.ORDER_ADMIN_EMAIL ?? COMPANY.adminEmail

  if (!apiKey) {
    console.info(`[Low stock email] ${alerts.length} alert(s) for order ${orderId}`)
    return { sent: false }
  }

  const rows = alerts
    .map(
      (alert) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${alert.product_name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${alert.quantity_sold}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${alert.previous_stock}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#b45309;font-weight:bold">${alert.new_stock}</td></tr>`
    )
    .join('')

  const sent = await sendResendEmail(apiKey, from, {
    to: [adminEmail],
    subject: `Low stock alert - Invoice ${invoiceNumber}`,
    html: `
      <p>The following product quantity dropped below 20 after order <strong>${invoiceNumber}</strong>.</p>
      <table style="border-collapse:collapse;width:100%;max-width:720px">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:8px;text-align:left">Product</th>
            <th style="padding:8px;text-align:center">Sold</th>
            <th style="padding:8px;text-align:center">Previous stock</th>
            <th style="padding:8px;text-align:center">New stock</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `,
  })

  return { sent }
}
