import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { BackButton } from '@/components/layout/back-button'
import { BlogGalleryLightbox } from '@/components/blog/blog-gallery-lightbox'
import { buildMetadata } from '@/utils/seo'
import { getBlogPosts } from '@/lib/data/queries'
import {
  eventCategoryLabel,
  getTrainingEventGallery,
  getTrainingEventsForTrainer,
} from '@/lib/data/training-events-blog'
import { getTrainerBySlug, getTrainerProfileAttachment, type TrainerProfileLink } from '@/lib/site-content'
import { getTrainerDisplayName } from '@/lib/trainer-display'
import { getTrainerImageUrl } from '@/lib/trainer-images'
import { cn } from '@/lib/utils'
import { Award, CalendarDays, CheckCircle2, ExternalLink, GraduationCap, Images, Link2, Star } from 'lucide-react'
import type { BlogGalleryImage } from '@/types/database'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const trainer = await getTrainerBySlug(slug)
  if (!trainer) return {}
  const trainerImageUrl = getTrainerImageUrl(trainer)
  const trainerDisplayName = getTrainerDisplayName(trainer)

  return buildMetadata({
    title: trainerDisplayName,
    description: trainer.bio ?? `${trainerDisplayName} profile at Phonics Club`,
    path: `/certified-trainers/${slug}`,
    image: trainerImageUrl ?? undefined,
  })
}

function DetailList({
  title,
  items,
  icon,
}: {
  title: string
  items?: string[] | null
  icon: ReactNode
}) {
  if (!items?.length) return null

  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        {icon}
        {title}
      </h2>
      <ul className="mt-4 space-y-3 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4ED8]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function uniqueGalleryImages(images: BlogGalleryImage[]) {
  const seen = new Set<string>()
  return images.filter((image) => {
    if (seen.has(image.src)) return false
    seen.add(image.src)
    return true
  })
}

function uniqueArticles<T extends { slug: string }>(articles: T[]) {
  const seen = new Set<string>()
  return articles.filter((article) => {
    if (seen.has(article.slug)) return false
    seen.add(article.slug)
    return true
  })
}

function formatPostDate(value?: string | null) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return 'Recent update'
  return date.toLocaleDateString('en-PK', { dateStyle: 'medium' })
}

function EmptyProfileSection({
  title,
  body,
  icon,
}: {
  title: string
  body: string
  icon: ReactNode
}) {
  return (
    <section className="mt-8 rounded-lg border border-dashed border-[#BFDBFE] bg-[#EFF6FF] p-6 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-white text-[#1D4ED8]">
        {icon}
      </div>
      <h2 className="mt-3 text-xl font-bold text-[#0F172A]">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#1D4ED8]">{body}</p>
    </section>
  )
}

function RelatedArticlesSection({
  trainerName,
  articles,
}: {
  trainerName: string
  articles: {
    slug: string
    title: string
    excerpt?: string | null
    dateDisplay: string
    category: string
    location?: string | null
  }[]
}) {
  if (!articles.length) {
    return (
      <EmptyProfileSection
        title="Related Posts"
        body={`Related posts for ${trainerName} will appear here as soon as matching event updates are published.`}
        icon={<ExternalLink className="h-5 w-5" />}
      />
    )
  }

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#D30000]">Posts</p>
          <h2 className="mt-2 text-2xl font-bold text-[#0F172A]">Related Posts, Articles & Newsletters</h2>
        </div>
        <p className="text-sm font-semibold text-slate-500">{articles.length} update{articles.length === 1 ? '' : 's'}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group rounded-lg border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-[#1D4ED8]" />
                {article.dateDisplay}
              </span>
              <span>{eventCategoryLabel(article.category)}</span>
              {article.location ? <span>{article.location}</span> : null}
            </p>
            <h3 className="mt-3 text-lg font-bold leading-6 text-[#0F172A] group-hover:text-[#1D4ED8]">{article.title}</h3>
            {article.excerpt ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.excerpt}</p> : null}
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1D4ED8]">
              Read article
              <ExternalLink className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function isExternalHref(href: string) {
  return /^(https?:)?\/\//i.test(href) || /^(mailto:|tel:)/i.test(href)
}

