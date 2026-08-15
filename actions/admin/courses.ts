'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin, requireAdminOrInstructor } from '@/lib/auth'
import { assignInstructorCourseOwner, canManageCourseId, getManagedCourseIds } from '@/lib/admin/course-scope'
import { courseSchema } from '@/lib/validations/course'
import { friendlyErrorMessage, toError } from '@/lib/friendly-error'
import { normalizeMediaUrl } from '@/lib/media-url'
import { CHILDREN_PHONICS_COURSES, mergeMissingChildrenPhonicsCourses } from '@/lib/data/children-phonics-courses'
import { ensureChildrenPhonicsCoursesInstalled } from '@/lib/data/children-phonics-install'
import type { ActionResult, CurriculumModule } from '@/types'
import type { Course } from '@/types/database'
import { z } from 'zod'

function parseLines(formData: FormData, key: string): string[] {
  const raw = formData.get(key)
  if (!raw) return []
  return String(raw).split('\n').map((s) => s.trim()).filter(Boolean)
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {}
}

function optionalNumber(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? '').trim()
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) ? Math.max(0, value) : null
}

function setOptionalString(metadata: Record<string, unknown>, key: string, value: string) {
  if (value) metadata[key] = value
  else delete metadata[key]
}

function parseCourseForm(formData: FormData, existingMetadata?: unknown) {
  let curriculum: CurriculumModule[] = []
  try {
    const raw = formData.get('curriculum')
    if (raw) curriculum = JSON.parse(String(raw))
  } catch {
    curriculum = []
  }

  const selectedVisibilityRaw = String(formData.get('visibility_status') || (formData.get('published') === 'on' ? 'published' : 'draft'))
  const selectedVisibility = ['draft', 'published', 'unlisted', 'archived'].includes(selectedVisibilityRaw)
    ? selectedVisibilityRaw
    : 'draft'
  const archived = formData.get('archived') === 'on' || selectedVisibility === 'archived'
  const selectedDraft = selectedVisibility === 'draft'
  const published = !archived && !selectedDraft && (
    selectedVisibility === 'published' ||
    selectedVisibility === 'unlisted' ||
    formData.get('published') === 'on'
  )
  const unlisted = selectedVisibility === 'unlisted' || (selectedVisibility !== 'published' && formData.get('unlisted') === 'on')
  const visibilityStatus = archived
    ? 'archived'
    : !published
      ? 'draft'
      : unlisted || selectedVisibility === 'unlisted'
        ? 'unlisted'
        : selectedVisibility === 'published'
          ? 'published'
          : 'published'

  const parsed = courseSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    subtitle: formData.get('subtitle'),
    description: formData.get('description'),
    rich_description: formData.get('rich_description'),
    excerpt: formData.get('excerpt'),
    price: formData.get('price'),
    discounted_price: formData.get('discounted_price') || null,
    currency: formData.get('currency') || 'PKR',
    category: formData.get('category'),
    level: formData.get('level'),
    language: formData.get('language') || 'English',
    duration: formData.get('duration'),
    instructor: formData.get('instructor'),
    instructor_bio: formData.get('instructor_bio'),
    image_url: normalizeMediaUrl(String(formData.get('image_url') ?? '')),
    thumbnail_url: normalizeMediaUrl(String(formData.get('thumbnail_url') || formData.get('image_url') || '')),
    banner_url: normalizeMediaUrl(String(formData.get('banner_url') ?? '')),
    instructor_image_url: normalizeMediaUrl(String(formData.get('instructor_image_url') ?? '')),
    certificate_background_url: normalizeMediaUrl(String(formData.get('certificate_background_url') ?? '')),
    hero_video_url: normalizeMediaUrl(String(formData.get('hero_video_url') ?? '')),
    enrolment_opens_at: formData.get('enrolment_opens_at') || null,
    enrolment_closes_at: formData.get('enrolment_closes_at') || null,
    max_students: formData.get('max_students') || null,
    access_duration_days: formData.get('access_duration_days') || 90,
    required_online_minutes: formData.get('required_online_minutes') || 0,
    required_offline_minutes: formData.get('required_offline_minutes') || 0,
    passing_quiz_percentage: formData.get('passing_quiz_percentage') || 70,
    required_assignment_passes: formData.get('required_assignment_passes') || 0,
    daily_online_minutes_cap: formData.get('daily_online_minutes_cap') || 480,
    inactivity_timeout_seconds: formData.get('inactivity_timeout_seconds') || 240,
    max_offline_entry_minutes: formData.get('max_offline_entry_minutes') || 360,
    objectives: formData.get('objectives'),
    requirements: formData.get('requirements'),
    seo_title: formData.get('seo_title'),
    seo_description: formData.get('seo_description'),
    featured: formData.get('featured') === 'on',
    published,
    visibility_status: visibilityStatus,
    enrollment_status: formData.get('enrollment_status') || 'open',
    unlisted: visibilityStatus === 'unlisted',
    archived,
    coming_soon: formData.get('coming_soon') === 'on',
    certificate_enabled: formData.get('certificate_enabled') === 'on',
    certificate_requires_payment: formData.get('certificate_requires_payment') === 'on',
    certificate_price: formData.get('certificate_price') || 0,
    completion_requires_lessons: formData.get('completion_requires_lessons') === 'on',
    completion_requires_online_minutes: formData.get('completion_requires_online_minutes') === 'on',
    completion_requires_offline_minutes: formData.get('completion_requires_offline_minutes') === 'on',
    completion_requires_quiz: formData.get('completion_requires_quiz') === 'on',
    completion_requires_assignments: formData.get('completion_requires_assignments') === 'on',
    completion_requires_active_enrollment: formData.get('completion_requires_active_enrollment') === 'on',
    completion_requires_instructor_approval: formData.get('completion_requires_instructor_approval') === 'on',
    offline_evidence_required: formData.get('offline_evidence_required') === 'on',
  })

  if (!parsed.success) {
    return {
      ok: false as const,
      error: friendlyErrorMessage(parsed.error.errors[0]?.message, 'Course details are incomplete.'),
    }
  }

  const price = parsed.data.price
  const certificateRequiresPayment = parsed.data.certificate_enabled && parsed.data.certificate_requires_payment
  const certificatePrice = certificateRequiresPayment ? parsed.data.certificate_price : 0
  const previewVideoUrl = String(formData.get('preview_video_url') ?? '').trim()
  const highlights = parseLines(formData, 'highlights')
  const coreMaterials = parseLines(formData, 'core_materials')
  const intendedAudience = parseLines(formData, 'intended_audience')
  const targetAudience = parseLines(formData, 'target_audience')
  const metadata = metadataRecord(existingMetadata)
  metadata.certificateEnabled = formData.get('certificate_enabled') === 'on'
  metadata.certificateRequiresPayment = certificateRequiresPayment
  metadata.certificatePrice = certificatePrice
  if (previewVideoUrl) metadata.previewVideoUrl = previewVideoUrl
  else delete metadata.previewVideoUrl
  if (highlights.length) metadata.highlights = highlights
  else delete metadata.highlights
  if (coreMaterials.length) metadata.coreMaterials = coreMaterials
  else delete metadata.coreMaterials
  if (intendedAudience.length) metadata.intendedAudience = intendedAudience
  else delete metadata.intendedAudience

  const instructorHelpEnabled = formData.get('instructor_help_enabled') === 'on'
  const instructorHelpTotalPrice = optionalNumber(formData, 'instructor_help_total_price')
  metadata.instructorHelpEnabled = instructorHelpEnabled
  if (instructorHelpEnabled && instructorHelpTotalPrice !== null) metadata.instructorHelpTotalPrice = instructorHelpTotalPrice
  else delete metadata.instructorHelpTotalPrice
  setOptionalString(metadata, 'instructorHelpLabel', String(formData.get('instructor_help_label') ?? '').trim())
  setOptionalString(metadata, 'instructorHelpNote', String(formData.get('instructor_help_note') ?? '').trim())
  setOptionalString(metadata, 'instructorHelpContactUrl', String(formData.get('instructor_help_contact_url') ?? '').trim())

  return {
    ok: true as const,
    data: {
      ...parsed.data,
      certificate_requires_payment: certificateRequiresPayment,
      certificate_price: certificatePrice,
      objectives: parseLines(formData, 'objectives'),
      requirements: parseLines(formData, 'requirements'),
      target_audience: targetAudience.length ? targetAudience : intendedAudience,
      is_free: price === 0,
      curriculum,
      metadata,
    },
  }
}

