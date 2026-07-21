import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { COMPANY, COMPANY_BANK_DETAILS } from '@/lib/company'
import { buildInvoiceSummary, formatDiscountPercent, type InvoiceOrder } from '@/lib/invoice-summary'
import { getCustomerOrderStatusLabel } from '@/lib/order-status'
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

type PdfColor = ReturnType<typeof rgb>

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

function drawRight(page: PDFPage, text: string, xRight: number, y: number, size: number, font: PDFFont, color = rgb(0, 0, 0)) {
  const width = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: xRight - width, y, size, font, color })
}

function drawCentered(page: PDFPage, text: string, xCenter: number, y: number, size: number, font: PDFFont, color = rgb(0, 0, 0)) {
  const textWidth = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: xCenter - textWidth / 2, y, size, font, color })
}

function drawCell(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  options: { fill?: PdfColor; border?: PdfColor; borderWidth?: number } = {}
) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: options.fill,
    borderColor: options.border ?? rgb(0.68, 0.76, 0.9),
    borderWidth: options.borderWidth ?? 0.75,
  })
}

function drawCellText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  size: number,
  font: PDFFont,
  align: 'left' | 'right' | 'center' = 'left',
  color = rgb(0.07, 0.09, 0.15)
) {
  const padding = 7
  const textY = y + height - size - 7
  if (align === 'right') {
    drawRight(page, text, x + width - padding, textY, size, font, color)
    return
  }
  if (align === 'center') {
    drawCentered(page, text, x + width / 2, textY, size, font, color)
    return
  }
  page.drawText(text, { x: x + padding, y: textY, size, font, color })
}

