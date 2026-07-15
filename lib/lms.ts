import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/auth'
import { COURSE_CATEGORIES } from '@/lib/constants'
import { SEED_COURSES } from '@/lib/data/seed'
import { getCourses, getCourseBySlug } from '@/lib/data/queries'
import type {
  Certificate,
  CourseAssignment,
  Course,
  CourseLesson,
  CourseModuleRow,
  CoursePayment,
  CourseQuiz,
  CourseResource,
  CourseReview,
  CourseWishlistItem,
  Enrollment,
  LessonProgress,
  LessonTimeTotal,
  OfflineActivityEntry,
  QuizAttempt,
  QuizQuestion,
  AssignmentSubmission,
  CourseCompletionStatus,
} from '@/types/database'

export const JOLLY_PHONICS_FREE_SLUG = 'teaching-english-through-jolly-phonics-free-version'

export type CourseModuleWithLessons = CourseModuleRow & { lessons: CourseLesson[] }

export interface CourseCatalogFilters {
  q?: string
  category?: string
  level?: string
  duration?: string
  price?: string
  sort?: string
  page?: string
}

export interface CourseCatalogResult {
  allCourses: Course[]
  courses: Course[]
  featuredCourse: Course | null
  total: number
  page: number
  pageSize: number
  totalPages: number
  filters: Required<CourseCatalogFilters>
  categories: string[]
  levels: string[]
}

export interface CourseDisplayMeta {
  rating: number
  students: number
  moduleCount: number
  lessonCount: number
  quizCount: number
  certificateEnabled: boolean
  previewVideoUrl: string | null
  highlights: string[]
  coreMaterials: string[]
  intendedAudience: string[]
  faq: { question: string; answer: string }[]
}

export interface QuizForCourse {
  quiz: CourseQuiz
  questions: Array<Omit<QuizQuestion, 'correct_option' | 'correct_options' | 'acceptable_answers' | 'matching_pairs'>>
  attempts: QuizAttempt[]
}

export interface CourseAccessState {
  active: boolean
  expired: boolean
  pendingPayment: boolean
  status: string
  expiresAt: string | null
  daysRemaining: number | null
}

export interface CompletionChecklist {
  lessons: { completed: number; required: number; satisfied: boolean }
  online: { minutes: number; required: number; satisfied: boolean }
  offline: { minutes: number; required: number; satisfied: boolean }
  quiz: { score: number | null; required: number; satisfied: boolean }
  assignments: { passed: number; required: number; satisfied: boolean }
  activeAccess: { expiresAt: string | null; satisfied: boolean }
  eligible: boolean
  completed: boolean
  progress: number
}

function metadata(course: Course): Record<string, unknown> {
  return (course.metadata ?? {}) as Record<string, unknown>
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean)
}

function asFaq(value: unknown): { question: string; answer: string }[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const question = String(record.question ?? '').trim()
      const answer = String(record.answer ?? '').trim()
      return question && answer ? { question, answer } : null
    })
    .filter((item): item is { question: string; answer: string } => Boolean(item))
}

function parseDurationMinutes(value?: string): number {
  if (!value) return 0
  const number = Number.parseFloat(value)
  if (!Number.isFinite(number)) return 0
  const lower = value.toLowerCase()
  if (lower.includes('week')) return number * 7 * 24 * 60
  if (lower.includes('hour')) return number * 60
  return number
}

function durationBucket(course: Course): string {
  const minutes = parseDurationMinutes(course.duration ?? undefined)
  if (!minutes) return 'self-paced'
  if (minutes <= 4 * 7 * 24 * 60) return 'short'
  if (minutes <= 8 * 7 * 24 * 60) return 'medium'
  return 'long'
}

