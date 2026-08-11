import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/auth'
import {
  CHILDREN_PHONICS_COURSES,
  CHILDREN_PHONICS_COURSE_SLUGS,
  isChildrenPhonicsCourseSlug,
} from './children-phonics-courses'
import type { Course, CurriculumModule } from '@/types/database'

type SupabaseLike = Awaited<ReturnType<typeof createClient>>

type LessonShell = {
  moduleIndex: number
  title: string
  description: string
}

const CHILDREN_PHONICS_LESSON_SHELLS: Record<string, LessonShell[]> = {
  'jolly-phonics-sounds-groups-1-3': [
    ...['s', 'a', 't', 'i', 'p', 'n'].map((sound) => ({
      moduleIndex: 0,
      title: `Sound ${sound}`,
      description: 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.',
    })),
    { moduleIndex: 0, title: 'Group 1 Flashcard Review', description: 'Content required: add instructor-approved review activity media.' },
    { moduleIndex: 0, title: 'Group 1 Formation Practice', description: 'Content required: add instructor-approved formation practice.' },
    { moduleIndex: 0, title: 'Group 1 Listening Game', description: 'Content required: add instructor-approved listening activity.' },
    { moduleIndex: 0, title: 'Group 1 Blending Practice', description: 'Content required: add approved blending examples using taught sounds.' },
    { moduleIndex: 0, title: 'Group 1 Segmenting Practice', description: 'Content required: add approved segmenting examples using taught sounds.' },
    { moduleIndex: 0, title: 'Group 1 Checkpoint', description: 'Content required: add a child-friendly checkpoint.' },
    { moduleIndex: 0, title: 'Group 1 Practice and Review', description: 'Content required: add flashcards, matching, tracing, blending, segmenting, memory pairs and mini-quiz activities.' },
    ...['c/k', 'e', 'h', 'r', 'm', 'd'].map((sound) => ({
      moduleIndex: 1,
      title: `Sound ${sound}`,
      description: sound === 'c/k'
        ? 'Content required: teach the /k/ sound with c and k spellings while adding approved media.'
        : 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.',
    })),
    { moduleIndex: 1, title: 'Group 2 Flashcard Review', description: 'Content required: add instructor-approved review activity media.' },
    { moduleIndex: 1, title: 'Group 2 Formation Practice', description: 'Content required: add instructor-approved formation practice.' },
    { moduleIndex: 1, title: 'Group 2 Listening Game', description: 'Content required: add instructor-approved listening activity.' },
    { moduleIndex: 1, title: 'Groups 1-2 Blending', description: 'Content required: add approved blending examples using taught sounds.' },
    { moduleIndex: 1, title: 'Groups 1-2 Segmenting', description: 'Content required: add approved segmenting examples using taught sounds.' },
    { moduleIndex: 1, title: 'Group 2 Checkpoint', description: 'Content required: add a child-friendly checkpoint.' },
    { moduleIndex: 1, title: 'Group 2 Practice and Review', description: 'Content required: add c/k distinction, formation, word building, listening and mini-assessment activities.' },
    ...['g', 'o', 'u', 'l', 'f', 'b'].map((sound) => ({
      moduleIndex: 2,
      title: `Sound ${sound}`,
      description: 'Content required: add pronunciation, poem or song, story, action, flashcard, formation, tracing and practice media.',
    })),
    { moduleIndex: 2, title: 'Group 3 Flashcard Review', description: 'Content required: add instructor-approved review activity media.' },
    { moduleIndex: 2, title: 'Group 3 Formation Practice', description: 'Content required: add instructor-approved formation practice.' },
    { moduleIndex: 2, title: 'Group 3 Listening Game', description: 'Content required: add instructor-approved listening activity.' },
    { moduleIndex: 2, title: 'Groups 1-3 Blending', description: 'Content required: add approved blending examples using taught sounds.' },
    { moduleIndex: 2, title: 'Groups 1-3 Segmenting', description: 'Content required: add approved segmenting examples using taught sounds.' },
    { moduleIndex: 2, title: 'Group 3 Checkpoint', description: 'Content required: add a child-friendly checkpoint.' },
    { moduleIndex: 2, title: 'Group 3 Practice and Review', description: 'Content required: add sound sorting, picture matching, word building and mini-assessment activities.' },
    { moduleIndex: 3, title: 'Groups 1-3 Blending Activities', description: 'Content required: add approved blending examples using only introduced sounds.' },
    { moduleIndex: 3, title: 'Groups 1-3 Segmenting Activities', description: 'Content required: add approved segmenting examples using only introduced sounds.' },
    { moduleIndex: 3, title: 'Groups 1-3 Review', description: 'Content required: add recognition, listening, matching, formation, blending and segmenting checks.' },
  ],
  'jolly-phonics-sounds-groups-4-7': [
    ...['ai', 'j', 'oa', 'ie', 'ee', 'or'].map((sound) => ({
      moduleIndex: 0,
      title: `Sound ${sound}`,
      description: ['ai', 'oa', 'ie', 'ee', 'or'].includes(sound)
        ? 'Content required: treat the digraph as one sound unit and add approved media.'
        : 'Content required: add approved media and practice activities.',
    })),
    { moduleIndex: 0, title: 'Group 4 Practice and Review', description: 'Content required: add pronunciation, recognition, blending and writing review activities.' },
    ...['z', 'w', 'ng', 'v'].map((sound) => ({
      moduleIndex: 1,
      title: `Sound ${sound}`,
      description: sound === 'ng'
        ? 'Content required: treat the digraph as one sound unit and add approved media.'
        : 'Content required: add approved media and practice activities.',
    })),
    { moduleIndex: 1, title: 'Sound oo (moon)', description: 'Content required: keep this oo sound separate from oo_book and add distinct pronunciation examples.' },
    { moduleIndex: 1, title: 'Sound oo (book)', description: 'Content required: keep this oo sound separate from oo_moon and add distinct pronunciation examples.' },
    { moduleIndex: 1, title: 'Group 5 Practice and Review', description: 'Content required: add games, tracing, flashcards, listening and sound practice activities.' },
    ...['y', 'x', 'ch', 'sh'].map((sound) => ({
      moduleIndex: 2,
      title: `Sound ${sound}`,
      description: ['ch', 'sh'].includes(sound)
        ? 'Content required: treat the digraph as one sound unit and add approved media.'
        : 'Content required: add approved media and practice activities.',
    })),
    { moduleIndex: 2, title: 'Sound th (unvoiced)', description: 'Content required: keep this th sound separate from th_voiced and add distinct pronunciation examples.' },
    { moduleIndex: 2, title: 'Sound th (voiced)', description: 'Content required: keep this th sound separate from th_unvoiced and add distinct pronunciation examples.' },
    { moduleIndex: 2, title: 'Group 6 Practice and Review', description: 'Content required: add recognition, pronunciation and application activities.' },
    ...['qu', 'ou', 'oi', 'ue', 'er', 'ar'].map((sound) => ({
      moduleIndex: 3,
      title: `Sound ${sound}`,
      description: 'Content required: treat the digraph as one sound unit and add approved media.',
    })),
    { moduleIndex: 3, title: 'Group 7 Practice and Review', description: 'Content required: add games, tracing, listening and word-building activities.' },
    { moduleIndex: 4, title: 'Groups 4-7 Blending Activities', description: 'Content required: add approved blending examples and keep digraphs as one tile.' },
    { moduleIndex: 4, title: 'Groups 4-7 Segmenting Activities', description: 'Content required: add approved segmenting examples and keep digraphs as one tile.' },
    { moduleIndex: 4, title: 'Groups 4-7 Review', description: 'Content required: add comprehensive Groups 4-7 review activities.' },
  ],
}

