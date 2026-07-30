import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobilePushTokenRegistrationSchema } from '@/lib/mobile-api/schemas'
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
    enforceMobileRateLimit(request, 'device-register', { identifier: context.user.id, limit: 20, windowMs: 60_000 })

    const parsed = mobilePushTokenRegistrationSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid device registration.', 400)
    }

    const now = new Date().toISOString()
    const { data: device, error } = await context.supabase
      .from('mobile_devices')
      .upsert(
        {
          user_id: context.user.id,
          expo_push_token: parsed.data.expoPushToken,
          platform: parsed.data.platform,
          app_version: parsed.data.appVersion,
          device_name: parsed.data.deviceName ?? null,
          locale: parsed.data.locale ?? null,
          timezone: parsed.data.timezone ?? null,
          is_active: true,
          last_seen_at: now,
          updated_at: now,
        } as never,
        { onConflict: 'expo_push_token' },
      )
      .select('id, platform, app_version, is_active, last_seen_at, created_at, updated_at')
      .single()

    if (error || !device) {
      throw new MobileApiError('DEVICE_SAVE_FAILED', 'Device could not be registered.', 500)
    }

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_push_token_registered',
      entityType: 'mobile_device',
      entityId: device.id,
      metadata: { platform: parsed.data.platform, appVersion: parsed.data.appVersion },
    })

    return createMobileApiResponse(
      { device },
      { status: 201, headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
