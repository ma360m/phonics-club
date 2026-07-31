import { slugify } from '@/utils/slug'
import { PRODUCT_CATEGORIES } from '@/lib/constants'

export const PRODUCT_EXPORT_COLUMNS = [
  'isbn',
  'name',
  'slug',
  'description',
  'price',
  'compare_at_price',
  'category',
  'stock',
  'sale_enabled',
  'sale_price',
  'sale_percentage',
  'featured',
  'published',
  'images',
] as const

export type ProductImportRow = {
  isbn: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  category: string
  stock: number
  sale_enabled: boolean
  sale_price: number | null
  sale_percentage: number | null
  featured: boolean
  published: boolean
  images: string[]
}

export function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  const s = String(value ?? '').trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes' || s === 'y'
}

export function parseNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback
  const n = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : fallback
}

export function parseImages(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  return String(value)
    .split(/[,;|]/)
    .map((s) => s.trim().replace(/^"+|"+$/g, ''))
    .filter(Boolean)
}

export function isPlaceholderIsbn(value: string): boolean {
  const compact = value.replace(/[^0-9A-Za-z]/g, '')
  return !compact || /^0+$/.test(compact) || /^97[89]0{10}$/.test(compact)
}

function makeUniqueValue(base: string, used: Set<string>): string {
  let value = base
  let index = 2

  while (used.has(value)) {
    value = `${base}-${index}`
    index += 1
  }

  used.add(value)
  return value
}

export function normalizeImportRow(raw: Record<string, unknown>): ProductImportRow | null {
  const isbn = String(raw.isbn ?? raw.ISBN ?? '').trim()
  const name = String(raw.name ?? raw.Name ?? raw.title ?? raw.Title ?? '').trim()
  if (!isbn || !name) return null

  const rawSlug = String(raw.slug ?? raw.Slug ?? '').trim()
  const slug = slugify(rawSlug || name)
  const category = String(raw.category ?? raw.Category ?? 'teacher-resources').trim()
  const validCategory = (PRODUCT_CATEGORIES as readonly string[]).includes(category)
    ? category
    : 'teacher-resources'
  const compareAtPrice = raw.compare_at_price ?? raw.CompareAtPrice ?? raw['compare price']
  const salePrice = raw.sale_price ?? raw.SalePrice ?? raw['sale price']
  const salePercentage = raw.sale_percentage ?? raw.SalePercentage ?? raw['sale percentage'] ?? raw['sale %']

  return {
    isbn,
    name,
    slug,
    description: String(raw.description ?? raw.Description ?? '').trim() || null,
    price: parseNumber(raw.price ?? raw.Price ?? raw['price (pkr)']),
    compare_at_price:
      compareAtPrice === null || compareAtPrice === undefined || compareAtPrice === ''
        ? null
        : parseNumber(compareAtPrice),
    category: validCategory,
    stock: parseNumber(raw.stock ?? raw.Stock, 100),
    sale_enabled: parseBoolean(raw.sale_enabled ?? raw.SaleEnabled ?? raw.sale ?? raw.Sale),
    sale_price:
      salePrice === null || salePrice === undefined || salePrice === ''
        ? null
        : parseNumber(salePrice),
    sale_percentage:
      salePercentage === null || salePercentage === undefined || salePercentage === ''
        ? null
        : parseNumber(salePercentage),
    featured: parseBoolean(raw.featured ?? raw.Featured),
    published: parseBoolean(raw.published ?? raw.Published ?? true),
    images: parseImages(raw.images ?? raw.Images ?? raw.image ?? raw.image_url),
  }
}

export function rowToExportRecord(product: Record<string, unknown>) {
  const images = product.images as string[] | undefined
  return {
    isbn: String(product.isbn ?? ''),
    name: String(product.name ?? ''),
    slug: String(product.slug ?? ''),
    description: String(product.description ?? ''),
    price: Number(product.price ?? 0),
    compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : '',
    category: String(product.category ?? ''),
    stock: Number(product.stock ?? 0),
    sale_enabled: Boolean(product.sale_enabled),
    sale_price: product.sale_price ? Number(product.sale_price) : '',
    sale_percentage: product.sale_percentage ? Number(product.sale_percentage) : '',
    featured: Boolean(product.featured),
    published: Boolean(product.published ?? true),
    images: (images ?? []).join(', '),
  }
}

export function productsToCsv(products: Record<string, unknown>[]): string {
  const header = PRODUCT_EXPORT_COLUMNS.join(',')
  const rows = products.map((p) => {
    const r = rowToExportRecord(p)
    return PRODUCT_EXPORT_COLUMNS.map((col) => {
      const val = r[col as keyof typeof r]
      const str = String(val ?? '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(',')
  })
  return [header, ...rows].join('\n')
}

export function parseCsv(text: string): Record<string, string>[] {
  const normalized = text.replace(/^\uFEFF/, '')
  const table: string[][] = []
  let row: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]
    if (ch === '"') {
      if (inQuotes && normalized[i + 1] === '"') {
        current += '"'
        i++
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
      if (ch === '\r' && normalized[i + 1] === '\n') i++
    } else {
      current += ch
    }
  }

  row.push(current.trim())
  if (row.some((cell) => cell.trim())) table.push(row)
  if (table.length < 2) return []

  const headers = table[0].map((h) =>
    h.replace(/^\uFEFF/, '').toLowerCase().replace(/\s+/g, '_')
  )
  return table.slice(1).map((values) => {
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = values[i] ?? ''
    })
    return row
  })
}

export function parseImportRowsFromObjects(objects: Record<string, unknown>[]): {
  rows: ProductImportRow[]
  skipped: number
} {
  const parsedRows: ProductImportRow[] = []
  let skipped = 0
  for (const obj of objects) {
    const row = normalizeImportRow(obj)
    if (row) parsedRows.push(row)
    else skipped++
  }

  const isbnCounts = new Map<string, number>()
  for (const row of parsedRows) {
    isbnCounts.set(row.isbn, (isbnCounts.get(row.isbn) ?? 0) + 1)
  }

  const usedIsbns = new Set<string>()
  const usedSlugs = new Set<string>()
  const rows = parsedRows.map((row) => {
    const slug = makeUniqueValue(row.slug || slugify(row.name), usedSlugs)
    const isbnIsReusable = !isPlaceholderIsbn(row.isbn) && (isbnCounts.get(row.isbn) ?? 0) === 1
    const isbn = makeUniqueValue(isbnIsReusable ? row.isbn : `PC-${slug}`, usedIsbns)

    return { ...row, isbn, slug }
  })

  return { rows, skipped }
}
