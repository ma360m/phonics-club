import { redirect } from 'next/navigation'
import { enrollInCourseAction } from '@/actions/enrollments'
import { getSession } from '@/lib/auth'
import { getCourseBySlug } from '@/lib/data/queries'
import {
  ensureChildrenPhonicsCourseInstalledBySlug,
} from '@/lib/data/children-phonics-install'
import { isChildrenPhonicsCourseSlug } from '@/lib/data/children-phonics-courses'

async function enrollFromSlug(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const returnPath = `/courses/${slug}/enroll`
  const user = await getSession()
  if (!user) redirect(`/auth/login?redirect=${encodeURIComponent(returnPath)}`)

  let course = await getCourseBySlug(slug)
  if (!course) redirect('/courses')

  if (isChildrenPhonicsCourseSlug(slug)) {
    const installedCourse = await ensureChildrenPhonicsCourseInstalledBySlug(slug, { requireService: true })
    if (installedCourse) course = installedCourse
    if (!installedCourse && course.id.startsWith('course-jp-')) {
      redirect(`/courses/${slug}?enrollError=${encodeURIComponent('Ask an admin to install this children course from Admin Courses first.')}`)
    }
  }

  const result = await enrollInCourseAction(course.id)
  if (result.success) redirect(result.data?.redirectTo ?? '/dashboard/my-courses')

  if (result.error?.toLowerCase().includes('already enrolled')) {
    redirect(`/course/${course.id}/learn`)
  }

  redirect(`/courses/${slug}?enrollError=${encodeURIComponent(result.error ?? 'Enrollment could not be started')}`)
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  return enrollFromSlug(request, context)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  return enrollFromSlug(request, context)
}
