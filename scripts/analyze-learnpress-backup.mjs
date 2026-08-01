import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const repoRoot = process.cwd()
const backupPath = process.argv[2] ?? 'C:/Users/DELL/Downloads/www-phonicsclub-com-20260801.wpress'
const sqlPath = process.argv[3] ?? path.join(repoRoot, 'tmp/wpress-analysis/database.sql')
const outDir = path.join(repoRoot, 'tmp/wpress-analysis')
const archiveIndexPath = path.join(outDir, 'wpress-index.json')
const summaryJsonPath = path.join(outDir, 'learnpress-summary.json')
const summaryMdPath = path.join(outDir, 'migration-summary.md')

const WPressHeaderBytes = 4377
const WPressNameBytes = 255
const WPressSizeStart = 255
const WPressSizeEnd = 269
const LearnPressPostTypes = new Set(['lp_course', 'lp_lesson', 'lp_quiz', 'lp_question'])
const AttachmentExtensions = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'svg',
  'pdf',
  'mp4',
  'm4v',
  'mov',
  'webm',
  'mp3',
  'wav',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'zip',
])

fs.mkdirSync(outDir, { recursive: true })

function cleanSqlIdentifier(name) {
  return name.replace(/^SERVMASK_PREFIX_/, '')
}

function rowObject(columns, values) {
  const row = {}
  columns.forEach((column, index) => {
    row[column] = values[index] ?? null
  })
  return row
}

function unescapeSqlString(value) {
  return value
    .replace(/\\0/g, '\0')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\b/g, '\b')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\Z/g, '\x1a')
    .replace(/\\\\/g, '\\')
}

function parseTupleValues(tuple) {
  const values = []
  let index = 0

  while (index < tuple.length) {
    while (tuple[index] === ' ' || tuple[index] === '\t' || tuple[index] === '\n' || tuple[index] === '\r' || tuple[index] === ',') index += 1
    if (index >= tuple.length) break

    if (tuple[index] === "'") {
      index += 1
      let value = ''
      while (index < tuple.length) {
        const char = tuple[index]
        if (char === '\\') {
          value += char + (tuple[index + 1] ?? '')
          index += 2
          continue
        }
        if (char === "'") {
          index += 1
          break
        }
        value += char
        index += 1
      }
      values.push(unescapeSqlString(value))
      continue
    }

    let value = ''
    while (index < tuple.length && tuple[index] !== ',') {
      value += tuple[index]
      index += 1
    }
    const trimmed = value.trim()
    if (/^null$/i.test(trimmed)) values.push(null)
    else if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) values.push(Number(trimmed))
    else values.push(trimmed)
  }

  return values
}

