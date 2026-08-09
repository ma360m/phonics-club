import { COMPANY, COMPANY_BANK_DETAILS } from '@/lib/company'
import { buildInvoiceSummary, formatDiscountPercent, type InvoiceOrder } from '@/lib/invoice-summary'
import { getCustomerOrderStatusLabel } from '@/lib/order-status'
import { shopPaymentLabel } from '@/lib/payment-methods'
import { formatPrice } from '@/utils/format'
import { formatCurrency } from '@/lib/currency'

interface InvoiceTemplate {
  header?: string
  tagline?: string
  footer?: string
  bankDetails?: {
    bankName?: string
    accountTitle?: string
    accountNumber?: string
    iban?: string
    instructions?: string
  }
}

export function generateInvoiceNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `INV_${date}_${rand}`
}

function invoiceFileSegment(value: unknown, maxLength = 80): string {
  return String(value ?? '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, maxLength)
}

export function invoiceFileBaseName(invoiceNumber: string, customerName?: unknown): string {
  const invoiceSegment = invoiceFileSegment(invoiceNumber, 40) || 'invoice'
  const customerSegment = invoiceFileSegment(customerName).toUpperCase()
  return customerSegment ? `${invoiceSegment}_${customerSegment}` : invoiceSegment
}

export function invoiceCustomerName(order: Pick<InvoiceOrder, 'shipping_address' | 'guest_email'>): string {
  const address = order.shipping_address as Record<string, unknown> | null
  return String(
    address?.fullName ??
      address?.customerName ??
      address?.name ??
      order.guest_email?.split('@')[0] ??
      '',
  )
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function invoiceTagline(value?: string) {
  const tagline = value?.trim() ?? ''
  if (/official\s+jolly.*distributor/i.test(tagline)) return ''
  return tagline
}

export function buildInvoiceHtml(order: InvoiceOrder, template?: InvoiceTemplate): string {
  const summary = buildInvoiceSummary(order)
  const addr = order.shipping_address as Record<string, string> | null
  const bankDetails = {
    ...COMPANY_BANK_DETAILS,
    ...(template?.bankDetails ?? {}),
  }
  const tagline = invoiceTagline(template?.tagline)
  const displayCurrency = order.display_currency === 'USD' ? 'USD' : null
  const exchangeRate = Number(order.exchange_rate ?? 0)
  const displaySubtotal = Number(order.display_subtotal ?? 0)
  const displayShipping = Number(order.display_shipping_fee ?? 0)
  const displayDiscount = Number(order.display_discount_amount ?? 0)
  const displayTotal = Number(order.display_total ?? 0)
  const discountLabel =
    order.coupon_code || order.member_id
      ? [
          order.coupon_code ? `Coupon ${escapeHtml(order.coupon_code)}${Number(order.coupon_discount_percent ?? 0) > 0 ? ` (${formatDiscountPercent(Number(order.coupon_discount_percent))})` : ''}` : null,
          order.member_id ? `Member ID ${escapeHtml(order.member_id)}${Number(order.member_discount_percent ?? 0) > 0 ? ` (${formatDiscountPercent(Number(order.member_discount_percent))})` : ''}` : null,
        ].filter(Boolean).join(' + ')
      : formatDiscountPercent(summary.discountPercent)
  const usdSummary =
    displayCurrency && exchangeRate && displayTotal
      ? `<div style="margin-bottom:24px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:8px;padding:14px;color:#1e3a8a">
          <p style="margin:0 0 8px;font-weight:bold">USD Display Summary</p>
          ${displaySubtotal ? `<p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0 0 4px"><span>Items Total</span><strong>${formatCurrency(displaySubtotal, 'USD', { freeLabel: false })}</strong></p>` : ''}
          ${displayDiscount ? `<p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0 0 4px"><span>Discount</span><strong>-${formatCurrency(displayDiscount, 'USD', { freeLabel: false })}</strong></p>` : ''}
          ${displayShipping ? `<p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0 0 4px"><span>Shipping</span><strong>${formatCurrency(displayShipping, 'USD', { freeLabel: false })}</strong></p>` : ''}
          <p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:6px 0 0;font-size:1.08em"><span>Displayed Total</span><strong>${formatCurrency(displayTotal, 'USD', { freeLabel: false })}</strong></p>
          <p style="margin:8px 0 0;color:#475569;font-size:12px">Official order total remains ${formatCurrency(summary.balanceDue, 'PKR', { freeLabel: false, useCode: true })}. Exchange rate: 1 USD = ${escapeHtml(exchangeRate.toLocaleString('en-PK'))} PKR.</p>
        </div>`
      : ''

  const rows = summary.lines
    .map((line) => {
      const discountText = line.lineDiscount > 0
        ? `${formatDiscountPercent(line.discountPercent)}<br><span style="color:#64748b">-${formatPrice(line.lineDiscount)}</span>`
        : '-'
      const stockNote = line.item.stock_note
        ? `<br><span style="display:block;margin-top:4px;color:#b45309;font-size:12px;font-weight:700">${escapeHtml(line.item.stock_note)}</span>`
        : ''
      return `<tr>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(line.item.name)}${stockNote}</td>
        <td style="padding:10px;border:1px solid #cbd5e1;text-align:center">${line.item.quantity}</td>
        <td style="padding:10px;border:1px solid #cbd5e1;text-align:right">${formatPrice(line.item.price)}</td>
        <td style="padding:10px;border:1px solid #cbd5e1;text-align:right">${discountText}</td>
        <td style="padding:10px;border:1px solid #cbd5e1;text-align:right">${formatPrice(line.lineTotal)}</td>
      </tr>`
    })
    .join('')

  const footerNote =
    template?.footer ??
    'Phonics Club reserves the right to increase or decrease shipping fees based on quantity, distance, and product weight.'

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(order.invoice_number ?? order.id.slice(0, 8))}</title></head>
<body style="font-family:Arial,sans-serif;max-width:840px;margin:0 auto;padding:24px;color:#111827;background:#FBF3D2">
  <main style="background:#FFF8E1;border:1px solid #E8DFAE;border-radius:12px;padding:28px">
    <div style="border-top:5px solid #1D4ED8;padding:18px 0;margin-bottom:24px;display:grid;grid-template-columns:130px 1fr 130px;align-items:center;gap:20px">
      <img src="/logo.png" alt="Phonics Club logo" style="width:118px;height:72px;object-fit:contain" />
      <div style="text-align:center">
        <h1 style="margin:0;color:#1D4ED8;font-size:28px;letter-spacing:0">${escapeHtml(template?.header ?? 'PHONICS CLUB PVT LTD')}</h1>
        ${tagline ? `<p style="margin:6px 0 0;color:#475569">${escapeHtml(tagline)}</p>` : ''}
      </div>
      <div></div>
    </div>

    <div style="display:flex;justify-content:space-between;gap:32px;margin-bottom:24px">
      <div style="min-width:240px">
        <p style="margin:4px 0"><strong>Invoice #:</strong> ${escapeHtml(order.invoice_number ?? order.id.slice(0, 8).toUpperCase())}</p>
        <p style="margin:4px 0"><strong>Status:</strong> ${escapeHtml(getCustomerOrderStatusLabel(order.status, order.payment_method))}</p>
        <p style="margin:4px 0"><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-PK')}</p>
        <p style="margin:4px 0"><strong>Payment:</strong> ${shopPaymentLabel(order.payment_method)}</p>
      </div>
      <div style="min-width:240px;text-align:left">
        <p style="margin:4px 0 8px"><strong>Bill To:</strong></p>
        <p style="margin:4px 0">${escapeHtml(addr?.fullName ?? '')}</p>
        <p style="margin:4px 0">${escapeHtml(addr?.email ?? '')}</p>
        <p style="margin:4px 0">${escapeHtml(order.phone ?? addr?.phone ?? '')}</p>
        <p style="margin:4px 0">${escapeHtml(addr?.address ?? '')}${addr?.city ? `, ${escapeHtml(addr.city)}` : ''}</p>
        <p style="margin:4px 0">${escapeHtml(addr?.country ?? 'Pakistan')}</p>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:white;border:1px solid #b6c3d8">
      <thead><tr style="background:#f1f5f9">
        <th style="padding:10px;text-align:left;border:1px solid #b6c3d8">Item</th>
        <th style="padding:10px;text-align:center;border:1px solid #b6c3d8">Qty</th>
        <th style="padding:10px;text-align:right;border:1px solid #b6c3d8">Price</th>
        <th style="padding:10px;text-align:right;border:1px solid #b6c3d8">Discount</th>
        <th style="padding:10px;text-align:right;border:1px solid #b6c3d8">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;margin-bottom:24px">
      <div style="width:340px;border:1px solid #b6c3d8;background:white;border-radius:8px;overflow:hidden">
        <p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0;padding:10px 12px;border-bottom:1px solid #cbd5e1"><span>Items Total</span><strong>${formatPrice(summary.subtotal)}</strong></p>
        ${summary.discount > 0 ? `<p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0;padding:10px 12px;border-bottom:1px solid #cbd5e1"><span>Final Discount - ${discountLabel}</span><strong>-${formatPrice(summary.discount)}</strong></p>` : ''}
        <p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0;padding:10px 12px;border-bottom:1px solid #cbd5e1"><span>Total after Discount</span><strong>${formatPrice(summary.totalAfterDiscount)}</strong></p>
        ${summary.shippingDiscount > 0 ? `<p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0;padding:10px 12px;border-bottom:1px solid #cbd5e1"><span>Shipping Waived${order.shipping_discount_reason ? ` (${escapeHtml(order.shipping_discount_reason)})` : ''}</span><strong>-${formatPrice(summary.shippingDiscount)}</strong></p>` : ''}
        <p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0;padding:10px 12px;border-bottom:1px solid #cbd5e1"><span>Shipping Fee</span><strong>${formatPrice(summary.shipping)}</strong></p>
        ${order.member_id ? `<p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0;padding:10px 12px;border-bottom:1px solid #cbd5e1"><span>Member ID</span><strong>${escapeHtml(order.member_id)}</strong></p>` : ''}
        <p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0;padding:12px;background:#eaf0ff;font-size:1.15em;color:#1D4ED8"><span>Balance Due</span><strong>${formatPrice(summary.balanceDue)}</strong></p>
        ${displayCurrency && exchangeRate && displayTotal ? `<p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0;padding:10px 12px;background:#f8fafc;color:#64748b;font-size:12px"><span>Displayed at checkout</span><strong>${formatCurrency(displayTotal, 'USD', { freeLabel: false })}</strong></p><p style="margin:0;padding:0 12px 10px;background:#f8fafc;color:#64748b;font-size:12px">Exchange rate: 1 USD = ${escapeHtml(exchangeRate.toLocaleString('en-PK'))} PKR</p>` : ''}
      </div>
    </div>
    ${usdSummary}

    <div style="border:1.5px solid #94A3B8;background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:24px">
      <p style="margin:0 0 8px;font-weight:bold;color:#111827">Bank Details</p>
      <p style="margin:4px 0"><strong>Bank:</strong> ${escapeHtml(bankDetails.bankName)}</p>
      <p style="margin:4px 0"><strong>Account Title:</strong> ${escapeHtml(bankDetails.accountTitle)}</p>
      <p style="margin:4px 0"><strong>Account Number:</strong> ${escapeHtml(bankDetails.accountNumber)}</p>
      ${bankDetails.iban ? `<p style="margin:4px 0"><strong>IBAN:</strong> ${escapeHtml(bankDetails.iban)}</p>` : ''}
      ${bankDetails.instructions ? `<p style="margin:8px 0 0;color:#475569;font-size:12px">${escapeHtml(bankDetails.instructions)}</p>` : ''}
    </div>

    <div style="background:#f8fafc;padding:16px;border-radius:8px;font-size:12px;color:#475569">
      <p style="margin:0"><strong>Shipping Notice:</strong> ${escapeHtml(footerNote)}</p>
      <p style="margin:8px 0 0">Contact: ${escapeHtml(COMPANY.adminEmail)} | 0308 4432015 | 0300 8079480</p>
    </div>
  </main>
</body></html>`
}
