import { PRODUCT_CATEGORY_LABELS } from '@/lib/constants'
import { PRODUCT_COLLECTIONS, getProductCollection } from '@/lib/product-collections'
import type { Product } from '@/types/database'

const CATEGORY_ALIASES: Record<string, string[]> = {
  'activity-books': ['activity', 'activities', 'activity books'],
  'pupil-books': ['pupil', 'student', 'students', 'pupil books'],
  workbooks: ['workbook', 'workbooks', 'practice', 'practice books'],
  'grammar-workbooks': ['grammar workbook', 'grammar workbooks', 'grammar practice'],
  'grammar-pupil-books': ['grammar pupil', 'spelling', 'grammar spelling'],
  'teachers-books': ['teacher', 'teachers', 'teacher book', 'teachers book'],
  comprehension: ['comprehension', 'creative writing', 'writing'],
  readers: ['reader', 'readers', 'reading book', 'reading books'],
  'teacher-resources': ['resource', 'resources', 'flashcard', 'flashcards', 'teaching resource'],
  kits: ['kit', 'kits', 'classroom set', 'class set'],
}

const PRODUCT_SEARCH_COLUMNS = [
  'name',
  'slug',
  'description',
  'product_number',
  'sku',
  'barcode',
  'alternate_barcode',
  'isbn',
  'category',
] as const

export function normalizeProductSearchValue(value: unknown) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function productMatchesSearch(product: Product, query: string) {
  const normalizedQuery = normalizeProductSearchValue(query)
  if (!normalizedQuery) return true

  const text = getProductSearchText(product)
  if (text.includes(normalizedQuery)) return true

  const words = getSearchWords(normalizedQuery)
  return words.length === 0 || words.every((word) => textIncludesWord(text, word))
}

export function searchProducts<T extends Product>(products: T[], query: string): T[] {
  const normalizedQuery = normalizeProductSearchValue(query)
  if (!normalizedQuery) return products

  return products
    .map((product) => ({ product, score: scoreProductSearchMatch(product, normalizedQuery) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .map((item) => item.product)
}

export function buildSupabaseProductSearchOrFilter(query: string) {
  const pattern = getSearchWords(query).join('%')
  if (!pattern) return null

  const likePattern = `%${pattern}%`
  return PRODUCT_SEARCH_COLUMNS.map((column) => `${column}.ilike.${likePattern}`).join(',')
}

function scoreProductSearchMatch(product: Product, normalizedQuery: string) {
  if (!productMatchesSearch(product, normalizedQuery)) return -1

  const words = getSearchWords(normalizedQuery)
  const text = getProductSearchText(product)
  const name = normalizeProductSearchValue(product.name)
  const slug = normalizeProductSearchValue(product.slug)
  const identifiers = getProductIdentifiers(product).map(normalizeProductSearchValue)
  let score = 0

  if (identifiers.some((identifier) => identifier === normalizedQuery)) score += 1000
  if (identifiers.some((identifier) => identifier.includes(normalizedQuery))) score += 700
  if (name === normalizedQuery) score += 600
  if (name.startsWith(normalizedQuery)) score += 450
  if (name.includes(normalizedQuery)) score += 350
  if (slug.includes(normalizedQuery)) score += 150
  if (text.includes(normalizedQuery)) score += 100

  for (const word of words) {
    if (name.split(' ').some((part) => part.startsWith(word))) score += 25
    if (identifiers.some((identifier) => identifier.includes(word))) score += 20
    if (textIncludesWord(text, word)) score += 10
  }

  return score
}

function getProductSearchText(product: Product) {
  const categoryLabel = PRODUCT_CATEGORY_LABELS[product.category] ?? product.category
  const collection = PRODUCT_COLLECTIONS.find((item) => item.slug === getProductCollection(product))
  const metadataValues = Object.values(product.metadata ?? {}).filter(
    (value): value is string | number => typeof value === 'string' || typeof value === 'number',
  )

  return normalizeProductSearchValue([
    product.name,
    product.slug,
    product.description,
    product.category,
    categoryLabel,
    product.product_number,
    product.sku,
    product.barcode,
    product.alternate_barcode,
    product.isbn,
    ...metadataValues,
    ...(CATEGORY_ALIASES[product.category] ?? []),
    collection?.slug,
    collection?.label,
    collection?.shortLabel,
  ].filter(Boolean).join(' '))
}

function getProductIdentifiers(product: Product) {
  return [
    product.product_number,
    product.sku,
    product.barcode,
    product.alternate_barcode,
    product.isbn,
    product.metadata?.isbn,
  ].filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
}

function getSearchWords(query: string) {
  return Array.from(new Set(normalizeProductSearchValue(query).split(' ').filter(Boolean)))
}

function textIncludesWord(text: string, word: string) {
  return getWordVariants(word).some((variant) => text.includes(variant))
}

function getWordVariants(word: string) {
  const variants = new Set([word])

  if (word.endsWith('ies') && word.length > 4) variants.add(`${word.slice(0, -3)}y`)
  if (word.endsWith('es') && word.length > 4) variants.add(word.slice(0, -2))
  if (word.endsWith('s') && word.length > 3) variants.add(word.slice(0, -1))
  if (!word.endsWith('s') && word.length > 2) variants.add(`${word}s`)

  return Array.from(variants)
}