const CHILDREN_PHONICS_FINAL_QUIZZES: Record<string, { title: string; description: string }> = {
  'jolly-phonics-sounds-groups-1-3': {
    title: 'Final Quiz',
    description: 'Final quiz for the Groups 1-3 blending and segmenting course. Add approved questions before publishing.',
  },
  'jolly-phonics-sounds-groups-4-7': {
    title: 'Final Quiz',
    description: 'Final quiz for the Groups 4-7 blending and segmenting course. Add approved questions before publishing.',
  },
}

function coursePayload(course: Course) {
  return {
    title: course.title,
    slug: course.slug,
    subtitle: course.subtitle ?? null,
    description: course.description,
    rich_description: course.rich_description ?? course.description,
    excerpt: course.excerpt,
    price: course.price,
    discounted_price: course.discounted_price ?? null,
    category: course.category,
    level: course.level,
    duration: course.duration,
    instructor: course.instructor,
    instructor_bio: course.instructor_bio ?? null,
    image_url: course.image_url,
    thumbnail_url: course.thumbnail_url ?? course.image_url,
    banner_url: course.banner_url ?? course.thumbnail_url ?? course.image_url,
    curriculum: course.curriculum,
    objectives: course.objectives ?? [],
    requirements: course.requirements ?? [],
    seo_title: course.seo_title ?? course.title,
    seo_description: course.seo_description ?? course.excerpt ?? course.description,
    rating: course.rating ?? 0,
    students_count: course.students_count ?? 0,
    is_free: course.is_free ?? course.price <= 0,
    certificate_enabled: course.certificate_enabled ?? false,
    featured: course.featured,
    published: course.published,
    completion_requires_lessons: true,
    completion_requires_quiz: false,
    completion_requires_assignments: false,
    metadata: course.metadata,
  }
}

