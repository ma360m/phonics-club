import { isEnrollmentActive } from '@/lib/lms'
import { recordMobileAuditEvent } from '@/lib/mobile-api/audit'
import { requireMobileUser, mobileUserCanManageCourse } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import { createPrivateSignedUrl } from '@/lib/mobile-api/storage'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

const protectedBuckets = new Set([
  'course-videos',
  'course-materials',
  'course-resources',
  'lesson-content',
  'assignment-submissions',
  'generated-certificates',
])

export async function POST(
  request: Request,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { resourceId } = await params
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'learning-resource-access', { identifier: context.user.id, limit: 60, windowMs: 60_000 })

    const { data: resource, error } = await context.supabase
      .from('course_resources')
      .select('*')
      .eq('id', resourceId)
      .maybeSingle()

    if (error || !resource) throw new MobileApiError('RESOURCE_NOT_FOUND', 'Resource could not be found.', 404)

    const [{ data: enrollment }, { data: lesson }, canManage] = await Promise.all([
      context.supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', context.user.id)
        .eq('course_id', resource.course_id)
        .maybeSingle(),
      resource.lesson_id
        ? context.supabase.from('course_lessons').select('id, is_preview').eq('id', resource.lesson_id).maybeSingle()
        : Promise.resolve({ data: null }),
      mobileUserCanManageCourse(context, resource.course_id),
    ])

    const previewAccess = resource.visibility === 'public' || Boolean(lesson?.is_preview)
    const activeAccess = isEnrollmentActive(enrollment as never)
    if (!previewAccess && !activeAccess && !canManage) {
      await recordMobileAuditEvent({
        request,
        requestId,
        userId: context.user.id,
        eventType: 'unauthorized_resource_access',
        entityType: 'course_resource',
        entityId: resource.id,
        metadata: { courseId: resource.course_id },
      })
      throw new MobileApiError('RESOURCE_FORBIDDEN', 'You do not have access to this resource.', 403)
    }

    if (!resource.storage_bucket || !resource.storage_path) {
      if (resource.visibility === 'public' && (resource.external_url || resource.resource_url)) {
        return createMobileApiResponse({
          resource: {
            id: resource.id,
            url: resource.external_url ?? resource.resource_url,
            expiresAt: null,
            expiresIn: null,
          },
        })
      }
      throw new MobileApiError('RESOURCE_FILE_MISSING', 'Resource file is not attached.', 404)
    }

    if (!protectedBuckets.has(resource.storage_bucket) && resource.visibility !== 'public') {
      throw new MobileApiError('RESOURCE_BUCKET_NOT_ALLOWED', 'Resource storage is not configured for mobile access.', 403)
    }

    const signed = await createPrivateSignedUrl(resource.storage_bucket, resource.storage_path, 300)
    await context.supabase.from('course_resource_downloads').insert({
      resource_id: resource.id,
      user_id: context.user.id,
      course_id: resource.course_id,
    } as never)
    await recordMobileAuditEvent({
      request,
      requestId,
      userId: context.user.id,
      eventType: 'mobile_resource_signed_url_created',
      entityType: 'course_resource',
      entityId: resource.id,
      metadata: { courseId: resource.course_id, bucket: resource.storage_bucket },
    })

    return createMobileApiResponse(
      {
        resource: {
          id: resource.id,
          url: signed.url,
          expiresAt: signed.expiresAt,
          expiresIn: signed.expiresIn,
        },
      },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
