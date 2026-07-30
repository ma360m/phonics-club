import { isMobileAdminRole, requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ certificateId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { certificateId } = await params
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'certificates-detail', { identifier: context.user.id, limit: 80, windowMs: 60_000 })

    const { data: certificate, error } = await context.supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .maybeSingle()

    if (error || !certificate) throw new MobileApiError('CERTIFICATE_NOT_FOUND', 'Certificate could not be found.', 404)
    if (certificate.user_id !== context.user.id && !isMobileAdminRole(context.profile.role)) {
      throw new MobileApiError('CERTIFICATE_FORBIDDEN', 'You are not authorized to view this certificate.', 403)
    }

    return createMobileApiResponse(
      {
        certificate: {
          id: certificate.id,
          courseId: certificate.course_id,
          certificateNumber: certificate.certificate_number,
          studentName: certificate.student_name,
          courseTitle: certificate.course_title,
          instructorName: certificate.instructor_name,
          issuedAt: certificate.issued_at,
          status: certificate.status,
          onlineMinutes: certificate.online_minutes,
          offlineMinutes: certificate.offline_minutes,
          finalScore: certificate.final_score,
          verificationCode: certificate.verification_code,
          verificationUrl: certificate.verification_url,
          revokedAt: certificate.revoked_at,
          revokeReason: certificate.revoke_reason,
        },
      },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
