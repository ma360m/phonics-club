import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { CourseCard } from '@/components/courses/course-card'
import { getCourses } from '@/lib/data/queries'
import { buildMetadata } from '@/utils/seo'
import { COURSE_CATEGORIES } from '@/lib/constants'

export const metadata = buildMetadata({
  title: 'Courses',
  description: 'Expert-led phonics and literacy courses for learners of all ages',
  path: '/courses',
})

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const courses = await getCourses({ category: category || undefined })

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Courses</h1>
        <p className="text-muted-foreground mb-8">Master phonics with structured, expert-led programs</p>
        <section className="mb-10 rounded-3xl border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-2">Full training session</h2>
          <p className="text-muted-foreground mb-4">Watch our full training session to see how Phonics Club supports teachers and learners.</p>
          <div className="aspect-video overflow-hidden rounded-2xl border bg-black">
            <iframe
              className="h-full w-full"
              src="https://www.youtube.com/embed/AyZdFB8s2IA?si=FWlYrqq3q9wndnH5"
              title="Phonics Club full training session"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </section>
        <div className="flex flex-wrap gap-2 mb-10">
          <a href="/courses" className={`px-4 py-2 rounded-xl text-sm font-medium ${!category ? 'bg-[#1D4ED8] text-white' : 'bg-muted'}`}>
            All
          </a>
          {COURSE_CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={`/courses?category=${cat}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize ${category === cat ? 'bg-[#1D4ED8] text-white' : 'bg-muted'}`}
            >
              {cat.replace('-', ' ')}
            </a>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
      <Footer />
    </main>
  )
}
