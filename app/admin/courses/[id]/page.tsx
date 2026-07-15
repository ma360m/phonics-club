import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAdminCourse } from '@/actions/admin/courses'
import { CourseForm } from '@/components/admin/course-form'
import { Button } from '@/components/ui/button'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = await getAdminCourse(id)
  if (!course) notFound()
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Edit Course</h1>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/admin/courses/${id}/builder`}>Open Course Builder</Link>
        </Button>
      </div>
      <CourseForm course={course} />
    </div>
  )
}