function parseInsert(line) {
  const match = line.match(/^INSERT INTO `([^`]+)` VALUES\s*(.+);$/)
  if (!match) return null
  const table = cleanSqlIdentifier(match[1])
  const payload = match[2]
  const tuples = []
  let inString = false
  let escaped = false
  let depth = 0
  let start = -1

  for (let i = 0; i < payload.length; i += 1) {
    const char = payload[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === "'") inString = false
      continue
    }
    if (char === "'") {
      inString = true
      continue
    }
    if (char === '(') {
      if (depth === 0) start = i + 1
      depth += 1
      continue
    }
    if (char === ')') {
      depth -= 1
      if (depth === 0 && start >= 0) {
        tuples.push(parseTupleValues(payload.slice(start, i)))
        start = -1
      }
    }
  }

  return { table, tuples }
}

function stripTags(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim()) return value
  }
  return null
}

function metaNumber(meta, keys) {
  for (const key of keys) {
    const raw = meta[key]?.[0]
    if (raw === undefined || raw === null || raw === '') continue
    const value = Number(String(raw).replace(/[^\d.-]/g, ''))
    if (Number.isFinite(value)) return value
  }
  return null
}

function metaString(meta, keys) {
  for (const key of keys) {
    const raw = meta[key]?.[0]
    if (raw !== undefined && raw !== null && String(raw).trim()) return String(raw).trim()
  }
  return null
}

function normalizeAssetPath(value) {
  if (!value) return null
  const raw = String(value).replace(/\\\//g, '/')
  const uploadsMatch = raw.match(/(?:https?:\/\/[^/]+\/)?wp-content\/uploads\/([^'")\s<>]+)/i)
  if (uploadsMatch) return `uploads/${uploadsMatch[1].replace(/^\/+/, '')}`
  if (/^\d{4}\/\d{2}\//.test(raw)) return `uploads/${raw}`
  if (/^uploads\//i.test(raw)) return raw.replace(/^\/+/, '')
  return null
}

function assetType(name) {
  const extension = String(name).split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extension)) return 'image'
  if (['mp4', 'm4v', 'mov', 'webm'].includes(extension)) return 'video'
  if (extension === 'pdf') return 'pdf'
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip'].includes(extension)) return 'download'
  if (['mp3', 'wav'].includes(extension)) return 'audio'
  return 'other'
}

function extractAssetPaths(...sources) {
  const paths = new Set()
  const regex = /(?:https?:\/\/[^/]+\/)?wp-content\/uploads\/[^'")\s<>]+|\b\d{4}\/\d{2}\/[^'")\s<>]+/gi
  for (const source of sources) {
    if (!source) continue
    const text = String(source)
    for (const match of text.matchAll(regex)) {
      const normalized = normalizeAssetPath(match[0])
      if (normalized) paths.add(normalized)
    }
  }
  return [...paths]
}

async function indexWpress() {
  if (!fs.existsSync(backupPath)) return { entries: [], stats: { found: false } }
  const stat = fs.statSync(backupPath)
  const fd = fs.openSync(backupPath, 'r')
  const header = Buffer.alloc(WPressHeaderBytes)
  const entries = []
  const extensionCounts = new Map()
  let offset = 0

  while (offset + WPressHeaderBytes <= stat.size) {
    const bytes = fs.readSync(fd, header, 0, WPressHeaderBytes, offset)
    if (bytes < WPressHeaderBytes) break
    const name = header.subarray(0, WPressNameBytes).toString('utf8').replace(/\0.*$/, '').trim()
    const size = Number.parseInt(header.subarray(WPressSizeStart, WPressSizeEnd).toString('ascii').replace(/\0/g, '').trim(), 10)
    if (!name || !Number.isFinite(size)) break

    const extension = name.split('.').pop()?.toLowerCase() ?? ''
    if (AttachmentExtensions.has(extension) || name === 'database.sql') {
      entries.push({ name, offset, size, extension })
    }
    if (extension) extensionCounts.set(extension, (extensionCounts.get(extension) ?? 0) + 1)
    offset += WPressHeaderBytes + size
  }
  fs.closeSync(fd)

  const index = {
    stats: {
      found: true,
      backupPath,
      totalBytes: stat.size,
      indexedEntries: entries.length,
      extensions: [...extensionCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40),
    },
    entries,
  }
  fs.writeFileSync(archiveIndexPath, JSON.stringify(index, null, 2))
  return index
}

async function readColumns() {
  const tables = new Map()
  const stream = fs.createReadStream(sqlPath, { encoding: 'utf8', highWaterMark: 1024 * 1024 })
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })
  let currentTable = null
  let columns = []

  for await (const line of rl) {
    const createMatch = line.match(/^CREATE TABLE `([^`]+)` \(/)
    if (createMatch) {
      currentTable = cleanSqlIdentifier(createMatch[1])
      columns = []
      continue
    }
    if (currentTable) {
      const columnMatch = line.match(/^\s*`([^`]+)`/)
      if (columnMatch) columns.push(columnMatch[1])
      if (line.startsWith(') ENGINE=')) {
        tables.set(currentTable, columns)
        currentTable = null
        columns = []
      }
    }
  }

  return tables
}

async function parseSql(columnsByTable) {
  const posts = new Map()
  const users = new Map()
  const terms = new Map()
  const taxonomies = new Map()
  const relationships = []
  const sections = []
  const sectionItems = []
  const quizQuestions = []
  const questionAnswers = []
  const questionAnswerMeta = []
  const learnpressCourses = new Map()
  const metaByPost = new Map()
  const postMetaRows = []
  const attachmentPosts = new Map()
  const wantedPostTypes = new Map()

  function addPostMeta(postId, key, value) {
    const id = Number(postId)
    if (!Number.isFinite(id)) return
    let meta = metaByPost.get(id)
    if (!meta) {
      meta = {}
      metaByPost.set(id, meta)
    }
    if (!meta[key]) meta[key] = []
    meta[key].push(value)
  }

  const stream = fs.createReadStream(sqlPath, { encoding: 'utf8', highWaterMark: 1024 * 1024 })
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

  for await (const line of rl) {
    if (!line.startsWith('INSERT INTO `SERVMASK_PREFIX_')) continue
    const parsed = parseInsert(line)
    if (!parsed) continue
    const columns = columnsByTable.get(parsed.table)
    if (!columns) continue

    for (const tuple of parsed.tuples) {
      const row = rowObject(columns, tuple)
      if (parsed.table === 'posts') {
        const postType = row.post_type
        if (LearnPressPostTypes.has(postType)) {
          const id = Number(row.ID)
          posts.set(id, row)
          wantedPostTypes.set(id, postType)
        } else if (postType === 'attachment') {
          const id = Number(row.ID)
          attachmentPosts.set(id, row)
        }
      } else if (parsed.table === 'users') {
        users.set(Number(row.ID), row)
      } else if (parsed.table === 'terms') {
        terms.set(Number(row.term_id), row)
      } else if (parsed.table === 'term_taxonomy') {
        taxonomies.set(Number(row.term_taxonomy_id), row)
      } else if (parsed.table === 'term_relationships') {
        relationships.push(row)
      } else if (parsed.table === 'learnpress_sections') {
        sections.push(row)
      } else if (parsed.table === 'learnpress_section_items') {
        sectionItems.push(row)
      } else if (parsed.table === 'learnpress_quiz_questions') {
        quizQuestions.push(row)
      } else if (parsed.table === 'learnpress_question_answers') {
        questionAnswers.push(row)
      } else if (parsed.table === 'learnpress_question_answermeta') {
        questionAnswerMeta.push(row)
      } else if (parsed.table === 'learnpress_courses') {
        learnpressCourses.set(Number(row.ID ?? row.course_id), row)
      } else if (parsed.table === 'postmeta') {
        postMetaRows.push(row)
      }
    }
  }

  for (const row of postMetaRows) {
    const postId = Number(row.post_id)
    const metaKey = String(row.meta_key ?? '')
    const metaValue = row.meta_value
    if (wantedPostTypes.has(postId)) addPostMeta(postId, metaKey, metaValue)
    if (metaKey === '_thumbnail_id') {
      const attachmentId = Number(metaValue)
      if (Number.isFinite(attachmentId)) addPostMeta(postId, metaKey, metaValue)
    }
  }

  for (const [attachmentId, attachment] of attachmentPosts) {
    const row = postMetaRows.find((meta) => Number(meta.post_id) === attachmentId && meta.meta_key === '_wp_attached_file')
    if (row) addPostMeta(attachmentId, '_wp_attached_file', row.meta_value)
  }

  return {
    posts,
    users,
    terms,
    taxonomies,
    relationships,
    sections,
    sectionItems,
    quizQuestions,
    questionAnswers,
    questionAnswerMeta,
    learnpressCourses,
    metaByPost,
    attachmentPosts,
  }
}

