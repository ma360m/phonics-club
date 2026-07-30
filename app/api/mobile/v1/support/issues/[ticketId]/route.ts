import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import {
  mobileUserHasAdminPermission,
  requireMobileAdminPermission,
  requireMobileUser,
} from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileSupportTicketUpdateSchema, uuidSchema } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

async function loadTicket(context: Awaited<ReturnType<typeof requireMobileUser>>, ticketId: string) {
  const { data: ticket, error } = await context.supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle()

  if (error || !ticket) {
    throw new MobileApiError('SUPPORT_NOT_FOUND', 'Support issue could not be found.', 404)
  }

  return ticket
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { ticketId: rawTicketId } = await params
    const ticketId = uuidSchema.parse(rawTicketId)
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'support-issues-detail', {
      identifier: context.user.id,
      limit: 80,
      windowMs: 60_000,
    })

    const canReadAll = await mobileUserHasAdminPermission(context, 'support.read')
    const ticket = await loadTicket(context, ticketId)
    if (!canReadAll && ticket.user_id !== context.user.id) {
      throw new MobileApiError('SUPPORT_FORBIDDEN', 'You are not authorized to view this support issue.', 403)
    }

    let messagesQuery = context.supabase
      .from('support_ticket_messages')
      .select('id, ticket_id, author_id, message, visibility, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (!canReadAll) messagesQuery = messagesQuery.eq('visibility', 'user')
    const { data: messages, error: messagesError } = await messagesQuery
    if (messagesError) throw new MobileApiError('SUPPORT_MESSAGES_UNAVAILABLE', 'Support messages could not be loaded.', 500)

    return createMobileApiResponse(
      { issue: ticket, messages: messages ?? [] },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { ticketId: rawTicketId } = await params
    const ticketId = uuidSchema.parse(rawTicketId)
    const context = await requireMobileAdminPermission(request, 'support.write')
    enforceMobileRateLimit(request, 'support-issues-update', {
      identifier: context.user.id,
      limit: 40,
      windowMs: 60_000,
    })

    const parsed = mobileSupportTicketUpdateSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid support update.', 400)
    }

    const update: Record<string, unknown> = {}
    if (parsed.data.status) {
      update.status = parsed.data.status
      if (parsed.data.status === 'resolved') update.resolved_at = new Date().toISOString()
      if (parsed.data.status === 'closed') update.closed_at = new Date().toISOString()
    }
    if (parsed.data.priority) update.urgency = parsed.data.priority
    if ('assignedAdminId' in parsed.data) update.assigned_admin_id = parsed.data.assignedAdminId ?? null

    const { data: ticket, error } = await context.supabase
      .from('support_tickets')
      .update(update as never)
      .eq('id', ticketId)
      .select('*')
      .maybeSingle()

    if (error || !ticket) {
      throw new MobileApiError('SUPPORT_UPDATE_FAILED', 'Support issue could not be updated.', 500)
    }

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_admin_support_ticket_updated',
      entityType: 'support_ticket',
      entityId: ticketId,
      metadata: update,
    })

    return createMobileApiResponse({ issue: ticket }, { headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