export async function createCourseAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireAdminOrInstructor()
  const parsed = parseCourseForm(formData)
  if (!parsed.ok) return { success: false, error: parsed.error }

  const supabase = await createClient()
  const { data: course, error } = await supabase.from('courses').insert(parsed.data as never).select('id').single()
  if (error) return { success: false, error: friendlyErrorMessage(error, 'Course could not be created.') }
  if (course?.id) {
    try {
      await assignInstructorCourseOwner(course.id, actor)
    } catch (ownershipError) {
      return { success: false, error: friendlyErrorMessage(ownershipError, 'Course ownership could not be saved.') }
    }
  }

  revalidatePath('/admin/courses')
  revalidatePath('/courses')
  return { success: true }
}

export async function updateCourseAction(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireAdminOrInstructor()
  const supabase = await createClient()
  if (!(await canManageCourseId(actor, id, supabase))) {
    return { success: false, error: 'You can only update courses assigned to your instructor account.' }
  }
  const { data: existing } = await supabase.from('courses').select('metadata').eq('id', id).maybeSingle()
  const parsed = parseCourseForm(formData, (existing as { metadata?: unknown } | null)?.metadata)
  if (!parsed.ok) return { success: false, error: parsed.error }

  const { error } = await supabase.from('courses').update(parsed.data as never).eq('id', id)
  if (error) return { success: false, error: friendlyErrorMessage(error, 'Course could not be updated.') }

  revalidatePath('/admin/courses')
  revalidatePath('/courses')
  return { success: true }
}

