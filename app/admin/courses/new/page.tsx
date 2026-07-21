import { CourseForm } from '@/components/admin/course-form'
import { LmsPageHeader } from '@/components/lms/lms-primitives'

export default function NewCoursePage() {
  return (
    <div className="mx-auto max-w-7xl">
      <LmsPageHeader
        eyebrow="Course Management"
        title="New Course"
        description="Create the public course record first, then add detailed modules and lessons in the builder."
      />
      <CourseForm />
    </div>
  )
}