function RelatedLinksSection({ links }: { links: TrainerProfileLink[] }) {
  if (!links.length) return null

  return (
    <section className="mt-8">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#D30000]">Links</p>
        <h2 className="mt-2 text-2xl font-bold text-[#0F172A]">Related Links</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {links.map((link) => {
          const external = isExternalHref(link.href)
          const content = (
            <>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#1D4ED8]">
                <Link2 className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-[#0F172A] group-hover:text-[#1D4ED8]">{link.label}</span>
                {link.description ? <span className="mt-1 block text-sm leading-6 text-muted-foreground">{link.description}</span> : null}
                <span className="mt-2 inline-flex items-center gap-1.5 break-all text-xs font-semibold text-[#1D4ED8]">
                  {link.href}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </span>
              </span>
            </>
          )

          return external ? (
            <a
              key={`${link.label}-${link.href}`}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="group flex gap-3 rounded-lg border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {content}
            </a>
          ) : (
            <Link
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="group flex gap-3 rounded-lg border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {content}
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default async function CertifiedTrainerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const trainer = await getTrainerBySlug(slug)
  if (!trainer) notFound()
  const trainerImageUrl = getTrainerImageUrl(trainer)
  const trainerDisplayName = getTrainerDisplayName(trainer)
  const isFatimaProfile = trainer.slug === 'fatima-tuz-zahra' || trainer.slug === 'dr-fatima-tuz-zahra'
  const trainerAttachment = await getTrainerProfileAttachment(slug)
  const relatedEvents = getTrainingEventsForTrainer(trainerDisplayName)
  const blogPosts = relatedEvents.length || trainerAttachment.articleSlugs.length ? await getBlogPosts() : []
  const blogPostBySlug = new Map(blogPosts.map((post) => [post.slug, post]))
  const automaticArticles = relatedEvents.map((event) => {
    const post = blogPostBySlug.get(event.slug)
    const galleryImages = post?.gallery_images ?? getTrainingEventGallery(event)

    return {
      slug: event.slug,
      title: post?.title ?? event.title,
      excerpt: post?.excerpt ?? event.excerpt,
      dateDisplay: event.dateDisplay,
      category: event.category,
      location: event.location ?? event.city ?? null,
      galleryImages,
    }
  })
  const attachedArticles = trainerAttachment.articleSlugs.map((articleSlug) => {
    const post = blogPostBySlug.get(articleSlug)
    if (!post) return null
    return {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      dateDisplay: formatPostDate(post.created_at),
      category: post.category,
      location: null,
      galleryImages: post.gallery_images ?? [],
    }
  }).filter(Boolean) as typeof automaticArticles
  const relatedArticles = uniqueArticles([
    ...attachedArticles,
    ...(trainerAttachment.includeAutoArticles ? automaticArticles : []),
  ])
  const galleryArticleImages = trainerAttachment.includeAutoGallery
    ? uniqueArticles([...attachedArticles, ...automaticArticles]).flatMap((article) => article.galleryImages)
    : []
  const trainerGalleryImages = uniqueGalleryImages([
    ...trainerAttachment.galleryImages,
    ...galleryArticleImages,
  ])

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <BackButton fallbackHref="/certified-trainers" />

        <section className="grid gap-8 rounded-lg border bg-white p-6 shadow-sm md:grid-cols-[220px_1fr] md:p-8">
          <div className={cn('mx-auto flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#1D4ED8]/20 to-[#FBBF24]/30 md:mx-0', isFatimaProfile ? 'h-52 w-52' : 'h-44 w-44')}>
            {trainerImageUrl ? (
              <Image src={trainerImageUrl} alt={trainerDisplayName} width={208} height={208} className="h-full w-full object-cover" />
            ) : (
              <Award className="h-20 w-20 text-[#1D4ED8]" />
            )}
          </div>
          <div className="flex flex-col justify-center text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#D30000]">Certified Trainer</p>
            <h1 className="mt-2 text-4xl font-bold">{trainerDisplayName}</h1>
            <p className="mt-2 text-lg text-[#1D4ED8]">{trainer.title ?? 'Jolly Phonics Certified Trainer'}</p>
            {trainer.bio && !trainer.profile_details ? <p className="mt-5 max-w-3xl leading-8 text-muted-foreground">{trainer.bio}</p> : null}
          </div>
        </section>

        {trainer.profile_details ? (
          <section className="mt-8 rounded-lg border bg-card p-6">
            <h2 className="text-xl font-bold">Profile</h2>
            <p className="mt-4 whitespace-pre-line leading-8 text-muted-foreground">{trainer.profile_details}</p>
          </section>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <DetailList title="Achievements" items={trainer.achievements} icon={<Star className="h-5 w-5 text-[#D30000]" />} />
          <DetailList title="Credentials" items={trainer.credentials} icon={<GraduationCap className="h-5 w-5 text-[#1D4ED8]" />} />
          <DetailList title="Specialties" items={trainer.specialties} icon={<Award className="h-5 w-5 text-[#FBBF24]" />} />
        </div>

        <RelatedArticlesSection trainerName={trainerDisplayName} articles={relatedArticles} />
        <RelatedLinksSection links={trainerAttachment.relatedLinks} />

        {trainerGalleryImages.length ? (
          <section className="mt-8 overflow-hidden rounded-lg border bg-white shadow-sm" aria-label={`${trainerDisplayName} event gallery`}>
            <BlogGalleryLightbox
              images={trainerGalleryImages}
              eyebrow="Trainer Events"
              title={`${trainerDisplayName} Event Gallery`}
            />
          </section>
        ) : (
          <EmptyProfileSection
            title="Event Gallery"
            body={`Event photos for ${trainerDisplayName} will appear here when matching event galleries are added.`}
            icon={<Images className="h-5 w-5" />}
          />
        )}

        <div className="mt-10 rounded-lg border bg-[#F8FAFC] p-6 text-center">
          <h2 className="text-2xl font-bold">Interested in training with {trainerDisplayName}?</h2>
          <p className="mt-3 text-muted-foreground">Explore available Phonics Club courses or contact us for school training and consultancy.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/courses" className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white">
              Explore Courses
            </Link>
            <Link href="/contact" className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