export function slugifyInstructor(name: string): string {
  return name
    .toLowerCase()
    .replace(/dr\./g, 'dr')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function formatCourseCategory(category: string): string {
  return category.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function getCourseDisplayMeta(
  course: Course,
  modules: CourseModuleWithLessons[] = []
): CourseDisplayMeta {
  const meta = metadata(course)
  const moduleCount = modules.length || course.curriculum?.length || Number(meta.modules ?? 0)
  const lessonCount =
    modules.reduce((total, module) => total + module.lessons.length, 0) ||
    course.curriculum?.reduce((total, module) => total + module.lessons.length, 0) ||
    Number(meta.lessons ?? 0)

  return {
    rating: Number(course.rating ?? meta.rating ?? 4.8),
    students: Number(course.students_count ?? meta.students ?? 0),
    moduleCount,
    lessonCount,
    quizCount: Number(meta.quizzes ?? 0),
    certificateEnabled: course.certificate_enabled ?? meta.certificateEnabled !== false,
    previewVideoUrl: typeof meta.previewVideoUrl === 'string' ? meta.previewVideoUrl : null,
    highlights: asStringArray(meta.highlights),
    coreMaterials: asStringArray(meta.coreMaterials),
    intendedAudience: asStringArray(meta.intendedAudience),
    faq: asFaq(meta.faq),
  }
}

export function youtubeEmbedUrl(url: string | null): string | null {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{6,})/)
  return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : url
}

function modulesFromCurriculum(course: Course): CourseModuleWithLessons[] {
  return (course.curriculum ?? []).map((module, moduleIndex) => ({
    id: `curriculum-${course.id}-${moduleIndex}`,
    course_id: course.id,
    title: module.title,
    description: module.duration ? `Duration: ${module.duration}` : null,
    sort_order: moduleIndex + 1,
    created_at: course.created_at,
    updated_at: course.updated_at,
    lessons: module.lessons.map((lesson, lessonIndex) => {
      const isQuiz = lesson.title.toLowerCase().includes('quiz')
      const isVideoFirst = lessonIndex === 0 || lesson.title.toLowerCase().includes('blending')
      const lessonType: CourseLesson['lesson_type'] = isQuiz ? 'quiz' : isVideoFirst ? 'video' : 'notes'
      const readingType: CourseLesson['reading_type'] =
        lesson.title === 'Learning the Letter Sounds' ? 'flipbook' :
        lesson.title === 'Learning Letter Formation' ? 'pdf_viewer' :
        lesson.title === 'Tricky Words' ? 'powerpoint_slides' :
        lesson.title === 'Identifying Sounds in Words' ? 'interactive_presentation' :
        isQuiz ? null :
        'rich_article'

      return {
        id: `curriculum-${course.id}-${moduleIndex}-${lessonIndex}`,
        module_id: `curriculum-${course.id}-${moduleIndex}`,
        course_id: course.id,
        title: lesson.title,
        description: lesson.description ?? null,
        rich_content: lesson.description ?? null,
        lesson_type: lessonType,
        reading_type: readingType,
        article_content: lesson.description ?? null,
        video_url: null,
        material_url: null,
        content: null,
        duration_minutes: Math.round(parseDurationMinutes(lesson.duration) || 0),
        sort_order: lessonIndex + 1,
        is_preview: moduleIndex === 0 && lessonIndex === 0,
        is_compulsory: !lesson.title.toLowerCase().includes('certificate'),
        sequentially_locked: true,
        manual_completion_allowed: true,
        completion_mode: 'manual',
        required_completion_percentage: 80,
        created_at: course.created_at,
        updated_at: course.updated_at,
      } satisfies CourseLesson
    }),
  }))
}

