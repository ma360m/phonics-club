import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/auth'
import {
  CHILDREN_PHONICS_COURSES,
  CHILDREN_PHONICS_COURSE_SLUGS,
  isChildrenPhonicsCourseSlug,
} from './children-phonics-courses'
import {
  GROUP_1_KEYS,
  GROUP_2_KEYS,
  GROUP_3_KEYS,
  GROUP_4_KEYS,
  GROUP_5_KEYS,
  GROUP_6_KEYS,
  GROUP_7_KEYS,
  GROUPS_1_3_KEYS,
  GROUPS_4_7_KEYS,
  getJollySound,
  reviewActivity,
  soundActivity,
  type JollyActivityData,
  type JollySoundKey,
} from './jolly-phonics-sound-data'
import type { Course, CurriculumModule } from '@/types/database'

type SupabaseLike = Awaited<ReturnType<typeof createClient>>

type LessonShell = {
  moduleIndex: number
  title: string
  description: string
  activityData: JollyActivityData
  durationMinutes?: number
}

const GROUP_KEYS: Record<number, JollySoundKey[]> = {
  1: GROUP_1_KEYS,
  2: GROUP_2_KEYS,
  3: GROUP_3_KEYS,
  4: GROUP_4_KEYS,
  5: GROUP_5_KEYS,
  6: GROUP_6_KEYS,
  7: GROUP_7_KEYS,
}

function soundTitle(key: JollySoundKey) {
  if (key === 'ck') return 'Sound c/k'
  if (key === 'oo_long') return 'Sound oo (moon)'
  if (key === 'oo_short') return 'Sound oo (book)'
  if (key === 'th_unvoiced') return 'Sound th (unvoiced)'
  if (key === 'th_voiced') return 'Sound th (voiced)'
  return `Sound ${getJollySound(key)?.display ?? key}`
}

function soundShell(moduleIndex: number, key: JollySoundKey): LessonShell {
  const sound = getJollySound(key)
  if (!sound) throw new Error(`Missing sound shell data for ${key}`)
  return {
    moduleIndex,
    title: soundTitle(key),
    description: `Interactive sound station for ${sound.display} ${sound.label}: hear the sound, practise the action, view the flashcard, trace the grapheme, match example words, blend, and segment.`,
    activityData: soundActivity(sound),
  }
}

function reviewShell(
  moduleIndex: number,
  title: string,
  keys: JollySoundKey[],
  mode: 'flashcards' | 'formation' | 'listening' | 'blending' | 'segmenting' | 'checkpoint' | 'review',
  description: string,
): LessonShell {
  return {
    moduleIndex,
    title,
    description,
    activityData: reviewActivity({
      title,
      group: keys.length === GROUPS_1_3_KEYS.length ? '1-3' : keys.length === GROUPS_4_7_KEYS.length ? '4-7' : getJollySound(keys[0])?.group ?? 1,
      keys,
      mode,
    }),
    durationMinutes: 10,
  }
}

function groupReviewShells(moduleIndex: number, group: number) {
  const keys = GROUP_KEYS[group] ?? []
  return [
    reviewShell(moduleIndex, `Group ${group} Practice and Review`, keys, 'review', `Review Group ${group} with flashcards, audio, tracing, word building, picture examples, blending, and segmenting.`),
  ]
}

