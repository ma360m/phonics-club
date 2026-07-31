import Link from 'next/link'
import Image from 'next/image'
import { AnnouncementBar, Footer, Navbar } from '@/components/layout'
import { CourseCard } from '@/components/courses/course-card'
import { CourseFilters } from '@/components/courses/course-filters'
import { CourseOrbitIllustration } from '@/components/courses/course-orbit-illustration'
import { Button } from '@/components/ui/button'
import { getUserEnrollments } from '@/actions/enrollments'
import { getCourseCatalog, type CourseCatalogFilters } from '@/lib/lms'
import { buildMetadata } from '@/utils/seo'
import { BookOpen, Search } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Courses',
  description: 'Expert-led phonics and literacy courses for learners, teachers and schools.',
  path: '/courses',
})

function catalogueHref(filters: CourseCatalogFilters, patch: CourseCatalogFilters = {}) {
  const params = new URLSearchParams()
  Object.entries({ ...filters, ...patch }).forEach(([key, value]) => {
    if (!value || value === 'all' || (key === 'page' && value === '1')) return
    params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `/courses?${query}` : '/courses'
}

function loadMoreHref(filters: CourseCatalogFilters, nextPage: number) {
  return catalogueHref(filters, { page: String(nextPage) })
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<CourseCatalogFilters>
}) {
  const params = await searchParams
  const [catalog, enrollments] = await Promise.all([
    getCourseCatalog(params),
    getUserEnrollments(),
  ])
  const enrollmentByCourseId = new Map(enrollments.map((item) => [item.course_id, item]))
  const showing = Math.min(catalog.courses.length, catalog.total)

  return (
    <main className="bg-[#F8FAFC]">
      <AnnouncementBar />
      <Navbar />

      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_82%_20%,rgba(96,165,250,0.22),transparent_34%),linear-gradient(135deg,#FFFFFF_0%,#F8FBFF_58%,#EFF6FF_100%)]">
        <Image
          src="/images/gallery/play.jpg"
          alt="Play-based phonics learning"
          fill
          priority
          className="absolute inset-0 -z-20 object-cover opacity-70"
          sizes="100vw"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/88 via-white/58 to-[#EFF6FF]/34" />
        <div className="absolute inset-y-0 left-0 -z-10 w-full bg-gradient-to-r from-white/82 via-white/38 to-transparent lg:w-[62%]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-14 xl:grid-cols-[minmax(0,1fr)_480px]">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Explore Learning</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-normal text-[#0F172A] sm:text-5xl">
              Find the Right Course for Your Journey
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Explore expert-led courses for teachers, children and families with interactive lessons, guided progress and certificates.
            </p>

            <form action="/courses" className="mt-7 max-w-3xl">
              {catalog.filters.category !== 'all' && <input type="hidden" name="category" value={catalog.filters.category} />}
              {catalog.filters.price !== 'all' && <input type="hidden" name="price" value={catalog.filters.price} />}
              {catalog.filters.level !== 'all' && <input type="hidden" name="level" value={catalog.filters.level} />}
              {catalog.filters.sort !== 'newest' && <input type="hidden" name="sort" value={catalog.filters.sort} />}
              <label htmlFor="course-catalog-search" className="sr-only">Search courses</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="course-catalog-search"
                  name="q"
                  defaultValue={catalog.filters.q}
                  placeholder="Search by course, topic or instructor"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white/85 pl-12 pr-4 text-base text-[#0F172A] shadow-sm outline-none backdrop-blur transition-colors focus:border-[#60A5FA] focus:bg-white focus:ring-2 focus:ring-[#60A5FA]/30"
                />
              </div>
            </form>
          </div>

          <CourseOrbitIllustration />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CourseFilters filters={catalog.filters} levels={catalog.levels} />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">
              {catalog.total} {catalog.total === 1 ? 'course' : 'courses'} found
            </p>
            <p className="text-sm text-slate-500">Showing {showing} of {catalog.total}</p>
          </div>
          {(catalog.filters.q || catalog.filters.category !== 'all' || catalog.filters.price !== 'all' || catalog.filters.level !== 'all') && (
            <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
              <Link href="/courses">Clear filters</Link>
            </Button>
          )}
        </div>

        {catalog.courses.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <Search className="mx-auto mb-3 h-10 w-10 text-[#1D4ED8]" />
            <h2 className="text-xl font-bold text-[#0F172A]">No courses match your search</h2>
            <p className="mt-2 text-sm text-slate-500">
              Try a different keyword, course type, level or price filter.
            </p>
            <Button asChild className="mt-5 rounded-xl bg-[#1D4ED8]">
              <Link href="/courses">Show all courses</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {catalog.courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  enrollment={enrollmentByCourseId.get(course.id) ?? null}
                  showWishlist={false}
                />
              ))}
            </div>

            {catalog.page < catalog.totalPages && (
              <div className="mt-8 text-center">
                <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                  <Link href={loadMoreHref(catalog.filters, catalog.page + 1)}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Load more courses
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </main>
  )
}