function normalizeModules(rows: CourseModuleRow[], course: Course): CourseModuleWithLessons[] {
  const modules = rows
    .map((row) => {
      const lessons = [...((row.course_lessons ?? row.lessons ?? []) as CourseLesson[])]
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      return { ...row, lessons }
    })
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  return modules.length ? modules : modulesFromCurriculum(course)
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  if (!isSupabaseConfigured()) {
    return SEED_COURSES.find((course) => course.id === courseId) ?? null
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('published', true)
    .maybeSingle()

  return (data as Course | null) ?? null
}

export async function getCourseModules(course: Course): Promise<CourseModuleWithLessons[]> {
  if (!isSupabaseConfigured()) return modulesFromCurriculum(course)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('course_modules')
      .select('*, course_lessons(*)')
      .eq('course_id', course.id)
      .order('sort_order', { ascending: true })

    if (error) return modulesFromCurriculum(course)
    return normalizeModules((data ?? []) as CourseModuleRow[], course)
  } catch {
    return modulesFromCurriculum(course)
  }
}

export async function getCourseReviews(courseId: string): Promise<CourseReview[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('course_reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(8)
    return (data as CourseReview[]) ?? []
  } catch {
    return []
  }
}

export async function getCourseResources(courseId: string): Promise<CourseResource[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('course_resources')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true })
    return (data as CourseResource[]) ?? []
  } catch {
    return []
  }
}

export async function getCourseQuizzes(courseId: string): Promise<CourseQuiz[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('course_quizzes')
      .select('*')
      .eq('course_id', courseId)
      .eq('published', true)
      .order('sort_order', { ascending: true })
    return (data as CourseQuiz[]) ?? []
  } catch {
    return []
  }
}

export async function getCourseCatalog(filters: CourseCatalogFilters): Promise<CourseCatalogResult> {
  const allCourses = await getCourses()
  const normalizedFilters = {
    q: filters.q ?? '',
    category: filters.category ?? 'all',
    level: filters.level ?? 'all',
    duration: filters.duration ?? 'all',
    price: filters.price ?? 'all',
    sort: filters.sort ?? 'newest',
    page: filters.page ?? '1',
  }

  const search = normalizedFilters.q.toLowerCase().trim()
  let courses = allCourses.filter((course) => {
    const matchesSearch =
      !search ||
      [course.title, course.excerpt, course.description, course.instructor, course.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    const matchesCategory =
      normalizedFilters.category === 'all' || course.category === normalizedFilters.category
    const matchesLevel =
      normalizedFilters.level === 'all' || course.level === normalizedFilters.level
    const matchesDuration =
      normalizedFilters.duration === 'all' || durationBucket(course) === normalizedFilters.duration
    const matchesPrice =
      normalizedFilters.price === 'all' ||
      (normalizedFilters.price === 'free' ? Number(course.price) === 0 : Number(course.price) > 0)

    return matchesSearch && matchesCategory && matchesLevel && matchesDuration && matchesPrice
  })

  courses = courses.sort((a, b) => {
    if (normalizedFilters.sort === 'title') return a.title.localeCompare(b.title)
    if (normalizedFilters.sort === 'rating') {
      return Number(b.rating ?? metadata(b).rating ?? 0) - Number(a.rating ?? metadata(a).rating ?? 0)
    }
    if (normalizedFilters.sort === 'popularity') {
      return Number(b.students_count ?? metadata(b).students ?? 0) - Number(a.students_count ?? metadata(a).students ?? 0)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const pageSize = 9
  const page = Math.max(Number.parseInt(normalizedFilters.page, 10) || 1, 1)
  const total = courses.length
  const totalPages = Math.max(Math.ceil(total / pageSize), 1)
  const pageItems = courses.slice(0, page * pageSize)

  return {
    allCourses,
    courses: pageItems,
    featuredCourse: courses.find((course) => course.featured) ?? allCourses.find((course) => course.featured) ?? null,
    total,
    page,
    pageSize,
    totalPages,
    filters: normalizedFilters,
    categories: Array.from(new Set([...COURSE_CATEGORIES, ...allCourses.map((course) => course.category)])),
    levels: Array.from(new Set(allCourses.map((course) => course.level).filter(Boolean))),
  }
}

export async function getUserEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()
  return (data as Enrollment | null) ?? null
}

export function getCoursePrice(course: Course): number {
  const discounted = course.discounted_price
  if (discounted !== null && discounted !== undefined && Number(discounted) >= 0) return Number(discounted)
  return Number(course.price ?? 0)
}

export function isEnrollmentActive(enrollment: Enrollment | null | undefined, at = new Date()): boolean {
  if (!enrollment) return false
  const status = enrollment.status ?? (enrollment.payment_status === 'free' ? 'active' : 'pending')
  if (!['active', 'completed'].includes(status)) return false
  if (!enrollment.expires_at) return true
  return new Date(enrollment.expires_at).getTime() > at.getTime()
}

export function getCourseAccessState(enrollment: Enrollment | null | undefined, at = new Date()): CourseAccessState {
  const status = enrollment?.status ?? (enrollment?.payment_status === 'free' ? 'active' : 'pending')
  const expiresAt = enrollment?.expires_at ?? null
  const expiryMs = expiresAt ? new Date(expiresAt).getTime() : null
  const expired = Boolean(expiryMs && expiryMs <= at.getTime()) || status === 'expired'
  const daysRemaining = expiryMs ? Math.max(0, Math.ceil((expiryMs - at.getTime()) / 86_400_000)) : null
  return {
    active: Boolean(enrollment) && !expired && ['active', 'completed'].includes(status),
    expired,
    pendingPayment: status === 'pending',
    status,
    expiresAt,
    daysRemaining,
  }
}

export async function getLessonProgress(userId: string, courseId: string): Promise<LessonProgress[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
  return (data as LessonProgress[]) ?? []
}

export async function getCourseAssignments(courseId: string): Promise<CourseAssignment[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('course_assignments')
      .select('*')
      .eq('course_id', courseId)
      .eq('published', true)
      .order('sort_order', { ascending: true })
    return (data as CourseAssignment[]) ?? []
  } catch {
    return []
  }
}

export async function getUserAssignmentSubmissions(userId: string, courseId: string): Promise<AssignmentSubmission[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('assignment_submissions')
      .select('*, course_assignments(*)')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('updated_at', { ascending: false })
    return (data as AssignmentSubmission[]) ?? []
  } catch {
    return []
  }
}

export async function getLessonTimeTotals(userId: string, courseId: string): Promise<LessonTimeTotal[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('lesson_time_totals')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
    return (data as LessonTimeTotal[]) ?? []
  } catch {
    return []
  }
}

