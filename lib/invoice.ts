import { COMPANY, COMPANY_BANK_DETAILS } from '@/lib/company'
import { buildInvoiceSummary, formatDiscountPercent, type InvoiceOrder } from '@/lib/invoice-summary'
import { shopPaymentLabel } from '@/lib/payment-methods'
import { formatPrice } from '@/utils/format'

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

export function invoiceFileBaseName(invoiceNumber: string): string {
  return (
    invoiceNumber
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'invoice'
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

  const rows = summary.lines
    .map((line) => {
      const discountText = line.lineDiscount > 0
        ? `${formatDiscountPercent(line.discountPercent)}<br><span style="color:#64748b">-${formatPrice(line.lineDiscount)}</span>`
        : '-'
      return `<tr>
        <td style="padding:10px;border:1px solid #cbd5e1">${escapeHtml(line.item.name)}</td>
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
        <p style="margin:4px 0"><strong>Status:</strong> ${escapeHtml(order.status)}</p>
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
        ${summary.discount > 0 ? `<p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0;padding:10px 12px;border-bottom:1px solid #cbd5e1"><span>Final Discount${order.coupon_code ? ` (${escapeHtml(order.coupon_code)})` : ''}</span><strong>-${formatPrice(summary.discount)}</strong></p>` : ''}
        <p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0;padding:10px 12px;border-bottom:1px solid #cbd5e1"><span>Total after Discount</span><strong>${formatPrice(summary.totalAfterDiscount)}</strong></p>
        <p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0;padding:10px 12px;border-bottom:1px solid #cbd5e1"><span>Shipping Fee</span><strong>${formatPrice(summary.shipping)}</strong></p>
        ${order.member_id ? `<p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0;padding:10px 12px;border-bottom:1px solid #cbd5e1"><span>Member ID</span><strong>${escapeHtml(order.member_id)}</strong></p>` : ''}
        <p style="display:grid;grid-template-columns:1fr auto;gap:12px;margin:0;padding:12px;background:#eaf0ff;font-size:1.15em;color:#1D4ED8"><span>Balance Due</span><strong>${formatPrice(summary.balanceDue)}</strong></p>
      </div>
    </div>

    <div style="border:1.5px solid #94A3B8;background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:24px">
      <p style="margin:0 0 8px;font-weight:bold;color:#111827">Bank Details</p>
      <p style="margin:4px 0"><strong>Bank:</strong> ${escapeHtml(bankDetails.bankName)}</p>
      <p style="margin:4px 0"><strong>Account Title:</strong> ${escapeHtml(bankDetails.accountTitle)}</p>
      <p style="margin:4px 0"><strong>Account Number:</strong> ${escapeHtml(bankDetails.accountNumber)}</p>
      <p style="margin:4px 0"><strong>IBAN:</strong> ${escapeHtml(bankDetails.iban)}</p>
      ${bankDetails.instructions ? `<p style="margin:8px 0 0;color:#475569;font-size:12px">${escapeHtml(bankDetails.instructions)}</p>` : ''}
    </div>

    <div style="background:#f8fafc;padding:16px;border-radius:8px;font-size:12px;color:#475569">
      <p style="margin:0"><strong>Shipping Notice:</strong> ${escapeHtml(footerNote)}</p>
      <p style="margin:8px 0 0">Contact: ${escapeHtml(COMPANY.adminEmail)} | ${escapeHtml(COMPANY.phoneDisplay)}</p>
    </div>
  </main>
</body></html>`
}
