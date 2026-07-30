import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { mobileUserHasAdminPermission, requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileSupportTicketReplySchema, uuidSchema } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { ticketId: rawTicketId } = await params
    const ticketId = uuidSchema.parse(rawTicketId)
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'support-issues-reply', {
      identifier: context.user.id,
      limit: 12,
      windowMs: 60_000,
    })

    const parsed = mobileSupportTicketReplySchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid support reply.', 400)
    }

    const canAdminReply = await mobileUserHasAdminPermission(context, 'support.write')
    const { data: ticket, error: ticketError } = await context.supabase
      .from('support_tickets')
      .select('id, user_id, status')
      .eq('id', ticketId)
      .maybeSingle()

    if (ticketError || !ticket) {
      throw new MobileApiError('SUPPORT_NOT_FOUND', 'Support issue could not be found.', 404)
    }
    if (!canAdminReply && ticket.user_id !== context.user.id) {
      throw new MobileApiError('SUPPORT_FORBIDDEN', 'You are not authorized to reply to this support issue.', 403)
    }
    if (!canAdminReply && parsed.data.visibility === 'internal') {
      throw new MobileApiError('SUPPORT_INTERNAL_FORBIDDEN', 'Internal support notes require admin access.', 403)
    }

    const { data: message, error } = await context.supabase
      .from('support_ticket_messages')
      .insert({
        ticket_id: ticketId,
        author_id: context.user.id,
        message: parsed.data.message,
        visibility: parsed.data.visibility,
      } as never)
      .select('id, ticket_id, author_id, message, visibility, created_at')
      .single()

    if (error || !message) {
      throw new MobileApiError('SUPPORT_REPLY_FAILED', 'Support reply could not be saved.', 500)
    }

    const now = new Date().toISOString()
    await context.supabase
      .from('support_tickets')
      .update(
        canAdminReply
          ? { status: 'waiting_for_user', last_admin_reply_at: now }
          : { status: 'under_review', last_user_reply_at: now },
      )
      .eq('id', ticketId)

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: canAdminReply ? 'mobile_admin_support_reply_created' : 'mobile_support_reply_created',
      entityType: 'support_ticket',
      entityId: ticketId,
      metadata: { visibility: parsed.data.visibility },
    })

    return createMobileApiResponse({ message }, { status: 201, headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
