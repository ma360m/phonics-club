'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { canManageCourseId, requireManagedCourse } from '@/lib/admin/course-scope'
import { LMS_ALLOWED_MIME_TYPES, LMS_BUCKETS, uploadLmsFile } from '@/lib/lms-storage'
import { approveCoursePaymentAction, rejectCoursePaymentAction } from '@/actions/lms'
import { toError } from '@/lib/friendly-error'

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const cleanValue = String(value ?? '').trim()
    if (cleanValue) return cleanValue
  }
  return ''
}

function coursePaymentFormError(message?: string | null) {
  const clean = firstText(message)
  if (/license_key|license_emailed_at|license_unlocked_at|schema cache/i.test(clean)) {
    return 'Database needs the course licence SQL migration. Run supabase/migrations/036_course_payment_license_keys.sql in Supabase, then reload the schema cache.'
  }
  return clean || 'Course payment could not be updated.'
}

function num(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key))
  return Number.isFinite(value) ? value : fallback
}

function lines(formData: FormData, key: string): string[] {
  return text(formData, key).split('\n').map((item) => item.trim()).filter(Boolean)
}

function csvNumbers(formData: FormData, key: string): number[] {
  return text(formData, key)
    .split(/[,\n]/)
    .map((item) => Number(item.trim()) - 1)
    .filter((item) => Number.isInteger(item) && item >= 0)
}

function normalizeQuestionType(value: string) {
  const allowed = new Set([
    'mcq',
    'multiple_select',
    'true_false',
    'fill_blank',
    'short_answer',
    'long_answer',
  ])
  return allowed.has(value) ? value : 'mcq'
}

function parseQuizQuestionForm(formData: FormData) {
  const questionType = normalizeQuestionType(text(formData, 'question_type') || 'mcq')
  const options = questionType === 'true_false' ? ['True', 'False'] : lines(formData, 'options')
  const correctOption = Math.max(0, num(formData, 'correct_option', 1) - 1)
  const correctOptions = csvNumbers(formData, 'correct_options')
  return {
    question: text(formData, 'question'),
    question_type: questionType,
    options,
    correct_option: correctOption,
    correct_options: questionType === 'multiple_select' ? correctOptions : [],
    acceptable_answers: ['fill_blank', 'short_answer', 'long_answer'].includes(questionType)
      ? lines(formData, 'acceptable_answers')
      : [],
    explanation: text(formData, 'explanation') || null,
    media_url: text(formData, 'media_url') || null,
    image_url: text(formData, 'image_url') || null,
    audio_url: text(formData, 'audio_url') || null,
    points: Math.max(1, num(formData, 'points', 1)),
    difficulty: text(formData, 'difficulty') || 'standard',
    sort_order: num(formData, 'sort_order', 0),
  }
}

async function assertQuizQuestionBelongsToCourse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  questionId: string,
  courseId: string,
) {
  const { data: quizzes } = await supabase.from('course_quizzes').select('id').eq('course_id', courseId)
  const quizIds = (quizzes ?? []).map((quiz: { id?: string | null }) => quiz.id).filter(Boolean) as string[]
  if (!quizIds.length) throw toError('Question not found for this course', 'Question could not be updated.')

  const { data: question } = await supabase
    .from('quiz_questions')
    .select('id')
    .eq('id', questionId)
    .in('quiz_id', quizIds)
    .maybeSingle()

  if (!question) throw toError('Question not found for this course', 'Question could not be updated.')
}

export async function getAdminCourseLms(courseId: string) {
  const actor = await requireManagedCourse(courseId)
  const supabase = await createClient()
  if (!(await canManageCourseId(actor, courseId, supabase))) {
    return { course: null, modules: [], resources: [], quizzes: [], questions: [], assignments: [] }
  }
  const [course, modules, resources, quizzes, assignments] = await Promise.all([
    supabase.from('courses').select('*').eq('id', courseId).maybeSingle(),
    supabase.from('course_modules').select('*, course_lessons(*)').eq('course_id', courseId).order('sort_order', { ascending: true }),
    supabase.from('course_resources').select('*').eq('course_id', courseId).order('sort_order', { ascending: true }),
    supabase.from('course_quizzes').select('*').eq('course_id', courseId).order('sort_order', { ascending: true }),
    supabase.from('course_assignments').select('*').eq('course_id', courseId).order('sort_order', { ascending: true }),
  ])

  if (course.error) throw toError(course.error, 'Course builder could not load this course.')
  const lmsError = modules.error ?? resources.error ?? quizzes.error ?? assignments.error
  if (lmsError) throw toError(lmsError, 'Course builder could not load LMS content.')
  const quizIds = (quizzes.data ?? []).map((quiz: any) => quiz.id).filter(Boolean)
  const questions = quizIds.length
    ? await supabase.from('quiz_questions').select('*').in('quiz_id', quizIds).order('sort_order', { ascending: true })
    : { data: [], error: null }
  if (questions.error) throw toError(questions.error, 'Quiz questions could not load.')

  return {
    course: course.data,
    modules: modules.data ?? [],
    resources: resources.data ?? [],
    quizzes: quizzes.data ?? [],
    questions: questions.data ?? [],
    assignments: assignments.data ?? [],
  }
}

