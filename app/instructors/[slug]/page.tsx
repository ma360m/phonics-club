import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { CourseCard } from '@/components/courses/course-card'
import { Button } from '@/components/ui/button'
import { getInstructorProfile } from '@/lib/lms'
import { buildMetadata } from '@/utils/seo'
import { Award, BookOpen, ChevronLeft } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const profile = await getInstructorProfile(slug)
  if (!profile) return {}
  return buildMetadata({
    title: `${profile.name} Courses`,
    description: profile.bio,
    path: `/instructors/${slug}`,
  })
}

export default async function InstructorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const profile = await getInstructorProfile(slug)
  if (!profile) notFound()

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" className="mb-6 rounded-xl">
          <Link href="/courses">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Courses
          </Link>
        </Button>

        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#1D4ED8]/10">
              <Award className="h-10 w-10 text-[#1D4ED8]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#D30000]">Instructor</p>
              <h1 className="text-4xl font-bold">{profile.name}</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">{profile.bio}</p>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold">
            <BookOpen className="h-6 w-6 text-[#1D4ED8]" />
            Courses by {profile.name}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profile.courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
