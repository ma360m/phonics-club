import { createServiceClient } from '@/lib/supabase/server'
import { getMobileRequestIp, getMobileUserAgent } from './rate-limit'

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function recordMobileAuditEvent(input: {
  request?: Request
  userId?: string | null
  eventType: string
  entityType?: string
  entityId?: string | null
  requestId?: string
  metadata?: Record<string, unknown>
}) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return

  try {
    const ip = input.request ? getMobileRequestIp(input.request) : null
    const supabase = await createServiceClient()
    await supabase.from('mobile_audit_events').insert({
      user_id: input.userId ?? null,
      event_type: input.eventType,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      request_id: input.requestId ?? null,
      ip_hash: ip && ip !== 'unknown' ? await sha256(ip) : null,
      user_agent: input.request ? getMobileUserAgent(input.request) : null,
      metadata: input.metadata ?? {},
    } as never)
  } catch (error) {
    console.error('[Mobile API] Audit event could not be recorded:', error)
  }
}