function drawCellLines(
  page: PDFPage,
  lines: string[],
  x: number,
  y: number,
  width: number,
  height: number,
  size: number,
  font: PDFFont,
  align: 'left' | 'right' = 'left',
  color = rgb(0.07, 0.09, 0.15)
) {
  const padding = 7
  const lineHeight = size + 3
  let textY = y + height - size - 7
  for (const line of lines) {
    if (align === 'right') {
      drawRight(page, line, x + width - padding, textY, size, font, color)
    } else {
      page.drawText(line, { x: x + padding, y: textY, size, font, color })
    }
    textY -= lineHeight
  }
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
  page.drawText(`Status: ${getCustomerOrderStatusLabel(order.status, order.payment_method)}`, { x: margin, y, size: 10, font })
  y -= 14
  page.drawText(`Date: ${new Date(order.created_at).toLocaleDateString('en-PK')}`, { x: margin, y, size: 10, font })
  y -= 14
  page.drawText(`Payment: ${shopPaymentLabel(order.payment_method)}`, { x: margin, y, size: 10, font })

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

  y = Math.min(y, billY) - 24

  const tableBorder = rgb(0.68, 0.76, 0.9)
  const tableHeaderFill = rgb(0.92, 0.95, 1)
  const tableX = margin
  const tableWidth = width - margin * 2
  const tableColumns = [
    { label: 'Item', x: tableX, width: 222, align: 'left' as const },
    { label: 'Qty', x: tableX + 222, width: 42, align: 'center' as const },
    { label: 'Price', x: tableX + 264, width: 74, align: 'right' as const },
    { label: 'Discount', x: tableX + 338, width: 92, align: 'right' as const },
    { label: 'Total', x: tableX + 430, width: tableWidth - 430, align: 'right' as const },
  ]
  const headerHeight = 24
  let tableBottom = y - headerHeight

  for (const column of tableColumns) {
    drawCell(page, column.x, tableBottom, column.width, headerHeight, {
      fill: tableHeaderFill,
      border: tableBorder,
      borderWidth: 0.9,
    })
    drawCellText(page, column.label, column.x, tableBottom, column.width, headerHeight, 9, fontBold, column.align)
  }

  y = tableBottom
  let renderedLines = 0
  for (const line of summary.lines) {
    const nameLines = wrapText(line.item.name, 34).slice(0, 4)
    const discountLines = line.lineDiscount > 0
      ? [formatDiscountPercent(line.discountPercent), `-${formatPrice(line.lineDiscount)}`]
      : ['-']
    const rowHeight = Math.max(30, Math.max(nameLines.length, discountLines.length) * 11 + 14)
    if (y - rowHeight < 335) break

    const rowBottom = y - rowHeight
    for (const column of tableColumns) {
      drawCell(page, column.x, rowBottom, column.width, rowHeight, {
        fill: rgb(1, 1, 1),
        border: tableBorder,
      })
    }
    drawCellLines(page, nameLines, tableColumns[0].x, rowBottom, tableColumns[0].width, rowHeight, 8.5, font)
    drawCellText(page, String(line.item.quantity), tableColumns[1].x, rowBottom, tableColumns[1].width, rowHeight, 8.5, font, 'center')
    drawCellText(page, formatPrice(line.item.price), tableColumns[2].x, rowBottom, tableColumns[2].width, rowHeight, 8.5, font, 'right')
    drawCellLines(page, discountLines, tableColumns[3].x, rowBottom, tableColumns[3].width, rowHeight, 8, font, 'right', rgb(0.3, 0.36, 0.45))
    drawCellText(page, formatPrice(line.lineTotal), tableColumns[4].x, rowBottom, tableColumns[4].width, rowHeight, 8.5, fontBold, 'right')

    y = rowBottom
    renderedLines += 1
  }

  if (renderedLines < summary.lines.length && y - 24 >= 335) {
    const rowBottom = y - 24
    drawCell(page, tableX, rowBottom, tableWidth, 24, { fill: rgb(1, 1, 1), border: tableBorder })
    drawCellText(page, `${summary.lines.length - renderedLines} more item(s) continue in the order record`, tableX, rowBottom, tableWidth, 24, 8, font, 'left', rgb(0.3, 0.36, 0.45))
    y = rowBottom
  }

  y -= 18
  const totalsRows: Array<[string, string, boolean]> = [
    ['Items Total', formatPrice(summary.subtotal), false],
  ]
  if (summary.discount > 0) {
    totalsRows.push([
      `Final Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}`,
      `-${formatPrice(summary.discount)}`,
      false,
    ])
  }
  totalsRows.push(['Total after Discount', formatPrice(summary.totalAfterDiscount), false])
  totalsRows.push(['Shipping Fee', formatPrice(summary.shipping), false])
  if (order.member_id) totalsRows.push(['Member ID', order.member_id, false])
  totalsRows.push(['Balance Due', formatPrice(summary.balanceDue), true])
  const totalsBoxWidth = 270
  const totalsLabelWidth = 154
  const totalsValueWidth = totalsBoxWidth - totalsLabelWidth
  const totalsX = width - margin - totalsBoxWidth
  const totalsRowHeight = 23

  totalsRows.forEach(([label, value, strong], index) => {
    const rowBottom = y - (index + 1) * totalsRowHeight
    const fill = strong ? rgb(0.9, 0.94, 1) : rgb(1, 1, 1)
    const color = strong ? rgb(0.11, 0.31, 0.85) : rgb(0.07, 0.09, 0.15)
    const rowFont = strong ? fontBold : font
    drawCell(page, totalsX, rowBottom, totalsLabelWidth, totalsRowHeight, { fill, border: tableBorder, borderWidth: 0.9 })
    drawCell(page, totalsX + totalsLabelWidth, rowBottom, totalsValueWidth, totalsRowHeight, { fill, border: tableBorder, borderWidth: 0.9 })
    drawCellText(page, label, totalsX, rowBottom, totalsLabelWidth, totalsRowHeight, strong ? 10.5 : 9, rowFont, 'left', color)
    drawCellText(page, value, totalsX + totalsLabelWidth, rowBottom, totalsValueWidth, totalsRowHeight, strong ? 10.5 : 9, rowFont, 'right', color)
  })

  y -= totalsRows.length * totalsRowHeight + 28
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