export async function getOfflineActivityEntries(userId: string, courseId?: string): Promise<OfflineActivityEntry[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    let query = supabase
      .from('offline_activity_entries')
      .select('*')
      .eq('user_id', userId)
      .order('activity_date', { ascending: false })
    if (courseId) query = query.eq('course_id', courseId)
    const { data } = await query
    return (data as OfflineActivityEntry[]) ?? []
  } catch {
    return []
  }
}

export async function getUserCoursePayments(userId: string): Promise<CoursePayment[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('course_payments')
      .select('*, courses(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return (data as CoursePayment[]) ?? []
  } catch {
    return []
  }
}

export async function getCourseCompletionStatus(userId: string, courseId: string): Promise<CourseCompletionStatus | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('course_completion_status')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()
    return (data as CourseCompletionStatus | null) ?? null
  } catch {
    return null
  }
}

export async function getCourseWishlist(userId: string): Promise<CourseWishlistItem[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('course_wishlists')
      .select('*, courses(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return (data as CourseWishlistItem[]) ?? []
  } catch {
    return []
  }
}

export async function getQuizForCourse(courseId: string, userId: string): Promise<QuizForCourse | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createServiceClient()
      : await createClient()

    const { data: quiz } = await supabase
      .from('course_quizzes')
      .select('*')
      .eq('course_id', courseId)
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (!quiz) return null

    const [{ data: questions }, { data: attempts }] = await Promise.all([
      supabase
        .from('quiz_questions')
        .select('id, quiz_id, bank_id, question, question_type, options, explanation, media_url, image_url, audio_url, points, difficulty, sort_order, created_at')
        .eq('quiz_id', quiz.id)
        .order('sort_order', { ascending: true }),
      supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quiz.id)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ])

    const safeQuestions = ((questions ?? []) as QuizQuestion[]).map((question) => ({
      ...question,
      options: Array.isArray(question.options) ? question.options : [],
    }))

    return {
      quiz: quiz as CourseQuiz,
      questions: safeQuestions,
      attempts: (attempts as QuizAttempt[]) ?? [],
    }
  } catch {
    return null
  }
}

