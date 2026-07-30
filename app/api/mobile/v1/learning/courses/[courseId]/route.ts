import { isEnrollmentActive } from '@/lib/lms'
import { requireMobileUser, mobileUserCanManageCourse } from '@/lib/mobile-api/auth'
import { enforceMobileRateLimit } from '@/lib/mobile-api/rate-limit'
import {
  createMobileApiResponse,
  createMobileRequestId,
  handleMobileApiError,
  MobileApiError,
} from '@/lib/mobile-api/response'

function safeLesson(lesson: Record<string, unknown>, canAccess: boolean) {
  const preview = Boolean(lesson.is_preview)
  const includeContent = canAccess || preview

  return {
    id: lesson.id,
    moduleId: lesson.module_id,
    courseId: lesson.course_id,
    title: lesson.title,
    description: lesson.description,
    lessonType: lesson.lesson_type,
    readingType: lesson.reading_type,
    durationMinutes: lesson.duration_minutes,
    sortOrder: lesson.sort_order,
    isPreview: preview,
    isCompulsory: lesson.is_compulsory,
    manualCompletionAllowed: lesson.manual_completion_allowed,
    completionMode: lesson.completion_mode,
    requiredCompletionPercentage: lesson.required_completion_percentage,
    content: includeContent ? lesson.content : null,
    richContent: includeContent ? lesson.rich_content : null,
    articleContent: includeContent ? lesson.article_content : null,
    videoUrl: includeContent ? lesson.video_url : null,
    materialUrl: includeContent ? lesson.material_url : null,
    requiresEnrollment: !preview,
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const requestId = createMobileRequestId(request)

  try {
    const { courseId } = await params
    const context = await requireMobileUser(request)
    enforceMobileRateLimit(request, 'learning-course-detail', { identifier: context.user.id, limit: 80, windowMs: 60_000 })

    const [{ data: course }, { data: enrollment }, canManage] = await Promise.all([
      context.supabase.from('courses').select('*').eq('id', courseId).eq('published', true).maybeSingle(),
      context.supabase.from('enrollments').select('*').eq('user_id', context.user.id).eq('course_id', courseId).maybeSingle(),
      mobileUserCanManageCourse(context, courseId),
    ])

    if (!course) throw new MobileApiError('COURSE_NOT_FOUND', 'Course could not be found.', 404)

    const active = canManage || isEnrollmentActive(enrollment as never)
    const expired = Boolean(enrollment?.expires_at && new Date(enrollment.expires_at).getTime() <= Date.now())

    const [{ data: modules }, { data: progress }, { data: resources }, { data: completion }] = await Promise.all([
      context.supabase
        .from('course_modules')
        .select('*, course_lessons(*)')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true }),
      context.supabase
        .from('lesson_progress')
        .select('lesson_id, completed, completed_at, content_progress_percentage, video_percentage, last_accessed_at')
        .eq('user_id', context.user.id)
        .eq('course_id', courseId),
      context.supabase
        .from('course_resources')
        .select('id, course_id, module_id, lesson_id, title, description, resource_type, visibility, is_downloadable, is_view_only, sort_order, external_url, resource_url')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true }),
      context.supabase
        .from('course_completion_status')
        .select('*')
        .eq('user_id', context.user.id)
        .eq('course_id', courseId)
        .maybeSingle(),
    ])

    const progressByLesson = new Map((progress ?? []).map((row) => [row.lesson_id, row]))
    const safeModules = (modules ?? [])
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .map((module) => {
        const lessons = ((module.course_lessons ?? []) as Record<string, unknown>[])
          .filter((lesson) => lesson.published !== false)
          .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
          .filter((lesson) => active || Boolean(lesson.is_preview))
          .map((lesson) => ({
            ...safeLesson(lesson, active),
            progress: progressByLesson.get(String(lesson.id)) ?? null,
          }))

        return {
          id: module.id,
          courseId: module.course_id,
          title: module.title,
          description: module.description,
          sortOrder: module.sort_order,
          lessons,
        }
      })

    return createMobileApiResponse(
      {
        course: {
          id: course.id,
          title: course.title,
          slug: course.slug,
          subtitle: course.subtitle,
          excerpt: course.excerpt,
          imageUrl: course.image_url,
          thumbnailUrl: course.thumbnail_url,
          category: course.category,
          level: course.level,
          duration: course.duration,
          instructor: course.instructor,
        },
        access: {
          enrolled: Boolean(enrollment),
          active,
          expired,
          status: enrollment?.status ?? null,
          paymentStatus: enrollment?.payment_status ?? null,
          expiresAt: enrollment?.expires_at ?? null,
        },
        modules: safeModules,
        resources: (resources ?? [])
          .filter((resource) => active || resource.visibility === 'public')
          .map((resource) => ({
            id: resource.id,
            courseId: resource.course_id,
            moduleId: resource.module_id,
            lessonId: resource.lesson_id,
            title: resource.title,
            description: resource.description,
            resourceType: resource.resource_type,
            visibility: resource.visibility,
            isDownloadable: resource.is_downloadable,
            isViewOnly: resource.is_view_only,
            externalUrl: resource.visibility === 'public' ? resource.external_url ?? resource.resource_url : null,
            requiresSignedAccess: Boolean(resource.visibility !== 'public'),
          })),
        completion: completion ?? null,
      },
      { headers: { 'X-Request-Id': requestId } },
    )
  } catch (error) {
    return handleMobileApiError(error, requestId)
  }
}
