import { createServiceClient } from '@/lib/supabase/server'
import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileNewsletterSubscribeSchema, normalizeEmail } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function POST(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const parsed = mobileNewsletterSubscribeSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid subscription request.', 400)
    }

    const normalizedEmail = normalizeEmail(parsed.data.email)
    enforceMobileRateLimit(request, 'newsletter-subscribe', { identifier: normalizedEmail, limit: 5, windowMs: 300_000 })

    const supabase = await createServiceClient()
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('normalized_email', normalizedEmail)
      .maybeSingle()

    const now = new Date().toISOString()
    if (existing) {
      if (existing.status === 'subscribed') {
        return createMobileApiResponse({ subscribed: true, status: 'already_subscribed' })
      }

      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({
          email: parsed.data.email.trim(),
          full_name: parsed.data.fullName ?? null,
          source: parsed.data.source,
          status: 'subscribed',
          subscribed_at: now,
          unsubscribed_at: null,
          consent_metadata: parsed.data.consentMetadata,
        } as never)
        .eq('id', existing.id)

      if (error) throw new MobileApiError('NEWSLETTER_SAVE_FAILED', 'Subscription could not be saved.', 500)
      return createMobileApiResponse({ subscribed: true, status: 'resubscribed' })
    }

    const { error } = await supabase.from('newsletter_subscribers').insert({
      email: parsed.data.email.trim(),
      normalized_email: normalizedEmail,
      full_name: parsed.data.fullName ?? null,
      source: parsed.data.source,
      status: 'subscribed',
      subscribed_at: now,
      consent_metadata: parsed.data.consentMetadata,
    } as never)

    if (error) {
      if (error.code === '23505') {
        return createMobileApiResponse({ subscribed: true, status: 'already_subscribed' })
      }
      throw new MobileApiError('NEWSLETTER_SAVE_FAILED', 'Subscription could not be saved.', 500)
    }

    await recordMobileAuditEvent({
      request,
      requestId,
      eventType: 'mobile_newsletter_subscribed',
      entityType: 'newsletter_subscriber',
      metadata: { source: parsed.data.source },
    })

    return createMobileApiResponse({ subscribed: true, status: 'subscribed' }, { status: 201 })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
