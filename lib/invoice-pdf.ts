import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { COMPANY, COMPANY_BANK_DETAILS } from '@/lib/company'
import { normalizeShopBankDetails } from '@/lib/bank-details'
import {
  buildInvoiceSummary,
  formatDiscountPercent,
  invoiceHasProvidedDiscount,
  type InvoiceOrder,
} from '@/lib/invoice-summary'
import { getCustomerOrderStatusLabel } from '@/lib/order-status'
import { shopPaymentLabel } from '@/lib/payment-methods'
import { formatPrice } from '@/utils/format'
import { formatCurrency } from '@/lib/currency'
import { INVOICE_STOCK_PAYMENT_NOTICE } from '@/lib/invoice-notices'

interface InvoiceTemplate {
  header?: string
  tagline?: string
  footer?: string
  contactPhoneDisplay?: string
  bankDetails?: {
    bankName?: string
    accountTitle?: string
    accountNumber?: string
    iban?: string
    instructions?: string
  }
}

type PdfColor = ReturnType<typeof rgb>

function pdfText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/\u20A8/g, 'Rs')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?')
}

function wrapText(text: string, maxChars: number): string[] {
  const words = pdfText(text).split(/\s+/)
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
  const safeText = pdfText(text)
  const width = font.widthOfTextAtSize(safeText, size)
  page.drawText(safeText, { x: xRight - width, y, size, font, color })
}

function drawCentered(page: PDFPage, text: string, xCenter: number, y: number, size: number, font: PDFFont, color = rgb(0, 0, 0)) {
  const safeText = pdfText(text)
  const textWidth = font.widthOfTextAtSize(safeText, size)
  page.drawText(safeText, { x: xCenter - textWidth / 2, y, size, font, color })
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
  page.drawText(pdfText(text), { x: x + padding, y: textY, size, font, color })
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
      page.drawText(pdfText(line), { x: x + padding, y: textY, size, font, color })
    }
    textY -= lineHeight
  }
}

function invoiceTagline(value?: string) {
  const tagline = value?.trim() ?? ''
  if (/official\s+jolly.*distributor/i.test(tagline)) return ''
  return tagline
}

function discountMeta(order: InvoiceOrder) {
  return [
    order.coupon_code ? `Coupon code: ${order.coupon_code}` : null,
    order.member_id ? `Member ID: ${order.member_id}` : null,
  ].filter(Boolean).join(' | ')
}

function shippingValue(summary: ReturnType<typeof buildInvoiceSummary>) {
  if (summary.shippingDiscount > 0) {
    const originalShipping = summary.shipping + summary.shippingDiscount
    return `${formatPrice(summary.shipping)} (was ${formatPrice(originalShipping)})`
  }

  return formatPrice(summary.shipping)
}

