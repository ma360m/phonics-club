import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { CourseQuiz } from '@/components/courses/course-quiz'
import { Button } from '@/components/ui/button'
import { requireAuth } from '@/lib/auth'
import { getCourseById, getQuizForCourse, getUserEnrollment, isEnrollmentActive } from '@/lib/lms'
import { ChevronLeft, CircleAlert } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Course Quiz',
  robots: { index: false, follow: false },
}

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth()
  const { id } = await params
  const course = await getCourseById(id)
  if (!course) notFound()

  const enrollment = await getUserEnrollment(user.id, id)
  if (!enrollment) redirect(`/courses/${course.slug}`)
  if (!isEnrollmentActive(enrollment)) redirect('/dashboard/my-courses')

  const quizBundle = await getQuizForCourse(id, user.id)

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" className="mb-4 rounded-xl">
          <Link href={`/course/${course.id}/learn`}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to learning
          </Link>
        </Button>

        {quizBundle ? (
          <CourseQuiz
            courseId={course.id}
            quiz={quizBundle.quiz}
            questions={quizBundle.questions}
            attempts={quizBundle.attempts}
          />
        ) : (
          <div className="rounded-3xl border bg-card p-10 text-center shadow-sm">
            <CircleAlert className="mx-auto mb-4 h-12 w-12 text-[#FBBF24]" />
            <h1 className="text-2xl font-bold">Quiz is not available yet</h1>
            <p className="mt-2 text-muted-foreground">
              The LMS now supports secure quizzes, but this course needs quiz content in Supabase.
            </p>
          </div>
        )}
      </section>
      <Footer />
    </main>
  )
}
