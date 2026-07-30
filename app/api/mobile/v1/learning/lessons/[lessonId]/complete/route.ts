import { z } from 'zod'
import { isEnrollmentActive } from '@/lib/lms'
import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

const lessonCompleteSchema = z.object({
  courseId: z.string().uuid(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { lessonId } = await params
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'lesson-complete', { identifier: context.user.id, limit: 40, windowMs: 60_000 })

    const parsed = lessonCompleteSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid lesson completion request.', 400)
    }

    const [{ data: lesson }, { data: enrollment }] = await Promise.all([
      context.supabase
        .from('course_lessons')
        .select('id, course_id, manual_completion_allowed')
        .eq('id', lessonId)
        .eq('course_id', parsed.data.courseId)
        .maybeSingle(),
      context.supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', context.user.id)
        .eq('course_id', parsed.data.courseId)
        .maybeSingle(),
    ])

    if (!lesson) throw new MobileApiError('LESSON_NOT_FOUND', 'Lesson could not be found.', 404)
    if (!isEnrollmentActive(enrollment as never)) {
      throw new MobileApiError('ENROLLMENT_REQUIRED', 'Your course access is not active.', 403)
    }
    if (lesson.manual_completion_allowed === false) {
      throw new MobileApiError('LESSON_MANUAL_COMPLETION_DISABLED', 'This lesson cannot be completed manually.', 409)
    }

    const now = new Date().toISOString()
    await context.supabase.from('lesson_progress').upsert(
      {
        user_id: context.user.id,
        lesson_id: lessonId,
        course_id: parsed.data.courseId,
        completed: true,
        completed_at: now,
        updated_at: now,
      } as never,
      { onConflict: 'user_id,lesson_id' },
    )

    const [{ count: totalLessons }, { count: completedLessons }] = await Promise.all([
      context.supabase
        .from('course_lessons')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', parsed.data.courseId)
        .neq('is_compulsory', false),
      context.supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', context.user.id)
        .eq('course_id', parsed.data.courseId)
        .eq('completed', true),
    ])

    const progress = totalLessons ? Math.min(Math.round(((completedLessons ?? 0) / totalLessons) * 100), 100) : 0
    await context.supabase
      .from('enrollments')
      .update({
        progress,
        completed_at: progress >= 100 ? now : null,
        last_accessed_at: now,
      } as never)
      .eq('id', enrollment?.id)
      .eq('user_id', context.user.id)

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_lesson_completed',
      entityType: 'course_lesson',
      entityId: lessonId,
      metadata: { courseId: parsed.data.courseId, progress },
    })

    return createMobileApiResponse(
      {
        lesson: {
          id: lessonId,
          completed: true,
          completedAt: now,
        },
        courseProgress: progress,
      },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
