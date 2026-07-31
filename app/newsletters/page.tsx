import Image from 'next/image'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { BackButton } from '@/components/layout/back-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { listNewsletterIssues, formatNewsletterMonth } from '@/lib/newsletters'
import { buildMetadata } from '@/utils/seo'
import { Download, FileText } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Newsletter Archive',
  description: 'Read previous Phonics Club newsletters by month and year.',
  path: '/newsletters',
})

export const dynamic = 'force-dynamic'

export default async function NewslettersPage() {
  const newsletters = await listNewsletterIssues()
  const grouped = newsletters.reduce<Record<string, typeof newsletters>>((acc, issue) => {
    const key = String(issue.year)
    acc[key] = acc[key] ?? []
    acc[key].push(issue)
    return acc
  }, {})

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a))

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <BackButton fallbackHref="/" />
        <div className="mb-10 overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-8 lg:p-10">
              <Badge className="mb-4 bg-[#1D4ED8]">Newsletter Archive</Badge>
              <h1 className="text-3xl font-bold sm:text-4xl">Past Phonics Club Newsletters</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Browse previous newsletters by month and year.
              </p>
            </div>
            <div className="relative min-h-56 bg-slate-50 lg:min-h-full">
              <Image
                src="/images/gallery/pl.jpg"
                alt="Phonics Club newsletter and learning activity"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 480px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />
            </div>
          </div>
        </div>

        {years.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[#1D4ED8]" />
            <p className="font-semibold">No newsletters are available yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Please check back soon.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {years.map((year) => (
              <section key={year}>
                <h2 className="mb-4 text-2xl font-bold">{year}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {grouped[year].map((issue) => (
                    <article key={issue.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8]/10">
                          <FileText className="h-5 w-5 text-[#1D4ED8]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1D4ED8]">
                            {formatNewsletterMonth(issue.month)} {issue.year}
                          </p>
                          <h3 className="font-bold">{issue.title}</h3>
                        </div>
                      </div>
                      <Button asChild variant="outline" className="rounded-xl">
                        <a href={issue.file_url} target="_blank" rel="noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          View / Download
                        </a>
                      </Button>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  )
}
