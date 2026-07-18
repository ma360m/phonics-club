'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { courseSchema } from '@/lib/validations/course'
import { friendlyErrorMessage, toError } from '@/lib/friendly-error'
import { normalizeMediaUrl } from '@/lib/media-url'
import type { ActionResult, CurriculumModule } from '@/types'

function parseLines(formData: FormData, key: string): string[] {
  const raw = formData.get(key)
  if (!raw) return []
  return String(raw).split('\n').map((s) => s.trim()).filter(Boolean)
}

function parseCourseForm(formData: FormData) {
  let curriculum: CurriculumModule[] = []
  try {
    const raw = formData.get('curriculum')
    if (raw) curriculum = JSON.parse(String(raw))
  } catch {
    curriculum = []
  }

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
    published: formData.get('published') === 'on',
    certificate_enabled: formData.get('certificate_enabled') === 'on',
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
  const previewVideoUrl = String(formData.get('preview_video_url') ?? '').trim()
  const highlights = parseLines(formData, 'highlights')
  const coreMaterials = parseLines(formData, 'core_materials')
  const intendedAudience = parseLines(formData, 'intended_audience')
  const targetAudience = parseLines(formData, 'target_audience')
  const metadata: Record<string, unknown> = {
    certificateEnabled: formData.get('certificate_enabled') === 'on',
  }
  if (previewVideoUrl) metadata.previewVideoUrl = previewVideoUrl
  if (highlights.length) metadata.highlights = highlights
  if (coreMaterials.length) metadata.coreMaterials = coreMaterials
  if (intendedAudience.length) metadata.intendedAudience = intendedAudience

  return {
    ok: true as const,
    data: {
      ...parsed.data,
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
  await requireAdmin()
  const parsed = parseCourseForm(formData)
  if (!parsed.ok) return { success: false, error: parsed.error }

  const supabase = await createClient()
  const { error } = await supabase.from('courses').insert(parsed.data as never)
  if (error) return { success: false, error: friendlyErrorMessage(error, 'Course could not be created.') }

  revalidatePath('/admin/courses')
  revalidatePath('/courses')
  return { success: true }
}

export async function updateCourseAction(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()
  const parsed = parseCourseForm(formData)
  if (!parsed.ok) return { success: false, error: parsed.error }

  const supabase = await createClient()
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

export async function getAdminCourses() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
  return data ?? []
}

export async function getAdminCourse(id: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('*').eq('id', id).single()
  return data
}
