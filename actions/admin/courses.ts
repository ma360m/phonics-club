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
  const parsed = parseCourseForm(formData)
  if (!parsed.ok) return { success: false, error: parsed.error }

  const supabase = await createClient()
  if (!(await canManageCourseId(actor, id, supabase))) {
    return { success: false, error: 'You can only update courses assigned to your instructor account.' }
  }
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
  const { error } = await supabase.from('courses').update({ published } as never).eq('id', id)
  if (error) throw toError(error, published ? 'Course could not be published.' : 'Course could not be saved as draft.')

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
  if (managedCourseIds && managedCourseIds.length === 0) {
    return {
      summary: {
        publishedCourses: 0,
        draftCourses: 0,
        totalStudents: 0,
        averageCompletion: 0,
      },
      courses: [],
      missingChildrenCourses: [],
      recentActivity: [],
      attentionItems: [],
    }
  }
  const [
    coursesResult,
    enrollmentsResult,
    modulesResult,
    lessonsResult,
    quizzesResult,
    questionsResult,
    progressResult,
  ] = await Promise.all([
    supabase.from('courses').select('*').order('updated_at', { ascending: false }),
    supabase.from('enrollments').select('id, user_id, course_id, progress, status, last_accessed_at, enrolled_at'),
    supabase.from('course_modules').select('id, course_id, title, sort_order'),
    supabase.from('course_lessons').select('id, course_id, module_id, title, lesson_type, thumbnail_url, video_url, material_url, article_content, rich_content, sort_order, published'),
    supabase.from('course_quizzes').select('id, course_id, lesson_id, title, published'),
    supabase.from('quiz_questions').select('id, quiz_id'),
    supabase.from('lesson_progress').select('id, user_id, course_id, lesson_id, completed, updated_at, last_accessed_at').order('updated_at', { ascending: false }).limit(8),
  ])

  const dbCourses = (coursesResult.data ?? []) as Course[]
  const allowedCourseIdSet = managedCourseIds ? new Set(managedCourseIds) : null
  const scopedDbCourses = allowedCourseIdSet ? dbCourses.filter((course) => allowedCourseIdSet.has(course.id)) : dbCourses
  const courses = managedCourseIds ? scopedDbCourses : mergeMissingChildrenPhonicsCourses(scopedDbCourses)
  const enrollments = allowedCourseIdSet ? (enrollmentsResult.data ?? []).filter((row: any) => allowedCourseIdSet.has(row.course_id)) : enrollmentsResult.data ?? []
  const modules = allowedCourseIdSet ? (modulesResult.data ?? []).filter((row: any) => allowedCourseIdSet.has(row.course_id)) : modulesResult.data ?? []
  const lessons = allowedCourseIdSet ? (lessonsResult.data ?? []).filter((row: any) => allowedCourseIdSet.has(row.course_id)) : lessonsResult.data ?? []
  const quizzes = allowedCourseIdSet ? (quizzesResult.data ?? []).filter((row: any) => allowedCourseIdSet.has(row.course_id)) : quizzesResult.data ?? []
  const questions = questionsResult.data ?? []
  const progress = allowedCourseIdSet ? (progressResult.data ?? []).filter((row: any) => allowedCourseIdSet.has(row.course_id)) : progressResult.data ?? []

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
      issues,
    }
  })

  const totalStudents = new Set(enrollments.map((enrollment: any) => enrollment.user_id).filter(Boolean)).size
  const averageCompletion = enrollments.length
    ? Math.round(enrollments.reduce((sum: number, enrollment: any) => sum + Number(enrollment.progress ?? 0), 0) / enrollments.length)
    : 0

  return {
    summary: {
      publishedCourses: courses.filter((course) => course.published).length,
      draftCourses: courses.filter((course) => !course.published).length,
      totalStudents,
      averageCompletion,
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
