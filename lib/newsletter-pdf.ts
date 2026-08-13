import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { eventCategoryLabel, type TrainingEventArticle } from '@/lib/data/training-events-blog'

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN = 54
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

function cleanPdfText(value?: string | null) {
  return (value ?? '')
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .trim()
}

export function newsletterPdfFileName(slug: string) {
  return `${slug.replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}-newsletter.pdf`
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = cleanPdfText(text).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next
    } else {
      if (line) lines.push(line)
      line = word
    }
  }

  if (line) lines.push(line)
  return lines
}

function addPage(pdfDoc: PDFDocument) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: rgb(0.97, 0.98, 1) })
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 22, width: PAGE_WIDTH, height: 22, color: rgb(0.11, 0.31, 0.85) })
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 28, width: PAGE_WIDTH, height: 6, color: rgb(0.98, 0.75, 0.14) })
  return page
}

function drawWrapped(
  pdfDoc: PDFDocument,
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  options: { font: PDFFont; size: number; lineHeight: number; color?: ReturnType<typeof rgb>; maxWidth?: number },
) {
  let currentPage = page
  let currentY = y

  for (const line of wrapText(text, options.font, options.size, options.maxWidth ?? CONTENT_WIDTH)) {
    if (currentY < MARGIN) {
      currentPage = addPage(pdfDoc)
      currentY = PAGE_HEIGHT - MARGIN
    }
    currentPage.drawText(line, {
      x,
      y: currentY,
      size: options.size,
      font: options.font,
      color: options.color ?? rgb(0.08, 0.1, 0.16),
    })
    currentY -= options.lineHeight
  }

  return { page: currentPage, y: currentY }
}

export async function buildEventNewsletterPdf(article: TrainingEventArticle) {
  const pdfDoc = await PDFDocument.create()
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  let page = addPage(pdfDoc)
  let y = PAGE_HEIGHT - 70

  page.drawText('PHONICS CLUB EVENT NEWSLETTER', {
    x: MARGIN,
    y,
    size: 11,
    font: bold,
    color: rgb(0.11, 0.31, 0.85),
  })
  y -= 28

  let result = drawWrapped(pdfDoc, page, article.title, MARGIN, y, {
    font: bold,
    size: 23,
    lineHeight: 28,
    color: rgb(0.05, 0.07, 0.12),
  })
  page = result.page
  y = result.y - 10

  const meta = [
    article.dateDisplay,
    article.location ?? article.city,
    article.trainer ?? article.guest,
    eventCategoryLabel(article.category),
  ].filter(Boolean).join(' | ')

  result = drawWrapped(pdfDoc, page, meta, MARGIN, y, {
    font: bold,
    size: 10,
    lineHeight: 14,
    color: rgb(0.11, 0.31, 0.85),
  })
  page = result.page
  y = result.y - 18

  result = drawWrapped(pdfDoc, page, article.excerpt, MARGIN, y, {
    font: regular,
    size: 12,
    lineHeight: 18,
    color: rgb(0.29, 0.35, 0.43),
  })
  page = result.page
  y = result.y - 18

  for (const paragraph of article.body) {
    result = drawWrapped(pdfDoc, page, paragraph, MARGIN, y, {
      font: regular,
      size: 11,
      lineHeight: 17,
    })
    page = result.page
    y = result.y - 9
  }

  for (const section of article.sections ?? []) {
    if (y < 95) {
      page = addPage(pdfDoc)
      y = PAGE_HEIGHT - MARGIN
    }
    page.drawText(cleanPdfText(section.title), {
      x: MARGIN,
      y,
      size: 15,
      font: bold,
      color: rgb(0.05, 0.07, 0.12),
    })
    y -= 22

    for (const paragraph of section.paragraphs ?? []) {
      result = drawWrapped(pdfDoc, page, paragraph, MARGIN, y, {
        font: regular,
        size: 11,
        lineHeight: 17,
      })
      page = result.page
      y = result.y - 8
    }

    for (const item of section.items ?? []) {
      result = drawWrapped(pdfDoc, page, `- ${item}`, MARGIN + 12, y, {
        font: regular,
        size: 11,
        lineHeight: 17,
        maxWidth: CONTENT_WIDTH - 12,
      })
      page = result.page
      y = result.y - 4
    }
    y -= 6
  }

  if (article.bulletSection) {
    if (y < 95) {
      page = addPage(pdfDoc)
      y = PAGE_HEIGHT - MARGIN
    }
    page.drawText(cleanPdfText(article.bulletSection.title), {
      x: MARGIN,
      y,
      size: 15,
      font: bold,
      color: rgb(0.05, 0.07, 0.12),
    })
    y -= 22
    for (const item of article.bulletSection.items) {
      result = drawWrapped(pdfDoc, page, `- ${item}`, MARGIN + 12, y, {
        font: regular,
        size: 11,
        lineHeight: 17,
        maxWidth: CONTENT_WIDTH - 12,
      })
      page = result.page
      y = result.y - 4
    }
  }

  return pdfDoc.save()
}
