import { NextResponse } from 'next/server'
import { getTrainingEventBySlug } from '@/lib/data/training-events-blog'
import { buildEventNewsletterPdf, newsletterPdfFileName } from '@/lib/newsletter-pdf'
import { getAnnouncements } from '@/lib/site-content'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const newsletterSlug = url.searchParams.get('newsletterPdf')

  if (newsletterSlug) {
    const article = getTrainingEventBySlug(newsletterSlug)
    if (!article) return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })

    const pdfBytes = await buildEventNewsletterPdf(article)
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${newsletterPdfFileName(article.slug)}"`,
      },
    })
  }

  const announcements = await getAnnouncements()
  return NextResponse.json(announcements, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  })
}
