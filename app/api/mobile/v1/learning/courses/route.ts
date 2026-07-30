import { isEnrollmentActive } from '@/lib/lms'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
} from '@/lib/mobile-api/response'

export async function GET(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'learning-courses', { identifier: context.user.id, limit: 80, windowMs: 60_000 })

    const [{ data: enrollments, error }, { data: completionRows }] = await Promise.all([
      context.supabase
        .from('enrollments')
        .select('*, courses(id, title, slug, subtitle, excerpt, image_url, thumbnail_url, category, level, duration, instructor, published)')
        .eq('user_id', context.user.id)
        .order('enrolled_at', { ascending: false }),
      context.supabase
        .from('course_completion_status')
        .select('course_id, eligible_for_certificate, completed, checklist, evaluated_at')
        .eq('user_id', context.user.id),
    ])

    if (error) throw error

    const completionByCourse = new Map((completionRows ?? []).map((row) => [row.course_id, row]))
    const courses = (enrollments ?? []).map((enrollment) => {
      const completion = completionByCourse.get(enrollment.course_id)
      return {
        enrollmentId: enrollment.id,
        courseId: enrollment.course_id,
        status: enrollment.status,
        paymentStatus: enrollment.payment_status,
        progress: enrollment.progress ?? 0,
        active: isEnrollmentActive(enrollment as never),
        enrolledAt: enrollment.enrolled_at,
        activatedAt: enrollment.activated_at,
        expiresAt: enrollment.expires_at,
        completedAt: enrollment.completed_at,
        lastAccessedAt: enrollment.last_accessed_at,
        certificateEligible: Boolean(completion?.eligible_for_certificate),
        courseCompleted: Boolean(completion?.completed),
        completionEvaluatedAt: completion?.evaluated_at ?? null,
        course: enrollment.courses,
      }
    })

    return createMobileApiResponse({ courses }, { headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
