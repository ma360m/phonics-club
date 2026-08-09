import { COMPANY } from '@/lib/company'
import { invoiceFileBaseName } from '@/lib/invoice'
import { formatDate, formatPrice } from '@/utils/format'
import { formatCurrency } from '@/lib/currency'
import { APP_URL } from '@/lib/constants'
import { sendTransactionalEmail, type MailSendResult } from '@/lib/email/mailer'

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

interface OrderEmailItem {
  name: string
  price: number
  quantity: number
  stock_note?: string
  stock_status?: string
}

interface OrderEmailShippingAddress {
  fullName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  zip?: string
  country?: string
}

interface OrderEmailOptions {
  accessToken?: string
  pdfBase64?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  orderDate: string
  paymentStatus: string
  total: number
  displayCurrency?: string
  displayTotal?: number
  exchangeRate?: number
  items: OrderEmailItem[]
  shippingAddress: OrderEmailShippingAddress | null
  requiresAdminConfirmation?: boolean
  adminConfirmationReason?: string | null
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

function formatStatus(value: string): string {
  const clean = value.replace(/_/g, ' ').trim()
  if (!clean) return 'Pending'

  return clean.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatOrderDate(value: string): string {
  const date = new Date(value)
  return formatDate(Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString())
}

function formatAddress(address: OrderEmailShippingAddress | null): string {
  if (!address) return 'Not provided'

  const cityLine = [address.city, address.zip].filter(Boolean).join(', ')
  const lines = [address.fullName, address.address, cityLine, address.country].filter(Boolean)
  return lines.length ? lines.map(escapeHtml).join('<br />') : 'Not provided'
}

function buildButton(label: string, href: string, background: string, color = '#ffffff'): string {
  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;border-radius:10px;background:${background};color:${color};font-size:14px;font-weight:700;line-height:1;text-decoration:none;padding:14px 20px;margin:6px 8px 6px 0;">
      ${escapeHtml(label)}
    </a>
  `
}

function buildEmailShell(preheader: string, body: string): string {
  return `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>${escapeHtml(COMPANY.name)}</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f6fb;color:#111827;font-family:Arial,Helvetica,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;margin:0;padding:0;width:100%;">
          <tr>
            <td align="center" style="padding:28px 14px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;box-shadow:0 16px 42px rgba(17,24,39,0.08);max-width:680px;overflow:hidden;width:100%;">
                ${body}
              </table>
              <p style="color:#6b7280;font-size:12px;line-height:1.6;margin:18px 0 0;max-width:620px;text-align:center;">
                ${escapeHtml(COMPANY.legalName)}<br />
                ${escapeHtml(COMPANY.address)} | ${escapeHtml(COMPANY.phoneDisplay)} | ${escapeHtml(COMPANY.email)}
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

function mailFailureForLog(result: MailSendResult) {
  const error = result.error
  return {
    provider: result.provider,
    status: result.status,
    responseText: result.responseText ? result.responseText.slice(0, 500) : undefined,
    error: error instanceof Error ? { name: error.name, message: error.message } : error ? String(error) : undefined,
  }
}

function buildHeader(eyebrow: string, title: string, copy: string): string {
  return `
    <tr>
      <td style="background:#1D4ED8;padding:30px 30px 28px;color:#ffffff;">
        <p style="font-size:13px;font-weight:800;letter-spacing:0.08em;margin:0 0 14px;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
        <h1 style="font-size:30px;line-height:1.18;margin:0 0 12px;">${escapeHtml(title)}</h1>
        <p style="font-size:15px;line-height:1.6;margin:0;color:#dbeafe;">${escapeHtml(copy)}</p>
      </td>
    </tr>
  `
}

function buildDetailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;padding:12px 0;">${escapeHtml(label)}</td>
      <td align="right" style="border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:700;padding:12px 0;">${escapeHtml(value)}</td>
    </tr>
  `
}

function buildCustomerEmailHtml({
  customerName,
  invoiceNumber,
  invoicePdfUrl,
  invoiceHtmlUrl,
  orderDate,
  paymentStatus,
  total,
  displayCurrency,
  displayTotal,
  exchangeRate,
  requiresAdminConfirmation,
  adminConfirmationReason,
}: {
  customerName: string
  invoiceNumber: string
  invoicePdfUrl: string
  invoiceHtmlUrl: string
  orderDate: string
  paymentStatus: string
  total: number
  displayCurrency?: string
  displayTotal?: number
  exchangeRate?: number
  requiresAdminConfirmation?: boolean
  adminConfirmationReason?: string | null
}): string {
  const safeName = customerName.trim() || 'there'
  const body = `
    ${buildHeader(
      'Phonics Club',
      requiresAdminConfirmation ? 'Your order has been received' : 'Your order is confirmed',
      requiresAdminConfirmation
        ? 'Some item stock is low or on backorder, so admin will confirm availability before processing.'
        : 'Thank you for ordering official Phonics Club learning resources.'
    )}
    <tr>
      <td style="padding:30px;">
        <p style="font-size:16px;line-height:1.7;margin:0 0 20px;">Hi ${escapeHtml(safeName)},</p>
        <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 24px;">
          We have received your order and attached your invoice for your records. You can also download or view it any time from the links below.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
          ${buildDetailRow('Invoice number', invoiceNumber)}
          ${buildDetailRow('Order date', formatOrderDate(orderDate))}
          ${buildDetailRow('Payment status', formatStatus(paymentStatus))}
          ${buildDetailRow('Total amount', formatPrice(total))}
          ${displayCurrency === 'USD' && displayTotal && exchangeRate ? buildDetailRow('Displayed at checkout', `${formatCurrency(displayTotal, 'USD', { freeLabel: false })} (1 USD = ${exchangeRate.toLocaleString('en-PK')} PKR)`) : ''}
        </table>
        <div style="margin:0 0 28px;">
          ${buildButton('Download Invoice', invoicePdfUrl, '#1D4ED8')}
          ${buildButton('View Invoice', invoiceHtmlUrl, '#FBBF24', '#111827')}
        </div>
        ${requiresAdminConfirmation ? `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:14px;color:#92400e;font-size:14px;line-height:1.6;margin:0 0 24px;padding:16px;">
          <p style="font-weight:700;margin:0 0 6px;">Admin stock confirmation required</p>
          <p style="margin:0;">We will confirm availability before processing this order.${adminConfirmationReason ? ` ${escapeHtml(adminConfirmationReason)}` : ''}</p>
        </div>` : ''}
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:18px;">
          <p style="color:#111827;font-size:14px;font-weight:700;margin:0 0 8px;">Need help with your order?</p>
          <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0;">
            Contact us at ${escapeHtml(COMPANY.adminEmail)} or ${escapeHtml(COMPANY.phoneDisplay)}.
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background:#111827;color:#d1d5db;font-size:12px;line-height:1.7;padding:22px 30px;text-align:center;">
        You are receiving this email because an order was placed with Phonics Club.
        <br />${escapeHtml(COMPANY.tagline)}
      </td>
    </tr>
  `

  return buildEmailShell(`Order ${invoiceNumber} confirmed`, body)
}

function buildAdminEmailHtml({
  customerName,
  customerEmail,
  customerPhone,
  invoiceNumber,
  items,
  total,
  displayCurrency,
  displayTotal,
  exchangeRate,
  paymentStatus,
  shippingAddress,
  adminOrderUrl,
  invoicePdfUrl,
  requiresAdminConfirmation,
  adminConfirmationReason,
}: {
  customerName: string
  customerEmail: string
  customerPhone: string
  invoiceNumber: string
  items: OrderEmailItem[]
  total: number
  displayCurrency?: string
  displayTotal?: number
  exchangeRate?: number
  paymentStatus: string
  shippingAddress: OrderEmailShippingAddress | null
  adminOrderUrl: string
  invoicePdfUrl: string
  requiresAdminConfirmation?: boolean
  adminConfirmationReason?: string | null
}): string {
  const itemRows = items
    .map((item) => {
      const lineTotal = Number(item.price) * Number(item.quantity)
      return `
        <tr>
          <td style="border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;padding:12px 0;">${escapeHtml(item.name)}${item.stock_note ? `<br /><span style="color:#b45309;font-size:12px;font-weight:700;">${escapeHtml(item.stock_note)}</span>` : ''}</td>
          <td align="center" style="border-bottom:1px solid #e5e7eb;color:#4b5563;font-size:14px;padding:12px 8px;">${escapeHtml(item.quantity)}</td>
          <td align="right" style="border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:700;padding:12px 0;">${escapeHtml(formatPrice(lineTotal))}</td>
        </tr>
      `
    })
    .join('')

  const body = `
    ${buildHeader(
      'Admin notification',
      'New order received',
      `Invoice ${invoiceNumber} is ready for review in the admin dashboard.`
    )}
    <tr>
      <td style="padding:30px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
          ${buildDetailRow('Customer name', customerName || 'Not provided')}
          ${buildDetailRow('Email', customerEmail)}
          ${buildDetailRow('Phone', customerPhone || 'Not provided')}
          ${buildDetailRow('Invoice number', invoiceNumber)}
          ${buildDetailRow('Payment status', formatStatus(paymentStatus))}
          ${buildDetailRow('Total', formatPrice(total))}
          ${requiresAdminConfirmation ? buildDetailRow('Stock confirmation', 'Required') : ''}
          ${displayCurrency === 'USD' && displayTotal && exchangeRate ? buildDetailRow('Displayed at checkout', `${formatCurrency(displayTotal, 'USD', { freeLabel: false })} (1 USD = ${exchangeRate.toLocaleString('en-PK')} PKR)`) : ''}
        </table>
        ${requiresAdminConfirmation ? `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:14px;color:#92400e;font-size:14px;line-height:1.6;margin:0 0 24px;padding:16px;">
          <p style="font-weight:700;margin:0 0 6px;">Low-stock/backorder review</p>
          <p style="margin:0;">${escapeHtml(adminConfirmationReason ?? 'Review item availability before processing this order.')}</p>
        </div>` : ''}

        <h2 style="color:#111827;font-size:16px;margin:0 0 12px;">Ordered items</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
          <tr>
            <th align="left" style="border-bottom:2px solid #d1d5db;color:#6b7280;font-size:12px;padding:0 0 10px;text-transform:uppercase;">Item</th>
            <th align="center" style="border-bottom:2px solid #d1d5db;color:#6b7280;font-size:12px;padding:0 8px 10px;text-transform:uppercase;">Qty</th>
            <th align="right" style="border-bottom:2px solid #d1d5db;color:#6b7280;font-size:12px;padding:0 0 10px;text-transform:uppercase;">Line total</th>
          </tr>
          ${itemRows || '<tr><td colspan="3" style="color:#6b7280;font-size:14px;padding:14px 0;">No items found.</td></tr>'}
        </table>

        <h2 style="color:#111827;font-size:16px;margin:0 0 12px;">Shipping address</h2>
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;color:#374151;font-size:14px;line-height:1.7;margin:0 0 26px;padding:18px;">
          ${formatAddress(shippingAddress)}
        </div>

        <div>
          ${buildButton('Open Admin Order', adminOrderUrl, '#1D4ED8')}
          ${buildButton('Download Invoice', invoicePdfUrl, '#111827')}
        </div>
      </td>
    </tr>
  `

  return buildEmailShell(`New order ${invoiceNumber}`, body)
}

export async function sendOrderConfirmationEmail(
  to: string,
  orderId: string,
  invoiceNumber: string,
  _invoiceHtml: string,
  options: OrderEmailOptions
): Promise<{ sent: boolean }> {
  const emailFrom =
    process.env.ORDER_EMAIL_FROM?.trim() || 'Phonics Club <info@phonicsclub.com>'
  const adminEmail = process.env.ORDER_ADMIN_EMAIL ?? COMPANY.adminEmail
  const baseUrl = getBaseUrl()
  const tokenParam = options?.accessToken ? `&token=${options.accessToken}` : ''
  const invoicePdfUrl = `${baseUrl}/api/orders/${orderId}/invoice?format=pdf${tokenParam}`
  const invoiceHtmlUrl = `${baseUrl}/api/orders/${orderId}/invoice${options?.accessToken ? `?token=${options.accessToken}` : ''}`
  const adminOrderUrl = `${baseUrl}/admin/orders#order-${orderId}`
  const attachment = options?.pdfBase64
    ? [{ filename: `${invoiceFileBaseName(invoiceNumber, options.customerName)}.pdf`, content: options.pdfBase64 }]
    : undefined

  const customerEmail: EmailPayload = {
    to: [to],
    subject: `Order Confirmation - Invoice ${invoiceNumber}`,
    html: buildCustomerEmailHtml({
      customerName: options.customerName,
      invoiceNumber,
      invoicePdfUrl,
      invoiceHtmlUrl,
      orderDate: options.orderDate,
      paymentStatus: options.paymentStatus,
      total: options.total,
      displayCurrency: options.displayCurrency,
      displayTotal: options.displayTotal,
      exchangeRate: options.exchangeRate,
      requiresAdminConfirmation: options.requiresAdminConfirmation,
      adminConfirmationReason: options.adminConfirmationReason,
    }),
    attachments: attachment,
  }

  const adminEmailPayload: EmailPayload = {
    to: [adminEmail],
    subject: `New order placed - Invoice ${invoiceNumber}`,
    html: buildAdminEmailHtml({
      customerName: options.customerName,
      customerEmail: options.customerEmail,
      customerPhone: options.customerPhone,
      invoiceNumber,
      items: options.items,
      total: options.total,
      displayCurrency: options.displayCurrency,
      displayTotal: options.displayTotal,
      exchangeRate: options.exchangeRate,
      paymentStatus: options.paymentStatus,
      shippingAddress: options.shippingAddress,
      adminOrderUrl,
      invoicePdfUrl,
      requiresAdminConfirmation: options.requiresAdminConfirmation,
      adminConfirmationReason: options.adminConfirmationReason,
    }),
    attachments: attachment,
  }

  console.info('Starting customer email', { orderId, invoiceNumber, recipientCount: customerEmail.to.length })
  const customerResult = await sendTransactionalEmail({ from: emailFrom, ...customerEmail })

  if (customerResult.ok) {
    console.info('Customer email sent', { orderId, invoiceNumber, provider: customerResult.provider })
  } else {
    console.error('Customer email failed', { orderId, invoiceNumber, ...mailFailureForLog(customerResult) })
  }

  console.info('Starting admin email', { orderId, invoiceNumber, recipientCount: adminEmailPayload.to.length })
  const adminResult = await sendTransactionalEmail({ from: emailFrom, ...adminEmailPayload })

  if (adminResult.ok) {
    console.info('Admin email sent', { orderId, invoiceNumber, provider: adminResult.provider })
  } else {
    console.error('Admin email failed', { orderId, invoiceNumber, ...mailFailureForLog(adminResult) })
  }

  return { sent: customerResult.ok && adminResult.ok }
}

export async function sendLowStockAlertEmail(
  alerts: LowStockEmailAlert[],
  orderId: string,
  invoiceNumber: string
): Promise<{ sent: boolean }> {
  if (!alerts.length) return { sent: false }

  const emailFrom =
    process.env.ORDER_EMAIL_FROM?.trim() || 'Phonics Club <info@phonicsclub.com>'
  const adminEmail = process.env.ORDER_ADMIN_EMAIL ?? COMPANY.adminEmail

  const rows = alerts
    .map(
      (alert) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${alert.product_name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${alert.quantity_sold}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${alert.previous_stock}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#b45309;font-weight:bold">${alert.new_stock}</td></tr>`
    )
    .join('')

  console.info('Starting low stock email', { orderId, invoiceNumber, alertCount: alerts.length })
  const sent = await sendTransactionalEmail({
    from: emailFrom,
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

  if (!sent.ok) {
    console.error('[Low stock email] Failed', { orderId, invoiceNumber, ...mailFailureForLog(sent) })
  } else {
    console.info('Low stock email sent', { orderId, invoiceNumber, provider: sent.provider })
  }

  return { sent: sent.ok }
}