export async function deleteCourseAction(id: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw toError(error, 'Course could not be deleted.')

  revalidatePath('/admin/courses')
}

export async function deleteCourseWithOptionsFormAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const parsed = z.object({
    courseId: z.string().uuid(),
    confirm: z.literal('DELETE'),
    deleteCoursePayments: z.boolean(),
  }).safeParse({
    courseId: formData.get('courseId'),
    confirm: formData.get('confirm'),
    deleteCoursePayments: formData.get('deleteCoursePayments') === 'on',
  })
  if (!parsed.success) throw new Error('Type DELETE to confirm course deletion.')

  const supabase = await createClient()
  if (parsed.data.deleteCoursePayments) {
    await supabase.from('course_payments').delete().eq('course_id', parsed.data.courseId)
  }

  const { error } = await supabase.from('courses').delete().eq('id', parsed.data.courseId)
  if (error) throw toError(error, 'Course could not be deleted.')

  revalidatePath('/admin/courses')
  revalidatePath('/courses')
  revalidatePath('/dashboard/my-courses')
}

export async function updateCoursePublishStatusAction(id: string, published: boolean): Promise<void> {
  const actor = await requireAdminOrInstructor()
  const supabase = await createClient()
  if (!(await canManageCourseId(actor, id, supabase))) {
    throw new Error('You can only publish courses assigned to your instructor account.')
  }
  const { error } = await supabase
    .from('courses')
    .update({
      published,
      ...(published ? { unlisted: false } : {}),
      visibility_status: published ? 'published' : 'draft',
      archived: false,
    } as never)
    .eq('id', id)
  if (error) throw toError(error, published ? 'Course could not be published.' : 'Course could not be saved as draft.')

  if (published) {
    const { error: lessonsError } = await supabase
      .from('course_lessons')
      .update({ published: true } as never)
      .eq('course_id', id)
    if (lessonsError) throw toError(lessonsError, 'Course was published, but lessons could not be shown.')

    const { error: quizzesError } = await supabase
      .from('course_quizzes')
      .update({ published: true } as never)
      .eq('course_id', id)
    if (quizzesError) throw toError(quizzesError, 'Course was published, but quizzes could not be shown.')
  }

  revalidatePath('/admin/courses')
  revalidatePath(`/admin/courses/${id}/builder`)
  revalidatePath('/courses')
}

export async function updateCourseCatalogVisibilityAction(id: string, listed: boolean): Promise<void> {
  const actor = await requireAdminOrInstructor()
  const supabase = await createClient()
  if (!(await canManageCourseId(actor, id, supabase))) {
    throw new Error('You can only update courses assigned to your instructor account.')
  }
  const { data: course } = await supabase
    .from('courses')
    .select('published')
    .eq('id', id)
    .maybeSingle()
  const published = Boolean((course as { published?: boolean } | null)?.published)
  const { error } = await supabase
    .from('courses')
    .update({
      unlisted: !listed,
      archived: false,
      visibility_status: published ? (listed ? 'published' : 'unlisted') : 'draft',
    } as never)
    .eq('id', id)
  if (error) throw toError(error, listed ? 'Course could not be shown publicly.' : 'Course could not be hidden.')

  revalidatePath('/admin/courses')
  revalidatePath(`/admin/courses/${id}/builder`)
  revalidatePath('/courses')
}

