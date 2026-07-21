import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAdminCourse } from '@/actions/admin/courses'
import { CourseForm } from '@/components/admin/course-form'
import { Button } from '@/components/ui/button'
import { LmsPageHeader } from '@/components/lms/lms-primitives'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = await getAdminCourse(id)
  if (!course) notFound()
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
    </div>
  )
}
