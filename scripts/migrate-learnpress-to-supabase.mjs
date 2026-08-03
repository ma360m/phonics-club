import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const PREFIX = 'SERVMASK_PREFIX_'
const HEADER_BYTES = 4377
const root = process.cwd()
const analysisDir = path.join(root, 'tmp', 'wpress-analysis')
const sqlPath = process.env.WPRESS_SQL_PATH || path.join(analysisDir, 'database.sql')
const indexPath = process.env.WPRESS_INDEX_PATH || path.join(analysisDir, 'wpress-index.json')
const backupPath = process.env.WPRESS_BACKUP_PATH || 'C:/Users/DELL/Downloads/www-phonicsclub-com-20260801.wpress'
const apply = process.argv.includes('--apply')
const skipAssets = process.argv.includes('--skip-assets')
const batch = process.env.LEARNPRESS_MIGRATION_BATCH || `learnpress-${new Date().toISOString().replace(/[:.]/g, '-')}`
const planPath = path.join(analysisDir, `learnpress-import-plan-${batch}.json`)
const rollbackPath = path.join(analysisDir, `rollback-${batch}.sql`)
const reportPath = path.join(analysisDir, `final-migration-report-${batch}.md`)

function loadEnvLocal() {
  const envPath = path.join(root, '.env.local')
  if (!fs.existsSync(envPath)) return
  const raw = fs.readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, value] = match
    if (!process.env[key]) process.env[key] = value.replace(/^['"]|['"]$/g, '')
  }
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function slugify(value, fallback = 'course') {
  const slug = String(value || fallback)
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\[\/?vc_[^\]]*]/gi, '')
    .replace(/\[\/?et_pb_[^\]]*]/gi, '')
    .trim()
}

function htmlToText(value) {
  return decodeHtml(
    cleanText(value)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function parseCreateColumns(sql, table) {
  const tick = '`'
  const marker = `CREATE TABLE ${tick}${PREFIX}${table}${tick}`
  const start = sql.indexOf(marker)
  if (start < 0) return []
  const end = sql.indexOf('ENGINE=', start)
  const block = sql.slice(start, end)
  return block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith(tick))
    .map((line) => line.slice(1, line.indexOf(tick, 1)))
}

function parseValue(body, state) {
  let i = state.i
  while (/\s/.test(body[i] ?? '')) i += 1
  if (body[i] === "'") {
    i += 1
    let out = ''
    while (i < body.length) {
      const ch = body[i]
      if (ch === "\\") {
        const next = body[i + 1]
        if (next === 'n') out += '\n'
        else if (next === 'r') out += '\r'
        else if (next === 't') out += '\t'
        else if (next === '0') out += '\0'
        else if (next === 'Z') out += '\u001a'
        else out += next ?? ''
        i += 2
        continue
      }
      if (ch === "'") {
        i += 1
        break
      }
      out += ch
      i += 1
    }
    state.i = i
    return out
  }

  const start = i
  while (i < body.length && body[i] !== ',' && body[i] !== ')') i += 1
  const raw = body.slice(start, i).trim()
  state.i = i
  if (/^null$/i.test(raw)) return null
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw)
  return raw
}

function parseTuples(body, columns, onRow) {
  const state = { i: 0 }
  while (state.i < body.length) {
    while (state.i < body.length && body[state.i] !== '(') state.i += 1
    if (state.i >= body.length) break
    state.i += 1
    const values = []
    while (state.i < body.length) {
      values.push(parseValue(body, state))
      while (/\s/.test(body[state.i] ?? '')) state.i += 1
      if (body[state.i] === ',') {
        state.i += 1
        continue
      }
      if (body[state.i] === ')') {
        state.i += 1
        break
      }
    }
    const row = {}
    columns.forEach((column, index) => {
      row[column] = values[index]
    })
    onRow(row)
  }
}

function readTable(sql, table, onRow) {
  const columns = parseCreateColumns(sql, table)
  const tick = '`'
  const marker = `INSERT INTO ${tick}${PREFIX}${table}${tick} VALUES `
  let cursor = 0
  let count = 0
  while (true) {
    const start = sql.indexOf(marker, cursor)
    if (start < 0) break
    const bodyStart = start + marker.length
    let end = sql.indexOf(';\n', bodyStart)
    if (end < 0) end = sql.indexOf(';\r\n', bodyStart)
    if (end < 0) end = sql.indexOf(';', bodyStart)
    if (end < 0) throw new Error(`Could not find end of INSERT for ${table}`)
    parseTuples(sql.slice(bodyStart, end), columns, (row) => {
      count += 1
      onRow(row)
    })
    cursor = end + 1
  }
  return count
}

function asMetaMap(postmetaRows) {
  const map = new Map()
  for (const row of postmetaRows) {
    const postId = Number(row.post_id)
    if (!map.has(postId)) map.set(postId, new Map())
    const values = map.get(postId)
    const key = String(row.meta_key ?? '')
    if (!values.has(key)) values.set(key, [])
    values.get(key).push(row.meta_value)
  }
  return map
}

function metaOne(meta, postId, ...keys) {
  const values = meta.get(Number(postId))
  if (!values) return null
  for (const key of keys) {
    const item = values.get(key)?.find((value) => value !== null && value !== '')
    if (item !== undefined) return item
  }
  return null
}