export async function updateCourseArchiveStatusAction(id: string, archived: boolean): Promise<void> {
  const actor = await requireAdminOrInstructor()
  const supabase = await createClient()
  if (!(await canManageCourseId(actor, id, supabase))) {
    throw new Error('You can only update courses assigned to your instructor account.')
  }
  const { data: course } = await supabase
    .from('courses')
    .select('published, unlisted')
    .eq('id', id)
    .maybeSingle()
  const published = Boolean((course as { published?: boolean } | null)?.published)
  const unlisted = Boolean((course as { unlisted?: boolean } | null)?.unlisted)
  const { error } = await supabase
    .from('courses')
    .update({
      archived,
      visibility_status: archived ? 'archived' : published ? (unlisted ? 'unlisted' : 'published') : 'draft',
      published: archived ? false : published,
    } as never)
    .eq('id', id)
  if (error) throw toError(error, archived ? 'Course could not be archived.' : 'Course could not be restored.')

  revalidatePath('/admin/courses')
  revalidatePath(`/admin/courses/${id}/builder`)
  revalidatePath('/courses')
}

export async function updateCourseMediaAction(id: string, formData: FormData): Promise<void> {
  const actor = await requireAdminOrInstructor()
  const supabase = await createClient()
  if (!(await canManageCourseId(actor, id, supabase))) {
    throw new Error('You can only update media for courses assigned to your instructor account.')
  }
  const imageUrl = normalizeMediaUrl(String(formData.get('image_url') ?? ''))
  const { error } = await supabase
    .from('courses')
    .update({
      image_url: imageUrl || null,
      thumbnail_url: normalizeMediaUrl(String(formData.get('thumbnail_url') || imageUrl || '')) || null,
      banner_url: normalizeMediaUrl(String(formData.get('banner_url') ?? '')) || null,
      hero_video_url: normalizeMediaUrl(String(formData.get('hero_video_url') ?? '')) || null,
    } as never)
    .eq('id', id)
  if (error) throw toError(error, 'Course media could not be saved.')

  revalidatePath(`/admin/courses/${id}/builder`)
  revalidatePath(`/courses`)
}

export async function updateCourseCertificateSettingsAction(id: string, formData: FormData): Promise<void> {
  const actor = await requireAdminOrInstructor()
  const supabase = await createClient()
  if (!(await canManageCourseId(actor, id, supabase))) {
    throw new Error('You can only update certificate settings for courses assigned to your instructor account.')
  }

  const certificateEnabled = formData.get('certificate_enabled') === 'on'
  const certificateRequiresPayment = certificateEnabled && formData.get('certificate_requires_payment') === 'on'
  const certificatePrice = certificateRequiresPayment ? Number(formData.get('certificate_price') || 0) : 0
  if (certificateRequiresPayment && (!Number.isFinite(certificatePrice) || certificatePrice <= 0)) {
    throw new Error('Enter a certificate price greater than 0, or turn off certificate payment.')
  }
  const { error } = await supabase
    .from('courses')
    .update({
      certificate_enabled: certificateEnabled,
      certificate_requires_payment: certificateRequiresPayment,
      certificate_price: certificatePrice,
      certificate_background_url: normalizeMediaUrl(String(formData.get('certificate_background_url') ?? '')) || null,
      passing_quiz_percentage: Number(formData.get('passing_quiz_percentage') || 70),
      completion_requires_lessons: formData.get('completion_requires_lessons') === 'on',
      completion_requires_quiz: certificateEnabled && formData.get('completion_requires_quiz') === 'on',
      completion_requires_active_enrollment: formData.get('completion_requires_active_enrollment') === 'on',
      completion_requires_instructor_approval: formData.get('completion_requires_instructor_approval') === 'on',
    } as never)
    .eq('id', id)

  if (error) throw toError(error, 'Certificate settings could not be saved.')

  revalidatePath('/admin/courses')
  revalidatePath(`/admin/courses/${id}`)
  revalidatePath(`/admin/courses/${id}/builder`)
  revalidatePath(`/course/${id}/certificate`)
}

export async function installChildrenPhonicsCoursesAction(): Promise<void> {
  await requireAdmin()
  await ensureChildrenPhonicsCoursesInstalled()
  revalidatePath('/admin/courses')
  revalidatePath('/courses')
}

