import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const PRODUCT_CATEGORIES = new Set([
  'activity-books',
  'pupil-books',
  'workbooks',
  'grammar-workbooks',
  'grammar-pupil-books',
  'teachers-books',
  'comprehension',
  'readers',
  'teacher-resources',
  'kits',
])

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value
  const text = String(value ?? '').trim().toLowerCase()
  return text === 'true' || text === '1' || text === 'yes' || text === 'y'
}

function parseNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback
  const number = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(number) ? number : fallback
}

function parseImages(value) {
  if (!value) return []
  return String(value)
    .split(/[,;|]/)
    .map((item) => item.trim().replace(/^"+|"+$/g, ''))
    .filter(Boolean)
}

function isPlaceholderIsbn(value) {
  const compact = String(value).replace(/[^0-9A-Za-z]/g, '')
  return !compact || /^0+$/.test(compact) || /^97[89]0{10}$/.test(compact)
}

function makeUniqueValue(base, used) {
  let value = base
  let index = 2

  while (used.has(value)) {
    value = `${base}-${index}`
    index += 1
  }

  used.add(value)
  return value
}

function parseCsv(text) {
  const normalized = text.replace(/^\uFEFF/, '')
  const table = []
  let row = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]

    if (ch === '"') {
      if (inQuotes && normalized[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(current.trim())
      current = ''
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      row.push(current.trim())
      current = ''
      if (row.some((cell) => cell.trim())) table.push(row)
      row = []
      if (ch === '\r' && normalized[i + 1] === '\n') i += 1
    } else {
      current += ch
    }
  }

  row.push(current.trim())
  if (row.some((cell) => cell.trim())) table.push(row)
  if (table.length < 2) return []

  const headers = table[0].map((header) =>
    header.replace(/^\uFEFF/, '').toLowerCase().replace(/\s+/g, '_')
  )

  return table.slice(1).map((values) => {
    const record = {}
    headers.forEach((header, index) => {
      record[header] = values[index] ?? ''
    })
    return record
  })
}

function normalizeImportRows(objects) {
  const parsedRows = []

  for (const raw of objects) {
    const isbn = String(raw.isbn ?? raw.ISBN ?? '').trim()
    const name = String(raw.name ?? raw.Name ?? raw.title ?? raw.Title ?? '').trim()
    if (!isbn || !name) continue

    const rawSlug = String(raw.slug ?? raw.Slug ?? '').trim()
    const slug = slugify(rawSlug || name)
    const category = String(raw.category ?? raw.Category ?? 'teacher-resources').trim()
    const compareAtPrice = raw.compare_at_price ?? raw.CompareAtPrice ?? raw['compare price']

    parsedRows.push({
      isbn,
      name,
      slug,
      description: String(raw.description ?? raw.Description ?? '').trim() || null,
      price: parseNumber(raw.price ?? raw.Price ?? raw['price (pkr)']),
      compare_at_price:
        compareAtPrice === null || compareAtPrice === undefined || compareAtPrice === ''
          ? null
          : parseNumber(compareAtPrice),
      category: PRODUCT_CATEGORIES.has(category) ? category : 'teacher-resources',
      stock: parseNumber(raw.stock ?? raw.Stock, 100),
      featured: parseBoolean(raw.featured ?? raw.Featured),
      published: parseBoolean(raw.published ?? raw.Published ?? true),
      images: parseImages(raw.images ?? raw.Images ?? raw.image ?? raw.image_url),
    })
  }

  const isbnCounts = new Map()
  for (const row of parsedRows) {
    isbnCounts.set(row.isbn, (isbnCounts.get(row.isbn) ?? 0) + 1)
  }

  const usedIsbns = new Set()
  const usedSlugs = new Set()

  return parsedRows.map((row) => {
    const slug = makeUniqueValue(row.slug || slugify(row.name), usedSlugs)
    const isbnIsReusable = !isPlaceholderIsbn(row.isbn) && (isbnCounts.get(row.isbn) ?? 0) === 1
    const isbn = makeUniqueValue(isbnIsReusable ? row.isbn : `PC-${slug}`, usedIsbns)

    return { ...row, isbn, slug }
  })
}

const input = process.argv[2]
const output = process.argv[3] ?? path.join('lib', 'data', 'product-catalog.json')

if (!input) {
  throw new Error('Usage: node scripts/build-product-catalog.mjs <products.csv> [output.json]')
}

const csv = await readFile(input, 'utf8')
const rows = normalizeImportRows(parseCsv(csv))

await mkdir(path.dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify(rows, null, 2)}\n`)

console.log(`Wrote ${rows.length} catalog products to ${output}`)