function numberMeta(meta, postId, ...keys) {
  const value = metaOne(meta, postId, ...keys)
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function boolMeta(meta, postId, ...keys) {
  const value = String(metaOne(meta, postId, ...keys) ?? '').toLowerCase()
  return ['yes', 'true', '1', 'on'].includes(value)
}

function normalizeUploadPath(value) {
  if (!value) return null
  let raw = String(value).trim().replace(/\\/g, '/')
  try {
    raw = decodeURIComponent(raw)
  } catch {
    // Keep the raw path if WordPress stored malformed encoding.
  }
  const uploadMatch = raw.match(/(?:wp-content\/)?uploads\/(.+)$/i)
  if (uploadMatch) raw = uploadMatch[1]
  raw = raw.replace(/^\/+/, '')
  if (!/\.[a-z0-9]{2,8}$/i.test(raw)) return null
  return `uploads/${raw.replace(/^uploads\//i, '')}`
}

function findUploadRefs(...values) {
  const refs = new Set()
  const patterns = [
    /(?:https?:\/\/[^"'\s<>]+)?\/wp-content\/uploads\/([^"'<>\s?#)]+)/gi,
    /(?:https?:\/\/[^"'\s<>]+)?\/uploads\/(\d{4}\/\d{2}\/[^"'<>\s?#)]+)/gi,
    /\buploads\/(\d{4}\/\d{2}\/[^"'<>\s?#)]+)/gi,
  ]
  for (const value of values) {
    const text = String(value ?? '')
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(text))) {
        const normalized = normalizeUploadPath(match[1])
        if (normalized) refs.add(normalized)
      }
    }
  }
  return [...refs]
}

function fileType(uploadPath) {
  const ext = path.extname(uploadPath).slice(1).toLowerCase()
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return 'image'
  if (['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'video'
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'worksheet'
  if (['ppt', 'pptx'].includes(ext)) return 'presentation'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet'
  if (['zip', 'rar'].includes(ext)) return 'archive'
  return 'file'
}

function mimeFor(uploadPath) {
  const ext = path.extname(uploadPath).slice(1).toLowerCase()
  return {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'application/zip',
    mp4: 'video/mp4',
    webm: 'video/webm',
  }[ext] || 'application/octet-stream'
}

function bucketFor(uploadPath, ownerType) {
  const type = fileType(uploadPath)
  if (ownerType === 'thumbnail' || type === 'image') return 'course-media'
  if (type === 'video') return 'course-videos'
  return 'course-resources'
}

function safeObjectName(filename) {
  return String(filename || 'asset.bin')
    .replace(/[/\\]/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}

function extractCachedSections(cached) {
  const candidates = []

  function asArray(value) {
    if (Array.isArray(value)) return value
    if (value && typeof value === 'object') return Object.values(value)
    return []
  }

  function normalizeSection(raw, index) {
    if (!raw || typeof raw !== 'object') return null
    const itemsRaw =
      raw.items ??
      raw.section_items ??
      raw.sections_items ??
      raw.children ??
      raw.lessons ??
      raw.curriculum_items ??
      []
    const items = asArray(itemsRaw)
      .map((item, itemIndex) => {
        if (typeof item === 'number' || typeof item === 'string') {
          return { oldId: Number(item), type: null, order: itemIndex + 1 }
        }
        if (!item || typeof item !== 'object') return null
        const oldId = Number(item.item_id ?? item.ID ?? item.id ?? item.post_id ?? item.object_id)
        if (!oldId) return null
        return {
          oldId,
          type: item.item_type ?? item.type ?? item.post_type ?? null,
          order: Number(item.item_order ?? item.order ?? item.menu_order ?? itemIndex + 1),
        }
      })
      .filter(Boolean)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    if (!items.length) return null
    return {
      oldId: Number(raw.section_id ?? raw.ID ?? raw.id ?? index + 1),
      title: String(raw.section_name ?? raw.title ?? raw.name ?? `Module ${index + 1}`).trim() || `Module ${index + 1}`,
      description: cleanText(raw.section_description ?? raw.description ?? ''),
      order: Number(raw.section_order ?? raw.order ?? index + 1),
      items,
    }
  }

  function collect(node) {
    if (!node || typeof node !== 'object') return
    for (const key of ['sections_items', 'sections', 'curriculum', 'items_sections']) {
      if (node[key]) {
        const sections = asArray(node[key]).map(normalizeSection).filter(Boolean)
        if (sections.length) candidates.push(sections)
      }
    }
    if (Array.isArray(node)) {
      const sections = node.map(normalizeSection).filter(Boolean)
      if (sections.length) candidates.push(sections)
    }
    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') collect(value)
    }
  }

  collect(cached)
  candidates.sort((a, b) => b.reduce((sum, section) => sum + section.items.length, 0) - a.reduce((sum, section) => sum + section.items.length, 0))
  return candidates[0] ?? []
}

function parseCachedCourseJson(value) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function buildRollbackSql(batchId) {
  return `-- Rollback for LearnPress migration batch ${batchId}
-- Generated before applying database changes.
-- Storage files created under course-media/learnpress/${batchId},
-- course-videos/learnpress/${batchId}, and course-resources/learnpress/${batchId}
-- should be removed from Supabase Storage if this rollback is used.

BEGIN;

DELETE FROM course_resource_downloads
WHERE course_id IN (
  SELECT id FROM courses WHERE metadata->>'migration_batch' = '${batchId}'
);

DELETE FROM quiz_attempts
WHERE course_id IN (
  SELECT id FROM courses WHERE metadata->>'migration_batch' = '${batchId}'
);

DELETE FROM quiz_questions
WHERE quiz_id IN (
  SELECT id FROM course_quizzes WHERE course_id IN (
    SELECT id FROM courses WHERE metadata->>'migration_batch' = '${batchId}'
  )
);

DELETE FROM course_quizzes
WHERE course_id IN (
  SELECT id FROM courses WHERE metadata->>'migration_batch' = '${batchId}'
);

DELETE FROM course_resources
WHERE course_id IN (
  SELECT id FROM courses WHERE metadata->>'migration_batch' = '${batchId}'
);

DELETE FROM lesson_progress
WHERE course_id IN (
  SELECT id FROM courses WHERE metadata->>'migration_batch' = '${batchId}'
);

DELETE FROM course_lessons
WHERE course_id IN (
  SELECT id FROM courses WHERE metadata->>'migration_batch' = '${batchId}'
);

DELETE FROM course_modules
WHERE course_id IN (
  SELECT id FROM courses WHERE metadata->>'migration_batch' = '${batchId}'
);

DELETE FROM courses
WHERE metadata->>'migration_batch' = '${batchId}';

COMMIT;
`
}

function bestTitle(post, fallback) {
  return decodeHtml(String(post?.post_title || fallback || 'Untitled').trim())
}

function moduleCount(modules) {
  return modules.reduce((total, module) => total + module.items.length, 0)
}

function segmentBetween(content, startPattern, endPattern = null) {
  const source = String(content || '')
  const lower = htmlToText(source).toLowerCase()
  const startText = startPattern.toLowerCase()
  const startIndexInText = lower.indexOf(startText)
  if (startIndexInText < 0) return ''
  const rawLower = source.toLowerCase()
  const rawStart = rawLower.indexOf(startText.split(/\s+/)[0])
  const start = rawStart >= 0 ? rawStart : 0
  let end = source.length
  if (endPattern) {
    const rawEnd = rawLower.indexOf(endPattern.toLowerCase().split(/\s+/)[0], start + 1)
    if (rawEnd > start) end = rawEnd
  }
  return source.slice(start, end).trim()
}

function lessonTitleFromContent(content, fallback) {
  const text = htmlToText(content)
  const firstLine = text.split(/\n+/).map((line) => line.trim()).find(Boolean)
  if (!firstLine) return fallback
  return firstLine.slice(0, 90)
}

function syntheticLessonsFromSteps(content, courseId, titlePrefix) {
  const source = cleanText(content)
  const stepMatches = [...source.matchAll(/<strong>\s*(Step\s+\d+)\s*<\/strong>/gi)]
  if (!stepMatches.length) {
    const text = htmlToText(source)
    const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter((part) => part.length > 40)
    return (paragraphs.length ? paragraphs : [text || titlePrefix]).slice(0, 10).map((paragraph, index) => ({
      oldId: -Number(`${courseId}${String(index + 1).padStart(2, '0')}`),
      type: 'lp_lesson',
      title: index === 0 ? `${titlePrefix} Overview` : lessonTitleFromContent(paragraph, `${titlePrefix} Part ${index + 1}`),
      slug: slugify(`${titlePrefix}-${index + 1}`),
      status: 'recovered',
      order: index + 1,
      duration: '20 minute',
      content: paragraph,
      excerpt: paragraph.slice(0, 220),
      assets: [],
      recovered: true,
    }))
  }

  return stepMatches.map((match, index) => {
    const start = match.index ?? 0
    const end = stepMatches[index + 1]?.index ?? source.length
    const block = source.slice(start, end).trim()
    const stepTitle = decodeHtml(match[1])
    return {
      oldId: -Number(`${courseId}${String(index + 1).padStart(2, '0')}`),
      type: 'lp_lesson',
      title: `${stepTitle}: ${titlePrefix}`,
      slug: slugify(`${titlePrefix}-${stepTitle}`),
      status: 'recovered',
      order: index + 1,
      duration: '20 minute',
      content: block,
      excerpt: htmlToText(block).slice(0, 220),
      assets: findUploadRefs(block),
      recovered: true,
    }
  })
}

function addCourseAsset(course, uploadPath, ownerType, oldOwnerId, referencedAssetPaths) {
  if (!uploadPath) return
  if (course.assets.some((asset) => asset.uploadPath === uploadPath && asset.oldOwnerId === oldOwnerId)) return
  course.assets.push({
    uploadPath,
    title: path.basename(uploadPath),
    ownerType,
    oldOwnerId,
  })
  referencedAssetPaths.add(uploadPath)
}

function addRecoveredModule(course, title, description, content, referencedAssetPaths, order = 1) {
  const lessons = syntheticLessonsFromSteps(content, course.oldId, title)
  for (const lesson of lessons) {
    for (const uploadPath of lesson.assets || []) {
      addCourseAsset(course, uploadPath, 'lesson', lesson.oldId, referencedAssetPaths)
    }
  }
  course.modules.push({
    oldId: -Number(`${course.oldId}${String(order).padStart(2, '0')}`),
    title,
    description,
    order,
    recovered: true,
    items: lessons,
  })
}

function recoverLinkedZeroCourseContent(courses, pageBySlug, referencedAssetPaths, cleanStats) {
  const preK = courses.find((course) => course.oldId === 39801)
  const kindergarten1 = courses.find((course) => course.oldId === 39802)
  const kindergarten2 = courses.find((course) => course.oldId === 39803)
  const complete = courses.find((course) => course.oldId === 39807)

  const completeContent = complete?.description || ''
  const k1PageContent = pageBySlug.get('kindergarten-1')?.post_content || ''
  const k2PageContent = pageBySlug.get('kindergarten-2')?.post_content || ''
  const k1Segment = segmentBetween(completeContent, 'Jolly Phonics 1', 'Jolly Phonics 2') || k1PageContent
  const k2Segment = segmentBetween(completeContent, 'Jolly Phonics 2') || k2PageContent

  if (kindergarten1 && kindergarten1.modules.length === 0 && (k1Segment || k1PageContent)) {
    addRecoveredModule(
      kindergarten1,
      'Jolly Phonics 1 (Basics) - Age 4 to 5',
      'Recovered from the old Kindergarten 1 linked page and Complete Course body because LearnPress section links were empty.',
      `${k1Segment}\n${k1PageContent}`,
      referencedAssetPaths,
      1,
    )
    cleanStats.recoveredCourses.push({
      oldId: kindergarten1.oldId,
      title: kindergarten1.title,
      recoveredFrom: 'course body plus /kindergarten-1/ linked page',
      modules: kindergarten1.modules.length,
      items: moduleCount(kindergarten1.modules),
    })
  }

  if (kindergarten2 && kindergarten2.modules.length === 0 && (k2Segment || k2PageContent)) {
    addRecoveredModule(
      kindergarten2,
      'Jolly Phonics 2 (Advanced) - Age 5 to 6',
      'Recovered from the old Kindergarten 2 linked page and Complete Course body because LearnPress section links were empty.',
      `${k2Segment}\n${k2PageContent}`,
      referencedAssetPaths,
      1,
    )
    cleanStats.recoveredCourses.push({
      oldId: kindergarten2.oldId,
      title: kindergarten2.title,
      recoveredFrom: 'course body plus /kindergarten-2/ linked page',
      modules: kindergarten2.modules.length,
      items: moduleCount(kindergarten2.modules),
    })
  }

  if (complete && complete.modules.length === 0) {
    if (preK?.modules.length) {
      complete.modules.push(...preK.modules.map((module, index) => ({
        ...module,
        oldId: -Number(`${complete.oldId}${String(index + 1).padStart(2, '0')}`),
        title: `Year 1 - ${module.title}`,
        order: index + 1,
        items: module.items.map((item) => ({ ...item })),
      })))
      for (const asset of preK.assets) {
        addCourseAsset(complete, asset.uploadPath, asset.ownerType, asset.oldOwnerId, referencedAssetPaths)
      }
    }
    if (k1Segment) {
      addRecoveredModule(
        complete,
        'Year 2 - Jolly Phonics 1 (Basics)',
        'Recovered from the Complete Course body.',
        k1Segment,
        referencedAssetPaths,
        complete.modules.length + 1,
      )
    }
    if (k2Segment) {
      addRecoveredModule(
        complete,
        'Year 3 - Jolly Phonics 2 (Advanced)',
        'Recovered from the Complete Course body.',
        k2Segment,
        referencedAssetPaths,
        complete.modules.length + 1,
      )
    }
    if (complete.modules.length) {
      cleanStats.recoveredCourses.push({
        oldId: complete.oldId,
        title: complete.title,
        recoveredFrom: 'Pre K hierarchy plus Complete Course body',
        modules: complete.modules.length,
        items: moduleCount(complete.modules),
      })
    }
  }
}

function buildPlan(sql) {
  const posts = new Map()
  const attachments = new Map()
  const pageBySlug = new Map()
  const users = new Map()
  const postmetaRows = []
  const sections = []
  const sectionItems = []
  const learnpressCourses = new Map()
  const quizQuestions = []
  const questionAnswers = []
  const terms = new Map()
  const termTaxonomy = new Map()
  const relationships = []

  readTable(sql, 'users', (row) => users.set(Number(row.ID), row))
  readTable(sql, 'posts', (row) => {
    const id = Number(row.ID)
    const type = String(row.post_type ?? '')
    if (type === 'attachment') attachments.set(id, row)
    if (type === 'page') pageBySlug.set(String(row.post_name || ''), row)
    if (['lp_course', 'lp_lesson', 'lp_quiz', 'lp_question', 'attachment'].includes(type)) posts.set(id, row)
  })
  readTable(sql, 'postmeta', (row) => postmetaRows.push(row))
  readTable(sql, 'learnpress_sections', (row) => sections.push(row))
  readTable(sql, 'learnpress_section_items', (row) => sectionItems.push(row))
  readTable(sql, 'learnpress_courses', (row) => learnpressCourses.set(Number(row.ID), row))
  readTable(sql, 'learnpress_quiz_questions', (row) => quizQuestions.push(row))
  readTable(sql, 'learnpress_question_answers', (row) => questionAnswers.push(row))
  readTable(sql, 'terms', (row) => terms.set(Number(row.term_id), row))
  readTable(sql, 'term_taxonomy', (row) => termTaxonomy.set(Number(row.term_taxonomy_id), row))
  readTable(sql, 'term_relationships', (row) => relationships.push(row))

  const meta = asMetaMap(postmetaRows)
  const sectionItemsBySection = new Map()
  for (const item of sectionItems) {
    const sectionId = Number(item.section_id)
    if (!sectionItemsBySection.has(sectionId)) sectionItemsBySection.set(sectionId, [])
    sectionItemsBySection.get(sectionId).push(item)
  }
  const directSectionsByCourse = new Map()
  for (const section of sections) {
    const courseId = Number(section.section_course_id)
    if (!directSectionsByCourse.has(courseId)) directSectionsByCourse.set(courseId, [])
    const items = (sectionItemsBySection.get(Number(section.section_id)) ?? [])
      .map((item) => ({
        oldId: Number(item.item_id),
        type: item.item_type || posts.get(Number(item.item_id))?.post_type || null,
        order: Number(item.item_order ?? 0),
      }))
      .filter((item) => item.oldId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    directSectionsByCourse.get(courseId).push({
      oldId: Number(section.section_id),
      title: decodeHtml(section.section_name || `Module ${section.section_order}`),
      description: cleanText(section.section_description || ''),
      order: Number(section.section_order ?? 0),
      items,
    })
  }

  const quizQuestionIds = new Map()
  for (const row of quizQuestions) {
    const quizId = Number(row.quiz_id)
    if (!quizQuestionIds.has(quizId)) quizQuestionIds.set(quizId, [])
    quizQuestionIds.get(quizId).push({
      oldId: Number(row.question_id),
      order: Number(row.question_order ?? 0),
    })
  }
  for (const items of quizQuestionIds.values()) items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const answersByQuestion = new Map()
  for (const row of questionAnswers) {
    const questionId = Number(row.question_id)
    if (!answersByQuestion.has(questionId)) answersByQuestion.set(questionId, [])
    answersByQuestion.get(questionId).push(row)
  }
  for (const answers of answersByQuestion.values()) answers.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))

  const categoriesByCourse = new Map()
  for (const rel of relationships) {
    const objectId = Number(rel.object_id)
    const tax = termTaxonomy.get(Number(rel.term_taxonomy_id))
    if (!tax || !String(tax.taxonomy || '').includes('course')) continue
    const term = terms.get(Number(tax.term_id))
    if (!term) continue
    if (!categoriesByCourse.has(objectId)) categoriesByCourse.set(objectId, [])
    categoriesByCourse.get(objectId).push({
      taxonomy: tax.taxonomy,
      name: decodeHtml(term.name),
      slug: term.slug,
    })
  }

  const attachmentPathById = new Map()
  for (const [id, attachment] of attachments) {
    const attached = normalizeUploadPath(metaOne(meta, id, '_wp_attached_file'))
    const fallback = normalizeUploadPath(attachment.guid)
    if (attached || fallback) attachmentPathById.set(id, attached || fallback)
  }

  const courses = []
  const cleanStats = {
    duplicateLessonsRemoved: 0,
    emptyLessonsSkipped: 0,
    orphanedRecordsSkipped: 0,
    revisionsAutosavesSkipped: 0,
    unusedMediaExcluded: 0,
    recoveredCourses: [],
  }
  const referencedAssetPaths = new Set()

  const coursePosts = [...posts.values()]
    .filter((post) => post.post_type === 'lp_course' && !['trash', 'auto-draft'].includes(String(post.post_status)))
    .sort((a, b) => Number(a.ID) - Number(b.ID))

  for (const coursePost of coursePosts) {
    const oldCourseId = Number(coursePost.ID)
    const direct = (directSectionsByCourse.get(oldCourseId) ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const cached = extractCachedSections(parseCachedCourseJson(learnpressCourses.get(oldCourseId)?.json))
    const modules = moduleCount(cached) > moduleCount(direct) ? cached : direct
    if (direct.length === 0 && modules.length > 0) {
      cleanStats.recoveredCourses.push({
        oldId: oldCourseId,
        title: bestTitle(coursePost),
        recoveredFrom: 'SERVMASK_PREFIX_learnpress_courses.json.sections_items',
        modules: modules.length,
        items: moduleCount(modules),
      })
    }

    const seenLessonKeys = new Set()
    const normalizedModules = []
    const courseAssets = new Map()
    const oldLessonIdToModuleOrder = new Map()

    for (const [moduleIndex, module] of modules.entries()) {
      const normalizedItems = []
      for (const [itemIndex, item] of module.items.entries()) {
        const post = posts.get(Number(item.oldId))
        if (!post || ['revision', 'auto-draft', 'trash'].includes(String(post.post_status))) {
          cleanStats.orphanedRecordsSkipped += 1
          continue
        }
        if (post.post_type === 'revision') {
          cleanStats.revisionsAutosavesSkipped += 1
          continue
        }
        const title = bestTitle(post, `${post.post_type} ${itemIndex + 1}`)
        const content = cleanText(post.post_content || '')
        const excerpt = cleanText(post.post_excerpt || '')
        const duration = metaOne(meta, post.ID, '_lp_duration', '_lp_lesson_duration', '_lp_meta_duration') || '0 minute'
        const itemType = item.type || post.post_type
        const normalizedItem = {
          oldId: Number(post.ID),
          type: itemType,
          title,
          slug: post.post_name || slugify(title),
          status: post.post_status,
          order: Number(item.order || itemIndex + 1),
          duration,
          content,
          excerpt,
          assets: [],
        }
        const refs = findUploadRefs(content, excerpt, post.guid)
        for (const uploadPath of refs) {
          normalizedItem.assets.push(uploadPath)
          courseAssets.set(uploadPath, {
            uploadPath,
            title: path.basename(uploadPath),
            ownerType: itemType === 'lp_quiz' ? 'quiz' : 'lesson',
            oldOwnerId: Number(post.ID),
          })
          referencedAssetPaths.add(uploadPath)
        }

        if (itemType === 'lp_lesson') {
          const lessonKey = `${slugify(title)}:${htmlToText(content).slice(0, 160)}`
          const hasMaterial = refs.length > 0 || Boolean(metaOne(meta, post.ID, '_lp_material_url', '_lp_video_url'))
          if (!title && !htmlToText(content) && !hasMaterial) {
            cleanStats.emptyLessonsSkipped += 1
            continue
          }
          if (seenLessonKeys.has(lessonKey)) {
            cleanStats.duplicateLessonsRemoved += 1
            continue
          }
          seenLessonKeys.add(lessonKey)
          oldLessonIdToModuleOrder.set(Number(post.ID), moduleIndex + 1)
        }
        normalizedItems.push(normalizedItem)
      }
      if (normalizedItems.length) {
        normalizedModules.push({
          oldId: module.oldId,
          title: decodeHtml(module.title || `Module ${moduleIndex + 1}`),
          description: cleanText(module.description || ''),
          order: Number(module.order || moduleIndex + 1),
          items: normalizedItems.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        })
      }
    }

    const thumbnailId = Number(metaOne(meta, oldCourseId, '_thumbnail_id') || 0)
    const thumbnailPath = attachmentPathById.get(thumbnailId) || normalizeUploadPath(coursePost.guid)
    if (thumbnailPath) {
      courseAssets.set(thumbnailPath, {
        uploadPath: thumbnailPath,
        title: `${bestTitle(coursePost)} thumbnail`,
        ownerType: 'thumbnail',
        oldOwnerId: oldCourseId,
      })
      referencedAssetPaths.add(thumbnailPath)
    }

    const courseRefs = findUploadRefs(coursePost.post_content, coursePost.post_excerpt)
    for (const uploadPath of courseRefs) {
      courseAssets.set(uploadPath, {
        uploadPath,
        title: path.basename(uploadPath),
        ownerType: 'course',
        oldOwnerId: oldCourseId,
      })
      referencedAssetPaths.add(uploadPath)
    }

    const price = numberMeta(meta, oldCourseId, '_lp_price', '_lp_regular_price', '_lp_course_price') ?? Number(learnpressCourses.get(oldCourseId)?.price_to_sort ?? 0)
    const salePrice = numberMeta(meta, oldCourseId, '_lp_sale_price', '_lp_course_sale_price')
    const author = users.get(Number(coursePost.post_author))
    const categories = categoriesByCourse.get(oldCourseId) ?? []
    const categorySlug = categories[0]?.slug === 'student-courses' ? 'children-courses' : categories[0]?.slug || 'teacher-courses'

    courses.push({
      oldId: oldCourseId,
      title: bestTitle(coursePost),
      slug: coursePost.post_name || slugify(coursePost.post_title),
      status: coursePost.post_status,
      author: author
        ? { oldId: Number(author.ID), name: author.display_name || author.user_login, email: author.user_email }
        : { oldId: Number(coursePost.post_author), name: 'Phonics Club', email: null },
      categories,
      category: categorySlug,
      price: Number.isFinite(price) ? price : 0,
      discountedPrice: salePrice,
      isFree: boolMeta(meta, oldCourseId, '_lp_free') || !price,
      duration: metaOne(meta, oldCourseId, '_lp_duration', '_lp_course_duration') || null,
      excerpt: cleanText(coursePost.post_excerpt || ''),
      description: cleanText(coursePost.post_content || ''),
      thumbnailPath,
      modules: normalizedModules,
      quizzes: normalizedModules.flatMap((module) => module.items.filter((item) => item.type === 'lp_quiz')).map((quizItem) => {
        const questions = (quizQuestionIds.get(quizItem.oldId) ?? [])
          .map((questionRef, index) => {
            const questionPost = posts.get(questionRef.oldId)
            if (!questionPost) return null
            const answers = answersByQuestion.get(questionRef.oldId) ?? []
            return {
              oldId: questionRef.oldId,
              title: bestTitle(questionPost, `Question ${index + 1}`),
              question: cleanText(questionPost.post_content || questionPost.post_title || ''),
              type: String(metaOne(meta, questionRef.oldId, '_lp_type', '_question_type') || 'mcq'),
              order: questionRef.order || index + 1,
              options: answers.map((answer) => decodeHtml(answer.title)),
              correctOptions: answers
                .map((answer, optionIndex) => String(answer.is_true).toLowerCase() === 'yes' ? optionIndex : -1)
                .filter((optionIndex) => optionIndex >= 0),
              explanation: cleanText(metaOne(meta, questionRef.oldId, '_lp_explanation', '_lp_hint') || ''),
            }
          })
          .filter(Boolean)
        return {
          oldId: quizItem.oldId,
          title: quizItem.title,
          slug: quizItem.slug,
          content: quizItem.content,
          order: quizItem.order,
          questions,
        }
      }),
      assets: [...courseAssets.values()],
    })
  }

  recoverLinkedZeroCourseContent(courses, pageBySlug, referencedAssetPaths, cleanStats)

  const archiveIndex = readArchiveIndex()
  for (const course of courses) {
    for (const asset of course.assets) {
      const basename = path.basename(asset.uploadPath).toLowerCase()
      const entry = archiveIndex.byName.get(basename)
      asset.foundInArchive = Boolean(entry)
      asset.size = entry?.size ?? null
      asset.bucket = bucketFor(asset.uploadPath, asset.ownerType)
      asset.mimeType = mimeFor(asset.uploadPath)
      asset.storagePath = `learnpress/${batch}/${course.oldId}/${crypto.randomUUID()}-${safeObjectName(path.basename(asset.uploadPath))}`
    }
  }
  cleanStats.unusedMediaExcluded = Math.max(archiveIndex.entries.length - referencedAssetPaths.size, 0)

  return {
    batch,
    generatedAt: new Date().toISOString(),
    apply,
    source: {
      sqlPath,
      backupPath,
      indexPath,
    },
    counts: {
      courses: courses.length,
      modules: courses.reduce((sum, course) => sum + course.modules.length, 0),
      lessons: courses.reduce((sum, course) => sum + course.modules.flatMap((module) => module.items).filter((item) => item.type === 'lp_lesson').length, 0),
      quizzes: courses.reduce((sum, course) => sum + course.quizzes.length, 0),
      questions: courses.reduce((sum, course) => sum + course.quizzes.reduce((inner, quiz) => inner + quiz.questions.length, 0), 0),
      referencedAssets: referencedAssetPaths.size,
      assetsFoundInArchive: courses.flatMap((course) => course.assets).filter((asset) => asset.foundInArchive).length,
    },
    cleanStats,
    courses,
  }
}

function readArchiveIndex() {
  const payload = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
  const entries = payload.entries || []
  const byName = new Map()
  for (const entry of entries) {
    const key = path.basename(entry.name).toLowerCase()
    if (!byName.has(key)) byName.set(key, entry)
  }
  return { entries, byName }
}

function readArchiveAsset(entry) {
  const fd = fs.openSync(backupPath, 'r')
  try {
    const buffer = Buffer.alloc(entry.size)
    fs.readSync(fd, buffer, 0, entry.size, entry.offset + HEADER_BYTES)
    return buffer
  } finally {
    fs.closeSync(fd)
  }
}

function durationMinutes(value) {
  const raw = String(value || '')
  const amount = Number.parseFloat(raw)
  if (!Number.isFinite(amount)) return 0
  const lower = raw.toLowerCase()
  if (lower.includes('hour')) return Math.round(amount * 60)
  if (lower.includes('week')) return Math.round(amount * 7 * 24 * 60)
  return Math.round(amount)
}

function lessonType(item) {
  if (item.type === 'lp_quiz') return 'quiz'
  const refs = item.assets || []
  if (refs.some((ref) => fileType(ref) === 'video')) return 'video'
  if (refs.some((ref) => fileType(ref) === 'pdf')) return 'pdf'
  if (refs.some((ref) => fileType(ref) === 'presentation')) return 'presentation'
  if (refs.some((ref) => ['worksheet', 'spreadsheet', 'archive'].includes(fileType(ref)))) return 'download'
  return 'reading'
}

function readingType(item) {
  if (item.type === 'lp_quiz') return null
  if ((item.assets || []).some((ref) => fileType(ref) === 'pdf')) return 'pdf_viewer'
  if ((item.assets || []).some((ref) => fileType(ref) === 'presentation')) return 'powerpoint_slides'
  return 'rich_article'
}

async function uploadAsset(supabase, archiveIndex, asset) {
  const entry = archiveIndex.byName.get(path.basename(asset.uploadPath).toLowerCase())
  if (!entry) return { skipped: true, reason: 'missing_from_archive' }
  if (skipAssets) return { skipped: true, reason: 'asset_upload_skipped' }
  const buffer = readArchiveAsset(entry)
  const upload = await supabase.upload(asset.bucket, asset.storagePath, buffer, asset.mimeType)
  if (!upload.ok) return { skipped: true, reason: upload.error }
  const publicUrl = asset.bucket === 'course-media'
    ? supabase.publicUrl(asset.bucket, asset.storagePath)
    : null
  return { skipped: false, publicUrl }
}

function relinkContent(content, uploadedAssets) {
  let output = cleanText(content)
  for (const asset of uploadedAssets) {
    if (!asset.publicUrl) continue
    const escaped = asset.uploadPath.replace(/^uploads\//, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    output = output.replace(new RegExp(`(?:https?:\\/\\/[^"'\\s<>]+)?(?:\\/wp-content)?\\/uploads\\/${escaped}`, 'gi'), asset.publicUrl)
    output = output.replace(new RegExp(`uploads\\/${escaped}`, 'gi'), asset.publicUrl)
  }
  return output
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlParagraphs(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<p>${escapeHtml(item).replace(/\n/g, '<br />')}</p>`)
    .join('\n')
}

function extractEmbedUrl(value) {
  const match = String(value ?? '').match(/\[embedyt\]\s*(https?:\/\/[^\[]+?)\s*\[\/embedyt\]/i)
  return match?.[1]?.trim() || null
}

function extractH5pIds(value) {
  return [...String(value ?? '').matchAll(/\[h5p\s+id=["']?(\d+)["']?\]/gi)].map((match) => match[1])
}

function normalizeLessonContent(content) {
  const embedUrl = extractEmbedUrl(content)
  if (embedUrl) {
    const intro = htmlParagraphs(String(content).replace(/\[embedyt\]\s*https?:\/\/[^\[]+?\s*\[\/embedyt\]/gi, '').trim())
    return [
      intro,
      '<p><strong>Imported video lesson</strong></p>',
      `<p><a href="${escapeHtml(embedUrl)}" target="_blank" rel="noopener noreferrer">Open the original YouTube lesson</a></p>`,
    ].filter(Boolean).join('\n')
  }

  const h5pIds = extractH5pIds(content)
  if (!h5pIds.length) return content

  const intro = htmlParagraphs(String(content).replace(/\[h5p\s+id=["']?\d+["']?\]/gi, '').trim())
  const activities = h5pIds.map((id) => [
    `<section data-imported-h5p-id="${escapeHtml(id)}">`,
    '<h3>Imported interactive WordPress activity</h3>',
    `<p>The original H5P activity #${escapeHtml(id)} was found in the WordPress backup and is preserved as source material. Replace this lesson with a native LMS activity, quiz, or uploaded resource before publishing it to students if you need the original interaction exactly.</p>`,
    '</section>',
  ].join('\n'))
  return [intro, ...activities].filter(Boolean).join('\n')
}

function createSupabaseHttpClient(baseUrl, serviceRole) {
  const apiBase = baseUrl.replace(/\/$/, '')
  const headers = {
    apikey: serviceRole,
    Authorization: `Bearer ${serviceRole}`,
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    })
    const text = await response.text()
    if (!response.ok) {
      throw new Error(text || `${response.status} ${response.statusText}`)
    }
    return text ? JSON.parse(text) : null
  }

  function storageObjectUrl(bucket, objectPath, publicRead = false) {
    const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/')
    const prefix = publicRead ? 'object/public' : 'object'
    return `${apiBase}/storage/v1/${prefix}/${bucket}/${encodedPath}`
  }

  return {
    async select(table, select) {
      const data = await requestJson(`${apiBase}/rest/v1/${table}?select=${select}`)
      return data || []
    },
    async insert(table, row, select = 'id') {
      const data = await requestJson(`${apiBase}/rest/v1/${table}?select=${select}`, {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(row),
      })
      return Array.isArray(data) ? data[0] : data
    },
    async upload(bucket, objectPath, buffer, contentType) {
      const response = await fetch(storageObjectUrl(bucket, objectPath), {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': contentType || 'application/octet-stream',
          'x-upsert': 'false',
        },
        body: buffer,
      })
      if (!response.ok) {
        return { ok: false, error: await response.text() }
      }
      return { ok: true }
    },
    publicUrl(bucket, objectPath) {
      return storageObjectUrl(bucket, objectPath, true)
    },
  }
}

async function importPlan(plan) {
  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) throw new Error('Supabase URL or service role key is missing.')
  const supabase = createSupabaseHttpClient(url, serviceRole)
  const archiveIndex = readArchiveIndex()
  const existingCourses = await supabase.select('courses', 'id,slug,metadata')
  const usedSlugs = new Set((existingCourses || []).map((course) => course.slug))
  const existingByOldId = new Map()
  for (const course of existingCourses || []) {
    const oldId = Number(course.metadata?.old_wordpress_id)
    if (course.metadata?.source === 'learnpress' && oldId) existingByOldId.set(oldId, course)
  }

  const imported = []
  const skipped = []
  const warnings = []
  const uploadedAssets = []

  for (const oldCourse of plan.courses) {
    if (existingByOldId.has(oldCourse.oldId)) {
      skipped.push({ type: 'course', oldId: oldCourse.oldId, title: oldCourse.title, reason: 'already_imported' })
      continue
    }

    let slug = slugify(oldCourse.slug || oldCourse.title)
    if (usedSlugs.has(slug)) slug = `learnpress-${slug}`
    let candidate = slug
    let suffix = 2
    while (usedSlugs.has(candidate)) {
      candidate = `${slug}-${suffix}`
      suffix += 1
    }
    slug = candidate
    usedSlugs.add(slug)

    const uploadedForCourse = []
    for (const asset of oldCourse.assets) {
      const result = await uploadAsset(supabase, archiveIndex, asset)
      if (result.skipped) {
        warnings.push({ type: 'asset', oldCourseId: oldCourse.oldId, path: asset.uploadPath, reason: result.reason })
        continue
      }
      uploadedForCourse.push({ ...asset, publicUrl: result.publicUrl })
      uploadedAssets.push({ ...asset, publicUrl: result.publicUrl })
    }

    const thumbnailAsset = uploadedForCourse.find((asset) => asset.ownerType === 'thumbnail')
    const richDescription = relinkContent(oldCourse.description, uploadedForCourse)
    const descriptionText = htmlToText(richDescription).slice(0, 2000)
    let insertedCourse
    try {
      insertedCourse = await supabase.insert('courses', {
        title: oldCourse.title,
        slug,
        subtitle: oldCourse.excerpt || null,
        description: descriptionText || oldCourse.excerpt || null,
        rich_description: richDescription || null,
        excerpt: oldCourse.excerpt || descriptionText.slice(0, 220) || null,
        price: Number(oldCourse.price || 0),
        discounted_price: oldCourse.discountedPrice,
        currency: 'PKR',
        category: oldCourse.category,
        level: 'all-levels',
        language: 'English',
        duration: oldCourse.duration,
        instructor: oldCourse.author.name,
        instructor_bio: oldCourse.author.email ? `Imported from WordPress instructor account ${oldCourse.author.email}.` : null,
        image_url: thumbnailAsset?.publicUrl ?? null,
        thumbnail_url: thumbnailAsset?.publicUrl ?? null,
        banner_url: thumbnailAsset?.publicUrl ?? null,
        objectives: [
          'Follow a clear module-by-module learning path.',
          'Use downloadable teaching material and practice resources.',
          'Complete quizzes and progress checks inside the LMS.',
        ],
        requirements: [
          'Stable internet connection.',
          'Notebook or printed worksheets for practice.',
          'Course resources downloaded from the Course Resources section.',
        ],
        seo_title: `${oldCourse.title} | Phonics Club LMS`,
        seo_description: descriptionText.slice(0, 155) || `Learn ${oldCourse.title} with Phonics Club.`,
        featured: false,
        published: false,
        visibility_status: 'draft',
        unlisted: true,
        archived: false,
        is_free: Number(oldCourse.price || 0) <= 0,
        certificate_enabled: true,
        access_duration_days: 180,
        completion_requires_lessons: true,
        completion_requires_quiz: oldCourse.quizzes.length > 0,
        metadata: {
          source: 'learnpress',
          migration_batch: plan.batch,
          old_wordpress_id: oldCourse.oldId,
          old_slug: oldCourse.slug,
          old_status: oldCourse.status,
          old_categories: oldCourse.categories,
          import_notes: 'Imported as draft and hidden for admin review.',
        },
      }, 'id,slug')
    } catch (error) {
      warnings.push({ type: 'course', oldCourseId: oldCourse.oldId, title: oldCourse.title, reason: error.message })
      continue
    }

    const lessonIdByOldId = new Map()
    const importedCourse = {
      oldId: oldCourse.oldId,
      id: insertedCourse.id,
      title: oldCourse.title,
      slug: insertedCourse.slug,
      modules: 0,
      lessons: 0,
      quizzes: 0,
      questions: 0,
      resources: 0,
    }

    for (const [moduleIndex, module] of oldCourse.modules.entries()) {
      let insertedModule
      try {
        insertedModule = await supabase.insert('course_modules', {
          course_id: insertedCourse.id,
          title: module.title || `Module ${moduleIndex + 1}`,
          description: htmlToText(module.description) || null,
          sort_order: moduleIndex + 1,
          transition_style: 'fade',
          unlock_animation: 'progress-ring',
        }, 'id')
      } catch (error) {
        warnings.push({ type: 'module', oldCourseId: oldCourse.oldId, title: module.title, reason: error.message })
        continue
      }
      importedCourse.modules += 1

      let lessonOrder = 1
      for (const item of module.items) {
        const type = lessonType(item)
        const itemAssets = uploadedForCourse.filter((asset) => asset.oldOwnerId === item.oldId)
        const rawContent = relinkContent(item.content || item.excerpt || '', itemAssets)
        const embedVideoUrl = extractEmbedUrl(rawContent)
        const h5pIds = extractH5pIds(rawContent)
        const content = normalizeLessonContent(rawContent)
        const importedLessonType = embedVideoUrl ? 'video' : h5pIds.length ? 'interactive' : type
        const firstPublicAsset = itemAssets.find((asset) => asset.publicUrl)
        let insertedLesson
        try {
          insertedLesson = await supabase.insert('course_lessons', {
            course_id: insertedCourse.id,
            module_id: insertedModule.id,
            title: item.title,
            description: item.excerpt || htmlToText(content).slice(0, 220) || null,
            rich_content: content || null,
            article_content: content || null,
            content: content || null,
            lesson_type: importedLessonType,
            reading_type: h5pIds.length ? 'interactive_presentation' : readingType(item),
            reading_external_url: firstPublicAsset?.publicUrl ?? null,
            material_url: firstPublicAsset?.publicUrl ?? null,
            video_url: embedVideoUrl,
            activity_data: h5pIds.length
              ? {
                  source: 'wordpress_h5p',
                  h5pIds,
                  originalShortcode: rawContent,
                  migrationBatch: plan.batch,
                }
              : {},
            duration_minutes: durationMinutes(item.duration),
            sort_order: lessonOrder,
            is_preview: moduleIndex === 0 && lessonOrder === 1,
            is_compulsory: true,
            sequentially_locked: true,
            manual_completion_allowed: true,
            completion_mode: 'manual',
            required_completion_percentage: 80,
            downloadable: true,
            published: false,
            bookmark_enabled: true,
            highlight_enabled: true,
            search_enabled: true,
            zoom_enabled: true,
            fullscreen_enabled: true,
            dark_mode_enabled: true,
            download_enabled: true,
            completion_animation: 'progress-ring',
            confetti_enabled: true,
          }, 'id')
        } catch (error) {
          warnings.push({ type: 'lesson', oldCourseId: oldCourse.oldId, oldId: item.oldId, title: item.title, reason: error.message })
          continue
        }
        lessonOrder += 1
        importedCourse.lessons += 1
        lessonIdByOldId.set(item.oldId, insertedLesson.id)

        for (const asset of itemAssets) {
          try {
            await supabase.insert('course_resources', {
              course_id: insertedCourse.id,
              module_id: insertedModule.id,
              lesson_id: insertedLesson.id,
              title: asset.title || path.basename(asset.uploadPath),
              description: `Imported from LearnPress lesson: ${item.title}`,
              resource_type: fileType(asset.uploadPath),
              scope: 'lesson',
              resource_url: asset.publicUrl,
              external_url: asset.publicUrl,
              storage_bucket: asset.bucket,
              storage_path: asset.storagePath,
              original_filename: path.basename(asset.uploadPath),
              mime_type: asset.mimeType,
              file_size_bytes: asset.size,
              visibility: 'enrolled',
              is_downloadable: true,
              is_view_only: fileType(asset.uploadPath) === 'image',
              is_compulsory: false,
              sort_order: importedCourse.resources + 1,
            }, 'id')
            importedCourse.resources += 1
          } catch (error) {
            warnings.push({ type: 'resource', oldCourseId: oldCourse.oldId, path: asset.uploadPath, reason: error.message })
          }
        }
      }
    }

    for (const quiz of oldCourse.quizzes) {
      const lessonId = lessonIdByOldId.get(quiz.oldId) ?? null
      let insertedQuiz
      try {
        insertedQuiz = await supabase.insert('course_quizzes', {
          course_id: insertedCourse.id,
          lesson_id: lessonId,
          title: quiz.title,
          description: htmlToText(quiz.content) || null,
          passing_score: 70,
          max_attempts: 3,
          randomize_questions: false,
          randomize_options: false,
          show_explanations: true,
          allow_review: true,
          published: false,
          sort_order: quiz.order || importedCourse.quizzes + 1,
        }, 'id')
      } catch (error) {
        warnings.push({ type: 'quiz', oldCourseId: oldCourse.oldId, oldId: quiz.oldId, title: quiz.title, reason: error.message })
        continue
      }
      importedCourse.quizzes += 1

      for (const [questionIndex, question] of quiz.questions.entries()) {
        const correctOptions = question.correctOptions?.length ? question.correctOptions : [0]
        try {
          await supabase.insert('quiz_questions', {
            quiz_id: insertedQuiz.id,
            question: question.question || question.title,
            question_type: question.type === 'true_or_false' ? 'true_false' : 'mcq',
            options: question.options.length ? question.options : ['Yes', 'No'],
            correct_option: correctOptions[0] ?? 0,
            correct_options: correctOptions,
            acceptable_answers: [],
            explanation: question.explanation || null,
            points: 1,
            difficulty: 'standard',
            sort_order: questionIndex + 1,
          }, 'id')
          importedCourse.questions += 1
        } catch (error) {
          warnings.push({ type: 'question', oldCourseId: oldCourse.oldId, oldId: question.oldId, reason: error.message })
        }
      }
    }

    for (const asset of uploadedForCourse.filter((item) => ['course', 'thumbnail'].includes(item.ownerType))) {
      if (asset.ownerType === 'thumbnail') continue
      try {
        await supabase.insert('course_resources', {
          course_id: insertedCourse.id,
          title: asset.title || path.basename(asset.uploadPath),
          description: 'Imported from LearnPress course-level material.',
          resource_type: fileType(asset.uploadPath),
          scope: 'course',
          resource_url: asset.publicUrl,
          external_url: asset.publicUrl,
          storage_bucket: asset.bucket,
          storage_path: asset.storagePath,
          original_filename: path.basename(asset.uploadPath),
          mime_type: asset.mimeType,
          file_size_bytes: asset.size,
          visibility: 'enrolled',
          is_downloadable: true,
          is_view_only: fileType(asset.uploadPath) === 'image',
          is_compulsory: false,
          sort_order: importedCourse.resources + 1,
        }, 'id')
        importedCourse.resources += 1
      } catch (error) {
        warnings.push({ type: 'resource', oldCourseId: oldCourse.oldId, path: asset.uploadPath, reason: error.message })
      }
    }

    imported.push(importedCourse)
  }

  const allCourses = await supabase.select('courses', 'id,title,slug,published,visibility_status,unlisted,metadata')
  const migratedCourses = allCourses.filter((course) => course.metadata?.migration_batch === plan.batch)

  return {
    imported,
    skipped,
    warnings,
    uploadedAssets,
    validation: {
      migratedCourseRows: migratedCourses,
      importedCourseCount: imported.length,
      uploadedAssetCount: uploadedAssets.length,
    },
  }
}

async function validateImportedBatch(batchId) {
  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) throw new Error('Supabase URL or service role key is missing.')
  const supabase = createSupabaseHttpClient(url, serviceRole)
  const [allCourses, allModules, allLessons, allResources, allQuizzes, allQuestions] = await Promise.all([
    supabase.select('courses', 'id,title,slug,published,visibility_status,unlisted,metadata'),
    supabase.select('course_modules', 'id,course_id,title'),
    supabase.select('course_lessons', 'id,course_id,module_id,title'),
    supabase.select('course_resources', 'id,course_id,module_id,lesson_id,title,storage_bucket,storage_path,external_url'),
    supabase.select('course_quizzes', 'id,course_id,lesson_id,title'),
    supabase.select('quiz_questions', 'id,quiz_id'),
  ])

  const courses = allCourses.filter((course) => course.metadata?.migration_batch === batchId)
  const courseIds = new Set(courses.map((course) => course.id))
  const modules = allModules.filter((module) => courseIds.has(module.course_id))
  const lessons = allLessons.filter((lesson) => courseIds.has(lesson.course_id))
  const resources = allResources.filter((resource) => courseIds.has(resource.course_id))
  const quizzes = allQuizzes.filter((quiz) => courseIds.has(quiz.course_id))
  const quizIds = new Set(quizzes.map((quiz) => quiz.id))
  const questions = allQuestions.filter((question) => quizIds.has(question.quiz_id))
  const imported = courses.map((course) => ({
    oldId: course.metadata?.old_wordpress_id,
    id: course.id,
    title: course.title,
    slug: course.slug,
    modules: modules.filter((module) => module.course_id === course.id).length,
    lessons: lessons.filter((lesson) => lesson.course_id === course.id).length,
    quizzes: quizzes.filter((quiz) => quiz.course_id === course.id).length,
    questions: questions.filter((question) => {
      const quiz = quizzes.find((item) => item.id === question.quiz_id)
      return quiz?.course_id === course.id
    }).length,
    resources: resources.filter((resource) => resource.course_id === course.id).length,
  }))

  const warnings = []
  for (const course of courses) {
    if (course.published !== false || course.visibility_status !== 'draft' || course.unlisted !== true) {
      warnings.push({ type: 'course_visibility', title: course.title, reason: 'Course is not draft + hidden.' })
    }
  }
  for (const course of imported) {
    if (course.modules === 0 || course.lessons === 0) {
      warnings.push({ type: 'course_content', title: course.title, reason: 'Course has no modules or lessons after import.' })
    }
  }

  return {
    imported,
    skipped: [],
    warnings,
    uploadedAssets: resources.filter((resource) => resource.storage_bucket && resource.storage_path),
    validation: {
      migratedCourseRows: courses,
      importedCourseCount: courses.length,
      moduleCount: modules.length,
      lessonCount: lessons.length,
      quizCount: quizzes.length,
      questionCount: questions.length,
      resourceCount: resources.length,
      storageAssetCount: resources.filter((resource) => resource.storage_bucket && resource.storage_path).length,
    },
  }
}

function writeReport(plan, result = null, options = {}) {
  const rows = plan.courses.map((course) => {
    const lessonCount = course.modules.flatMap((module) => module.items).filter((item) => item.type === 'lp_lesson').length
    const itemCount = course.modules.reduce((sum, module) => sum + module.items.length, 0)
    const questionCount = course.quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0)
    return `| ${course.oldId} | ${course.title.replace(/\|/g, '/')} | ${course.modules.length} | ${lessonCount} | ${course.quizzes.length} | ${questionCount} | ${course.assets.length} | ${itemCount} |`
  })

  const recovered = plan.cleanStats.recoveredCourses.length
    ? plan.cleanStats.recoveredCourses.map((course) => `- ${course.oldId} ${course.title}: recovered ${course.modules} modules / ${course.items} items from ${course.recoveredFrom}`).join('\n')
    : '- None'

  const imported = result?.imported?.length
    ? result.imported.map((course) => `- ${course.title}: ${course.modules} modules, ${course.lessons} lessons, ${course.quizzes} quizzes, ${course.questions} questions, ${course.resources} resources`).join('\n')
    : apply ? '- No courses imported.' : '- Dry run only. Use --apply to import.'

  const skipped = result?.skipped?.length
    ? result.skipped.map((item) => `- ${item.type} ${item.oldId ?? ''} ${item.title ?? ''}: ${item.reason}`).join('\n')
    : '- None'

  const warnings = result?.warnings?.length
    ? result.warnings.slice(0, 200).map((item) => `- ${item.type}: ${item.title ?? item.path ?? item.oldId ?? ''} - ${item.reason}`).join('\n')
    : '- None'
  const validation = result?.validation
    ? `- Imported courses: ${result.validation.importedCourseCount ?? 0}
- Modules: ${result.validation.moduleCount ?? result.imported?.reduce((sum, course) => sum + course.modules, 0) ?? 0}
- Lessons: ${result.validation.lessonCount ?? result.imported?.reduce((sum, course) => sum + course.lessons, 0) ?? 0}
- Quizzes: ${result.validation.quizCount ?? result.imported?.reduce((sum, course) => sum + course.quizzes, 0) ?? 0}
- Questions: ${result.validation.questionCount ?? result.imported?.reduce((sum, course) => sum + course.questions, 0) ?? 0}
- Course resources: ${result.validation.resourceCount ?? result.imported?.reduce((sum, course) => sum + course.resources, 0) ?? 0}
- Storage-backed assets: ${result.validation.storageAssetCount ?? result.uploadedAssets?.length ?? 0}`
    : '- Not run.'

  return `# LearnPress Migration Final Report

Batch: ${plan.batch}
Generated: ${new Date().toISOString()}
Mode: ${options.mode ?? (apply ? 'APPLY' : 'DRY RUN')}

## Cleanup Summary

- Duplicate lessons removed: ${plan.cleanStats.duplicateLessonsRemoved}
- Empty lessons skipped: ${plan.cleanStats.emptyLessonsSkipped}
- Orphaned records skipped: ${plan.cleanStats.orphanedRecordsSkipped}
- Revisions/autosaves skipped: ${plan.cleanStats.revisionsAutosavesSkipped}
- Unused archive media excluded from the import plan: ${plan.cleanStats.unusedMediaExcluded}

## Recovered Hierarchy

${recovered}

## Import Plan

| Old ID | Course | Modules | Lessons | Quizzes | Questions | Assets | Ordered items |
|---:|---|---:|---:|---:|---:|---:|---:|
${rows.join('\n')}

## Applied Import

${imported}

## Validation Totals

${validation}

## Skipped Items

${skipped}

## Warnings

${warnings}

## Files

- Plan JSON: ${options.planPath ?? planPath}
- Rollback SQL: ${options.rollbackPath ?? rollbackPath}
- Report: ${options.reportPath ?? reportPath}

## Admin Review Notes

- Every imported course is saved as draft, hidden from the public Courses page, and tagged with metadata.migration_batch = ${plan.batch}.
- Downloadable material is imported into Course Resources so students can access worksheets, reading files, presentations, videos, and teacher resources from a dedicated course page section.
- Existing LMS courses are not overwritten; slug collisions are imported with a learnpress- prefix.
`
}

