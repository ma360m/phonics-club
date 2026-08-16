'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { createCourseCheckoutAction } from '@/actions/lms'
import { getCoursePrice, isCourseFree, isEnrollmentActive } from '@/lib/lms'
import { notifyAdminOfCourseEnrollment } from '@/lib/email/send-course-enrollment-admin-email'
import type { ActionResult } from '@/types'
import { z } from 'zod'

const courseCancellationRequestSchema = z.object({
  courseId: z.string().uuid(),
  enrollmentId: z.string().uuid().optional(),
  reason: z.string().trim().max(1000).optional(),
})

export async function enrollInCourseAction(courseId: string): Promise<ActionResult<{ redirectTo?: string }>> {
  const user = await getSession()
  if (!user) return { success: false, error: 'Please sign in to enroll' }

  const supabase = await createClient()
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, slug, title, price, discounted_price, currency, is_free, published, access_duration_days')
    .eq('id', courseId)
    .eq('published', true)
    .in('visibility_status', ['published', 'unlisted'])
    .eq('archived', false)
    .maybeSingle()

  if (courseError) return { success: false, error: courseError.message }
  if (!course) return { success: false, error: 'Course not found' }

  const price = getCoursePrice(course as never)
  if (price > 0 && !isCourseFree(course as never)) {
    const checkout = await createCourseCheckoutAction(courseId)
    if (!checkout.success) return { success: false, error: checkout.error }
    return { success: true, data: { redirectTo: checkout.data?.redirectTo ?? '/dashboard/my-courses?tab=payments' } }
  }

  const { data: existingEnrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()

  if (isEnrollmentActive(existingEnrollment as never)) {
    return { success: true, data: { redirectTo: `/course/${courseId}/learn` } }
  }

  const now = new Date().toISOString()
  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .upsert(
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
    .select('id, status, payment_status')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .maybeSingle()

  await notifyAdminOfCourseEnrollment({
    course,
    enrollmentId: enrollment.id,
    student: {
      id: user.id,
      name: (profile as { full_name?: string | null } | null)?.full_name ?? user.email,
      email: (profile as { email?: string | null } | null)?.email ?? user.email,
    },
    status: enrollment.status ?? 'active',
    paymentStatus: enrollment.payment_status ?? 'free',
    amount: 0,
    currency: course.currency ?? 'PKR',
    source: 'Website free enrollment',
    enrolledAt: now,
  })

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

export async function requestCourseCancellationAction(formData: FormData): Promise<void> {
  const user = await getSession()
  if (!user) throw new Error('Please sign in to request cancellation.')

  const parsed = courseCancellationRequestSchema.safeParse({
    courseId: formData.get('courseId'),
    enrollmentId: formData.get('enrollmentId') || undefined,
    reason: formData.get('reason') || undefined,
  })
  if (!parsed.success) throw new Error('Course cancellation request is invalid.')

  const supabase = await createClient()
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('id', parsed.data.enrollmentId ?? '')
    .eq('course_id', parsed.data.courseId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!enrollment) throw new Error('This course enrollment could not be found on your account.')

  const { error } = await supabase.from('course_cancellation_requests').insert({
    user_id: user.id,
    course_id: parsed.data.courseId,
    enrollment_id: enrollment.id,
    reason: parsed.data.reason ?? null,
    status: 'pending',
  } as never)

  if (error) {
    if (error.code === '23505') throw new Error('A cancellation request for this course is already pending.')
    if (error.code === '42P01') throw new Error('Course cancellation requests need database migration 030 applied first.')
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/my-courses')
  revalidatePath('/admin/customers')
}