async function getBestQuizScore(courseId: string, userId: string): Promise<number | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('quiz_attempts')
      .select('score')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(1)
    const row = data?.[0] as { score?: number } | undefined
    return row?.score ?? null
  } catch {
    return null
  }
}

export async function evaluateCourseCompletion(course: Course, userId: string): Promise<CompletionChecklist> {
  const [enrollment, modules, progressItems, timeTotals, offlineEntries, assignments, submissions] = await Promise.all([
    getUserEnrollment(userId, course.id),
    getCourseModules(course),
    getLessonProgress(userId, course.id),
    getLessonTimeTotals(userId, course.id),
    getOfflineActivityEntries(userId, course.id),
    getCourseAssignments(course.id),
    getUserAssignmentSubmissions(userId, course.id),
  ])

  const access = getCourseAccessState(enrollment)
  const requiredLessons = modules.flatMap((module) => module.lessons).filter((lesson) => lesson.is_compulsory !== false)
  const completedLessonIds = new Set(progressItems.filter((item) => item.completed).map((item) => item.lesson_id))
  const lessonsCompleted = requiredLessons.filter((lesson) => completedLessonIds.has(lesson.id)).length

  const onlineMinutes = Math.floor(
    timeTotals.reduce((total, item) => total + Number(item.approved_seconds ?? 0), 0) / 60
  )
  const offlineMinutes = offlineEntries
    .filter((entry) => entry.status === 'approved' || entry.status === 'partially_approved')
    .reduce((total, entry) => total + Number(entry.approved_minutes ?? 0), 0)
  const bestQuizScore = await getBestQuizScore(course.id, userId)

  const requiredAssignments = assignments.filter((assignment) => assignment.compulsory)
  const passedAssignmentIds = new Set(
    submissions
      .filter((submission) => submission.feedback_released && submission.passed)
      .map((submission) => submission.assignment_id)
  )
  const assignmentsPassed = requiredAssignments.filter((assignment) => passedAssignmentIds.has(assignment.id)).length

  const requiredOnline = Number(course.required_online_minutes ?? metadata(course).requiredOnlineMinutes ?? 0)
  const requiredOffline = Number(course.required_offline_minutes ?? metadata(course).requiredOfflineMinutes ?? 0)
  const requiredQuiz = Number(course.passing_quiz_percentage ?? metadata(course).passingQuizPercentage ?? 70)
  const requiredAssignmentPasses = Math.max(
    Number(course.required_assignment_passes ?? 0),
    requiredAssignments.length,
  )
  const requiresLessons = course.completion_requires_lessons ?? true
  const requiresOnline = course.completion_requires_online_minutes ?? false
  const requiresOffline = course.completion_requires_offline_minutes ?? false
  const requiresQuiz = course.completion_requires_quiz ?? false
  const requiresAssignments = course.completion_requires_assignments ?? false
  const requiresActiveAccess = course.completion_requires_active_enrollment ?? true

  const checks = {
    lessons: {
      completed: lessonsCompleted,
      required: requiredLessons.length,
      satisfied: !requiresLessons || requiredLessons.length === 0 || lessonsCompleted >= requiredLessons.length,
    },
    online: {
      minutes: onlineMinutes,
      required: requiredOnline,
      satisfied: !requiresOnline || onlineMinutes >= requiredOnline,
    },
    offline: {
      minutes: offlineMinutes,
      required: requiredOffline,
      satisfied: !requiresOffline || offlineMinutes >= requiredOffline,
    },
    quiz: {
      score: bestQuizScore,
      required: requiredQuiz,
      satisfied: !requiresQuiz || (bestQuizScore !== null && bestQuizScore >= requiredQuiz),
    },
    assignments: {
      passed: assignmentsPassed,
      required: requiredAssignmentPasses,
      satisfied: !requiresAssignments || assignmentsPassed >= requiredAssignmentPasses,
    },
    activeAccess: {
      expiresAt: access.expiresAt,
      satisfied: !requiresActiveAccess || access.active,
    },
  }

  const satisfiedCount = Object.values(checks).filter((check) => check.satisfied).length
  const totalChecks = Object.values(checks).length
  const completed = Object.values(checks).every((check) => check.satisfied)

  const checklist: CompletionChecklist = {
    ...checks,
    eligible: completed && (course.certificate_enabled ?? metadata(course).certificateEnabled !== false),
    completed,
    progress: Math.round((satisfiedCount / totalChecks) * 100),
  }

  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = await createServiceClient()
      await supabase.from('course_completion_status').upsert(
        {
          user_id: userId,
          course_id: course.id,
          enrollment_id: enrollment?.id ?? null,
          lessons_completed: checks.lessons.completed,
          lessons_required: checks.lessons.required,
          online_minutes: checks.online.minutes,
          offline_minutes: checks.offline.minutes,
          final_quiz_score: checks.quiz.score,
          required_assignments_passed: checks.assignments.passed,
          required_assignments_total: checks.assignments.required,
          eligible_for_certificate: checklist.eligible,
          completed,
          checklist,
          evaluated_at: new Date().toISOString(),
        } as never,
        { onConflict: 'user_id,course_id' },
      )

      if (enrollment) {
        await supabase
          .from('enrollments')
          .update({
            progress: checklist.progress,
            status: completed ? 'completed' : enrollment.status ?? 'active',
            completed_at: completed ? new Date().toISOString() : enrollment.completed_at ?? null,
          } as never)
          .eq('id', enrollment.id)
      }
    } catch {
      // The evaluator remains useful before the pending LMS migration is applied.
    }
  }

  return checklist
}

