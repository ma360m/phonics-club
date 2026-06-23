import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { COMPANY } from '@/lib/company'
import { SHIPPING_FEE_PKR } from '@/lib/commerce'
import { formatPrice } from '@/utils/format'
import type { Order } from '@/types/database'

interface InvoiceTemplate {
  header?: string
  tagline?: string
  footer?: string
}

type InvoiceOrder = Order & {
  invoice_number?: string
  subtotal?: number
  shipping_fee?: number
  discount_amount?: number
  coupon_code?: string
  member_id?: string
  payment_method?: string
  phone?: string
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxChars) {
      if (line) lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export async function buildInvoicePdf(
  order: InvoiceOrder,
  template?: InvoiceTemplate
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()

  const items = order.items as { name: string; quantity: number; price: number }[]
  const subtotal = Number(order.subtotal ?? order.total)
  const shipping = Number(order.shipping_fee ?? SHIPPING_FEE_PKR)
  const discount = Number(order.discount_amount ?? 0)
  const grandTotal = subtotal + shipping - discount
  const addr = order.shipping_address as Record<string, string> | null
  const footerNote =
    template?.footer ??
    'Phonics Club reserves the right to increase or decrease shipping fees based on quantity, distance, and product weight.'

  let y = height - 50

  page.drawText(template?.header ?? 'PHONICS CLUB PVT LTD', {
    x: 50,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.11, 0.31, 0.85),
  })
  y -= 18
  page.drawText(template?.tagline ?? COMPANY.tagline, {
    x: 50,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  })
  y -= 30

  const invoiceNo = order.invoice_number ?? order.id.slice(0, 8).toUpperCase()
  page.drawText(`Invoice #: ${invoiceNo}`, { x: 50, y, size: 10, font })
  page.drawText(`Date: ${new Date(order.created_at).toLocaleDateString('en-PK')}`, {
    x: 320,
    y,
    size: 10,
    font,
  })
  y -= 14
  page.drawText(`Status: ${order.status}`, { x: 50, y, size: 10, font })
  page.drawText(
    `Payment: ${order.payment_method === 'credit' ? 'Bank Transfer' : 'Cash on Delivery'}`,
    { x: 320, y, size: 10, font }
  )
  y -= 24

  page.drawText('Bill To:', { x: 320, y, size: 10, font: fontBold })
  y -= 14
  for (const line of [
    addr?.fullName ?? '',
    addr?.email ?? '',
    order.phone ?? addr?.phone ?? '',
    `${addr?.address ?? ''}, ${addr?.city ?? ''}`,
    addr?.country ?? 'Pakistan',
  ].filter(Boolean)) {
    page.drawText(line, { x: 320, y, size: 9, font })
    y -= 12
  }

  y -= 10
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
  y -= 18

  page.drawText('Item', { x: 50, y, size: 9, font: fontBold })
  page.drawText('Qty', { x: 320, y, size: 9, font: fontBold })
  page.drawText('Price', { x: 380, y, size: 9, font: fontBold })
  page.drawText('Total', { x: 480, y, size: 9, font: fontBold })
  y -= 14

  for (const item of items) {
    if (y < 120) break
    const nameLines = wrapText(item.name, 42)
    page.drawText(nameLines[0] ?? item.name, { x: 50, y, size: 9, font })
    page.drawText(String(item.quantity), { x: 325, y, size: 9, font })
    page.drawText(formatPrice(item.price), { x: 380, y, size: 9, font })
    page.drawText(formatPrice(item.price * item.quantity), { x: 480, y, size: 9, font })
    y -= 12
    for (let i = 1; i < nameLines.length; i++) {
      page.drawText(nameLines[i], { x: 50, y, size: 9, font })
      y -= 12
    }
    y -= 4
  }

  y -= 10
  page.drawText(`Subtotal: ${formatPrice(subtotal)}`, { x: 380, y, size: 10, font })
  y -= 14
  page.drawText(`Shipping: ${formatPrice(shipping)}`, { x: 380, y, size: 10, font })
  y -= 14
  if (discount > 0) {
    page.drawText(
      `Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}: -${formatPrice(discount)}`,
      { x: 380, y, size: 10, font }
    )
    y -= 14
  }
  if (order.member_id) {
    page.drawText(`Member ID: ${order.member_id}`, { x: 380, y, size: 10, font })
    y -= 14
  }
  page.drawText(`Grand Total: ${formatPrice(grandTotal)}`, {
    x: 380,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.11, 0.31, 0.85),
  })

  y = 80
  for (const line of wrapText(`Shipping Notice: ${footerNote}`, 90)) {
    page.drawText(line, { x: 50, y, size: 8, font, color: rgb(0.35, 0.35, 0.35) })
    y -= 10
  }
  page.drawText(`Contact: ${COMPANY.adminEmail} | ${COMPANY.phoneDisplay}`, {
    x: 50,
    y: y - 4,
    size: 8,
    font,
    color: rgb(0.35, 0.35, 0.35),
  })

  return pdfDoc.save()
}

export function generateOrderAccessToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}
