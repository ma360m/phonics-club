'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { createCourseCheckoutAction } from '@/actions/lms'
import { getCoursePrice, isCourseFree } from '@/lib/lms'
import type { ActionResult } from '@/types'

export async function enrollInCourseAction(courseId: string): Promise<ActionResult<{ redirectTo?: string }>> {
  const user = await getSession()
  if (!user) return { success: false, error: 'Please sign in to enroll' }

  const supabase = await createClient()
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, slug, title, price, discounted_price, is_free, published, access_duration_days')
    .eq('id', courseId)
    .eq('published', true)
    .maybeSingle()

  if (courseError) return { success: false, error: courseError.message }
  if (!course) return { success: false, error: 'Course not found' }

  const price = getCoursePrice(course as never)
  if (price > 0 && !isCourseFree(course as never)) {
    const checkout = await createCourseCheckoutAction(courseId)
    if (!checkout.success) return { success: false, error: checkout.error }
    return { success: true, data: { redirectTo: checkout.data?.redirectTo ?? '/dashboard/my-courses?tab=payments' } }
  }

  const now = new Date().toISOString()
  const { error } = await supabase.from('enrollments').upsert(
    {
      user_id: user.id,
      course_id: courseId,
      progress: 0,
      status: 'active',
      payment_status: 'free',
      purchase_date: now,
      activated_at: now,
      last_accessed_at: now,
      expires_at: new Date(Date.now() + Number(course.access_duration_days ?? 90) * 86_400_000).toISOString(),
    } as never,
    { onConflict: 'user_id,course_id' },
  )

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/my-courses')
  revalidatePath('/courses')
  revalidatePath(`/courses/${course.slug}`)
  return { success: true, data: { redirectTo: `/course/${courseId}/learn` } }
}

export async function getUserEnrollments() {
  const user = await getSession()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('user_id', user.id)

  return data ?? []
}
