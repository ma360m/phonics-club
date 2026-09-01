import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarDays, Download, ExternalLink, MapPin, UserRound } from 'lucide-react'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { getBlogPostBySlug } from '@/lib/data/queries'
import { buildMetadata, articleJsonLd } from '@/utils/seo'
import { JsonLd } from '@/components/seo/json-ld'
import { formatDate } from '@/utils/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BlogGalleryLightbox } from '@/components/blog/blog-gallery-lightbox'
import { ShareButtons } from '@/components/blog/share-buttons'
import { cn } from '@/lib/utils'
import {
  eventCategoryLabel,
  getRelatedTrainingEvents,
  getTrainingEventBySlug,
  getTrainingEventGallery,
  getTrainingEventHeroImage,
  trainingEventJsonLd,
} from '@/lib/data/training-events-blog'
import { CANONICAL_URL } from '@/lib/constants'
import { gradientForYear, yearFromValue } from '@/components/blog/gradient-thumbnail'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = getTrainingEventBySlug(slug)
  const post = await getBlogPostBySlug(slug)
  if (!post) return {}

  return buildMetadata({
    title: event?.seoTitle ?? post.seo_title ?? post.title,
    description: event?.seoDescription ?? post.seo_description ?? post.excerpt ?? undefined,
    path: `/blog/${post.slug}`,
    image: event ? getTrainingEventHeroImage(event) ?? post.cover_image ?? undefined : post.cover_image ?? undefined,
    type: 'article',
  })
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-[#0F172A]">{value}</p>
    </div>
  )
}

