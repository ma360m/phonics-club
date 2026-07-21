'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { enrollInCourseAction } from '@/actions/enrollments'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function EnrollButton({
  courseId,
  courseSlug,
  className,
}: {
  courseId: string
  courseSlug?: string
  className?: string
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleEnroll() {
    startTransition(async () => {
      if (courseSlug) {
        router.push(`/courses/${courseSlug}/enroll`)
        return
      }

      const result = await enrollInCourseAction(courseId)
      if (result.success) {
        toast.success(result.data?.redirectTo?.includes('payments') ? 'Payment request created.' : 'Enrolled successfully!')
        router.push(result.data?.redirectTo ?? '/dashboard/my-courses')
      } else if (result.error?.toLowerCase().includes('sign in')) {
        router.push(`/auth/login?redirect=${encodeURIComponent(courseSlug ? `/courses/${courseSlug}` : '/courses')}`)
      } else {
        toast.error(result.error ?? 'Enrollment failed')
      }
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
