import { evaluateCourseCompletion, getCourseById, isEnrollmentActive } from '@/lib/lms'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileLearningHeartbeatSchema } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { sessionId } = await params
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'learning-heartbeat', { identifier: context.user.id, limit: 90, windowMs: 60_000 })

    const parsed = mobileLearningHeartbeatSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid learning heartbeat.', 400)
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

    const { data: session } = await context.supabase
      .from('learning_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', context.user.id)
      .eq('course_id', parsed.data.courseId)
      .maybeSingle()

    if (!session) throw new MobileApiError('LEARNING_SESSION_NOT_FOUND', 'Learning session could not be found.', 404)
    if (session.status === 'ended') {
      throw new MobileApiError('LEARNING_SESSION_ENDED', 'This learning session has ended.', 409)
    }

    const now = new Date()
    const last = session.last_heartbeat_at ? new Date(session.last_heartbeat_at) : new Date(session.started_at)
    const flags: string[] = []
    let elapsed = Math.max(0, Math.floor((now.getTime() - last.getTime()) / 1000))
    if (elapsed > 90) flags.push('heartbeat_gap_capped')
    elapsed = Math.min(elapsed, 60)
    if (!parsed.data.visible) flags.push('app_not_visible')
    if (!parsed.data.focused) flags.push('app_not_focused')
    if (!parsed.data.active) flags.push('inactive')
    const creditedSeconds = flags.length ? 0 : elapsed
    const suspicious = flags.includes('heartbeat_gap_capped')

    const { error: heartbeatError } = await context.supabase.from('learning_heartbeats').insert({
      session_id: sessionId,
      user_id: context.user.id,
      course_id: parsed.data.courseId,
      lesson_id: parsed.data.lessonId ?? null,
      heartbeat_id: parsed.data.heartbeatId,
      client_sent_at: parsed.data.clientSentAt ?? null,
      credited_seconds: creditedSeconds,
      visible: parsed.data.visible,
      focused: parsed.data.focused,
      active: parsed.data.active,
      route: parsed.data.route,
      validation_flags: flags,
      suspicious,
    } as never)

    if (heartbeatError) {
      if (heartbeatError.code === '23505') {
        throw new MobileApiError('DUPLICATE_HEARTBEAT', 'Duplicate heartbeat ignored.', 409)
      }
      throw new MobileApiError('HEARTBEAT_SAVE_FAILED', 'Learning heartbeat could not be saved.', 500)
    }

    const totalSeconds = Number(session.credited_seconds ?? 0) + creditedSeconds
    await context.supabase
      .from('learning_sessions')
      .update({
        last_heartbeat_at: now.toISOString(),
        credited_seconds: totalSeconds,
        status: suspicious ? 'flagged' : 'active',
        suspicious,
        validation_flags: Array.from(new Set([...(session.validation_flags ?? []), ...flags])),
      } as never)
      .eq('id', sessionId)
      .eq('user_id', context.user.id)

    if (parsed.data.lessonId && creditedSeconds > 0) {
      const { data: existing } = await context.supabase
        .from('lesson_time_totals')
        .select('id, approved_seconds')
        .eq('user_id', context.user.id)
        .eq('course_id', parsed.data.courseId)
        .eq('lesson_id', parsed.data.lessonId)
        .maybeSingle()

      await context.supabase.from('lesson_time_totals').upsert(
        {
          id: existing?.id,
          user_id: context.user.id,
          course_id: parsed.data.courseId,
          lesson_id: parsed.data.lessonId,
          approved_seconds: Number(existing?.approved_seconds ?? 0) + creditedSeconds,
          last_activity_at: now.toISOString(),
          updated_at: now.toISOString(),
        } as never,
        { onConflict: 'user_id,course_id,lesson_id' },
      )
    }

    if (creditedSeconds > 0) {
      const course = await getCourseById(parsed.data.courseId, { includeUnpublished: true })
      if (course) await evaluateCourseCompletion(course, context.user.id)
    }

    return createMobileApiResponse(
      { creditedSeconds, totalSeconds, flags },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
