import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileText,
  MapPin,
  PlayCircle,
  Settings,
} from 'lucide-react'
import { AnnouncementBar, Footer, Navbar } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CourseImage } from '@/components/courses/course-image'
import { getBlogPosts, getCourses } from '@/lib/data/queries'
import { getAboutPageContent, getResearchPageContent } from '@/lib/site-content'
import { formatCourseCategory, getCourseDisplayMeta, getCoursePrice } from '@/lib/lms'
import { formatNewsletterMonth, listNewsletterIssues, type NewsletterIssue } from '@/lib/newsletters'
import {
  eventCategoryLabel,
  getTrainingEventHeroImage,
  TRAINING_EVENT_ARTICLES,
  type TrainingEventArticle,
} from '@/lib/data/training-events-blog'
import { GradientThumbnail, yearFromValue } from '@/components/blog/gradient-thumbnail'
import type { BlogPost, Course } from '@/types/database'

function yearFromDate(value: string) {
  return String(new Date(value).getFullYear())
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

function groupByYear<T>(items: T[], getDate: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const year = yearFromDate(getDate(item))
    acc[year] = acc[year] ?? []
    acc[year].push(item)
    return acc
  }, {})
}

function dedupeBy<T>(items: T[], keyFor: (item: T) => string) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = keyFor(item).toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function BlogThumb({ post }: { post: BlogPost }) {
  if (post.cover_image && post.cover_image !== '/logo.png') {
    return <Image src={post.cover_image} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 320px" />
  }
  return <GradientThumbnail title={post.title} meta={dateLabel(post.created_at)} year={yearFromValue(post.created_at)} compact />
}

function NewsletterThumb({ article }: { article: TrainingEventArticle }) {
  const image = getTrainingEventHeroImage(article)
  if (image) return <Image src={image} alt={article.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 320px" />
  return <GradientThumbnail title={article.title} meta={article.dateDisplay} year={yearFromValue(article.sortDate)} compact />
}

function newsletterPdfFromArticle(article: TrainingEventArticle): NewsletterIssue | null {
  if (!article.newsletterUrl) return null
  return {
    id: `${article.id}-pdf`,
    title: article.title,
    month: new Date(article.sortDate).getMonth() + 1,
    year: Number(yearFromDate(article.sortDate)),
    file_url: article.newsletterUrl,
    file_path: article.newsletterUrl,
    file_size: 0,
    published: true,
    created_at: article.sortDate,
    updated_at: article.sortDate,
  }
}

function SectionHeader({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <div className="mb-7 max-w-4xl">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1D4ED8]">{kicker}</p>
      <h2 className="mt-2 text-3xl font-bold text-[#0F172A] sm:text-4xl">{title}</h2>
      <p className="mt-3 text-base leading-7 text-slate-600">{text}</p>
    </div>
  )
}

function CoursePreviewCard({ course, featured = false }: { course: Course; featured?: boolean }) {
  const meta = getCourseDisplayMeta(course)
  const price = getCoursePrice(course)

  return (
    <article className={featured ? 'grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.95fr_1.05fr]' : 'overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm'}>
      <div className={featured ? 'relative min-h-[320px] bg-[#EFF6FF]' : 'relative aspect-[16/10] bg-[#EFF6FF]'}>
        <CourseImage src={course.thumbnail_url ?? course.image_url} alt={course.title} priority={featured} />
      </div>
      <div className={featured ? 'flex flex-col justify-center p-7' : 'p-5'}>
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]">{formatCourseCategory(course.category)}</Badge>
          <Badge className={price === 0 ? 'rounded-full bg-emerald-600 text-white' : 'rounded-full bg-[#FBBF24] text-[#111827]'}>
            {price === 0 ? 'Free' : `PKR ${price.toLocaleString('en-PK')}`}
          </Badge>
        </div>
        <h3 className={featured ? 'text-3xl font-bold leading-tight text-[#0F172A]' : 'line-clamp-2 text-lg font-bold leading-snug text-[#0F172A]'}>
          {course.title}
        </h3>
        {(course.excerpt || course.description) ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{course.excerpt ?? course.description}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-500">
          <span className="rounded-full bg-[#F8FAFC] px-3 py-1">{meta.lessonCount || 0} lessons</span>
          <span className="rounded-full bg-[#F8FAFC] px-3 py-1">{meta.moduleCount || 0} modules</span>
          {course.level ? <span className="rounded-full bg-[#F8FAFC] px-3 py-1">{formatCourseCategory(course.level)}</span> : null}
        </div>
        <Button asChild className="mt-6 w-fit rounded-xl bg-[#1D4ED8]">
          <Link href={`/courses/${course.slug}`}>View Course <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    </article>
  )
}