export async function getAdminCourses() {
  const actor = await requireAdminOrInstructor()
  const supabase = await createClient()
  const managedCourseIds = await getManagedCourseIds(actor, supabase)
  if (managedCourseIds && managedCourseIds.length === 0) return []
  let query = supabase.from('courses').select('*').order('created_at', { ascending: false })
  if (managedCourseIds) query = query.in('id', managedCourseIds)
  const { data } = await query
  return data ?? []
}

export async function getAdminCourse(id: string) {
  const actor = await requireAdminOrInstructor()
  const supabase = await createClient()
  if (!(await canManageCourseId(actor, id, supabase))) return null
  const { data } = await supabase.from('courses').select('*').eq('id', id).single()
  return data
}

export async function getInstructorDashboardData() {
  const actor = await requireAdminOrInstructor()
  const supabase = await createClient()
  const managedCourseIds = await getManagedCourseIds(actor, supabase)
  const emptyDashboard = {
    summary: {
      publishedCourses: 0,
      draftCourses: 0,
      totalStudents: 0,
      averageCompletion: 0,
      reviewCount: 0,
      averageRating: 0,
    },
    courses: [],
    missingChildrenCourses: [],
    recentActivity: [],
    attentionItems: [],
    recentReviews: [],
  }
  if (managedCourseIds && managedCourseIds.length === 0) {
    return emptyDashboard
  }
  const coursesQueryBase = supabase.from('courses').select('*')
  const coursesQuery = (managedCourseIds ? coursesQueryBase.in('id', managedCourseIds) : coursesQueryBase)
    .order('updated_at', { ascending: false })
  const enrollmentsQueryBase = supabase
    .from('enrollments')
    .select('id, user_id, course_id, progress, status, last_accessed_at, enrolled_at')
  const enrollmentsQuery = managedCourseIds ? enrollmentsQueryBase.in('course_id', managedCourseIds) : enrollmentsQueryBase
  const modulesQueryBase = supabase.from('course_modules').select('id, course_id, title, sort_order')
  const modulesQuery = managedCourseIds ? modulesQueryBase.in('course_id', managedCourseIds) : modulesQueryBase
  const lessonsQueryBase = supabase
    .from('course_lessons')
    .select('id, course_id, module_id, title, lesson_type, thumbnail_url, video_url, material_url, article_content, rich_content, sort_order, published')
  const lessonsQuery = managedCourseIds ? lessonsQueryBase.in('course_id', managedCourseIds) : lessonsQueryBase
  const quizzesQueryBase = supabase.from('course_quizzes').select('id, course_id, lesson_id, title, published')
  const quizzesQuery = managedCourseIds ? quizzesQueryBase.in('course_id', managedCourseIds) : quizzesQueryBase
  const progressQueryBase = supabase
    .from('lesson_progress')
    .select('id, user_id, course_id, lesson_id, completed, updated_at, last_accessed_at')
  const progressQuery = (managedCourseIds ? progressQueryBase.in('course_id', managedCourseIds) : progressQueryBase)
    .order('updated_at', { ascending: false })
    .limit(8)
  const reviewsQueryBase = supabase
    .from('course_reviews')
    .select('id, course_id, rating, comment, created_at')
  const reviewsQuery = (managedCourseIds ? reviewsQueryBase.in('course_id', managedCourseIds) : reviewsQueryBase)
    .order('created_at', { ascending: false })
    .limit(50)

  const [
    coursesResult,
    enrollmentsResult,
    modulesResult,
    lessonsResult,
    quizzesResult,
    progressResult,
    reviewsResult,
  ] = await Promise.all([
    coursesQuery,
    enrollmentsQuery,
    modulesQuery,
    lessonsQuery,
    quizzesQuery,
    progressQuery,
    reviewsQuery,
  ])

  const dbCourses = (coursesResult.data ?? []) as Course[]
  const allowedCourseIdSet = managedCourseIds ? new Set(managedCourseIds) : null
  const scopedDbCourses = allowedCourseIdSet ? dbCourses.filter((course) => allowedCourseIdSet.has(course.id)) : dbCourses
  const courses = managedCourseIds ? scopedDbCourses : mergeMissingChildrenPhonicsCourses(scopedDbCourses)
  const enrollments = enrollmentsResult.data ?? []
  const modules = modulesResult.data ?? []
  const lessons = lessonsResult.data ?? []
  const quizzes = quizzesResult.data ?? []
  const progress = progressResult.data ?? []
  const reviews = reviewsResult.data ?? []
  const quizIds = quizzes.map((quiz: any) => quiz.id).filter(Boolean)
  const questionsResult = quizIds.length
    ? await supabase.from('quiz_questions').select('id, quiz_id').in('quiz_id', quizIds)
    : { data: [] }
  const questions = questionsResult.data ?? []

  const questionsByQuiz = new Map<string, number>()
  questions.forEach((question: any) => {
    questionsByQuiz.set(question.quiz_id, (questionsByQuiz.get(question.quiz_id) ?? 0) + 1)
  })

  const courseRows = courses.map((course) => {
    const courseEnrollments = enrollments.filter((enrollment: any) => enrollment.course_id === course.id)
    const progressValues = courseEnrollments.map((enrollment: any) => Number(enrollment.progress ?? 0))
    const averageCompletion = progressValues.length
      ? Math.round(progressValues.reduce((sum: number, value: number) => sum + value, 0) / progressValues.length)
      : 0
    const courseModules = modules.filter((module: any) => module.course_id === course.id)
    const courseLessons = lessons.filter((lesson: any) => lesson.course_id === course.id)
    const courseQuizzes = quizzes.filter((quiz: any) => quiz.course_id === course.id)
    const courseReviews = reviews.filter((review: any) => review.course_id === course.id)
    const averageRating = courseReviews.length
      ? Number((courseReviews.reduce((sum: number, review: any) => sum + Number(review.rating ?? 0), 0) / courseReviews.length).toFixed(1))
      : 0
    const issues: string[] = []

    if (!course.published) issues.push('Unpublished course')
    if (!course.image_url && !course.thumbnail_url) issues.push('Course without thumbnail')
    if (courseModules.length === 0 || courseLessons.length === 0) issues.push('Draft course missing content')
    courseQuizzes.forEach((quiz: any) => {
      if ((questionsByQuiz.get(quiz.id) ?? 0) === 0) issues.push(`Quiz without questions: ${quiz.title}`)
    })

    return {
      course,
      studentCount: courseEnrollments.length,
      averageCompletion,
      moduleCount: courseModules.length,
      lessonCount: courseLessons.length,
      quizCount: courseQuizzes.length,
      reviewCount: courseReviews.length,
      averageRating,
      issues,
    }
  })

  const totalStudents = new Set(enrollments.map((enrollment: any) => enrollment.user_id).filter(Boolean)).size
  const averageCompletion = enrollments.length
    ? Math.round(enrollments.reduce((sum: number, enrollment: any) => sum + Number(enrollment.progress ?? 0), 0) / enrollments.length)
    : 0
  const reviewCount = reviews.length
  const averageRating = reviewCount
    ? Number((reviews.reduce((sum: number, review: any) => sum + Number(review.rating ?? 0), 0) / reviewCount).toFixed(1))
    : 0

  return {
    summary: {
      publishedCourses: courses.filter((course) => course.published).length,
      draftCourses: courses.filter((course) => !course.published).length,
      totalStudents,
      averageCompletion,
      reviewCount,
      averageRating,
    },
    courses: courseRows,
    missingChildrenCourses: managedCourseIds ? [] : CHILDREN_PHONICS_COURSES.filter(
      (course) => !dbCourses.some((existing) => existing.slug === course.slug),
    ),
    recentActivity: progress.map((item: any) => {
      const course = courses.find((row) => row.id === item.course_id)
      const lesson = lessons.find((row: any) => row.id === item.lesson_id)
      return {
        id: item.id,
        courseTitle: course?.title ?? 'Course',
        lessonTitle: lesson?.title ?? 'Lesson',
        completed: Boolean(item.completed),
        updatedAt: item.last_accessed_at ?? item.updated_at,
      }
    }),
    recentReviews: reviews.slice(0, 8).map((review: any) => {
      const course = courses.find((row) => row.id === review.course_id)
      return {
        id: review.id,
        courseId: review.course_id,
        courseTitle: course?.title ?? 'Course',
        rating: Number(review.rating ?? 0),
        comment: review.comment ?? null,
        createdAt: review.created_at,
      }
    }),
    attentionItems: courseRows.flatMap((row) =>
      row.issues.map((issue) => ({
        id: `${row.course.id}-${issue}`,
        courseId: row.course.id,
        courseTitle: row.course.title,
        issue,
      })),
    ),
  }
}
