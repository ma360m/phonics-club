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
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function parseImages(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  return String(value)
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function normalizeImportRow(raw: Record<string, unknown>): ProductImportRow | null {
  const isbn = String(raw.isbn ?? raw.ISBN ?? '').trim()
  const name = String(raw.name ?? raw.Name ?? raw.title ?? raw.Title ?? '').trim()
  if (!isbn || !name) return null

  const slug = String(raw.slug ?? raw.Slug ?? slugify(name)).trim() || slugify(name)
  const category = String(raw.category ?? raw.Category ?? 'teacher-resources').trim()
  const validCategory = (PRODUCT_CATEGORIES as readonly string[]).includes(category)
    ? category
    : 'teacher-resources'

  return {
    isbn,
    name,
    slug,
    description: String(raw.description ?? raw.Description ?? '').trim() || null,
    price: parseNumber(raw.price ?? raw.Price ?? raw['price (pkr)']),
    compare_at_price: raw.compare_at_price
      ? parseNumber(raw.compare_at_price)
      : raw['compare_at_price'] || raw['compare price']
        ? parseNumber(raw['compare price'])
        : null,
    category: validCategory,
    stock: parseNumber(raw.stock ?? raw.Stock, 100),
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
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else current += ch
    }
    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'))
  return lines.slice(1).map((line) => {
    const values = parseLine(line)
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
  const rows: ProductImportRow[] = []
  let skipped = 0
  for (const obj of objects) {
    const row = normalizeImportRow(obj)
    if (row) rows.push(row)
    else skipped++
  }
  return { rows, skipped }
}
