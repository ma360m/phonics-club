import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Course } from '@/types/database'

export interface CertificatePdfInput {
  certificateNumber: string
  studentName: string
  course: Course
  issuedAt: Date
  onlineMinutes: number
  offlineMinutes: number
  finalScore: number | null
  verificationUrl: string
}

function hours(minutes: number): string {
  const value = Math.round((minutes / 60) * 10) / 10
  return `${value} hours`
}

export async function buildCertificatePdf(input: CertificatePdfInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([842, 595])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 0.99, 0.94) })
  page.drawRectangle({ x: 38, y: 38, width: width - 76, height: height - 76, borderColor: rgb(0.11, 0.31, 0.85), borderWidth: 3 })
  page.drawRectangle({ x: 54, y: 54, width: width - 108, height: height - 108, borderColor: rgb(0.83, 0, 0), borderWidth: 1 })

  page.drawText('PHONICS CLUB', {
    x: 315,
    y: height - 112,
    size: 28,
    font: bold,
    color: rgb(0.11, 0.31, 0.85),
  })
  page.drawText('Certificate of Completion', {
    x: 265,
    y: height - 168,
    size: 30,
    font: bold,
    color: rgb(0.83, 0, 0),
  })
  page.drawText('This certifies that', { x: 355, y: height - 220, size: 14, font, color: rgb(0.25, 0.25, 0.25) })
  page.drawText(input.studentName, {
    x: Math.max(90, 421 - input.studentName.length * 7),
    y: height - 270,
    size: 32,
    font: bold,
    color: rgb(0.05, 0.07, 0.12),
  })
  page.drawText('has successfully completed', { x: 334, y: height - 314, size: 14, font, color: rgb(0.25, 0.25, 0.25) })
  page.drawText(input.course.title, {
    x: Math.max(80, 421 - input.course.title.length * 4.7),
    y: height - 354,
    size: 18,
    font: bold,
    color: rgb(0.11, 0.31, 0.85),
  })

  const details = [
    `Instructor: ${input.course.instructor ?? 'Phonics Club'}`,
    `Completion date: ${input.issuedAt.toLocaleDateString('en-PK')}`,
    `Online learning: ${hours(input.onlineMinutes)}`,
    `Approved offline learning: ${hours(input.offlineMinutes)}`,
    `Final score: ${input.finalScore ?? 0}%`,
  ]
  details.forEach((line, index) => {
    page.drawText(line, { x: 150 + (index % 2) * 290, y: 176 - Math.floor(index / 2) * 28, size: 11, font })
  })

  page.drawText(`Certificate #: ${input.certificateNumber}`, { x: 92, y: 82, size: 10, font: bold })
  page.drawText(`Verify: ${input.verificationUrl}`, { x: 92, y: 64, size: 9, font })
  page.drawText('Authorized by Phonics Club', { x: width - 255, y: 82, size: 12, font: bold })

  return pdfDoc.save()
}
