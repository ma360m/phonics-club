import { createServiceClient } from '@/lib/supabase/server'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { mobileNewsletterUnsubscribeSchema, normalizeEmail } from '@/lib/mobile-api/schemas'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function POST(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const parsed = mobileNewsletterUnsubscribeSchema.safeParse(await request.json())
    if (!parsed.success) {
      throw new MobileApiError('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid unsubscribe request.', 400)
    }

    const normalizedEmail = normalizeEmail(parsed.data.email)
    enforceMobileRateLimit(request, 'newsletter-unsubscribe', { identifier: normalizedEmail, limit: 5, windowMs: 300_000 })

    const supabase = await createServiceClient()
    await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      } as never)
      .eq('normalized_email', normalizedEmail)

    return createMobileApiResponse({ unsubscribed: true })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
