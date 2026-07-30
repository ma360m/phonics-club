import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { mobileUserHasAdminPermission, requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobilePaginationSchema, mobileSupportTicketCreateSchema } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

const supportStatuses = new Set([
  'submitted',
  'under_review',
  'waiting_for_user',
  'in_progress',
  'resolved',
  'closed',
])

export async function GET(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'support-issues-list', {
      identifier: context.user.id,
      limit: 60,
      windowMs: 60_000,
    })

    const canReadAll = await mobileUserHasAdminPermission(context, 'support.read')
    const url = new URL(request.url)
    const pagination = mobilePaginationSchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
    })
    const status = url.searchParams.get('status')?.trim()
    if (status && !supportStatuses.has(status)) {
      throw new MobileApiError('INVALID_SUPPORT_STATUS', 'Support status filter is invalid.', 400)
    }

    const from = (pagination.page - 1) * pagination.pageSize
    const to = from + pagination.pageSize - 1
    let query = context.supabase
      .from('support_tickets')
      .select(
        'id, user_id, category, subject, description, related_order_id, related_course_id, urgency, status, assigned_admin_id, last_user_reply_at, last_admin_reply_at, resolved_at, closed_at, created_at, updated_at',
        { count: 'exact' },
      )
      .order('updated_at', { ascending: false })
      .range(from, to)

    if (!canReadAll) query = query.eq('user_id', context.user.id)
    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) throw new MobileApiError('SUPPORT_UNAVAILABLE', 'Support issues could not be loaded.', 500)

    return createMobileApiResponse(
      {
        issues: data ?? [],
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          total: count ?? 0,
          totalPages: Math.max(Math.ceil((count ?? 0) / pagination.pageSize), 1),
        },
      },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}

export async function POST(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'support-issues-create', {
      identifier: context.user.id,
      limit: 6,
      windowMs: 60_000,
    })

    const parsed = mobileSupportTicketCreateSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid support issue.', 400)
    }

    const { data: ticket, error } = await context.supabase
      .from('support_tickets')
      .insert({
        user_id: context.user.id,
        category: parsed.data.category,
        subject: parsed.data.subject,
        description: parsed.data.message,
        related_order_id: parsed.data.orderId ?? null,
        related_course_id: parsed.data.courseId ?? null,
        urgency: parsed.data.priority,
        status: 'submitted',
        last_user_reply_at: new Date().toISOString(),
      } as never)
      .select('*')
      .single()

    if (error || !ticket) {
      throw new MobileApiError('SUPPORT_CREATE_FAILED', 'Support issue could not be created.', 500)
    }

    await context.supabase.from('support_ticket_messages').insert({
      ticket_id: ticket.id,
      author_id: context.user.id,
      message: parsed.data.message,
      visibility: 'user',
    } as never)

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_support_ticket_created',
      entityType: 'support_ticket',
      entityId: ticket.id,
      metadata: { category: parsed.data.category, priority: parsed.data.priority },
    })

    return createMobileApiResponse({ issue: ticket }, { status: 201, headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
