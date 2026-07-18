import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { COMPANY, COMPANY_BANK_DETAILS } from '@/lib/company'
import { buildInvoiceSummary, formatDiscountPercent, type InvoiceOrder } from '@/lib/invoice-summary'
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

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxChars) {
      if (line) lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawRight(page: PDFPage, text: string, xRight: number, y: number, size: number, font: PDFFont) {
  const width = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: xRight - width, y, size, font })
}

function drawCentered(page: PDFPage, text: string, xCenter: number, y: number, size: number, font: PDFFont, color = rgb(0, 0, 0)) {
  const textWidth = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: xCenter - textWidth / 2, y, size, font, color })
}

function paymentLabel(method?: string | null) {
  return method === 'credit' ? 'Bank Transfer' : 'Cash on Delivery'
}

function invoiceTagline(value?: string) {
  const tagline = value?.trim() ?? ''
  if (/official\s+jolly.*distributor/i.test(tagline)) return ''
  return tagline
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

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 0.97, 0.82) })

  const summary = buildInvoiceSummary(order)
  const addr = order.shipping_address as Record<string, string> | null
  const bankDetails = {
    ...COMPANY_BANK_DETAILS,
    ...(template?.bankDetails ?? {}),
  }
  const footerNote =
    template?.footer ??
    'Phonics Club reserves the right to increase or decrease shipping fees based on quantity, distance, and product weight.'
  const tagline = invoiceTagline(template?.tagline)
  const margin = 50
  let y = height - 48

  page.drawLine({ start: { x: margin, y: y + 18 }, end: { x: width - margin, y: y + 18 }, thickness: 4, color: rgb(0.11, 0.31, 0.85) })

  try {
    const logoBytes = await readFile(join(process.cwd(), 'public', 'logo.png'))
    const logo = await pdfDoc.embedPng(logoBytes)
    const dims = logo.scaleToFit(112, 58)
    page.drawImage(logo, { x: margin, y: y - 48, width: dims.width, height: dims.height })
  } catch {
    /* logo is optional */
  }

  drawCentered(page, template?.header ?? 'PHONICS CLUB PVT LTD', width / 2, y, 18, fontBold, rgb(0.11, 0.31, 0.85))
  if (tagline) {
    drawCentered(page, tagline, width / 2, y - 18, 9, font, rgb(0.3, 0.36, 0.45))
  }

  y -= 98
  const invoiceNo = order.invoice_number ?? order.id.slice(0, 8).toUpperCase()
  page.drawText(`Invoice #: ${invoiceNo}`, { x: margin, y, size: 10, font })
  y -= 14
  page.drawText(`Status: ${order.status}`, { x: margin, y, size: 10, font })
  y -= 14
  page.drawText(`Date: ${new Date(order.created_at).toLocaleDateString('en-PK')}`, { x: margin, y, size: 10, font })
  y -= 14
  page.drawText(`Payment: ${paymentLabel(order.payment_method)}`, { x: margin, y, size: 10, font })

  let billY = height - 146
  page.drawText('Bill To:', { x: 330, y: billY, size: 10, font: fontBold })
  billY -= 14
  for (const line of [
    addr?.fullName ?? '',
    addr?.email ?? '',
    order.phone ?? addr?.phone ?? '',
    `${addr?.address ?? ''}${addr?.city ? `, ${addr.city}` : ''}`,
    addr?.country ?? 'Pakistan',
  ].filter(Boolean)) {
    for (const wrapped of wrapText(line, 36)) {
      page.drawText(wrapped, { x: 330, y: billY, size: 9, font })
      billY -= 12
    }
  }

  y = Math.min(y, billY) - 22
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
  y -= 20

  page.drawText('Item', { x: margin, y, size: 9, font: fontBold })
  page.drawText('Qty', { x: 280, y, size: 9, font: fontBold })
  page.drawText('Price', { x: 320, y, size: 9, font: fontBold })
  page.drawText('Discount', { x: 390, y, size: 9, font: fontBold })
  page.drawText('Total', { x: 500, y, size: 9, font: fontBold })
  y -= 14

  for (const line of summary.lines) {
    if (y < 190) break
    const nameLines = wrapText(line.item.name, 36)
    page.drawText(nameLines[0] ?? line.item.name, { x: margin, y, size: 9, font })
    page.drawText(String(line.item.quantity), { x: 284, y, size: 9, font })
    page.drawText(formatPrice(line.item.price), { x: 320, y, size: 9, font })
    const discountLabel = line.lineDiscount > 0
      ? `${formatDiscountPercent(line.discountPercent)} (-${formatPrice(line.lineDiscount)})`
      : '-'
    page.drawText(discountLabel, { x: 390, y, size: 8, font })
    drawRight(page, formatPrice(line.lineTotal), width - margin, y, 9, font)
    y -= 12
    for (let i = 1; i < nameLines.length; i++) {
      page.drawText(nameLines[i], { x: margin, y, size: 9, font })
      y -= 12
    }
    y -= 5
  }

  y -= 8
  const totalsX = 350
  const totalsRight = width - margin
  page.drawText('Items Total', { x: totalsX, y, size: 10, font })
  drawRight(page, formatPrice(summary.subtotal), totalsRight, y, 10, fontBold)
  y -= 14
  if (summary.discount > 0) {
    page.drawText(`Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}`, { x: totalsX, y, size: 10, font })
    drawRight(page, `-${formatPrice(summary.discount)}`, totalsRight, y, 10, fontBold)
    y -= 14
  }
  page.drawText('Total after Discount', { x: totalsX, y, size: 10, font })
  drawRight(page, formatPrice(summary.totalAfterDiscount), totalsRight, y, 10, fontBold)
  y -= 14
  page.drawText('Shipping', { x: totalsX, y, size: 10, font })
  drawRight(page, formatPrice(summary.shipping), totalsRight, y, 10, fontBold)
  y -= 14
  if (order.member_id) {
    page.drawText(`Member ID: ${order.member_id}`, { x: totalsX, y, size: 9, font })
    y -= 14
  }
  page.drawLine({ start: { x: totalsX, y: y + 18 }, end: { x: totalsRight, y: y + 18 }, thickness: 1.5, color: rgb(0.11, 0.31, 0.85) })
  page.drawText('Balance Due', { x: totalsX, y, size: 12, font: fontBold, color: rgb(0.11, 0.31, 0.85) })
  drawRight(page, formatPrice(summary.balanceDue), totalsRight, y, 12, fontBold)

  y -= 34
  if (y < 150) y = 150

  const bankLines = [
    `Bank: ${bankDetails.bankName}`,
    `Account Title: ${bankDetails.accountTitle}`,
    `Account Number: ${bankDetails.accountNumber}`,
    `IBAN: ${bankDetails.iban}`,
  ]
  const instructionLines = bankDetails.instructions ? wrapText(bankDetails.instructions, 72) : []
  const bankBoxHeight = 34 + bankLines.length * 12 + instructionLines.length * 10 + 14
  const bankBoxTop = y + 14
  page.drawRectangle({
    x: margin,
    y: bankBoxTop - bankBoxHeight,
    width: width - margin * 2,
    height: bankBoxHeight,
    borderColor: rgb(0.62, 0.68, 0.75),
    borderWidth: 1,
    color: rgb(0.97, 0.98, 0.99),
  })

  page.drawText('Bank Details', { x: margin + 14, y, size: 10, font: fontBold })
  y -= 16
  for (const line of bankLines) {
    page.drawText(line, { x: margin + 14, y, size: 9, font })
    y -= 12
  }
  for (const line of instructionLines) {
    page.drawText(line, { x: margin + 14, y, size: 8, font, color: rgb(0.35, 0.35, 0.35) })
    y -= 10
  }

  y = 80
  for (const line of wrapText(`Shipping Notice: ${footerNote}`, 90)) {
    page.drawText(line, { x: margin, y, size: 8, font, color: rgb(0.35, 0.35, 0.35) })
    y -= 10
  }
  page.drawText(`Contact: ${COMPANY.adminEmail} | ${COMPANY.phoneDisplay}`, {
    x: margin,
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
