import { requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
} from '@/lib/mobile-api/response'

export async function GET(request: Request) {
  const requestId = createMobileRequestId(request)

  try {
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'certificates-list', { identifier: context.user.id, limit: 60, windowMs: 60_000 })

    const { data, error } = await context.supabase
      .from('certificates')
      .select('id, course_id, certificate_number, student_name, course_title, instructor_name, issued_at, status, online_minutes, offline_minutes, final_score, verification_code, verification_url')
      .eq('user_id', context.user.id)
      .order('issued_at', { ascending: false })

    if (error) throw error

    return createMobileApiResponse({ certificates: data ?? [] }, { headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
