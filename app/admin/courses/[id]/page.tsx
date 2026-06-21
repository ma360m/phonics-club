import { notFound } from 'next/navigation'
import { getAdminCourse } from '@/actions/admin/courses'
import { CourseForm } from '@/components/admin/course-form'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = await getAdminCourse(id)
  if (!course) notFound()
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Course</h1>
      <CourseForm course={course} />
    </div>
  )
}