async function getWriteClient(requireService = false): Promise<SupabaseLike | null> {
  if (!isSupabaseConfigured()) return null
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return createServiceClient() as Promise<SupabaseLike>
  if (requireService) return null
  return createClient()
}

async function ensureCategory(supabase: SupabaseLike) {
  await supabase.from('course_categories').upsert(
    {
      name: "Children's Courses",
      slug: 'children-courses',
      description: 'Interactive phonics and early reading courses for children.',
      sort_order: 2,
    } as never,
    { onConflict: 'slug' },
  )
}

async function ensureModules(supabase: SupabaseLike, courseId: string, curriculum: CurriculumModule[]) {
  const installedModules: Array<{ id: string; sort_order: number }> = []

  for (const [index, module] of curriculum.entries()) {
    const sortOrder = index + 1
    const { data: existing } = await supabase
      .from('course_modules')
      .select('id, sort_order')
      .eq('course_id', courseId)
      .eq('sort_order', sortOrder)
      .maybeSingle()

    if (existing?.id) {
      installedModules.push(existing as { id: string; sort_order: number })
      continue
    }

    const { data: inserted, error } = await supabase
      .from('course_modules')
      .insert({
        course_id: courseId,
        title: module.title,
        description: module.description ?? null,
        sort_order: sortOrder,
      } as never)
      .select('id, sort_order')
      .single()

    if (error) throw new Error(error.message)
    installedModules.push(inserted as { id: string; sort_order: number })
  }

  return installedModules
}

async function ensureLessonShells(
  supabase: SupabaseLike,
  courseId: string,
  slug: string,
  modules: Array<{ id: string; sort_order: number }>,
) {
  const moduleByIndex = new Map(modules.map((module) => [module.sort_order - 1, module.id]))
  const shells = CHILDREN_PHONICS_LESSON_SHELLS[slug] ?? []

  for (const [index, shell] of shells.entries()) {
    const moduleId = moduleByIndex.get(shell.moduleIndex)
    if (!moduleId) continue
    const sortOrder = shells.slice(0, index + 1).filter((item) => item.moduleIndex === shell.moduleIndex).length

    const { data: existing } = await supabase
      .from('course_lessons')
      .select('id')
      .eq('course_id', courseId)
      .eq('module_id', moduleId)
      .eq('sort_order', sortOrder)
      .maybeSingle()

    if (existing?.id) continue

    const { error } = await supabase.from('course_lessons').insert({
      course_id: courseId,
      module_id: moduleId,
      title: shell.title,
      description: shell.description,
      lesson_type: 'interactive',
      reading_type: 'interactive_presentation',
      duration_minutes: 8,
      sort_order: sortOrder,
      is_preview: false,
      is_compulsory: true,
      sequentially_locked: true,
      manual_completion_allowed: true,
      completion_mode: 'manual',
      required_completion_percentage: 80,
      published: true,
      activity_data: {
        childActivityShell: true,
        contentStatus: 'content_required',
        activityTypes: [
          'sound_introduction',
          'pronunciation_video',
          'poem_or_song',
          'story',
          'action',
          'flashcard',
          'formation_demo',
          'trace_and_write',
          'listen_and_choose',
          'picture_match',
          'blending',
          'segmenting',
          'quick_review',
        ],
      },
    } as never)

    if (error) throw new Error(error.message)
  }
}

