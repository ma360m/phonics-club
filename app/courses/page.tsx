import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { CourseCard } from '@/components/courses/course-card'
import { CourseFilters } from '@/components/courses/course-filters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCourseCatalog, type CourseCatalogFilters } from '@/lib/lms'
import { TEACHING_OF_ENGLISH_PATHWAY } from '@/lib/lms-hierarchy'
import { buildMetadata } from '@/utils/seo'
import { ArrowRight, BookOpen, GraduationCap, Home, Layers3, Search } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Courses',
  description: 'Expert-led phonics and literacy courses for learners, teachers and schools.',
  path: '/courses',
})

function loadMoreHref(filters: CourseCatalogFilters, nextPage: number) {
  const params = new URLSearchParams()
  Object.entries({ ...filters, page: String(nextPage) }).forEach(([key, value]) => {
    if (!value || value === 'all' || (key === 'page' && value === '1')) return
    params.set(key, value)
  })
  const query = params.toString()
  return query ? `/courses?${query}` : '/courses'
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<CourseCatalogFilters>
}) {
  const catalog = await getCourseCatalog(await searchParams)
  const featured = catalog.featuredCourse
  const showing = Math.min(catalog.courses.length, catalog.total)

  return (
    <main>
      <AnnouncementBar />
      <Navbar />

      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="inline-flex items-center gap-1 hover:text-[#1D4ED8]">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">Courses</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3">
              <Badge className="mb-4 rounded-full bg-[#D30000] text-white">Phonics Club LMS</Badge>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                Premium phonics courses for confident teachers and readers
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                Browse structured Jolly Phonics, reading and preschool courses with guided lessons,
                progress tracking, quizzes and certificate pathways.
              </p>
            </div>

            {featured && (
              <div className="rounded-2xl border bg-[#F8FAFC] p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1D4ED8]">
                  <GraduationCap className="h-4 w-4" />
                  Featured course
                </div>
                <h2 className="text-xl font-bold">{featured.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{featured.excerpt}</p>
                <Button asChild className="mt-4 rounded-xl bg-[#1D4ED8]">
                  <Link href={`/courses/${featured.slug}`}>
                    View featured course
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-b bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#D30000]">Learning pathway</p>
              <h2 className="mt-1 text-2xl font-bold">{TEACHING_OF_ENGLISH_PATHWAY.title}</h2>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {TEACHING_OF_ENGLISH_PATHWAY.description}
              </p>
            </div>
            <Badge variant="outline" className="rounded-full bg-white">
              Udemy-style course library
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {TEACHING_OF_ENGLISH_PATHWAY.children?.map((stage) => (
              <article key={stage.slug} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#1D4ED8]/10 text-[#1D4ED8]">
                  <Layers3 className="h-5 w-5" />
                </div>
                <h3 className="font-bold">{stage.title}</h3>
                <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">{stage.description}</p>
                {stage.children?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stage.children.map((child) => (
                      <span key={child.slug} className="rounded-full bg-[#FBBF24]/20 px-2.5 py-1 text-xs font-semibold text-[#7A1D1D]">
                        {child.title}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs font-semibold text-[#1D4ED8]">Ready for future courses</p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1D4ED8]">{catalog.total} courses found</p>
            <p className="text-sm text-muted-foreground">Showing {showing} of {catalog.total}</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <CourseFilters
            filters={catalog.filters}
            categories={catalog.categories}
            levels={catalog.levels}
          />

          <div>
            {catalog.courses.length === 0 ? (
              <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
                <Search className="mx-auto mb-3 h-10 w-10 text-[#1D4ED8]" />
                <h2 className="text-xl font-bold">No courses match your filters</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try a different category, level, duration or search term.
                </p>
                <Button asChild className="mt-5 rounded-xl bg-[#D30000]">
                  <Link href="/courses">Reset filters</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {catalog.courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                {catalog.page < catalog.totalPages && (
                  <div className="mt-8 text-center">
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link href={loadMoreHref(catalog.filters, catalog.page + 1)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Load more courses
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