const CHILDREN_PHONICS_LESSON_SHELLS: Record<string, LessonShell[]> = {
  'jolly-phonics-sounds-groups-1-3': [
    ...GROUP_1_KEYS.map((key) => soundShell(0, key)),
    reviewShell(0, 'Group 1 Flashcard Review', GROUP_1_KEYS, 'flashcards', 'Fast flashcard practice for s, a, t, i, p, and n using the embedded Group 1 sound recordings.'),
    reviewShell(0, 'Group 1 Formation Practice', GROUP_1_KEYS, 'formation', 'Trace and form each Group 1 grapheme after hearing the sound.'),
    reviewShell(0, 'Group 1 Listening Game', GROUP_1_KEYS, 'listening', 'Listen, identify the matching flashcard, and reinforce the Group 1 sounds.'),
    reviewShell(0, 'Group 1 Blending Practice', GROUP_1_KEYS, 'blending', 'Blend simple CVC words using only Group 1 sounds.'),
    reviewShell(0, 'Group 1 Segmenting Practice', GROUP_1_KEYS, 'segmenting', 'Segment simple words into the Group 1 sound tiles.'),
    reviewShell(0, 'Group 1 Checkpoint', GROUP_1_KEYS, 'checkpoint', 'A child-friendly checkpoint for sound recognition, formation, blending, and segmenting.'),
    reviewShell(0, 'Group 1 Practice and Review', GROUP_1_KEYS, 'review', 'Full Group 1 practice with audio flashcards, matching, tracing, blending, and segmenting.'),
    ...GROUP_2_KEYS.map((key) => soundShell(1, key)),
    reviewShell(1, 'Group 2 Flashcard Review', GROUP_2_KEYS, 'flashcards', 'Fast flashcard practice for c/k, e, h, r, m, and d.'),
    reviewShell(1, 'Group 2 Formation Practice', GROUP_2_KEYS, 'formation', 'Trace Group 2 letters and keep c/k as the shared /k/ sound station.'),
    reviewShell(1, 'Group 2 Listening Game', GROUP_2_KEYS, 'listening', 'Listen and choose the matching Group 2 sound card.'),
    reviewShell(1, 'Groups 1-2 Blending', [...GROUP_1_KEYS, ...GROUP_2_KEYS], 'blending', 'Blend words using the sounds introduced in Groups 1 and 2.'),
    reviewShell(1, 'Groups 1-2 Segmenting', [...GROUP_1_KEYS, ...GROUP_2_KEYS], 'segmenting', 'Segment words into taught sound tiles from Groups 1 and 2.'),
    reviewShell(1, 'Group 2 Checkpoint', GROUP_2_KEYS, 'checkpoint', 'A child-friendly checkpoint for Group 2 recognition, formation, and application.'),
    reviewShell(1, 'Group 2 Practice and Review', GROUP_2_KEYS, 'review', 'Review c/k distinction, formation, listening, blending, segmenting, and word building.'),
    ...GROUP_3_KEYS.map((key) => soundShell(2, key)),
    reviewShell(2, 'Group 3 Flashcard Review', GROUP_3_KEYS, 'flashcards', 'Fast flashcard practice for g, o, u, l, f, and b.'),
    reviewShell(2, 'Group 3 Formation Practice', GROUP_3_KEYS, 'formation', 'Trace and form the Group 3 sounds with large visual cards.'),
    reviewShell(2, 'Group 3 Listening Game', GROUP_3_KEYS, 'listening', 'Listen, choose, and reinforce the Group 3 sound cards.'),
    reviewShell(2, 'Groups 1-3 Blending', GROUPS_1_3_KEYS, 'blending', 'Blend words using the first 18 introduced sounds.'),
    reviewShell(2, 'Groups 1-3 Segmenting', GROUPS_1_3_KEYS, 'segmenting', 'Segment words into sound tiles from Groups 1-3.'),
    reviewShell(2, 'Group 3 Checkpoint', GROUP_3_KEYS, 'checkpoint', 'A child-friendly checkpoint for Group 3 sound recognition and word application.'),
    reviewShell(2, 'Group 3 Practice and Review', GROUP_3_KEYS, 'review', 'Review Group 3 with audio flashcards, sound sorting, picture words, blending, and segmenting.'),
    reviewShell(3, 'Groups 1-3 Blending Activities', GROUPS_1_3_KEYS, 'blending', 'Final blending practice using only the first 18 introduced sounds.'),
    reviewShell(3, 'Groups 1-3 Segmenting Activities', GROUPS_1_3_KEYS, 'segmenting', 'Final segmenting practice using the first 18 introduced sounds.'),
    reviewShell(3, 'Groups 1-3 Review', GROUPS_1_3_KEYS, 'review', 'Complete Groups 1-3 review with sound cards, audio, matching, formation, blending, and segmenting.'),
  ],
  'jolly-phonics-sounds-groups-4-7': [
    ...GROUP_4_KEYS.map((key) => soundShell(0, key)),
    ...groupReviewShells(0, 4),
    ...GROUP_5_KEYS.map((key) => soundShell(1, key)),
    ...groupReviewShells(1, 5),
    ...GROUP_6_KEYS.map((key) => soundShell(2, key)),
    ...groupReviewShells(2, 6),
    ...GROUP_7_KEYS.map((key) => soundShell(3, key)),
    ...groupReviewShells(3, 7),
    reviewShell(4, 'Groups 4-7 Blending Activities', GROUPS_4_7_KEYS, 'blending', 'Blend advanced words while keeping digraphs and vowel teams together as one sound tile.'),
    reviewShell(4, 'Groups 4-7 Segmenting Activities', GROUPS_4_7_KEYS, 'segmenting', 'Segment words into sound tiles, keeping ai, oa, ie, ee, or, ng, oo, ch, sh, th, qu, ou, oi, ue, er, and ar whole.'),
    reviewShell(4, 'Groups 4-7 Review', GROUPS_4_7_KEYS, 'review', 'Complete Groups 4-7 review with themed flashcards, audio, word building, blending, segmenting, and a game-style final check.'),
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
      .select('id, activity_data')
      .eq('course_id', courseId)
      .eq('module_id', moduleId)
      .eq('sort_order', sortOrder)
      .maybeSingle()

    if (existing?.id) {
      const existingActivityData =
        existing.activity_data && typeof existing.activity_data === 'object' && !Array.isArray(existing.activity_data)
          ? existing.activity_data as Record<string, unknown>
          : {}
      const shouldRefresh =
        existingActivityData.childActivityShell === true ||
        existingActivityData.contentStatus === 'content_required' ||
        Object.keys(existingActivityData).length === 0

      if (shouldRefresh) {
        const { error } = await supabase
          .from('course_lessons')
          .update({
            title: shell.title,
            description: shell.description,
            lesson_type: 'interactive',
            reading_type: 'interactive_presentation',
            duration_minutes: shell.durationMinutes ?? 8,
            manual_completion_allowed: true,
            completion_mode: 'manual',
            required_completion_percentage: 80,
            published: true,
            activity_data: shell.activityData,
          } as never)
          .eq('id', existing.id)

        if (error) throw new Error(error.message)
      }
      continue
    }

    const { error } = await supabase.from('course_lessons').insert({
      course_id: courseId,
      module_id: moduleId,
      title: shell.title,
      description: shell.description,
      lesson_type: 'interactive',
      reading_type: 'interactive_presentation',
      duration_minutes: shell.durationMinutes ?? 8,
      sort_order: sortOrder,
      is_preview: false,
      is_compulsory: true,
      sequentially_locked: true,
      manual_completion_allowed: true,
      completion_mode: 'manual',
      required_completion_percentage: 80,
      published: true,
      activity_data: shell.activityData,
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
