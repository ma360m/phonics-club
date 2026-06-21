import { COMPANY } from '@/lib/company'

export async function sendOrderConfirmationEmail(
  to: string,
  orderId: string,
  invoiceNumber: string,
  invoiceHtml: string
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.ORDER_EMAIL_FROM ?? `orders@${COMPANY.adminEmail.split('@')[1] ?? 'phonicsclub.com'}`

  if (!apiKey) {
    console.info(`[Order email] To: ${to} | Invoice: ${invoiceNumber} | Order: ${orderId}`)
    return { sent: false }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `PHONICS CLUB <${from}>`,
        to: [to],
        subject: `Order Confirmation — Invoice ${invoiceNumber}`,
        html: `
          <p>Thank you for your order with Phonics Club!</p>
          <p>Your invoice number is <strong>${invoiceNumber}</strong>.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/api/orders/${orderId}/invoice">Download your invoice</a></p>
          <p>Contact us: ${COMPANY.adminEmail} | ${COMPANY.phoneDisplay}</p>
        `,
      }),
    })
    return { sent: res.ok }
  } catch {
    return { sent: false }
  }
}
