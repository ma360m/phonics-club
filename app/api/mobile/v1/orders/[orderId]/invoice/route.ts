import { buildInvoicePdf } from '@/lib/invoice-pdf'
import { invoiceCustomerName, invoiceFileBaseName } from '@/lib/invoice'
import { getInvoiceTemplate } from '@/lib/site-content'
import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { isMobileAdminRole, requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import {
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { orderId } = await params
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'orders-invoice', { identifier: context.user.id, limit: 30, windowMs: 60_000 })

    const { data: order, error } = await context.supabase.from('orders').select('*').eq('id', orderId).maybeSingle()
    if (error || !order) throw new MobileApiError('ORDER_NOT_FOUND', 'Order could not be found.', 404)
    if (order.user_id !== context.user.id && !isMobileAdminRole(context.profile.role)) {
      throw new MobileApiError('ORDER_FORBIDDEN', 'You are not authorized to view this invoice.', 403)
    }

    const template = await getInvoiceTemplate()
    const invoiceNo = order.invoice_number ?? order.id.slice(0, 8)
    const invoiceFileName = invoiceFileBaseName(invoiceNo, invoiceCustomerName(order as never))
    const pdfBytes = await buildInvoicePdf(order as never, template)

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_order_invoice_downloaded',
      entityType: 'order',
      entityId: order.id,
    })

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoiceFileName}.pdf"`,
        'X-Request-Id': requestId,
      },
    })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
