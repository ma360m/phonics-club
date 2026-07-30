import { createMobileApiResponse, createMobileRequestId, handleMobileApiError } from '@/lib/mobile-api/response'
import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'

export async function GET(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'auth-me', { identifier: context.user.id, limit: 60, windowMs: 60_000 })

    const metadata = (context.user.user_metadata ?? {}) as Record<string, unknown>
    const notificationPreferences =
      metadata.notification_preferences && typeof metadata.notification_preferences === 'object'
        ? metadata.notification_preferences
        : { email: true, push: false }

    return createMobileApiResponse(
      {
        user: {
          id: context.user.id,
          email: context.user.email ?? context.profile.email,
          createdAt: context.user.created_at ?? context.profile.created_at,
        },
        profile: {
          id: context.profile.id,
          fullName: context.profile.full_name,
          avatarUrl: context.profile.avatar_url,
          role: context.profile.role,
          preferredCurrency: metadata.preferred_currency === 'USD' ? 'USD' : 'PKR',
          notificationPreferences,
          createdAt: context.profile.created_at,
          updatedAt: context.profile.updated_at,
        },
      },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
