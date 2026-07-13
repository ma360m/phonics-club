import { COMPANY } from '@/lib/company'

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

export async function sendOrderConfirmationEmail(
  to: string,
  orderId: string,
  invoiceNumber: string,
  invoiceHtml: string,
  options?: { accessToken?: string; pdfBase64?: string }
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.ORDER_EMAIL_FROM ?? 'orders@phonicsclub.com'
  const baseUrl = getBaseUrl()
  const tokenParam = options?.accessToken ? `&token=${options.accessToken}` : ''
  const invoicePdfUrl = `${baseUrl}/api/orders/${orderId}/invoice?format=pdf${tokenParam}`
  const invoiceHtmlUrl = `${baseUrl}/api/orders/${orderId}/invoice${options?.accessToken ? `?token=${options.accessToken}` : ''}`

  if (!apiKey) {
    console.info(`[Order email] To: ${to} | Invoice: ${invoiceNumber} | Order: ${orderId}`)
    return { sent: false }
  }

  try {
    const adminEmail = COMPANY.adminEmail
    const bcc = adminEmail.toLowerCase() !== to.toLowerCase() ? [adminEmail] : undefined
    const payload: Record<string, unknown> = {
      from: `PHONICS CLUB <${from}>`,
      to: [to],
      ...(bcc ? { bcc } : {}),
      subject: `Order Confirmation — Invoice ${invoiceNumber}`,
      html: `
        <p>Thank you for your order with Phonics Club!</p>
        <p>Your invoice number is <strong>${invoiceNumber}</strong>.</p>
        <p>
          <a href="${invoicePdfUrl}">Download invoice (PDF)</a> ·
          <a href="${invoiceHtmlUrl}">View invoice (HTML)</a>
        </p>
        <p>Contact us: ${COMPANY.adminEmail} | ${COMPANY.phoneDisplay}</p>
      `,
    }

    if (options?.pdfBase64) {
      payload.attachments = [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: options.pdfBase64,
        },
      ]
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[Order email] Failed to send invoice ${invoiceNumber}: ${res.status} ${body}`)
    }
    return { sent: res.ok }
  } catch (error) {
    console.error(`[Order email] Failed to send invoice ${invoiceNumber}`, error)
    return { sent: false }
  }
}
