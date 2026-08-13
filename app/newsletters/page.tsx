import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Download, FileText, MapPin, UserRound } from 'lucide-react'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { BackButton } from '@/components/layout/back-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GradientRibbon, yearFromValue } from '@/components/blog/gradient-thumbnail'
import { listNewsletterIssues, formatNewsletterMonth } from '@/lib/newsletters'
import {
  eventCategoryLabel,
  TRAINING_EVENT_ARTICLES,
  type TrainingEventArticle,
} from '@/lib/data/training-events-blog'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({
  title: 'Newsletter Archive',
  description: 'Read previous Phonics Club newsletters by month and year.',
  path: '/newsletters',
})

export const dynamic = 'force-dynamic'

function articleYear(article: TrainingEventArticle) {
  return String(new Date(article.sortDate).getFullYear())
}

function articlePerson(article: TrainingEventArticle) {
  return article.trainer ?? article.guest ?? null
}

function NewsletterCard({ article }: { article: TrainingEventArticle }) {
  const person = articlePerson(article)

  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-[#1D4ED8] hover:shadow-md">
      <div className="flex min-w-0 flex-col p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className="w-fit bg-[#1D4ED8] capitalize text-white">{eventCategoryLabel(article.category)}</Badge>
          <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-bold text-[#92400E]">{articleYear(article)}</span>
        </div>
        <Link href={`/newsletter/${article.slug}`}>
          <h3 className="whitespace-normal break-words text-xl font-bold leading-tight text-[#0F172A] group-hover:text-[#1D4ED8]">{article.title}</h3>
        </Link>
        <GradientRibbon year={yearFromValue(article.sortDate)} className="mt-3" />
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{article.excerpt}</p>
        <div className="mt-5 grid gap-2 text-sm text-slate-500 lg:grid-cols-2">
          <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#1D4ED8]" />{article.dateDisplay}</span>
          {article.location || article.city ? <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#D30000]" />{article.location ?? article.city}</span> : null}
          {person ? <span className="flex items-center gap-2 lg:col-span-2"><UserRound className="h-4 w-4 text-[#8B1E2D]" />{person}</span> : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/newsletter/${article.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#1D4ED8]">
            Read newsletter
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href={`/api/site/announcements?newsletterPdf=${encodeURIComponent(article.slug)}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#D30000]">
            <Download className="h-4 w-4" />
            Download Event Newsletter (PDF)
          </a>
        </div>
      </div>
    </article>
  )
}

export default async function NewslettersPage() {
  const uploadedNewsletters = await listNewsletterIssues()
  const articleNewsletters = TRAINING_EVENT_ARTICLES.filter((article) => article.published)
    .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
  const articleGroups = articleNewsletters.reduce<Record<string, TrainingEventArticle[]>>((acc, article) => {
    const key = articleYear(article)
    acc[key] = acc[key] ?? []
    acc[key].push(article)
    return acc
  }, {})
  const grouped = uploadedNewsletters.reduce<Record<string, typeof uploadedNewsletters>>((acc, issue) => {
    const key = String(issue.year)
    acc[key] = acc[key] ?? []
    acc[key].push(issue)
    return acc
  }, {})

  const articleYears = Object.keys(articleGroups).sort((a, b) => Number(b) - Number(a))
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a))

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <section className="relative isolate overflow-hidden bg-[#0F172A] text-white">
        <Image
          src="/images/gallery/pl.jpg"
          alt="Phonics Club newsletter and learning activity"
          fill
          priority
          className="absolute inset-0 -z-20 object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0F172A]/95 via-[#0F172A]/74 to-[#1D4ED8]/24" />
        <div className="mx-auto w-full max-w-none px-6 py-12 sm:px-8 lg:px-10 lg:py-16">
          <BackButton fallbackHref="/" />
          <div className="mt-8 max-w-5xl">
            <Badge className="mb-4 bg-[#1D4ED8] text-white">Newsletter Archive</Badge>
            <h1 className="text-4xl font-bold tracking-normal text-white sm:text-5xl">Phonics Club Newsletters</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-white/86 sm:text-lg">
              Browse training, webinar, event and pilot-project newsletters by year and date.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-none px-6 py-12 sm:px-8 lg:px-10">
        <div className="space-y-10">
          {articleYears.map((year) => (
            <section key={year}>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b pb-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-[#1D4ED8]">Newsletters</p>
                  <h2 className="text-3xl font-bold text-[#0F172A]">{year}</h2>
                </div>
                <p className="text-sm text-slate-500">{articleGroups[year].length} item{articleGroups[year].length === 1 ? '' : 's'}</p>
              </div>
              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {articleGroups[year].map((article) => <NewsletterCard key={article.id} article={article} />)}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-none px-6 pb-14 sm:px-8 lg:px-10">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-wide text-[#1D4ED8]">Uploaded PDFs</p>
          <h2 className="text-3xl font-bold text-[#0F172A]">Past PDF Newsletters</h2>
        </div>
        {years.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[#1D4ED8]" />
            <p className="font-semibold">No PDF newsletters are uploaded yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Use the article newsletters above for now.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {years.map((year) => (
              <section key={year}>
                <h2 className="mb-4 text-2xl font-bold">{year}</h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {grouped[year].map((issue) => (
                    <article key={issue.id} className="rounded-lg border bg-card p-5 shadow-sm">
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