function buildSummary(data, archiveIndex) {
  const {
    posts,
    users,
    terms,
    taxonomies,
    relationships,
    sections,
    sectionItems,
    quizQuestions,
    questionAnswers,
    questionAnswerMeta,
    learnpressCourses,
    metaByPost,
    attachmentPosts,
  } = data

  const archiveByName = new Map(archiveIndex.entries.map((entry) => [entry.name.replace(/^\/+/, ''), entry]))
  const postById = posts
  const courses = [...posts.values()].filter((post) => post.post_type === 'lp_course')
  const lessons = [...posts.values()].filter((post) => post.post_type === 'lp_lesson')
  const quizzes = [...posts.values()].filter((post) => post.post_type === 'lp_quiz')
  const questions = [...posts.values()].filter((post) => post.post_type === 'lp_question')
  const termsByTaxonomyId = new Map(
    [...taxonomies.values()].map((taxonomy) => [Number(taxonomy.term_taxonomy_id), {
      ...taxonomy,
      term: terms.get(Number(taxonomy.term_id)) ?? null,
    }]),
  )
  const relsByObjectId = new Map()
  relationships.forEach((relationship) => {
    const objectId = Number(relationship.object_id)
    if (!relsByObjectId.has(objectId)) relsByObjectId.set(objectId, [])
    relsByObjectId.get(objectId).push(relationship)
  })

  const sectionItemsBySection = new Map()
  sectionItems.forEach((item) => {
    const sectionId = Number(item.section_id)
    if (!sectionItemsBySection.has(sectionId)) sectionItemsBySection.set(sectionId, [])
    sectionItemsBySection.get(sectionId).push(item)
  })

  const sectionsByCourse = new Map()
  sections.forEach((section) => {
    const courseId = Number(section.section_course_id)
    if (!sectionsByCourse.has(courseId)) sectionsByCourse.set(courseId, [])
    sectionsByCourse.get(courseId).push(section)
  })

  const quizQuestionIdsByQuiz = new Map()
  quizQuestions.forEach((row) => {
    const quizId = Number(row.quiz_id)
    if (!quizQuestionIdsByQuiz.has(quizId)) quizQuestionIdsByQuiz.set(quizId, [])
    quizQuestionIdsByQuiz.get(quizId).push(row)
  })

  const answersByQuestion = new Map()
  questionAnswers.forEach((row) => {
    const questionId = Number(row.question_id)
    if (!answersByQuestion.has(questionId)) answersByQuestion.set(questionId, [])
    answersByQuestion.get(questionId).push(row)
  })

  const answerMetaByAnswer = new Map()
  questionAnswerMeta.forEach((row) => {
    const answerId = Number(row.learnpress_question_answer_id)
    if (!answerMetaByAnswer.has(answerId)) answerMetaByAnswer.set(answerId, {})
    const record = answerMetaByAnswer.get(answerId)
    if (!record[row.meta_key]) record[row.meta_key] = []
    record[row.meta_key].push(row.meta_value)
  })

  const assetRefs = new Map()
  function addAsset(source, owner) {
    const normalized = normalizeAssetPath(source)
    if (!normalized) return
    const direct = archiveByName.get(normalized)
    const basename = normalized.split('/').pop()?.toLowerCase() ?? normalized.toLowerCase()
    const byBasename = direct
      ? direct
      : archiveIndex.entries.find((entry) => entry.name.toLowerCase() === basename || entry.name.toLowerCase().endsWith(`/${basename}`))
    const current = assetRefs.get(normalized) ?? {
      path: normalized,
      type: assetType(normalized),
      foundInArchive: Boolean(byBasename),
      size: byBasename?.size ?? null,
      owners: [],
    }
    current.owners.push(owner)
    assetRefs.set(normalized, current)
  }

  const courseSummaries = courses.map((course) => {
    const courseId = Number(course.ID)
    const meta = metaByPost.get(courseId) ?? {}
    const author = users.get(Number(course.post_author))
    const categoryTerms = (relsByObjectId.get(courseId) ?? [])
      .map((rel) => termsByTaxonomyId.get(Number(rel.term_taxonomy_id)))
      .filter(Boolean)
      .filter((taxonomy) => ['course_category', 'course_tag', 'lp_course_category', 'lp_course_tag'].includes(String(taxonomy.taxonomy)))
      .map((taxonomy) => ({
        taxonomy: taxonomy.taxonomy,
        name: taxonomy.term?.name ?? '',
        slug: taxonomy.term?.slug ?? '',
      }))

    const thumbnailId = Number(meta._thumbnail_id?.[0])
    const thumbnailMeta = Number.isFinite(thumbnailId) ? metaByPost.get(thumbnailId) : null
    const thumbnailPost = Number.isFinite(thumbnailId) ? attachmentPosts.get(thumbnailId) : null
    const thumbnailPath = normalizeAssetPath(firstNonEmpty(thumbnailMeta?._wp_attached_file?.[0], thumbnailPost?.guid))

    const courseSections = (sectionsByCourse.get(courseId) ?? [])
      .sort((a, b) => Number(a.section_order ?? 0) - Number(b.section_order ?? 0))
      .map((section) => {
        const items = (sectionItemsBySection.get(Number(section.section_id)) ?? [])
          .sort((a, b) => Number(a.item_order ?? 0) - Number(b.item_order ?? 0))
          .map((item) => {
            const post = postById.get(Number(item.item_id))
            const itemMeta = metaByPost.get(Number(item.item_id)) ?? {}
            extractAssetPaths(post?.post_content, post?.guid, ...Object.values(itemMeta).flat()).forEach((assetPath) => {
              addAsset(assetPath, { type: post?.post_type ?? item.item_type, id: item.item_id, title: post?.post_title ?? item.item_type })
            })
            return {
              oldId: Number(item.item_id),
              type: post?.post_type ?? item.item_type ?? null,
              title: post?.post_title ?? '',
              slug: post?.post_name ?? slugify(post?.post_title),
              status: post?.post_status ?? null,
              order: Number(item.item_order ?? 0),
              duration: metaString(itemMeta, ['_lp_duration', '_duration', 'duration']),
              hasContent: Boolean(stripTags(post?.post_content).length),
            }
          })

        return {
          oldId: Number(section.section_id),
          title: String(section.section_name ?? '').trim() || 'Module',
          description: String(section.section_description ?? '').trim() || null,
          order: Number(section.section_order ?? 0),
          items,
        }
      })

    const courseQuizSummaries = courseSections.flatMap((section) =>
      section.items.filter((item) => item.type === 'lp_quiz').map((quiz) => {
        const rows = (quizQuestionIdsByQuiz.get(Number(quiz.oldId)) ?? []).sort((a, b) => Number(a.question_order ?? 0) - Number(b.question_order ?? 0))
        return {
          oldId: quiz.oldId,
          title: quiz.title,
          questions: rows.map((row) => {
            const question = postById.get(Number(row.question_id))
            const questionMeta = metaByPost.get(Number(row.question_id)) ?? {}
            const answers = (answersByQuestion.get(Number(row.question_id)) ?? []).map((answer) => {
              const answerMeta = answerMetaByAnswer.get(Number(answer.question_answer_id)) ?? {}
              return {
                answerId: Number(answer.question_answer_id),
                text: answer.title ?? answer.answer_title ?? '',
                value: answer.value ?? answer.answer_value ?? null,
                isTrue: String(firstNonEmpty(answer.is_true, answerMeta._lp_answer_correct?.[0], answerMeta.is_true?.[0]) ?? '').match(/^(yes|true|1)$/i) ? true : false,
              }
            })
            return {
              oldId: Number(row.question_id),
              title: question?.post_title ?? '',
              question: stripTags(question?.post_content) || question?.post_title || '',
              type: metaString(questionMeta, ['_lp_type', '_question_type']) ?? 'mcq',
              order: Number(row.question_order ?? 0),
              answers,
            }
          }),
        }
      }),
    )

    const price = metaNumber(meta, ['_lp_price', '_lp_regular_price', '_course_price', '_price'])
    const salePrice = metaNumber(meta, ['_lp_sale_price', '_lp_sale_price_value', '_sale_price'])
    const duration = metaString(meta, ['_lp_duration', '_lp_course_duration', '_duration'])
    const oldLearnPressRow = learnpressCourses.get(courseId) ?? null
    const assetPaths = extractAssetPaths(
      course.post_content,
      course.guid,
      thumbnailPath,
      ...Object.values(meta).flat(),
    )
    assetPaths.forEach((assetPath) => addAsset(assetPath, { type: 'course', id: courseId, title: course.post_title }))
    if (thumbnailPath) addAsset(thumbnailPath, { type: 'course_thumbnail', id: courseId, title: course.post_title })

    return {
      oldId: courseId,
      title: course.post_title,
      slug: course.post_name || slugify(course.post_title),
      status: course.post_status,
      author: author ? { oldId: Number(author.ID), name: author.display_name, email: author.user_email } : null,
      categories: categoryTerms,
      price,
      salePrice,
      isFree: Number(price ?? 0) <= 0 || String(meta._lp_price?.[0] ?? '').toLowerCase() === 'free',
      duration,
      excerpt: stripTags(course.post_excerpt),
      descriptionText: stripTags(course.post_content).slice(0, 800),
      thumbnailPath,
      moduleCount: courseSections.length,
      lessonCount: courseSections.flatMap((section) => section.items).filter((item) => item.type === 'lp_lesson').length,
      quizCount: courseSections.flatMap((section) => section.items).filter((item) => item.type === 'lp_quiz').length,
      questionCount: courseQuizSummaries.reduce((total, quiz) => total + quiz.questions.length, 0),
      modules: courseSections,
      quizzes: courseQuizSummaries,
      metaKeys: Object.keys(meta).sort(),
      learnpressRow: oldLearnPressRow,
    }
  })

  const orphanLessons = lessons.filter((lesson) =>
    !courseSummaries.some((course) => course.modules.some((module) => module.items.some((item) => Number(item.oldId) === Number(lesson.ID)))),
  )
  const orphanQuizzes = quizzes.filter((quiz) =>
    !courseSummaries.some((course) => course.modules.some((module) => module.items.some((item) => Number(item.oldId) === Number(quiz.ID)))),
  )
  const orphanQuestions = questions.filter((question) =>
    !courseSummaries.some((course) => course.quizzes.some((quiz) => quiz.questions.some((item) => Number(item.oldId) === Number(question.ID)))),
  )

  return {
    generatedAt: new Date().toISOString(),
    source: {
      backupPath,
      sqlPath,
      backupBytes: archiveIndex.stats.totalBytes ?? null,
      databaseBytes: fs.existsSync(sqlPath) ? fs.statSync(sqlPath).size : null,
      archiveIndexedEntries: archiveIndex.stats.indexedEntries ?? 0,
    },
    counts: {
      courses: courses.length,
      lessons: lessons.length,
      quizzes: quizzes.length,
      questions: questions.length,
      sections: sections.length,
      sectionItems: sectionItems.length,
      questionAnswers: questionAnswers.length,
      orphanLessons: orphanLessons.length,
      orphanQuizzes: orphanQuizzes.length,
      orphanQuestions: orphanQuestions.length,
      referencedAssets: assetRefs.size,
    },
    courses: courseSummaries,
    referencedAssets: [...assetRefs.values()].sort((a, b) => a.path.localeCompare(b.path)),
    orphanContentPreview: {
      lessons: orphanLessons.slice(0, 20).map((post) => ({ oldId: Number(post.ID), title: post.post_title, status: post.post_status })),
      quizzes: orphanQuizzes.slice(0, 20).map((post) => ({ oldId: Number(post.ID), title: post.post_title, status: post.post_status })),
      questions: orphanQuestions.slice(0, 20).map((post) => ({ oldId: Number(post.ID), title: post.post_title, status: post.post_status })),
    },
  }
}