export async function buildInvoicePdf(
  order: InvoiceOrder,
  template?: InvoiceTemplate
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const pageSize: [number, number] = [595.28, 841.89]
  const [width, height] = pageSize
  const margin = 50
  const pageBottomLimit = 70

  let logo: PDFImage | null = null
  try {
    const logoBytes = await readFile(join(process.cwd(), 'public', 'logo.png'))
    logo = await pdfDoc.embedPng(logoBytes)
  } catch {
    /* logo is optional */
  }

  const summary = buildInvoiceSummary(order)
  const showDiscountBreakdown = invoiceHasProvidedDiscount(order)
  const addr = order.shipping_address as Record<string, string> | null
  const bankDetails = normalizeShopBankDetails(COMPANY_BANK_DETAILS)
  const showBankDetails = true
  const discountMetaText = discountMeta(order)
  const footerNote =
    template?.footer ??
    'Phonics Club reserves the right to increase or decrease shipping fees based on quantity, distance, and product weight.'
  const tagline = invoiceTagline(template?.tagline)
  const contactPhoneDisplay = template?.contactPhoneDisplay?.trim() || COMPANY.phoneDisplay
  const invoiceNo = order.invoice_number ?? order.id.slice(0, 8).toUpperCase()

  const tableBorder = rgb(0.68, 0.76, 0.9)
  const tableHeaderFill = rgb(0.92, 0.95, 1)
  const tableX = margin
  const tableWidth = width - margin * 2
  const tableColumns = showDiscountBreakdown
    ? [
        { label: '#', x: tableX, width: 30, align: 'center' as const },
        { label: 'Item', x: tableX + 30, width: 200, align: 'left' as const },
        { label: 'Qty', x: tableX + 230, width: 42, align: 'center' as const },
        { label: 'Price', x: tableX + 272, width: 74, align: 'right' as const },
        { label: 'Discount', x: tableX + 346, width: 92, align: 'right' as const },
        { label: 'Total', x: tableX + 438, width: tableWidth - 438, align: 'right' as const },
      ]
    : [
        { label: '#', x: tableX, width: 30, align: 'center' as const },
        { label: 'Item', x: tableX + 30, width: 254, align: 'left' as const },
        { label: 'Qty', x: tableX + 284, width: 42, align: 'center' as const },
        { label: 'Price', x: tableX + 326, width: 84, align: 'right' as const },
        { label: 'Total', x: tableX + 410, width: tableWidth - 410, align: 'right' as const },
      ]
  const headerHeight = 24

  function addInvoicePage() {
    const nextPage = pdfDoc.addPage(pageSize)
    nextPage.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 0.97, 0.82) })
    return nextPage
  }

  function drawFirstPageHeader(targetPage: PDFPage) {
    let currentY = height - 48
    targetPage.drawLine({ start: { x: margin, y: currentY + 18 }, end: { x: width - margin, y: currentY + 18 }, thickness: 4, color: rgb(0.11, 0.31, 0.85) })

    if (logo) {
      const dims = logo.scaleToFit(112, 58)
      targetPage.drawImage(logo, { x: margin, y: currentY - 48, width: dims.width, height: dims.height })
    }

    drawCentered(targetPage, template?.header ?? 'PHONICS CLUB PVT LTD', width / 2, currentY, 18, fontBold, rgb(0.11, 0.31, 0.85))
    if (tagline) {
      drawCentered(targetPage, tagline, width / 2, currentY - 18, 9, font, rgb(0.3, 0.36, 0.45))
    }

    currentY -= 98
    targetPage.drawText(pdfText(`Invoice #: ${invoiceNo}`), { x: margin, y: currentY, size: 10, font })
    currentY -= 14
    targetPage.drawText(pdfText(`Status: ${getCustomerOrderStatusLabel(order.status, order.payment_method)}`), { x: margin, y: currentY, size: 10, font })
    currentY -= 14
    targetPage.drawText(pdfText(`Date: ${new Date(order.created_at).toLocaleDateString('en-PK')}`), { x: margin, y: currentY, size: 10, font })
    currentY -= 14
    targetPage.drawText(pdfText(`Payment: ${shopPaymentLabel(order.payment_method)}`), { x: margin, y: currentY, size: 10, font })

    let billY = height - 146
    targetPage.drawText('Bill To:', { x: 330, y: billY, size: 10, font: fontBold })
    billY -= 14
    for (const line of [
      addr?.fullName ?? '',
      addr?.email ?? '',
      order.phone ?? addr?.phone ?? '',
      `${addr?.address ?? ''}${addr?.city ? `, ${addr.city}` : ''}`,
      addr?.country ?? 'Pakistan',
    ].filter(Boolean)) {
      for (const wrapped of wrapText(line, 36)) {
        targetPage.drawText(pdfText(wrapped), { x: 330, y: billY, size: 9, font })
        billY -= 12
      }
    }

    return Math.min(currentY, billY) - 24
  }

  function drawContinuationHeader(targetPage: PDFPage, label: string) {
    const topY = height - 46
    targetPage.drawLine({ start: { x: margin, y: topY + 16 }, end: { x: width - margin, y: topY + 16 }, thickness: 4, color: rgb(0.11, 0.31, 0.85) })

    if (logo) {
      const dims = logo.scaleToFit(82, 42)
      targetPage.drawImage(logo, { x: margin, y: topY - 36, width: dims.width, height: dims.height })
    }

    drawCentered(targetPage, template?.header ?? 'PHONICS CLUB PVT LTD', width / 2, topY, 14, fontBold, rgb(0.11, 0.31, 0.85))
    targetPage.drawText(pdfText(`Invoice #: ${invoiceNo} | ${label}`), {
      x: margin,
      y: topY - 56,
      size: 9,
      font,
      color: rgb(0.3, 0.36, 0.45),
    })

    return topY - 78
  }

  function drawTableHeader(targetPage: PDFPage, topY: number) {
    const tableBottom = topY - headerHeight
    for (const column of tableColumns) {
      drawCell(targetPage, column.x, tableBottom, column.width, headerHeight, {
        fill: tableHeaderFill,
        border: tableBorder,
        borderWidth: 0.9,
      })
      drawCellText(targetPage, column.label, column.x, tableBottom, column.width, headerHeight, 9, fontBold, column.align)
    }

    return tableBottom
  }

  function drawInvoiceLine(targetPage: PDFPage, line: (typeof summary.lines)[number], rowBottom: number, rowHeight: number) {
    const nameLines = wrapText(line.item.name, 34)
    const stockNoteLines = line.item.stock_note ? wrapText(line.item.stock_note, 36).slice(0, 2) : []
    const itemLines = nameLines.concat(stockNoteLines).slice(0, 6)
    const discountLines = line.lineDiscount > 0
      ? [formatDiscountPercent(line.discountPercent), `-${formatPrice(line.lineDiscount)}`]
      : ['-']
    const totalColumn = tableColumns[showDiscountBreakdown ? 5 : 4]
    const lineDisplayTotal = showDiscountBreakdown ? line.lineTotal : line.lineSubtotal

    for (const column of tableColumns) {
      drawCell(targetPage, column.x, rowBottom, column.width, rowHeight, {
        fill: rgb(1, 1, 1),
        border: tableBorder,
      })
    }
    drawCellText(targetPage, String(line.position), tableColumns[0].x, rowBottom, tableColumns[0].width, rowHeight, 8, font, 'center', rgb(0.39, 0.45, 0.55))
    drawCellLines(targetPage, itemLines, tableColumns[1].x, rowBottom, tableColumns[1].width, rowHeight, 8.5, font)
    drawCellText(targetPage, String(line.item.quantity), tableColumns[2].x, rowBottom, tableColumns[2].width, rowHeight, 8.5, font, 'center')
    drawCellText(targetPage, formatPrice(line.item.price), tableColumns[3].x, rowBottom, tableColumns[3].width, rowHeight, 8.5, font, 'right')
    if (showDiscountBreakdown) {
      drawCellLines(targetPage, discountLines, tableColumns[4].x, rowBottom, tableColumns[4].width, rowHeight, 8, font, 'right', rgb(0.3, 0.36, 0.45))
    }
    drawCellText(targetPage, formatPrice(lineDisplayTotal), totalColumn.x, rowBottom, totalColumn.width, rowHeight, 8.5, fontBold, 'right')
  }

  function lineRowHeight(line: (typeof summary.lines)[number]) {
    const nameLines = wrapText(line.item.name, 34)
    const stockNoteLines = line.item.stock_note ? wrapText(line.item.stock_note, 36).slice(0, 2) : []
    const itemLineCount = nameLines.concat(stockNoteLines).slice(0, 6).length
    const discountLineCount = showDiscountBreakdown && line.lineDiscount > 0 ? 2 : 1
    return Math.max(30, Math.max(itemLineCount, discountLineCount) * 11 + 14)
  }

  let page = addInvoicePage()
  let y = drawTableHeader(page, drawFirstPageHeader(page))
  for (const line of summary.lines) {
    const rowHeight = lineRowHeight(line)
    if (y - rowHeight < pageBottomLimit) {
      page = addInvoicePage()
      y = drawTableHeader(page, drawContinuationHeader(page, 'Items continued'))
    }

    const rowBottom = y - rowHeight
    drawInvoiceLine(page, line, rowBottom, rowHeight)
    y = rowBottom
  }

  const totalsRows: Array<[string, string, boolean]> = [
    ['Items Total', formatPrice(summary.subtotal), false],
    ['Total Quantity', String(summary.totalQuantity), false],
  ]
  if (showDiscountBreakdown && summary.discount > 0) {
    totalsRows.push([
      `Discount (${formatDiscountPercent(Number(order.discount_percent ?? summary.discountPercent))})`,
      `-${formatPrice(summary.discount)}`,
      false,
    ])
  }
  if (showDiscountBreakdown) {
    totalsRows.push(['Total after Discount', formatPrice(summary.totalAfterDiscount), false])
  }
  totalsRows.push(['Shipping', shippingValue(summary), false])
  totalsRows.push(['Balance Due', formatPrice(summary.balanceDue), true])
  if (order.display_currency === 'USD' && order.display_total && order.exchange_rate) {
    if (order.display_subtotal) {
      totalsRows.push(['USD Items Total', formatCurrency(Number(order.display_subtotal), 'USD', { freeLabel: false }), false])
    }
    if (showDiscountBreakdown && order.display_discount_amount) {
      totalsRows.push(['USD Discount', `-${formatCurrency(Number(order.display_discount_amount), 'USD', { freeLabel: false })}`, false])
    }
    if (order.display_shipping_fee) {
      totalsRows.push(['USD Shipping', formatCurrency(Number(order.display_shipping_fee), 'USD', { freeLabel: false }), false])
    }
    totalsRows.push([
      'USD Display Total',
      `${formatCurrency(Number(order.display_total), 'USD', { freeLabel: false })} @ ${Number(order.exchange_rate).toLocaleString('en-PK')}`,
      false,
    ])
  }
  const totalsBoxWidth = 270
  const totalsLabelWidth = 154
  const totalsValueWidth = totalsBoxWidth - totalsLabelWidth
  const totalsX = width - margin - totalsBoxWidth
  const totalsRowHeight = 23
  const discountMetaLines = discountMetaText ? wrapText(discountMetaText, 52) : []
  const discountMetaHeight = discountMetaLines.length ? discountMetaLines.length * 9 + 8 : 0
  const bankLines = [
    `Bank: ${bankDetails.bankName}`,
    `Account Title: ${bankDetails.accountTitle}`,
    `Account Number: ${bankDetails.accountNumber}`,
  ].concat(bankDetails.iban ? [`IBAN: ${bankDetails.iban}`] : [])
  const instructionLines = bankDetails.instructions ? wrapText(bankDetails.instructions, 72) : []
  const bankBoxHeight = showBankDetails ? 34 + bankLines.length * 12 + instructionLines.length * 10 + 14 : 0
  const stockPaymentNoticeLines = wrapText(`Stock & Payment Notice: ${INVOICE_STOCK_PAYMENT_NOTICE}`, 90)
  const footerLines = [
    ...stockPaymentNoticeLines,
    ...wrapText(`Shipping Notice: ${footerNote}`, 90),
  ]
  const footerLineHeight = 10
  const footerBottomY = 56
  const footerStartY = footerBottomY + footerLines.length * footerLineHeight + 8
  const footerReserveHeight = footerStartY + 22
  const requiredSummarySpace =
    18 + totalsRows.length * totalsRowHeight + discountMetaHeight + (showBankDetails ? 28 + bankBoxHeight : 12) + footerReserveHeight

  if (y < requiredSummarySpace) {
    page = addInvoicePage()
    y = drawContinuationHeader(page, 'Summary')
  }

  y -= 18

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

  y -= totalsRows.length * totalsRowHeight
  if (discountMetaLines.length) {
    y -= 10
    for (const line of discountMetaLines) {
      page.drawText(pdfText(line), { x: totalsX + 7, y, size: 7.5, font, color: rgb(0.39, 0.45, 0.55) })
      y -= 9
    }
  }

  y -= showBankDetails ? 28 : 12
  if (showBankDetails) {
    if (y < bankBoxHeight + footerReserveHeight) y = bankBoxHeight + footerReserveHeight
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
      page.drawText(pdfText(line), { x: margin + 14, y, size: 9, font })
      y -= 12
    }
    for (const line of instructionLines) {
      page.drawText(pdfText(line), { x: margin + 14, y, size: 8, font, color: rgb(0.35, 0.35, 0.35) })
      y -= 10
    }
  }

  y = footerStartY
  footerLines.forEach((line, index) => {
    const color = index < stockPaymentNoticeLines.length ? rgb(0.57, 0.25, 0.05) : rgb(0.35, 0.35, 0.35)
    page.drawText(pdfText(line), { x: margin, y, size: 8, font, color })
    y -= 10
  })
  page.drawText(pdfText(`Contact: ${COMPANY.adminEmail} | ${contactPhoneDisplay}`), {
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
