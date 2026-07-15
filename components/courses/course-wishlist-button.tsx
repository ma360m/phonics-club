'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { toggleCourseWishlistAction } from '@/actions/lms'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CourseWishlistButton({
  courseId,
  initialWishlisted = false,
  className,
}: {
  courseId: string
  initialWishlisted?: boolean
  className?: string
}) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={pending}
      aria-label={wishlisted ? 'Remove course from wishlist' : 'Add course to wishlist'}
      className={cn('rounded-full bg-white/95 shadow-sm', className)}
      onClick={(event) => {
        event.preventDefault()
        startTransition(async () => {
          const result = await toggleCourseWishlistAction(courseId)
          if (result.success && result.data) {
            setWishlisted(result.data.wishlisted)
            toast.success(result.data.wishlisted ? 'Added to wishlist' : 'Removed from wishlist')
          } else if (result.error?.toLowerCase().includes('sign in')) {
            router.push('/auth/login?redirect=/courses')
          } else {
            toast.error(result.error ?? 'Wishlist update failed')
          }
        })
      }}
    >
      <Heart className={cn('h-4 w-4', wishlisted && 'fill-[#D30000] text-[#D30000]')} />
    </Button>
  )
}
