'use client'

import { useTransition } from 'react'
import { enrollInCourseAction } from '@/actions/enrollments'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function EnrollButton({ courseId, className }: { courseId: string; className?: string }) {
  const [pending, startTransition] = useTransition()

  function handleEnroll() {
    startTransition(async () => {
      const result = await enrollInCourseAction(courseId)
      if (result.success) toast.success('Enrolled successfully!')
      else toast.error(result.error ?? 'Enrollment failed')
    })
  }

  return (
    <Button
      onClick={handleEnroll}
      disabled={pending}
      className={className ?? 'rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90'}
    >
      {pending ? 'Enrolling...' : 'Enroll Now'}
    </Button>
  )
}
