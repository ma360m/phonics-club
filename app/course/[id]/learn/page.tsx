import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { requireAuth } from '@/lib/auth'
import { CourseLearnPlayer } from '@/components/courses/course-learn-player'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import {
  getCourseById,
  getCourseModules,
  getCourseQuizzes,
  getCourseResources,
  getLessonProgress,
  getUserEnrollment,
  isEnrollmentActive,
} from '@/lib/lms'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Course Learning',
  robots: { index: false, follow: false },
}

export default async function CourseLearnPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth()
  const { id } = await params
  const course = await getCourseById(id)
  if (!course) notFound()

  const enrollment = await getUserEnrollment(user.id, id)
  if (!enrollment) redirect(`/courses/${course.slug}`)
  if (!isEnrollmentActive(enrollment)) redirect('/dashboard/my-courses')
  const [modules, progressItems, resources, quizzes] = await Promise.all([
    getCourseModules(course),
    getLessonProgress(user.id, id),
    getCourseResources(id),
    getCourseQuizzes(id),
  ])

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-4 rounded-xl">
          <Link href="/dashboard/my-courses">
            <ChevronLeft className="w-4 h-4 mr-1" /> My Courses
          </Link>
        </Button>
        <CourseLearnPlayer
          course={course}
          modules={modules}
          progressItems={progressItems}
          resources={resources}
          quizzes={quizzes}
          initialProgress={enrollment?.progress ?? 0}
        />
      </div>
      <Footer />
    </main>
  )
}
