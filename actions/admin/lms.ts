'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { LMS_ALLOWED_MIME_TYPES, LMS_BUCKETS, uploadLmsFile } from '@/lib/lms-storage'
import { approveCoursePaymentAction, rejectCoursePaymentAction } from '@/actions/lms'

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function num(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key))
  return Number.isFinite(value) ? value : fallback
}

export async function getAdminCourseLms(courseId: string) {
  await requireAdmin()
  const supabase = await createClient()
  const [course, modules, resources, quizzes, assignments] = await Promise.all([
    supabase.from('courses').select('*').eq('id', courseId).maybeSingle(),
    supabase.from('course_modules').select('*, course_lessons(*)').eq('course_id', courseId).order('sort_order', { ascending: true }),
    supabase.from('course_resources').select('*').eq('course_id', courseId).order('sort_order', { ascending: true }),
    supabase.from('course_quizzes').select('*').eq('course_id', courseId).order('sort_order', { ascending: true }),
    supabase.from('course_assignments').select('*').eq('course_id', courseId).order('sort_order', { ascending: true }),
  ])

  return {
    course: course.data,
    modules: modules.data ?? [],
    resources: resources.data ?? [],
    quizzes: quizzes.data ?? [],
    assignments: assignments.data ?? [],
  }
}

export async function createCourseModuleFormAction(courseId: string, formData: FormData): Promise<void> {
  await requireAdmin()
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
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function updateCourseModuleFormAction(moduleId: string, courseId: string, formData: FormData): Promise<void> {
  await requireAdmin()
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
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function deleteCourseModuleAction(moduleId: string, courseId: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('course_modules').delete().eq('id', moduleId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function createCourseLessonFormAction(courseId: string, moduleId: string, formData: FormData): Promise<void> {
  await requireAdmin()
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
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function updateCourseLessonFormAction(lessonId: string, courseId: string, formData: FormData): Promise<void> {
  await requireAdmin()
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
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function deleteCourseLessonAction(lessonId: string, courseId: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('course_lessons').delete().eq('id', lessonId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function uploadCourseResourceFormAction(courseId: string, formData: FormData): Promise<void> {
  const admin = await requireAdmin()
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
    uploaded_by: admin.id,
  } as never)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function deleteCourseResourceAction(resourceId: string, courseId: string): Promise<void> {
  await requireAdmin()
  const supabase = await createServiceClient()
  const { data: resource } = await supabase.from('course_resources').select('*').eq('id', resourceId).maybeSingle()
  if (resource?.storage_bucket && resource?.storage_path) {
    await supabase.storage.from(resource.storage_bucket).remove([resource.storage_path])
  }
  const { error } = await supabase.from('course_resources').delete().eq('id', resourceId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}/builder`)
}

export async function getAdminCoursePayments(status?: string) {
  await requireAdmin()
  const supabase = await createClient()
  let query = supabase
    .from('course_payments')
    .select('*, courses(title, slug), profiles(full_name, email)')
    .order('created_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)
  const { data } = await query
  const rows = data ?? []
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return rows
  const service = await createServiceClient()
  return Promise.all(
    rows.map(async (row: any) => {
      if (!row.receipt_bucket || !row.receipt_path) return row
      const { data: signed } = await service.storage.from(row.receipt_bucket).createSignedUrl(row.receipt_path, 60 * 5)
      return { ...row, signed_receipt_url: signed?.signedUrl ?? null }
    })
  )
}

export async function approveCoursePaymentFormAction(formData: FormData): Promise<void> {
  const result = await approveCoursePaymentAction(String(formData.get('payment_id')))
  if (!result.success) throw new Error(result.error)
}

export async function rejectCoursePaymentFormAction(formData: FormData): Promise<void> {
  const result = await rejectCoursePaymentAction(String(formData.get('payment_id')), text(formData, 'reason'))
  if (!result.success) throw new Error(result.error)
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