async function main() {
  const validateBatchIndex = process.argv.indexOf('--validate-batch')
  if (validateBatchIndex >= 0) {
    const targetBatch = process.argv[validateBatchIndex + 1]
    if (!targetBatch) throw new Error('Pass a batch id after --validate-batch.')
    const targetPlanPath = path.join(analysisDir, `learnpress-import-plan-${targetBatch}.json`)
    if (!fs.existsSync(targetPlanPath)) throw new Error(`Plan file not found for ${targetBatch}`)
    const plan = JSON.parse(fs.readFileSync(targetPlanPath, 'utf8'))
    const result = await validateImportedBatch(targetBatch)
    const targetReportPath = path.join(analysisDir, `final-migration-report-${targetBatch}.md`)
    fs.writeFileSync(targetReportPath, writeReport(plan, result, {
      mode: 'APPLIED + VALIDATED',
      planPath: targetPlanPath,
      rollbackPath: path.join(analysisDir, `rollback-${targetBatch}.sql`),
      reportPath: targetReportPath,
    }))
    console.log(JSON.stringify({
      batch: targetBatch,
      reportPath: targetReportPath,
      validation: result.validation,
      warnings: result.warnings,
    }, null, 2))
    return
  }

  if (process.argv.includes('--list-imported')) {
    loadEnvLocal()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRole) throw new Error('Supabase URL or service role key is missing.')
    const supabase = createSupabaseHttpClient(url, serviceRole)
    const rows = await supabase.select('courses', 'id,title,slug,published,visibility_status,unlisted,metadata')
    const imported = rows
      .filter((row) => row.metadata?.source === 'learnpress')
      .map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        oldWordPressId: row.metadata?.old_wordpress_id,
        batch: row.metadata?.migration_batch,
        published: row.published,
        visibilityStatus: row.visibility_status,
        unlisted: row.unlisted,
      }))
    console.log(JSON.stringify(imported, null, 2))
    return
  }

  ensureDir(planPath)
  const sql = fs.readFileSync(sqlPath, 'utf8')
  const plan = buildPlan(sql)
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2))
  fs.writeFileSync(rollbackPath, buildRollbackSql(plan.batch))

  let result = null
  if (apply) result = await importPlan(plan)
  fs.writeFileSync(reportPath, writeReport(plan, result))

  console.log(JSON.stringify({
    batch: plan.batch,
    mode: apply ? 'apply' : 'dry-run',
    planPath,
    rollbackPath,
    reportPath,
    counts: plan.counts,
    recoveredCourses: plan.cleanStats.recoveredCourses,
    imported: result?.imported?.length ?? 0,
    warnings: result?.warnings?.length ?? 0,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