function usableHeroImage(value?: string | null) {
  if (!value || value === '/logo.png') return null
  return value
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

  const event = getTrainingEventBySlug(slug)
  const galleryImages = post.gallery_images ?? (event ? getTrainingEventGallery(event) : [])
  const heroImage = usableHeroImage(event ? getTrainingEventHeroImage(event) ?? post.cover_image : post.cover_image)
  const articleUrl = `${CANONICAL_URL}/blog/${post.slug}`
  const related = event ? getRelatedTrainingEvents(event) : []
  const hasRelated = related.length > 0
  const showGallery = Boolean(event || galleryImages.length)
  const fallbackGradient = gradientForYear(yearFromValue(post.created_at))

  return (
    <main>
      <JsonLd data={event ? trainingEventJsonLd(event) : articleJsonLd(post)} />
      <AnnouncementBar />
      <Navbar />

      <article>
        <header className={cn('relative overflow-hidden border-b', heroImage ? 'bg-[#F8FAFC]' : fallbackGradient.className)}>
          {!heroImage ? (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_78%_8%,rgba(255,255,255,0.14),transparent_24%)]" />
              <div className={cn('absolute inset-x-0 bottom-0 h-2', fallbackGradient.accentClassName)} />
            </>
          ) : null}
          <div className={cn('relative mx-auto w-full max-w-none px-6 py-8 sm:px-8 lg:px-10', heroImage ? '' : 'text-current')}>
            <Badge className={cn('mb-4 capitalize', heroImage ? 'bg-[#1D4ED8]' : 'bg-white/20 text-current ring-1 ring-white/30')}>{event ? eventCategoryLabel(event.category) : eventCategoryLabel(post.category)}</Badge>
            <h1 className={cn('text-4xl font-bold leading-tight sm:text-5xl', heroImage ? 'text-[#0F172A]' : '')}>{post.title}</h1>
            {post.excerpt ? <p className={cn('mt-5 max-w-5xl text-lg leading-8', heroImage ? 'text-slate-600' : 'opacity-90')}>{post.excerpt}</p> : null}
            <div className={cn('mt-6 flex flex-wrap gap-4 text-sm', heroImage ? 'text-slate-600' : 'opacity-90')}>
              <span className="flex items-center gap-2">
                <CalendarDays className={cn('h-4 w-4', heroImage ? 'text-[#1D4ED8]' : '')} />
                {event?.dateDisplay ?? formatDate(post.created_at)}
              </span>
              {event?.location ? (
                <span className="flex items-center gap-2">
                  <MapPin className={cn('h-4 w-4', heroImage ? 'text-[#D30000]' : '')} />
                  {event.location}
                </span>
              ) : null}
              {event?.trainer || event?.guest ? (
                <span className="flex items-center gap-2">
                  <UserRound className={cn('h-4 w-4', heroImage ? 'text-[#8B1E2D]' : '')} />
                  {event.trainer ?? event.guest}
                </span>
              ) : null}
            </div>
          </div>
        </header>

        {showGallery ? (
          <section className="border-b bg-white" aria-label="Event photo gallery">
            {galleryImages.length ? (
              <BlogGalleryLightbox images={galleryImages} />
            ) : (
              <div className="mx-auto w-full max-w-none px-6 py-6 sm:px-8 lg:px-10">
                <div className="rounded-lg border border-dashed border-[#BFDBFE] bg-[#EFF6FF] p-6 text-sm leading-6 text-[#1D4ED8]">
                  Event gallery coming soon.
                </div>
              </div>
            )}
          </section>
        ) : null}

        {heroImage ? (
          <section className="mx-auto w-full max-w-none px-6 py-5 sm:px-8 lg:px-10">
            <div className="relative aspect-[18/5] max-h-[300px] min-h-[170px] overflow-hidden rounded-lg border bg-[#EFF6FF] shadow-sm">
              <Image src={heroImage} alt={post.title} fill priority className="object-cover" sizes="100vw" />
            </div>
          </section>
        ) : null}

        <div
          className={cn(
            'mx-auto grid w-full max-w-none gap-8 px-6 pb-14 pt-4 sm:px-8 lg:px-10',
            hasRelated ? 'lg:grid-cols-[minmax(0,1fr)_360px]' : 'lg:grid-cols-1',
          )}
        >
          <div className="min-w-0">
            {event ? (
              <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold text-[#0F172A]">Event at a Glance</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Date" value={event.dateDisplay} />
                  <Field label="Venue" value={event.venue ?? event.location} />
                  <Field label="City" value={event.city} />
                  <Field label={event.guest ? 'Guest' : 'Trainer'} value={event.trainer ?? event.guest} />
                  <Field label="Organized by" value={event.organizer} />
                  <Field label="Partners" value={event.partners?.join(', ')} />
                  <Field label="Format" value={event.format} />
                  <Field label="Time" value={event.timeDisplay} />
                  <Field label="Participants" value={event.participants} />
                  <Field label="Audience" value={event.audience} />
                </div>
              </section>
            ) : null}

            <div
              className="pc-blog-content prose prose-lg w-full max-w-none rounded-lg border border-slate-200 bg-white p-6 leading-8 shadow-sm prose-headings:text-[#0F172A] prose-a:text-[#1D4ED8] sm:p-8"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {event?.originalPostUrls?.length || event ? (
              <section className="mt-8 flex flex-wrap gap-3">
                {event.originalPostUrls?.map((url, index) => (
                  <Button key={url} asChild variant="outline" className="rounded-xl bg-white">
                    <a href={url} target="_blank" rel="noreferrer">
                      View Original Post on Instagram{event.originalPostUrls!.length > 1 ? ` ${index + 1}` : ''} <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                ))}
                {event.newsletterUrl ? (
                  <Button asChild className="rounded-xl bg-[#1D4ED8]">
                    <a href={event.newsletterUrl}>Read the Full Newsletter -&gt;</a>
                  </Button>
                ) : null}
                <Button asChild variant="outline" className="rounded-xl bg-white">
                  <a href={`/api/site/announcements?newsletterPdf=${encodeURIComponent(event.slug)}`}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Event Newsletter (PDF)
                  </a>
                </Button>
              </section>
            ) : null}

            {post.tags?.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link key={tag} href={`/blog?q=${encodeURIComponent(tag)}`}>
                    <Badge variant="outline" className="rounded-full bg-white">{tag}</Badge>
                  </Link>
                ))}
              </div>
            ) : null}

            <section className="mt-10 rounded-lg border border-slate-200 bg-[#F8FAFC] p-6">
              <h2 className="text-2xl font-bold text-[#0F172A]">Continue Your Learning</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Explore Phonics Club's training, courses and educational resources designed to support confident and effective literacy teaching.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild className="rounded-xl bg-[#1D4ED8]"><Link href="/courses">Explore Courses</Link></Button>
                <Button asChild variant="outline" className="rounded-xl bg-white"><Link href="/trainings">Upcoming Training</Link></Button>
                <Button asChild variant="outline" className="rounded-xl bg-white"><Link href="/shop">Visit Our Shop</Link></Button>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-3 text-xl font-bold text-[#0F172A]">Share article</h2>
              <ShareButtons url={articleUrl} title={post.title} />
            </section>
          </div>

          {hasRelated ? (
            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-[#0F172A]">Related Stories</h2>
                <div className="mt-4 space-y-4">
                  {related.map((story) => (
                    <Link key={story.slug} href={`/blog/${story.slug}`} className="block rounded-lg border border-slate-200 bg-[#F8FAFC] p-4 transition hover:border-[#BFDBFE]">
                      <Badge variant="secondary" className="mb-2 capitalize">{eventCategoryLabel(story.category)}</Badge>
                      <h3 className="font-semibold leading-snug text-[#0F172A]">{story.title}</h3>
                      {story.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">{story.excerpt}</p> : null}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </article>

      <Footer />
    </main>
  )
}