export async function getCertificateStatus(course: Course, userId: string) {
  const enrollment = await getUserEnrollment(userId, course.id)
  if (!isSupabaseConfigured()) {
    return { enrollment, certificate: null, eligible: false, progress: 0, checklist: null }
  }

  const [checklist, certificateResult] = await Promise.all([
    evaluateCourseCompletion(course, userId),
    createClient().then((supabase) =>
      supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', course.id)
        .maybeSingle()
    ),
  ])

  return {
    enrollment,
    certificate: (certificateResult.data as Certificate | null) ?? null,
    eligible: checklist.eligible,
    progress: checklist.progress,
    checklist,
  }
}

export async function getInstructorProfile(slug: string) {
  const courses = await getCourses()
  const instructorCourses = courses.filter((course) => {
    if (!course.instructor) return false
    return slugifyInstructor(course.instructor) === slug
  })

  const first = instructorCourses[0]
  if (!first?.instructor) return null

  return {
    name: first.instructor,
    slug,
    bio:
      first.instructor_bio ??
      'Phonics Club instructor supporting teachers and learners with structured phonics, reading and classroom implementation.',
    avatar: first.instructor_avatar ?? null,
    courses: instructorCourses,
  }
}

export async function getCourseDetailBundle(slug: string) {
  const course = await getCourseBySlug(slug)
  if (!course) return null

  const [modules, reviews, resources, quizzes, allCourses] = await Promise.all([
    getCourseModules(course),
    getCourseReviews(course.id),
    getCourseResources(course.id),
    getCourseQuizzes(course.id),
    getCourses(),
  ])

  return {
    course,
    modules,
    reviews,
    resources,
    quizzes,
    relatedCourses: allCourses
      .filter((item) => item.id !== course.id && item.category === course.category)
      .slice(0, 3),
  }
}
