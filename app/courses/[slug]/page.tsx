import { notFound } from 'next/navigation'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { CourseDetailView } from '@/components/courses/course-detail-view'
import { getCourseBySlug, getCourses } from '@/lib/data/queries'
import { buildMetadata, courseJsonLd } from '@/utils/seo'
import { JsonLd } from '@/components/seo/json-ld'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = await getCourseBySlug(slug)
  if (!course) return {}
  return buildMetadata({
    title: course.seo_title ?? course.title,
    description: course.seo_description ?? course.excerpt ?? course.description ?? undefined,
    path: `/courses/${course.slug}`,
    image: course.image_url ?? undefined,
  })
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = await getCourseBySlug(slug)
  if (!course) notFound()

  const allCourses = await getCourses()
  const relatedCourses = allCourses
    .filter((c) => c.id !== course.id && c.category === course.category)
    .slice(0, 3)

  return (
    <main>
      <JsonLd data={courseJsonLd(course)} />
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <CourseDetailView course={course} relatedCourses={relatedCourses} />
      </div>
      <Footer />
    </main>
  )
}
