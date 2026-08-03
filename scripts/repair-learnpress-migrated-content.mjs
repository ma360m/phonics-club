import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const analysisDir = path.join(root, 'tmp', 'wpress-analysis')
const batch = process.env.LEARNPRESS_MIGRATION_BATCH || 'learnpress-2026-08-01T15-31-44-674Z'
const planPath = process.env.LEARNPRESS_IMPORT_PLAN || path.join(analysisDir, `learnpress-import-plan-${batch}.json`)
const apply = process.argv.includes('--apply')
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const rollbackPath = path.join(analysisDir, `rollback-learnpress-content-repair-${stamp}.sql`)
const reportPath = path.join(analysisDir, `learnpress-content-repair-report-${stamp}.md`)

function loadEnvLocal() {
  const envPath = path.join(root, '.env.local')
  if (!fs.existsSync(envPath)) return
  const raw = fs.readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index <= 0) continue
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

function normalizeTitle(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL'
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
  return `'${String(value).replace(/'/g, "''")}'`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlParagraphs(value) {
  const lines = String(value ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
  return lines.map((item) => `<p>${escapeHtml(item).replace(/\n/g, '<br />')}</p>`).join('\n')
}

function extractEmbedUrl(value) {
  const match = String(value ?? '').match(/\[embedyt\]\s*(https?:\/\/[^\[]+?)\s*\[\/embedyt\]/i)
  return match?.[1]?.trim() || null
}

function extractH5pIds(value) {
  return [...String(value ?? '').matchAll(/\[h5p\s+id=["']?(\d+)["']?\]/gi)].map((match) => match[1])
}

function importedVideoContent(rawContent, url) {
  const withoutShortcode = String(rawContent ?? '').replace(/\[embedyt\]\s*https?:\/\/[^\[]+?\s*\[\/embedyt\]/gi, '').trim()
  const intro = htmlParagraphs(withoutShortcode)
  return [
    intro,
    '<p><strong>Imported video lesson</strong></p>',
    `<p><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open the original YouTube lesson</a></p>`,
  ].filter(Boolean).join('\n')
}

function importedH5pContent(rawContent, ids) {
  let remaining = String(rawContent ?? '').replace(/\[h5p\s+id=["']?\d+["']?\]/gi, '').trim()
  const intro = htmlParagraphs(remaining)
  const cards = ids.map((id) => [
    `<section data-imported-h5p-id="${escapeHtml(id)}">`,
    '<h3>Imported interactive WordPress activity</h3>',
    `<p>The original H5P activity #${escapeHtml(id)} was found in the WordPress backup and is preserved as source material. Replace this lesson with a native LMS activity, quiz, or uploaded resource before publishing it to students if you need the original interaction exactly.</p>`,
    '</section>',
  ].join('\n'))
  return [intro, ...cards].filter(Boolean).join('\n')
}

function hasRawShortcode(value) {
  return /\[(embedyt|h5p)\b/i.test(String(value ?? ''))
}

function oldValueMap(row, update) {
  const out = {}
  for (const key of Object.keys(update)) out[key] = row[key] ?? null
  return out
}

function rollbackSql(table, id, oldValues) {
  const setClause = Object.entries(oldValues)
    .map(([key, value]) => `${key} = ${sqlValue(value)}`)
    .join(', ')
  return `UPDATE ${table} SET ${setClause} WHERE id = ${sqlValue(id)};`
}

function mergeActivityData(current, patch) {
  return {
    ...(current && typeof current === 'object' && !Array.isArray(current) ? current : {}),
    ...patch,
  }
}

loadEnvLocal()

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}

if (!fs.existsSync(planPath)) {
  throw new Error(`Import plan not found: ${planPath}`)
}

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'))
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const { data: allCourses, error: coursesError } = await supabase
  .from('courses')
  .select('id,title,slug,published,visibility_status,unlisted,archived,metadata')
if (coursesError) throw coursesError

const courses = (allCourses ?? []).filter((course) => course.metadata?.migration_batch === batch)
const courseIds = courses.map((course) => course.id)
const courseByOldId = new Map(courses.map((course) => [String(course.metadata?.old_wordpress_id ?? ''), course]))

let lessons = []
let modules = []
let quizzes = []
let questions = []
let resources = []

if (courseIds.length) {
  const [lessonResult, moduleResult, quizResult, resourceResult] = await Promise.all([
    supabase
      .from('course_lessons')
      .select('id,course_id,module_id,title,description,rich_content,article_content,content,lesson_type,reading_type,video_url,material_url,reading_external_url,activity_data,published,sort_order')
      .in('course_id', courseIds),
    supabase
      .from('course_modules')
      .select('id,course_id,title,sort_order')
      .in('course_id', courseIds),
    supabase
      .from('course_quizzes')
      .select('id,course_id,lesson_id,title,published')
      .in('course_id', courseIds),
    supabase
      .from('course_resources')
      .select('id,course_id,lesson_id,title,resource_url,external_url,storage_bucket,storage_path,original_filename,mime_type')
      .in('course_id', courseIds),
  ])

  if (lessonResult.error) throw lessonResult.error
  if (moduleResult.error) throw moduleResult.error
  if (quizResult.error) throw quizResult.error
  if (resourceResult.error) throw resourceResult.error

  lessons = lessonResult.data ?? []
  modules = moduleResult.data ?? []
  quizzes = quizResult.data ?? []
  resources = resourceResult.data ?? []

  if (quizzes.length) {
    const quizIds = quizzes.map((quiz) => quiz.id)
    const questionResult = await supabase
      .from('quiz_questions')
      .select('id,quiz_id,question,question_type,sort_order')
      .in('quiz_id', quizIds)
    if (questionResult.error) throw questionResult.error
    questions = questionResult.data ?? []
  }
}

const lessonsByCourseAndTitle = new Map()
for (const lesson of lessons) {
  const key = `${lesson.course_id}::${normalizeTitle(lesson.title)}`
  const existing = lessonsByCourseAndTitle.get(key) ?? []
  existing.push(lesson)
  lessonsByCourseAndTitle.set(key, existing)
}

const repairs = []
const skipped = []
const warnings = []

for (const oldCourse of plan.courses ?? []) {
  const course = courseByOldId.get(String(oldCourse.oldId))
  if (!course) {
    skipped.push({ course: oldCourse.title, reason: 'No matching migrated course in Supabase.' })
    continue
  }

  for (const module of oldCourse.modules ?? []) {
    for (const item of module.items ?? []) {
      if (item.type !== 'lp_lesson') continue
      const rawContent = String(item.content || item.excerpt || '').trim()
      const embedUrl = extractEmbedUrl(rawContent)
      const h5pIds = extractH5pIds(rawContent)
      if (!rawContent || (!embedUrl && h5pIds.length === 0)) continue

      const candidates = lessonsByCourseAndTitle.get(`${course.id}::${normalizeTitle(item.title)}`) ?? []
      const lesson = candidates.find((candidate) => {
        const values = [candidate.rich_content, candidate.article_content, candidate.content]
        return values.some((value) => hasRawShortcode(value)) || embedUrl && !candidate.video_url
      }) ?? candidates[0]

      if (!lesson) {
        warnings.push({ course: oldCourse.title, item: item.title, reason: 'Lesson exists in plan but was not found in Supabase.' })
        continue
      }

      const update = {}
      if (embedUrl && lesson.video_url !== embedUrl) {
        update.video_url = embedUrl
        update.lesson_type = 'video'
        update.description = lesson.description || 'Imported YouTube lesson from the LearnPress course.'
      }

      if (embedUrl && (
        hasRawShortcode(lesson.rich_content) ||
        hasRawShortcode(lesson.article_content) ||
        hasRawShortcode(lesson.content) ||
        !lesson.rich_content ||
        !lesson.article_content
      )) {
        const content = importedVideoContent(rawContent, embedUrl)
        update.rich_content = content
        update.article_content = content
        update.content = content
      }

      if (h5pIds.length && !embedUrl && (
        hasRawShortcode(lesson.rich_content) ||
        hasRawShortcode(lesson.article_content) ||
        hasRawShortcode(lesson.content) ||
        !lesson.rich_content ||
        !lesson.article_content
      )) {
        const content = importedH5pContent(rawContent, h5pIds)
        update.lesson_type = lesson.lesson_type === 'quiz' ? lesson.lesson_type : 'interactive'
        update.reading_type = 'interactive_presentation'
        update.rich_content = content
        update.article_content = content
        update.content = content
        update.activity_data = mergeActivityData(lesson.activity_data, {
          source: 'wordpress_h5p',
          h5pIds,
          originalShortcode: rawContent,
          migrationBatch: batch,
        })
        update.description = lesson.description || `Imported H5P activity ${h5pIds.join(', ')} from the LearnPress course.`
      }

      if (!Object.keys(update).length) continue

      const oldValues = oldValueMap(lesson, update)
      if (apply) {
        const { error } = await supabase
          .from('course_lessons')
          .update(update)
          .eq('id', lesson.id)
        if (error) {
          warnings.push({ course: oldCourse.title, item: item.title, reason: error.message })
          continue
        }
      }

      Object.assign(lesson, update)
      repairs.push({
        course: oldCourse.title,
        lesson: item.title,
        lessonId: lesson.id,
        type: embedUrl ? 'video_shortcode' : 'h5p_shortcode',
        values: update,
        oldValues,
      })
    }
  }
}

const courseSummaries = courses
  .sort((a, b) => a.title.localeCompare(b.title))
  .map((course) => {
    const courseModules = modules.filter((module) => module.course_id === course.id).length
    const courseLessons = lessons.filter((lesson) => lesson.course_id === course.id)
    const courseQuizzes = quizzes.filter((quiz) => quiz.course_id === course.id)
    const courseQuestions = questions.filter((question) => courseQuizzes.some((quiz) => quiz.id === question.quiz_id)).length
    const courseResources = resources.filter((resource) => resource.course_id === course.id)
    return {
      title: course.title,
      slug: course.slug,
      status: `${course.visibility_status}${course.unlisted ? ' / hidden' : ''}`,
      published: course.published,
      modules: courseModules,
      lessons: courseLessons.length,
      lessonsWithContent: courseLessons.filter((lesson) => (
        lesson.video_url ||
        lesson.material_url ||
        lesson.reading_external_url ||
        lesson.rich_content ||
        lesson.article_content ||
        lesson.content
      )).length,
      quizzes: courseQuizzes.length,
      questions: courseQuestions,
      resources: courseResources.length,
      storageBackedResources: courseResources.filter((resource) => resource.storage_bucket && resource.storage_path).length,
    }
  })

const resourceWarnings = resources
  .filter((resource) => !resource.storage_path && !resource.external_url && !resource.resource_url)
  .map((resource) => ({
    title: resource.title,
    courseId: resource.course_id,
    reason: 'Resource has no storage path or URL.',
  }))

const emptyLessons = lessons
  .filter((lesson) => !lesson.video_url && !lesson.material_url && !lesson.reading_external_url && !lesson.rich_content && !lesson.article_content && !lesson.content)
  .map((lesson) => ({
    title: lesson.title,
    courseId: lesson.course_id,
  }))

const rollbackLines = [
  `-- Rollback for LearnPress content repair ${stamp}`,
  `-- Batch: ${batch}`,
  '-- Run only if you need to restore the lesson fields changed by this repair.',
  ...repairs.map((repair) => rollbackSql('course_lessons', repair.lessonId, repair.oldValues)),
  '',
]
fs.writeFileSync(rollbackPath, rollbackLines.join('\n'), 'utf8')

const lines = [
  '# LearnPress Content Repair Report',
  '',
  `Batch: ${batch}`,
  `Generated: ${new Date().toISOString()}`,
  `Mode: ${apply ? 'APPLIED' : 'DRY RUN'}`,
  '',
  '## Repair Summary',
  '',
  `- Lessons repaired: ${repairs.length}`,
  `- YouTube shortcodes converted to lesson videos: ${repairs.filter((repair) => repair.type === 'video_shortcode').length}`,
  `- H5P shortcodes marked as imported interactive activities: ${repairs.filter((repair) => repair.type === 'h5p_shortcode').length}`,
  `- Skipped plan items: ${skipped.length}`,
  `- Warnings: ${warnings.length + resourceWarnings.length}`,
  '',
  '## Imported Course Records',
  '',
  '| Course | Slug | Status | Modules | Lessons | Lessons With Content | Quizzes | Questions | Resources | Storage Assets |',
  '|---|---|---|---:|---:|---:|---:|---:|---:|---:|',
  ...courseSummaries.map((course) => `| ${course.title} | ${course.slug} | ${course.published ? 'published' : course.status} | ${course.modules} | ${course.lessons} | ${course.lessonsWithContent} | ${course.quizzes} | ${course.questions} | ${course.resources} | ${course.storageBackedResources} |`),
  '',
  '## Repaired Lessons',
  '',
  repairs.length
    ? repairs.map((repair) => `- ${repair.course}: ${repair.lesson} (${repair.type})`).join('\n')
    : '- None',
  '',
  '## Remaining Empty Lessons',
  '',
  emptyLessons.length
    ? emptyLessons.map((lesson) => `- ${lesson.title} (${lesson.courseId})`).join('\n')
    : '- None',
  '',
  '## Warnings',
  '',
  [...warnings, ...resourceWarnings].length
    ? [...warnings, ...resourceWarnings].map((item) => `- ${item.course ?? item.title ?? item.courseId}: ${item.item ? `${item.item} - ` : ''}${item.reason}`).join('\n')
    : '- None',
  '',
  '## Files',
  '',
  `- Import plan: ${planPath}`,
  `- Rollback SQL: ${rollbackPath}`,
  `- Report: ${reportPath}`,
  '',
]
fs.writeFileSync(reportPath, lines.join('\n'), 'utf8')

console.log(JSON.stringify({
  mode: apply ? 'applied' : 'dry-run',
  batch,
  courses: courseSummaries.length,
  repairs: repairs.length,
  videoRepairs: repairs.filter((repair) => repair.type === 'video_shortcode').length,
  h5pRepairs: repairs.filter((repair) => repair.type === 'h5p_shortcode').length,
  emptyLessons: emptyLessons.length,
  warnings: warnings.length + resourceWarnings.length,
  rollbackPath,
  reportPath,
}, null, 2))
