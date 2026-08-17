import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileReceiptMetadataSchema } from '@/lib/mobile-api/schemas'
import { uploadPrivateReceiptFile } from '@/lib/mobile-api/storage'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'
import { shopPaymentNeedsReceipt } from '@/lib/payment-methods'
import { notifyAdminOfPaymentReceipt } from '@/lib/email/send-payment-receipt-admin-email'

const lockedReceiptStatuses = new Set([
  'payment_confirmed',
  'processing',
  'ready_to_dispatch',
  'shipped',
  'delivered',
  'cancelled',
])

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? '').trim()
    if (text) return text
  }
  return ''
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { orderId } = await params
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'orders-receipt', { identifier: context.user.id, limit: 10, windowMs: 60_000 })

    const { data: order, error: orderError } = await context.supabase
      .from('orders')
      .select('id, user_id, status, payment_method, invoice_number, total, phone, guest_email, shipping_address')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) throw new MobileApiError('ORDER_NOT_FOUND', 'Order could not be found.', 404)
    if (order.user_id !== context.user.id) {
      await recordMobileAuditEvent({
        request,
        requestId,
        userId: context.user.id,
        eventType: 'unauthorized_order_receipt_upload',
        entityType: 'order',
        entityId: orderId,
      })
      throw new MobileApiError('ORDER_FORBIDDEN', 'You are not authorized to upload a receipt for this order.', 403)
    }

    if (!shopPaymentNeedsReceipt(order.payment_method)) {
      throw new MobileApiError('RECEIPT_NOT_SUPPORTED', 'This payment method does not accept receipt uploads.', 400)
    }

    if (lockedReceiptStatuses.has(order.status)) {
      throw new MobileApiError('ORDER_LOCKED', 'This order can no longer accept payment receipts.', 409)
    }

    const formData = await request.formData()
    const file = formData.get('receipt')
    if (!(file instanceof File)) {
      throw new MobileApiError('FILE_REQUIRED', 'Choose a receipt file to upload.', 400)
    }

    const metadata = mobileReceiptMetadataSchema.parse({
      transactionReference: formData.get('transactionReference') || undefined,
    })
    const uploaded = await uploadPrivateReceiptFile({
      file,
      pathPrefix: `orders/${order.id}`,
    })

    const now = new Date().toISOString()
    const { error: updateError } = await context.supabase
      .from('orders')
      .update({
        status: 'payment_submitted',
        receipt_url: null,
        receipt_bucket: uploaded.bucket,
        receipt_path: uploaded.path,
        receipt_filename: uploaded.filename,
        receipt_mime_type: uploaded.mimeType,
        receipt_size_bytes: uploaded.sizeBytes,
        receipt_uploaded_at: now,
      } as never)
      .eq('id', order.id)
      .eq('user_id', context.user.id)

    if (updateError) {
      throw new MobileApiError('RECEIPT_RECORD_FAILED', 'Receipt was uploaded, but the order could not be updated.', 500)
    }

    await context.supabase.from('order_events').insert({
      order_id: order.id,
      user_id: context.user.id,
      actor_id: context.user.id,
      event_type: 'mobile_order_receipt_uploaded',
      previous_status: order.status,
      new_status: 'payment_submitted',
      payload: {
        transactionReference: metadata.transactionReference ?? null,
        receiptPath: uploaded.path,
      },
    } as never)

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_order_receipt_uploaded',
      entityType: 'order',
      entityId: order.id,
      metadata: { mimeType: uploaded.mimeType, sizeBytes: uploaded.sizeBytes },
    })

    const shippingAddress = objectRecord(order.shipping_address)
    await notifyAdminOfPaymentReceipt({
      type: 'order',
      source: 'Mobile order receipt upload',
      orderId: order.id,
      reference: order.invoice_number ? `Invoice ${order.invoice_number}` : order.id,
      status: 'payment_submitted',
      paymentMethod: order.payment_method,
      amount: Number(order.total ?? 0),
      currency: 'PKR',
      customer: {
        name: firstText(shippingAddress.fullName, context.profile.full_name, context.user.email),
        email: firstText(shippingAddress.email, context.profile.email, order.guest_email, context.user.email),
        phone: firstText(shippingAddress.phone, order.phone),
      },
      receipt: {
        filename: uploaded.filename,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        storageBucket: uploaded.bucket,
        storagePath: uploaded.path,
      },
      uploadedAt: now,
      attachmentFile: file,
    })

    return createMobileApiResponse(
      {
        receipt: {
          uploaded: true,
          filename: uploaded.filename,
          mimeType: uploaded.mimeType,
          sizeBytes: uploaded.sizeBytes,
          uploadedAt: now,
          reviewStatus: 'payment_submitted',
        },
      },
      { status: 201, headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