export default async function NewsletterIndexRedirect({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>
}) {
  const { preview } = await searchParams
  if (preview !== 'redesign') {
    redirect('/newsletters')
  }

  const [rawPosts, uploadedPdfs, about, research, rawCourses] = await Promise.all([
    getBlogPosts(),
    listNewsletterIssues(),
    getAboutPageContent(),
    getResearchPageContent(),
    getCourses({ featured: true, limit: 8 }),
  ])

  const posts = dedupeBy(rawPosts, (post) => post.slug).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const postGroups = groupByYear(posts, (post) => post.created_at)
  const postYears = Object.keys(postGroups).sort((a, b) => Number(b) - Number(a))
  const newsletters = dedupeBy(TRAINING_EVENT_ARTICLES.filter((article) => article.published), (article) => article.slug)
    .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
  const newsletterGroups = groupByYear(newsletters, (article) => article.sortDate)
  const newsletterYears = Object.keys(newsletterGroups).sort((a, b) => Number(b) - Number(a))
  const pdfs = dedupeBy([...uploadedPdfs, ...newsletters.map(newsletterPdfFromArticle).filter((issue): issue is NewsletterIssue => Boolean(issue))], (issue) => issue.file_url)
    .sort((a, b) => b.year - a.year || b.month - a.month)
  const courses = dedupeBy(rawCourses, (course) => course.slug || course.title)
  const featuredCourse = courses[0] ?? null
  const milestones = about.milestones.filter((milestone) => !/^Future Milestones$/i.test(milestone.title))

  return (
    <main className="bg-[#F8FAFC]">
      <AnnouncementBar />
      <Navbar />

      <section className="border-b bg-white">
        <div className="mx-auto max-w-[1680px] px-6 py-10 sm:px-8 lg:px-10">
          <Badge className="bg-[#D30000] text-white">Preview only</Badge>
          <h1 className="mt-4 text-4xl font-bold tracking-normal text-[#0F172A] sm:text-5xl">Redesign Preview Workspace</h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-slate-600">
            Nothing on this preview replaces the live pages. It uses the existing data and keeps the current header images.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-6 py-12 sm:px-8 lg:px-10">
        <SectionHeader kicker="Archives" title="Blogs and newsletters by year" text="Wide desktop rows, datewise ordering, and color-gradient thumbnails where an image is missing." />
        <div className="grid gap-8 xl:grid-cols-2">
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h3 className="mb-5 text-2xl font-bold text-[#0F172A]">Blogs</h3>
            <div className="space-y-8">
              {postYears.slice(0, 4).map((year) => (
                <section key={year}>
                  <div className="mb-3 flex items-center justify-between border-b pb-2">
                    <h4 className="text-xl font-bold">{year}</h4>
                    <span className="text-sm text-slate-500">{postGroups[year].length}</span>
                  </div>
                  <div className="grid gap-4">
                    {postGroups[year].slice(0, 4).map((post) => (
                      <Link key={post.slug} href={`/blog/${post.slug}`} className="grid overflow-hidden rounded-lg border bg-white transition hover:border-[#1D4ED8] md:grid-cols-[260px_minmax(0,1fr)]">
                        <div className="relative aspect-[16/10] md:aspect-auto"><BlogThumb post={post} /></div>
                        <div className="p-5">
                          <Badge variant="secondary" className="capitalize">{post.category.replace(/-/g, ' ')}</Badge>
                          <h5 className="mt-3 text-xl font-bold leading-tight text-[#0F172A]">{post.title}</h5>
                          {post.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.excerpt}</p> : null}
                          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500"><CalendarDays className="h-4 w-4 text-[#1D4ED8]" />{dateLabel(post.created_at)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h3 className="mb-5 text-2xl font-bold text-[#0F172A]">Newsletters</h3>
            <div className="space-y-8">
              {newsletterYears.slice(0, 3).map((year) => (
                <section key={year}>
                  <div className="mb-3 flex items-center justify-between border-b pb-2">
                    <h4 className="text-xl font-bold">{year}</h4>
                    <span className="text-sm text-slate-500">{newsletterGroups[year].length}</span>
                  </div>
                  <div className="grid gap-4">
                    {newsletterGroups[year].slice(0, 4).map((article) => (
                      <Link key={article.slug} href={`/blog/${article.slug}`} className="grid overflow-hidden rounded-lg border bg-white transition hover:border-[#1D4ED8] md:grid-cols-[260px_minmax(0,1fr)]">
                        <div className="relative aspect-[16/10] md:aspect-auto"><NewsletterThumb article={article} /></div>
                        <div className="p-5">
                          <Badge className="bg-[#1D4ED8] text-white">{eventCategoryLabel(article.category)}</Badge>
                          <h5 className="mt-3 text-xl font-bold leading-tight text-[#0F172A]">{article.title}</h5>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{article.excerpt}</p>
                          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500"><CalendarDays className="h-4 w-4 text-[#1D4ED8]" />{article.dateDisplay}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="mt-8 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-5">
              <h4 className="text-lg font-bold text-[#0F172A]">PDF newsletter preview</h4>
              <div className="mt-4 grid gap-3">
                {pdfs.slice(0, 3).map((issue, index) => (
                  <a key={issue.id} href={issue.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 rounded-lg border bg-white p-4">
                    <span>
                      <span className="block text-sm font-semibold text-[#1D4ED8]">{formatNewsletterMonth(issue.month)} {issue.year}</span>
                      <span className="block font-bold text-[#0F172A]">{issue.title}</span>
                    </span>
                    <Download className="h-5 w-5 shrink-0 text-[#D30000]" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-white">
        <div className="mx-auto max-w-[1680px] px-6 py-12 sm:px-8 lg:px-10">
          <SectionHeader kicker="About" title="Journey and milestones" text="A broader timeline that keeps the content but removes repetitive card noise." />
          <div className="grid gap-5 xl:grid-cols-2">
            {milestones.map((milestone, index) => (
              <article key={`${milestone.year}-${milestone.title}`} className="grid rounded-lg border bg-[#F8FAFC] p-5 shadow-sm md:grid-cols-[120px_minmax(0,1fr)]">
                <p className={index % 3 === 1 ? 'text-4xl font-bold text-[#1D4ED8]' : index % 3 === 2 ? 'text-4xl font-bold text-[#F59E0B]' : 'text-4xl font-bold text-[#D30000]'}>{milestone.year}</p>
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A]">{milestone.title}</h3>
                  <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600 lg:grid-cols-2">
                    {milestone.items.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4ED8]" />{item}</li>)}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1680px] px-6 py-12 sm:px-8 lg:px-10">
        <SectionHeader kicker="Courses" title="Course preview without duplicacies" text="Real course data, deduped by slug, with one strong featured course and compact supporting cards." />
        {featuredCourse ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <CoursePreviewCard course={featuredCourse} featured />
            <div className="grid gap-5">{courses.slice(1, 4).map((course) => <CoursePreviewCard key={course.id} course={course} />)}</div>
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-8 text-center"><BookOpen className="mx-auto h-10 w-10 text-[#1D4ED8]" /><p className="mt-3 font-semibold">No courses available.</p></div>
        )}
      </section>

      <section className="border-y bg-white">
        <div className="mx-auto max-w-[1680px] px-6 py-12 sm:px-8 lg:px-10">
          <SectionHeader kicker="Admin courses" title="Easy access admin preview" text="Public page, lessons, builder and settings stay visible as direct actions. No functionality is removed." />
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            {courses.slice(0, 6).map((course) => {
              const meta = getCourseDisplayMeta(course)
              return (
                <article key={course.id} className="grid gap-4 border-b p-4 last:border-b-0 lg:grid-cols-[minmax(280px,1fr)_160px_160px_360px] lg:items-center">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg border bg-[#EFF6FF]"><CourseImage src={course.thumbnail_url ?? course.image_url} alt={course.title} /></div>
                    <div className="min-w-0"><h3 className="truncate font-bold text-[#0F172A]">{course.title}</h3><p className="mt-1 text-sm text-slate-500">{formatCourseCategory(course.category)}</p></div>
                  </div>
                  <Badge className={course.published ? 'w-fit bg-emerald-600 text-white' : 'w-fit bg-[#FBBF24] text-[#111827]'}>{course.published ? 'Published' : 'Draft'}</Badge>
                  <p className="text-sm text-slate-600">{meta.moduleCount || 0} modules / {meta.lessonCount || 0} lessons</p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline" className="rounded-lg bg-white"><Link href={`/courses/${course.slug}`}><Eye className="mr-1 h-3.5 w-3.5" />Public</Link></Button>
                    <Button asChild size="sm" variant="outline" className="rounded-lg bg-white"><Link href={`/course/${course.id}/learn?preview=admin`}><PlayCircle className="mr-1 h-3.5 w-3.5" />Lessons</Link></Button>
                    <Button asChild size="sm" className="rounded-lg bg-[#1D4ED8]"><Link href={`/admin/courses/${course.id}/builder`}><Edit3 className="mr-1 h-3.5 w-3.5" />Builder</Link></Button>
                    <Button asChild size="sm" variant="outline" className="rounded-lg bg-white"><Link href={`/admin/courses/${course.id}`}><Settings className="mr-1 h-3.5 w-3.5" />Settings</Link></Button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC]">
        <div className="relative isolate overflow-hidden bg-[#0F172A] text-white">
          {research.hero.image ? <Image src={research.hero.image.src} alt={research.hero.image.alt} fill className="absolute inset-0 -z-20 object-cover" sizes="100vw" /> : null}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0F172A]/95 via-[#0F172A]/74 to-[#1D4ED8]/22" />
          <div className="mx-auto max-w-[1680px] px-6 py-12 sm:px-8 lg:px-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#FBBF24]">Pilot projects</p>
            <h2 className="mt-3 text-4xl font-bold text-white">{research.hero.title}</h2>
            <p className="mt-4 max-w-4xl text-base leading-7 text-white/85">{research.hero.subtitle}</p>
          </div>
        </div>
        <div className="mx-auto max-w-[1680px] px-6 py-12 sm:px-8 lg:px-10">
          <div className="grid gap-5 xl:grid-cols-3">
            {research.projects.map((project, index) => (
              <article key={project.title} className="rounded-lg border bg-white p-6 shadow-sm">
                <Badge className={index % 2 ? 'bg-[#D30000] text-white' : 'bg-[#1D4ED8] text-white'}>Project {index + 1}</Badge>
                <h3 className="mt-3 text-2xl font-bold text-[#0F172A]">{project.title}</h3>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">{project.summary.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.schools?.slice(0, 6).map((school) => <span key={school} className="rounded-full bg-[#EFF6FF] px-3 py-1 text-sm font-semibold text-[#1D4ED8]">{school}</span>)}
                  {project.cities?.map((city) => <span key={city} className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-3 py-1 text-sm font-semibold text-[#92400E]"><MapPin className="h-3.5 w-3.5" />{city}</span>)}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
