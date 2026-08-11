import { notFound, redirect } from 'next/navigation'
import { getProfile, isLmsManagerRole, requireAuth } from '@/lib/auth'
import { canManageCourseId } from '@/lib/admin/course-scope'
import { CourseLearnPlayer } from '@/components/courses/course-learn-player'
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

export const dynamic = 'force-dynamic'

export default async function CourseLearnPage({
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
  if (managerPreview && !(await canManageCourseId(profile, id))) notFound()

  const enrollment = managerPreview ? null : await getUserEnrollment(user.id, id)
  if (!managerPreview && !enrollment) redirect(`/courses/${course.slug}`)
  if (!managerPreview && !isEnrollmentActive(enrollment)) redirect('/dashboard/my-courses')
  const [modules, progressItems, resources, quizzes] = await Promise.all([
    getCourseModules(course),
    managerPreview ? Promise.resolve([]) : getLessonProgress(user.id, id),
    getCourseResources(id),
    getCourseQuizzes(id, { includeUnpublished: managerPreview }),
  ])

  return (
    <main className="min-h-screen bg-[#F4F8FF] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1680px]">
        <CourseLearnPlayer
          course={course}
          modules={modules}
          progressItems={progressItems}
          resources={resources}
          quizzes={quizzes}
          initialProgress={enrollment?.progress ?? 0}
          previewMode={managerPreview}
        />
      </div>
    </main>
  )
}