export async function createCourseModuleFormAction(courseId: string, formData: FormData): Promise<void> {
  await requireManagedCourse(courseId)
  const supabase = await createClient()
  const { error } = await supabase.from('course_modules').insert({
    course_id: courseId,
    title: text(formData, 'title'),
    description: text(formData, 'description') || null,
    thumbnail_url: text(formData, 'thumbnail_url') || null,
    transition_style: text(formData, 'transition_style') || 'fade',
    unlock_animation: text(formData, 'unlock_animation') || 'progress-ring',
    sort_order: num(formData, 'sort_order', 0),
  } as never)
  if (error) throw toError(error, 'Module could not be added.')
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function updateCourseModuleFormAction(moduleId: string, courseId: string, formData: FormData): Promise<void> {
  await requireManagedCourse(courseId)
  const supabase = await createClient()
  const { error } = await supabase
    .from('course_modules')
    .update({
      title: text(formData, 'title'),
      description: text(formData, 'description') || null,
      thumbnail_url: text(formData, 'thumbnail_url') || null,
      transition_style: text(formData, 'transition_style') || 'fade',
      unlock_animation: text(formData, 'unlock_animation') || 'progress-ring',
      sort_order: num(formData, 'sort_order', 0),
    } as never)
    .eq('id', moduleId)
    .eq('course_id', courseId)
  if (error) throw toError(error, 'Module could not be updated.')
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function deleteCourseModuleAction(moduleId: string, courseId: string): Promise<void> {
  await requireManagedCourse(courseId)
  const supabase = await createClient()
  const { error } = await supabase.from('course_modules').delete().eq('id', moduleId).eq('course_id', courseId)
  if (error) throw toError(error, 'Module could not be deleted.')
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function createCourseLessonFormAction(courseId: string, moduleId: string, formData: FormData): Promise<void> {
  await requireManagedCourse(courseId)
  const supabase = await createClient()
  const { error } = await supabase.from('course_lessons').insert({
    course_id: courseId,
    module_id: moduleId,
    title: text(formData, 'title'),
    description: text(formData, 'description') || null,
    rich_content: text(formData, 'rich_content') || null,
    lesson_type: text(formData, 'lesson_type') || 'video',
    thumbnail_url: text(formData, 'thumbnail_url') || null,
    reading_type: text(formData, 'reading_type') || null,
    reading_external_url: text(formData, 'reading_external_url') || null,
    article_content: text(formData, 'article_content') || null,
    practice_prompt: text(formData, 'practice_prompt') || null,
    discussion_prompt: text(formData, 'discussion_prompt') || null,
    live_session_url: text(formData, 'live_session_url') || null,
    external_link_url: text(formData, 'external_link_url') || null,
    video_url: text(formData, 'video_url') || null,
    material_url: text(formData, 'material_url') || null,
    duration_minutes: num(formData, 'duration_minutes', 0),
    sort_order: num(formData, 'sort_order', 0),
    is_preview: formData.get('is_preview') === 'on',
    is_compulsory: formData.get('is_compulsory') === 'on',
    sequentially_locked: formData.get('sequentially_locked') === 'on',
    manual_completion_allowed: formData.get('manual_completion_allowed') === 'on',
    completion_mode: text(formData, 'completion_mode') || 'manual',
    required_completion_percentage: num(formData, 'required_completion_percentage', 80),
    bookmark_enabled: formData.get('bookmark_enabled') === 'on',
    highlight_enabled: formData.get('highlight_enabled') === 'on',
    print_enabled: formData.get('print_enabled') === 'on',
    download_enabled: formData.get('download_enabled') === 'on',
    dark_mode_enabled: formData.get('dark_mode_enabled') === 'on',
    fullscreen_enabled: formData.get('fullscreen_enabled') === 'on',
    search_enabled: formData.get('search_enabled') === 'on',
    zoom_enabled: formData.get('zoom_enabled') === 'on',
    completion_animation: text(formData, 'completion_animation') || 'progress-ring',
    confetti_enabled: formData.get('confetti_enabled') === 'on',
    published: formData.get('published') === 'on',
  } as never)
  if (error) throw toError(error, 'Lesson could not be added.')
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function updateCourseLessonFormAction(lessonId: string, courseId: string, formData: FormData): Promise<void> {
  await requireManagedCourse(courseId)
  const supabase = await createClient()
  const { error } = await supabase
    .from('course_lessons')
    .update({
      title: text(formData, 'title'),
      description: text(formData, 'description') || null,
      rich_content: text(formData, 'rich_content') || null,
      lesson_type: text(formData, 'lesson_type') || 'video',
      thumbnail_url: text(formData, 'thumbnail_url') || null,
      reading_type: text(formData, 'reading_type') || null,
      reading_external_url: text(formData, 'reading_external_url') || null,
      article_content: text(formData, 'article_content') || null,
      practice_prompt: text(formData, 'practice_prompt') || null,
      discussion_prompt: text(formData, 'discussion_prompt') || null,
      live_session_url: text(formData, 'live_session_url') || null,
      external_link_url: text(formData, 'external_link_url') || null,
      video_url: text(formData, 'video_url') || null,
      material_url: text(formData, 'material_url') || null,
      duration_minutes: num(formData, 'duration_minutes', 0),
      sort_order: num(formData, 'sort_order', 0),
      is_preview: formData.get('is_preview') === 'on',
      is_compulsory: formData.get('is_compulsory') === 'on',
      sequentially_locked: formData.get('sequentially_locked') === 'on',
      manual_completion_allowed: formData.get('manual_completion_allowed') === 'on',
      completion_mode: text(formData, 'completion_mode') || 'manual',
      required_completion_percentage: num(formData, 'required_completion_percentage', 80),
      bookmark_enabled: formData.get('bookmark_enabled') === 'on',
      highlight_enabled: formData.get('highlight_enabled') === 'on',
      print_enabled: formData.get('print_enabled') === 'on',
      download_enabled: formData.get('download_enabled') === 'on',
      dark_mode_enabled: formData.get('dark_mode_enabled') === 'on',
      fullscreen_enabled: formData.get('fullscreen_enabled') === 'on',
      search_enabled: formData.get('search_enabled') === 'on',
      zoom_enabled: formData.get('zoom_enabled') === 'on',
      completion_animation: text(formData, 'completion_animation') || 'progress-ring',
      confetti_enabled: formData.get('confetti_enabled') === 'on',
      published: formData.get('published') === 'on',
    } as never)
    .eq('id', lessonId)
    .eq('course_id', courseId)
  if (error) throw toError(error, 'Lesson could not be updated.')
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function deleteCourseLessonAction(lessonId: string, courseId: string): Promise<void> {
  await requireManagedCourse(courseId)
  const supabase = await createClient()
  const { error } = await supabase.from('course_lessons').delete().eq('id', lessonId).eq('course_id', courseId)
  if (error) throw toError(error, 'Lesson could not be deleted.')
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function uploadCourseResourceFormAction(courseId: string, formData: FormData): Promise<void> {
  const actor = await requireManagedCourse(courseId)
  const file = formData.get('file') as File | null
  const externalUrl = text(formData, 'external_url')
  const supabase = await createServiceClient()

  let uploaded: Awaited<ReturnType<typeof uploadLmsFile>> | null = null
  if (file && file.size > 0) {
    uploaded = await uploadLmsFile(LMS_BUCKETS.resources, file, `${courseId}/resources`, {
      allowedMimeTypes: LMS_ALLOWED_MIME_TYPES,
      maxBytes: 100 * 1024 * 1024,
    })
  }

  const { error } = await supabase.from('course_resources').insert({
    course_id: courseId,
    module_id: text(formData, 'module_id') || null,
    lesson_id: text(formData, 'lesson_id') || null,
    title: text(formData, 'title'),
    description: text(formData, 'description') || null,
    resource_type: text(formData, 'resource_type') || 'file',
    scope: text(formData, 'scope') || 'course',
    external_url: externalUrl || null,
    resource_url: externalUrl || null,
    storage_bucket: uploaded?.bucket ?? null,
    storage_path: uploaded?.path ?? null,
    original_filename: uploaded?.filename ?? null,
    mime_type: uploaded?.mimeType ?? null,
    file_size_bytes: uploaded?.sizeBytes ?? null,
    visibility: text(formData, 'visibility') || 'enrolled',
    is_downloadable: formData.get('is_downloadable') === 'on',
    is_view_only: formData.get('is_view_only') === 'on',
    is_compulsory: formData.get('is_compulsory') === 'on',
    sort_order: num(formData, 'sort_order', 0),
    uploaded_by: actor.id,
  } as never)
  if (error) throw toError(error, 'Course resource could not be saved.')
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function updateCourseResourceFormAction(resourceId: string, courseId: string, formData: FormData): Promise<void> {
  const actor = await requireManagedCourse(courseId)
  const supabase = await createServiceClient()
  const { data: existing, error: loadError } = await supabase
    .from('course_resources')
    .select('*')
    .eq('id', resourceId)
    .eq('course_id', courseId)
    .maybeSingle()
  if (loadError || !existing) throw toError(loadError ?? 'Resource not found', 'Course resource could not be updated.')

  const file = formData.get('file') as File | null
  const externalUrl = text(formData, 'external_url')
  let uploaded: Awaited<ReturnType<typeof uploadLmsFile>> | null = null

  if (file && file.size > 0) {
    uploaded = await uploadLmsFile(LMS_BUCKETS.resources, file, `${courseId}/resources`, {
      allowedMimeTypes: LMS_ALLOWED_MIME_TYPES,
      maxBytes: 100 * 1024 * 1024,
    })
  }

  const { error } = await supabase
    .from('course_resources')
    .update({
      module_id: text(formData, 'module_id') || null,
      lesson_id: text(formData, 'lesson_id') || null,
      title: text(formData, 'title'),
      description: text(formData, 'description') || null,
      resource_type: text(formData, 'resource_type') || 'file',
      scope: text(formData, 'scope') || 'course',
      external_url: externalUrl || null,
      resource_url: externalUrl || null,
      storage_bucket: uploaded?.bucket ?? existing.storage_bucket ?? null,
      storage_path: uploaded?.path ?? existing.storage_path ?? null,
      original_filename: uploaded?.filename ?? existing.original_filename ?? null,
      mime_type: uploaded?.mimeType ?? existing.mime_type ?? null,
      file_size_bytes: uploaded?.sizeBytes ?? existing.file_size_bytes ?? null,
      visibility: text(formData, 'visibility') || 'enrolled',
      is_downloadable: formData.get('is_downloadable') === 'on',
      is_view_only: formData.get('is_view_only') === 'on',
      is_compulsory: formData.get('is_compulsory') === 'on',
      sort_order: num(formData, 'sort_order', 0),
      uploaded_by: uploaded ? actor.id : existing.uploaded_by,
    } as never)
    .eq('id', resourceId)
    .eq('course_id', courseId)

  if (error) throw toError(error, 'Course resource could not be updated.')

  if (uploaded && existing.storage_bucket && existing.storage_path) {
    await supabase.storage.from(existing.storage_bucket).remove([existing.storage_path])
  }

  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function deleteCourseResourceAction(resourceId: string, courseId: string): Promise<void> {
  await requireManagedCourse(courseId)
  const supabase = await createServiceClient()
  const { data: resource } = await supabase.from('course_resources').select('*').eq('id', resourceId).eq('course_id', courseId).maybeSingle()
  if (resource?.storage_bucket && resource?.storage_path) {
    await supabase.storage.from(resource.storage_bucket).remove([resource.storage_path])
  }
  const { error } = await supabase.from('course_resources').delete().eq('id', resourceId).eq('course_id', courseId)
  if (error) throw toError(error, 'Course resource could not be deleted.')
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function createCourseQuizFormAction(courseId: string, formData: FormData): Promise<void> {
  await requireManagedCourse(courseId)
  const supabase = await createClient()
  const { error } = await supabase.from('course_quizzes').insert({
    course_id: courseId,
    lesson_id: text(formData, 'lesson_id') || null,
    title: text(formData, 'title'),
    description: text(formData, 'description') || null,
    passing_score: num(formData, 'passing_score', 70),
    max_attempts: num(formData, 'max_attempts', 3),
    timer_minutes: text(formData, 'timer_minutes') ? num(formData, 'timer_minutes', 0) : null,
    randomize_questions: formData.get('randomize_questions') === 'on',
    randomize_options: formData.get('randomize_options') === 'on',
    show_explanations: formData.get('show_explanations') === 'on',
    allow_review: formData.get('allow_review') === 'on',
    published: formData.get('published') === 'on',
    sort_order: num(formData, 'sort_order', 0),
  } as never)
  if (error) throw toError(error, 'Quiz could not be added.')
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function deleteCourseQuizAction(quizId: string, courseId: string): Promise<void> {
  await requireManagedCourse(courseId)
  const supabase = await createClient()
  const { error } = await supabase.from('course_quizzes').delete().eq('id', quizId).eq('course_id', courseId)
  if (error) throw toError(error, 'Quiz could not be deleted.')
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function createQuizQuestionFormAction(quizId: string, courseId: string, formData: FormData): Promise<void> {
  await requireManagedCourse(courseId)
  const values = parseQuizQuestionForm(formData)
  if (!values.question) throw toError('Question text is required', 'Question could not be added.')
  const supabase = await createClient()
  const { data: quiz } = await supabase.from('course_quizzes').select('id').eq('id', quizId).eq('course_id', courseId).maybeSingle()
  if (!quiz) throw toError('Quiz not found', 'Question could not be added.')
  const { error } = await supabase.from('quiz_questions').insert({
    quiz_id: quizId,
    ...values,
  } as never)
  if (error) throw toError(error, 'Question could not be added.')
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function updateQuizQuestionFormAction(questionId: string, courseId: string, formData: FormData): Promise<void> {
  await requireManagedCourse(courseId)
  const values = parseQuizQuestionForm(formData)
  if (!values.question) throw toError('Question text is required', 'Question could not be updated.')
  const supabase = await createClient()
  await assertQuizQuestionBelongsToCourse(supabase, questionId, courseId)
  const { error } = await supabase.from('quiz_questions').update(values as never).eq('id', questionId)
  if (error) throw toError(error, 'Question could not be updated.')
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function deleteQuizQuestionAction(questionId: string, courseId: string): Promise<void> {
  await requireManagedCourse(courseId)
  const supabase = await createClient()
  await assertQuizQuestionBelongsToCourse(supabase, questionId, courseId)
  const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId)
  if (error) throw toError(error, 'Question could not be deleted.')
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function getAdminCoursePayments(status?: string) {
  await requireAdmin()
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? await createServiceClient() : await createClient()
  let query = supabase
    .from('course_payments')
    .select('*')
    .order('created_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw toError(error, 'Course payments could not be loaded.')
  const rows = data ?? []
  const courseIds = Array.from(new Set(rows.map((row: any) => row.course_id).filter(Boolean)))
  const userIds = Array.from(new Set(rows.map((row: any) => row.user_id).filter(Boolean)))
  const enrollmentIds = rows.map((row: any) => row.enrollment_id).filter(Boolean)

  const [coursesResult, profilesResult, enrollmentsResult] = await Promise.all([
    courseIds.length
      ? supabase.from('courses').select('id, title, slug').in('id', courseIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase.from('profiles').select('id, full_name, email, username').in('id', userIds)
      : Promise.resolve({ data: [] }),
    enrollmentIds.length
      ? supabase.from('enrollments').select('id, status, progress, expires_at, access_extended_until').in('id', enrollmentIds)
      : Promise.resolve({ data: [] }),
  ])

  const coursesById = new Map((coursesResult.data ?? []).map((course: any) => [course.id, course]))
  const profilesById = new Map((profilesResult.data ?? []).map((profile: any) => [profile.id, profile]))
  const enrollmentsById = new Map((enrollmentsResult.data ?? []).map((enrollment: any) => [enrollment.id, enrollment]))
  const rowsWithEnrollments = rows.map((row: any) => ({
    ...row,
    courses: row.course_id ? coursesById.get(row.course_id) ?? null : null,
    profiles: row.user_id ? profilesById.get(row.user_id) ?? null : null,
    enrollment: row.enrollment_id ? enrollmentsById.get(row.enrollment_id) ?? null : null,
  })).map((row: any) => {
    const profile = row.profiles as { full_name?: string | null; email?: string | null; username?: string | null } | null
    const metadata = objectRecord(row.metadata)
    const customerName = firstText(profile?.full_name, metadata.studentName, metadata.student_name, metadata.customerName, metadata.name, profile?.email, row.user_id)
    const customerEmail = firstText(profile?.email, metadata.studentEmail, metadata.student_email, metadata.customerEmail, metadata.email)
    return {
      ...row,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_username: firstText(profile?.username, metadata.username),
    }
  })

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return rowsWithEnrollments
  const service = await createServiceClient()
  return Promise.all(
    rowsWithEnrollments.map(async (row: any) => {
      if (!row.receipt_bucket || !row.receipt_path) return row
      const { data: signed } = await service.storage.from(row.receipt_bucket).createSignedUrl(row.receipt_path, 60 * 5)
      return { ...row, signed_receipt_url: signed?.signedUrl ?? null }
    })
  )
}

export async function approveCoursePaymentFormAction(formData: FormData): Promise<void> {
  const result = await approveCoursePaymentAction(String(formData.get('payment_id')), {
    licenseKey: text(formData, 'license_key') || undefined,
    forceNewLicenseKey: formData.get('force_new_license_key') === 'on',
    resendEmail: formData.get('resend_license_email') === 'on',
  })
  if (!result.success) {
    redirect(`/admin/course-payments?approveError=${encodeURIComponent(coursePaymentFormError(result.error))}`)
  }
}

export async function rejectCoursePaymentFormAction(formData: FormData): Promise<void> {
  const result = await rejectCoursePaymentAction(String(formData.get('payment_id')), text(formData, 'reason'))
  if (!result.success) {
    redirect(`/admin/course-payments?approveError=${encodeURIComponent(coursePaymentFormError(result.error))}`)
  }
}

export async function extendEnrollmentAccessFormAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const enrollmentId = text(formData, 'enrollment_id')
  const days = num(formData, 'days', 0)
  if (!enrollmentId) throw toError('Enrollment is missing', 'Course access could not be extended.')
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw toError('Extension days must be between 1 and 365', 'Course access could not be extended.')
  }

  const supabase = await createServiceClient()
  const { data: enrollment, error: loadError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .maybeSingle()
  if (loadError) throw toError(loadError, 'Course access could not be extended.')
  if (!enrollment) throw toError('Enrollment not found', 'Course access could not be extended.')

  const now = new Date()
  const currentExpiry = enrollment.expires_at ? new Date(enrollment.expires_at) : now
  const base = currentExpiry.getTime() > now.getTime() ? currentExpiry : now
  base.setDate(base.getDate() + days)
  const note = `Access extended ${days} day(s) by ${admin.email} on ${now.toISOString()}.`
  const { error } = await supabase
    .from('enrollments')
    .update({
      status: 'active',
      expires_at: base.toISOString(),
      access_extended_until: base.toISOString(),
      admin_notes: enrollment.admin_notes ? `${enrollment.admin_notes}\n${note}` : note,
    } as never)
    .eq('id', enrollmentId)

  if (error) throw toError(error, 'Course access could not be extended.')
  revalidatePath('/admin/course-payments')
  revalidatePath('/dashboard/my-courses')
  revalidatePath(`/course/${enrollment.course_id}/learn`)
}

export async function getAdminLmsReport() {
  await requireAdmin()
  const supabase = await createClient()
  const [
    enrollments,
    payments,
    completion,
    sessions,
    offline,
    quizAttempts,
    assignments,
    certificates,
    downloads,
  ] = await Promise.all([
    supabase.from('enrollments').select('status', { count: 'exact', head: false }),
    supabase.from('course_payments').select('status, amount', { count: 'exact', head: false }),
    supabase.from('course_completion_status').select('completed, eligible_for_certificate', { count: 'exact', head: false }),
    supabase.from('learning_sessions').select('credited_seconds, suspicious', { count: 'exact', head: false }),
    supabase.from('offline_activity_entries').select('status, approved_minutes', { count: 'exact', head: false }),
    supabase.from('quiz_attempts').select('score, passed', { count: 'exact', head: false }),
    supabase.from('assignment_submissions').select('status, passed', { count: 'exact', head: false }),
    supabase.from('certificates').select('status', { count: 'exact', head: false }),
    supabase.from('course_resource_downloads').select('id', { count: 'exact', head: false }),
  ])
  return {
    enrollments: enrollments.data ?? [],
    payments: payments.data ?? [],
    completion: completion.data ?? [],
    sessions: sessions.data ?? [],
    offline: offline.data ?? [],
    quizAttempts: quizAttempts.data ?? [],
    assignments: assignments.data ?? [],
    certificates: certificates.data ?? [],
    downloads: downloads.data ?? [],
  }
}
