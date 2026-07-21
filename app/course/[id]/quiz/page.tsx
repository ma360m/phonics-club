import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { CourseQuiz } from '@/components/courses/course-quiz'
import { Button } from '@/components/ui/button'
import { getProfile, isLmsManagerRole, requireAuth } from '@/lib/auth'
import { LmsShell } from '@/components/lms/lms-shell'
import { getCourseById, getQuizForCourse, getUserEnrollment, isEnrollmentActive } from '@/lib/lms'
import { ChevronLeft, CircleAlert } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Course Quiz',
  robots: { index: false, follow: false },
}

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ preview?: string }>
}) {
  const user = await requireAuth()
  const profile = await getProfile()
  const { id } = await params
  const previewRequested = (await searchParams)?.preview === 'admin'
  const managerPreview = previewRequested && isLmsManagerRole(profile?.role)
  const course = await getCourseById(id, { includeUnpublished: managerPreview })
  if (!course) notFound()

  const enrollment = managerPreview ? null : await getUserEnrollment(user.id, id)
  if (!managerPreview && !enrollment) redirect(`/courses/${course.slug}`)
  if (!managerPreview && !isEnrollmentActive(enrollment)) redirect('/dashboard/my-courses')

  const quizBundle = await getQuizForCourse(id, user.id, {
    includeUnpublished: managerPreview,
    includeAttempts: !managerPreview,
  })
  const learnHref = managerPreview ? `/course/${course.id}/learn?preview=admin` : `/course/${course.id}/learn`

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <LmsShell userName={profile?.full_name} userEmail={profile?.email} isAdmin={profile?.role === 'admin'}>
        <Button asChild variant="ghost" className="mb-4 rounded-xl text-slate-600 hover:text-[#1D4ED8]">
          <Link href={learnHref}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to learning
          </Link>
        </Button>

        {quizBundle ? (
          <CourseQuiz
            courseId={course.id}
            courseTitle={course.title}
            quiz={quizBundle.quiz}
            questions={quizBundle.questions}
            attempts={quizBundle.attempts}
            previewMode={managerPreview}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <CircleAlert className="mx-auto mb-4 h-12 w-12 text-[#FBBF24]" />
            <h1 className="text-2xl font-bold text-[#0F172A]">Quiz is not available yet</h1>
            <p className="mt-2 text-slate-500">
              This course needs quiz content before students can start an attempt.
            </p>
          </div>
        )}
      </LmsShell>
      <Footer />
    </main>
  )
}
