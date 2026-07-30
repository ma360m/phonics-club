import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { isMobileAdminRole, requireMobileUser } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { createPrivateSignedUrl } from '@/lib/mobile-api/storage'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ certificateId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { certificateId } = await params
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'certificates-download', { identifier: context.user.id, limit: 30, windowMs: 60_000 })

    const { data: certificate, error } = await context.supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .maybeSingle()

    if (error || !certificate) throw new MobileApiError('CERTIFICATE_NOT_FOUND', 'Certificate could not be found.', 404)
    if (certificate.user_id !== context.user.id && !isMobileAdminRole(context.profile.role)) {
      throw new MobileApiError('CERTIFICATE_FORBIDDEN', 'You are not authorized to download this certificate.', 403)
    }
    if (certificate.status === 'revoked') {
      throw new MobileApiError('CERTIFICATE_REVOKED', 'This certificate has been revoked.', 409)
    }

    let download: { url: string; expiresAt: string | null; expiresIn: number | null }
    if (certificate.pdf_bucket && certificate.pdf_path) {
      const signed = await createPrivateSignedUrl(certificate.pdf_bucket, certificate.pdf_path, 300)
      download = signed
    } else if (certificate.pdf_url) {
      download = { url: certificate.pdf_url, expiresAt: null, expiresIn: null }
    } else {
      throw new MobileApiError('CERTIFICATE_FILE_MISSING', 'Certificate PDF is not available yet.', 404)
    }

    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_certificate_downloaded',
      entityType: 'certificate',
      entityId: certificate.id,
      metadata: { courseId: certificate.course_id },
    })

    return createMobileApiResponse(
      {
        certificate: {
          id: certificate.id,
          certificateNumber: certificate.certificate_number,
          downloadUrl: download.url,
          expiresAt: download.expiresAt,
          expiresIn: download.expiresIn,
        },
      },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
