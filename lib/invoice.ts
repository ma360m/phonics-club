import { COMPANY } from '@/lib/company'
import { SHIPPING_FEE_PKR } from '@/lib/commerce'
import { formatPrice } from '@/utils/format'
import type { Order } from '@/types/database'

interface InvoiceTemplate {
  header?: string
  tagline?: string
  footer?: string
}

export function generateInvoiceNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `PC-${date}-${rand}`
}

export function buildInvoiceHtml(
  order: Order & {
    invoice_number?: string
    subtotal?: number
    shipping_fee?: number
    discount_amount?: number
    coupon_code?: string
    member_id?: string
    payment_method?: string
    phone?: string
  },
  template?: InvoiceTemplate
): string {
  const items = order.items as { name: string; quantity: number; price: number }[]
  const subtotal = Number(order.subtotal ?? order.total)
  const shipping = Number(order.shipping_fee ?? SHIPPING_FEE_PKR)
  const discount = Number(order.discount_amount ?? 0)
  const grandTotal = subtotal + shipping - discount
  const addr = order.shipping_address as Record<string, string> | null

  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatPrice(i.price)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatPrice(i.price * i.quantity)}</td></tr>`
    )
    .join('')

  const footerNote =
    template?.footer ??
    'Phonics Club reserves the right to increase or decrease shipping fees based on quantity, distance, and product weight.'

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${order.invoice_number ?? order.id.slice(0, 8)}</title></head>
<body style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#111">
  <div style="border-bottom:3px solid #1D4ED8;padding-bottom:16px;margin-bottom:24px">
    <h1 style="margin:0;color:#1D4ED8">${template?.header ?? 'PHONICS CLUB PVT LTD'}</h1>
    <p style="margin:4px 0 0;color:#666">${template?.tagline ?? COMPANY.tagline}</p>
  </div>
  <div style="display:flex;justify-content:space-between;margin-bottom:24px">
    <div>
      <p><strong>Invoice #:</strong> ${order.invoice_number ?? order.id.slice(0, 8).toUpperCase()}</p>
      <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-PK')}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Payment:</strong> ${order.payment_method === 'credit' ? 'Bank Transfer' : 'Cash on Delivery'}</p>
    </div>
    <div style="text-align:right">
      <p><strong>Bill To:</strong></p>
      <p>${addr?.fullName ?? ''}</p>
      <p>${addr?.email ?? ''}</p>
      <p>${order.phone ?? addr?.phone ?? ''}</p>
      <p>${addr?.address ?? ''}, ${addr?.city ?? ''}</p>
      <p>${addr?.country ?? 'Pakistan'}</p>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead><tr style="background:#f1f5f9">
      <th style="padding:8px;text-align:left">Item</th>
      <th style="padding:8px;text-align:center">Qty</th>
      <th style="padding:8px;text-align:right">Price</th>
      <th style="padding:8px;text-align:right">Total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div style="text-align:right;margin-bottom:24px">
    <p>Subtotal: ${formatPrice(subtotal)}</p>
    <p>Shipping: ${formatPrice(shipping)}</p>
    ${discount > 0 ? `<p>Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}: -${formatPrice(discount)}</p>` : ''}
    ${order.member_id ? `<p>Member ID: ${order.member_id}</p>` : ''}
    <p style="font-size:1.25em;font-weight:bold;color:#1D4ED8">Grand Total: ${formatPrice(grandTotal)}</p>
  </div>
  <div style="background:#f8fafc;padding:16px;border-radius:8px;font-size:12px;color:#475569">
    <p style="margin:0"><strong>Shipping Notice:</strong> ${footerNote}</p>
    <p style="margin:8px 0 0">Contact: ${COMPANY.adminEmail} | ${COMPANY.phoneDisplay}</p>
  </div>
</body></html>`
}