function renderMarkdown(summary) {
  const lines = []
  lines.push('# LearnPress Migration Summary')
  lines.push('')
  lines.push(`Generated: ${summary.generatedAt}`)
  lines.push('')
  lines.push('## Source')
  lines.push('')
  lines.push(`- Backup: ${summary.source.backupPath}`)
  lines.push(`- Extracted SQL: ${summary.source.sqlPath}`)
  lines.push(`- Database size: ${summary.source.databaseBytes?.toLocaleString()} bytes`)
  lines.push(`- Indexed media/download archive entries: ${summary.source.archiveIndexedEntries.toLocaleString()}`)
  lines.push('')
  lines.push('## Content Found')
  lines.push('')
  lines.push(`- Courses: ${summary.counts.courses}`)
  lines.push(`- Lessons: ${summary.counts.lessons}`)
  lines.push(`- Quizzes: ${summary.counts.quizzes}`)
  lines.push(`- Questions: ${summary.counts.questions}`)
  lines.push(`- LearnPress sections/modules: ${summary.counts.sections}`)
  lines.push(`- LearnPress section items: ${summary.counts.sectionItems}`)
  lines.push(`- Referenced course assets: ${summary.counts.referencedAssets}`)
  lines.push('')
  lines.push('## Course Inventory')
  lines.push('')
  lines.push('| Old ID | Course | Status | Instructor | Price | Modules | Lessons | Quizzes | Questions |')
  lines.push('|---:|---|---|---|---:|---:|---:|---:|---:|')
  for (const course of summary.courses) {
    const price = course.isFree ? 'Free' : String(course.salePrice ?? course.price ?? '')
    lines.push(`| ${course.oldId} | ${course.title.replace(/\|/g, '\\|')} | ${course.status} | ${(course.author?.name ?? '').replace(/\|/g, '\\|')} | ${price} | ${course.moduleCount} | ${course.lessonCount} | ${course.quizCount} | ${course.questionCount} |`)
  }
  lines.push('')
  lines.push('## Supabase Mapping')
  lines.push('')
  lines.push('- `lp_course` posts map to `courses` with `metadata.old_wordpress_id`, `metadata.source = "learnpress"`, `published = false` by default until reviewed.')
  lines.push('- LearnPress sections map to `course_modules` with preserved `sort_order`.')
  lines.push('- Section lesson items map to `course_lessons`; lesson text becomes `article_content` / `rich_content`; video/PDF/download URLs become lesson media or `course_resources`.')
  lines.push('- Section quiz items map to `course_quizzes`; linked LearnPress questions map to `quiz_questions` with options and answer flags.')
  lines.push('- WordPress terms with course taxonomies map to `course_categories` when possible; unknown categories are preserved in `metadata.old_categories` for admin review.')
  lines.push('- Course authors map to text instructor fields first; matching Supabase profiles can later be connected in `course_instructors`.')
  lines.push('- Referenced uploads should be extracted from `.wpress`, reviewed, then uploaded to Supabase Storage before final import.')
  lines.push('')
  lines.push('## Import Guardrails')
  lines.push('')
  lines.push('- Do not overwrite current LMS courses; import with new IDs and skip slugs that already exist unless admin explicitly chooses merge.')
  lines.push('- Import as drafts/unlisted first, then let admin preview and publish.')
  lines.push('- Keep WordPress themes, plugins, Elementor layouts, plugin settings, order/session history, and security logs out of the LMS import.')
  lines.push('')
  lines.push('## Referenced Asset Preview')
  lines.push('')
  const assetPreview = summary.referencedAssets.slice(0, 60)
  if (assetPreview.length === 0) {
    lines.push('- No direct course upload references found yet.')
  } else {
    for (const asset of assetPreview) {
      lines.push(`- ${asset.type}: ${asset.path} (${asset.foundInArchive ? 'found' : 'not found in archive index'})`)
    }
  }
  if (summary.referencedAssets.length > assetPreview.length) {
    lines.push(`- ...and ${summary.referencedAssets.length - assetPreview.length} more assets in learnpress-summary.json`)
  }
  lines.push('')
  lines.push('## Not Imported Yet')
  lines.push('')
  lines.push('This is analysis only. No Supabase rows or storage files were created by this script.')
  lines.push('')
  return lines.join('\n')
}

const archiveIndex = await indexWpress()
const columnsByTable = await readColumns()
const data = await parseSql(columnsByTable)
const summary = buildSummary(data, archiveIndex)
fs.writeFileSync(summaryJsonPath, JSON.stringify(summary, null, 2))
fs.writeFileSync(summaryMdPath, renderMarkdown(summary))

console.log(JSON.stringify({
  summaryJsonPath,
  summaryMdPath,
  counts: summary.counts,
  courses: summary.courses.map((course) => ({
    oldId: course.oldId,
    title: course.title,
    modules: course.moduleCount,
    lessons: course.lessonCount,
    quizzes: course.quizCount,
    questions: course.questionCount,
    price: course.isFree ? 'Free' : course.salePrice ?? course.price,
  })),
}, null, 2))
