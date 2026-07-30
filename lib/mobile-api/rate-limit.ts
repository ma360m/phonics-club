import { rateLimit } from '@/lib/rate-limit'
import { MobileApiError } from './response'

const DEFAULT_LIMIT = 30
const DEFAULT_WINDOW_MS = 60_000

export function getMobileRequestIp(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'
  )
}

export function getMobileUserAgent(request: Request) {
  return request.headers.get('user-agent')?.slice(0, 500) || null
}

export function getMobileRateLimitHeaders(remaining: number) {
  return {
    'X-RateLimit-Remaining': String(Math.max(remaining, 0)),
  }
}

export function enforceMobileRateLimit(
  request: Request,
  scope: string,
  options: {
    identifier?: string | null
    limit?: number
    windowMs?: number
  } = {},
) {
  const identifier = options.identifier || getMobileRequestIp(request)
  const result = rateLimit(
    `mobile:${scope}:${identifier}`,
    options.limit ?? DEFAULT_LIMIT,
    options.windowMs ?? DEFAULT_WINDOW_MS,
  )

  if (!result.success) {
    throw new MobileApiError('RATE_LIMITED', 'Too many requests. Please try again later.', 429)
  }

  return result
}
