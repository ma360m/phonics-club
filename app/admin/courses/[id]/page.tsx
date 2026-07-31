import { notFound } from 'next/navigation'
import Link from 'next/link'
import { deleteCourseWithOptionsFormAction, getAdminCourse } from '@/actions/admin/courses'
import { CourseForm } from '@/components/admin/course-form'
import { Button } from '@/components/ui/button'
import { LmsPageHeader } from '@/components/lms/lms-primitives'
import { getProfile, isAdminRole } from '@/lib/auth'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [course, profile] = await Promise.all([getAdminCourse(id), getProfile()])
  if (!course) notFound()
  const isAdmin = isAdminRole(profile?.role)

  return (
    <div className="mx-auto max-w-7xl">
      <LmsPageHeader
        eyebrow="Course Management"
        title="Edit Course"
        description={course.title}
        action={(
          <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
            <Link href={`/admin/courses/${id}/builder`}>Open Course Builder</Link>
          </Button>
        )}
      />
      <CourseForm course={course} />
      {isAdmin && (
        <section className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <h2 className="text-xl font-bold text-rose-900">Delete Course</h2>
          <p className="mt-2 text-sm leading-6 text-rose-800">
            This permanently deletes the course. Depending on Supabase foreign-key rules, related enrollments,
            lessons, invoices, and payments may also be removed. Export or review records before deleting.
          </p>
          <form action={deleteCourseWithOptionsFormAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
            <input type="hidden" name="courseId" value={id} />
            <label className="space-y-1.5 text-sm font-medium text-rose-950">
              Type DELETE to confirm
              <input name="confirm" className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 font-mono text-sm" placeholder="DELETE" />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-rose-900">
              <input type="checkbox" name="deleteCoursePayments" />
              Delete related course payments first
            </label>
            <Button type="submit" variant="destructive" className="rounded-xl">
              Delete Course
            </Button>
          </form>
        </section>
      )}
    </div>
  )
}
