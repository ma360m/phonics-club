import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { deviceId } = await params
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'device-unregister', { identifier: context.user.id, limit: 20, windowMs: 60_000 })

    const { data: device, error } = await context.supabase
      .from('mobile_devices')
      .update({
        is_active: false,
        last_seen_at: new Date().toISOString(),
      } as never)
      .eq('id', deviceId)
      .eq('user_id', context.user.id)
      .select('id, is_active')
      .maybeSingle()

    if (error || !device) {
      throw new MobileApiError('DEVICE_NOT_FOUND', 'Device could not be found.', 404)
    }

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_push_token_disabled',
      entityType: 'mobile_device',
      entityId: device.id,
    })

    return createMobileApiResponse({ device })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
