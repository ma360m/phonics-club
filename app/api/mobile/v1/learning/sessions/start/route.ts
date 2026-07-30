import { isEnrollmentActive } from '@/lib/lms'
import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileLearningSessionStartSchema } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function POST(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'learning-session-start', { identifier: context.user.id, limit: 20, windowMs: 60_000 })

    const parsed = mobileLearningSessionStartSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid learning session request.', 400)
    }

    const { data: enrollment } = await context.supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', context.user.id)
      .eq('course_id', parsed.data.courseId)
      .maybeSingle()

    if (!isEnrollmentActive(enrollment as never)) {
      throw new MobileApiError('ENROLLMENT_REQUIRED', 'Your course access is not active.', 403)
    }

    if (parsed.data.lessonId) {
      const { data: lesson } = await context.supabase
        .from('course_lessons')
        .select('id')
        .eq('id', parsed.data.lessonId)
        .eq('course_id', parsed.data.courseId)
        .maybeSingle()
      if (!lesson) throw new MobileApiError('LESSON_NOT_FOUND', 'Lesson could not be found.', 404)
    }

    const { data: session, error } = await context.supabase
      .from('learning_sessions')
      .insert({
        user_id: context.user.id,
        course_id: parsed.data.courseId,
        lesson_id: parsed.data.lessonId ?? null,
        enrollment_id: enrollment?.id ?? null,
        device_id: parsed.data.deviceId.slice(0, 120),
        started_at: new Date().toISOString(),
        status: 'active',
      } as never)
      .select('id, started_at')
      .single()

    if (error || !session) {
      throw new MobileApiError('LEARNING_SESSION_FAILED', 'Learning session could not be started.', 500)
    }

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_learning_session_started',
      entityType: 'learning_session',
      entityId: session.id,
      metadata: { courseId: parsed.data.courseId, lessonId: parsed.data.lessonId ?? null },
    })

    return createMobileApiResponse(
      { sessionId: session.id, startedAt: session.started_at },
      { status: 201, headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
