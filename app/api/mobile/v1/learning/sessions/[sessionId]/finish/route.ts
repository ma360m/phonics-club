import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
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
    enforceMobileRateLimit(request, 'learning-session-finish', { identifier: context.user.id, limit: 30, windowMs: 60_000 })

    const { data: session } = await context.supabase
      .from('learning_sessions')
      .select('id, course_id, lesson_id, credited_seconds, status')
      .eq('id', sessionId)
      .eq('user_id', context.user.id)
      .maybeSingle()

    if (!session) throw new MobileApiError('LEARNING_SESSION_NOT_FOUND', 'Learning session could not be found.', 404)

    const endedAt = new Date().toISOString()
    await context.supabase
      .from('learning_sessions')
      .update({ ended_at: endedAt, status: 'ended' } as never)
      .eq('id', sessionId)
      .eq('user_id', context.user.id)

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_learning_session_finished',
      entityType: 'learning_session',
      entityId: session.id,
      metadata: { courseId: session.course_id, creditedSeconds: session.credited_seconds ?? 0 },
    })

    return createMobileApiResponse(
      {
        session: {
          id: session.id,
          status: 'ended',
          endedAt,
          creditedSeconds: session.credited_seconds ?? 0,
        },
      },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