async function ensureFinalQuizShell(supabase: SupabaseLike, courseId: string, slug: string) {
  const quiz = CHILDREN_PHONICS_FINAL_QUIZZES[slug]
  if (!quiz) return

  const { data: existing } = await supabase
    .from('course_quizzes')
    .select('id')
    .eq('course_id', courseId)
    .in('title', [quiz.title, 'Final Assessment'])
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    await supabase
      .from('course_quizzes')
      .update({
        title: quiz.title,
        description: quiz.description,
        lesson_id: null,
        sort_order: 1,
      } as never)
      .eq('id', existing.id)
    return
  }

  const { error } = await supabase.from('course_quizzes').insert({
    course_id: courseId,
    lesson_id: null,
    title: quiz.title,
    description: quiz.description,
    passing_score: 70,
    max_attempts: 3,
    sort_order: 1,
    published: false,
  } as never)

  if (error) throw new Error(error.message)
}

export async function ensureChildrenPhonicsCoursesInstalled(options?: {
  slugs?: string[]
  requireService?: boolean
}) {
  const supabase = await getWriteClient(options?.requireService ?? false)
  if (!supabase) return []

  await ensureCategory(supabase)

  const requestedSlugs = options?.slugs?.length ? options.slugs : CHILDREN_PHONICS_COURSE_SLUGS
  const installed: Course[] = []

  for (const course of CHILDREN_PHONICS_COURSES.filter((item) => requestedSlugs.includes(item.slug))) {
    const { data: existing } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', course.slug)
      .maybeSingle()

    let dbCourse = existing as Course | null
    if (!dbCourse) {
      const { data: inserted, error } = await supabase
        .from('courses')
        .insert(coursePayload(course) as never)
        .select('*')
        .single()

      if (error) throw new Error(error.message)
      dbCourse = inserted as Course
    } else {
      const existingMetadata =
        dbCourse.metadata && typeof dbCourse.metadata === 'object' && !Array.isArray(dbCourse.metadata)
          ? dbCourse.metadata
          : {}
      const coursePatch = {
        title: course.title,
        seo_title: course.seo_title ?? course.title,
        image_url: course.image_url,
        thumbnail_url: course.thumbnail_url ?? course.image_url,
        banner_url: course.banner_url ?? course.thumbnail_url ?? course.image_url,
        curriculum: course.curriculum,
        metadata: {
          ...existingMetadata,
          ...(course.metadata ?? {}),
        },
      }
      await supabase.from('courses').update(coursePatch as never).eq('id', dbCourse.id)
      dbCourse = { ...dbCourse, ...coursePatch }
    }

    const modules = await ensureModules(supabase, dbCourse.id, course.curriculum)
    await ensureLessonShells(supabase, dbCourse.id, course.slug, modules)
    await ensureFinalQuizShell(supabase, dbCourse.id, course.slug)
    installed.push(dbCourse)
  }

  return installed
}

export async function ensureChildrenPhonicsCourseInstalledBySlug(slug: string, options?: { requireService?: boolean }) {
  if (!isChildrenPhonicsCourseSlug(slug)) return null
  const courses = await ensureChildrenPhonicsCoursesInstalled({ slugs: [slug], requireService: options?.requireService })
  return courses[0] ?? null
}
