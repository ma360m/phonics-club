import { slugify } from '@/utils/slug'
import type { ProductImportRow } from '@/lib/products/import-export'

export function importRowToDbPayload(row: ProductImportRow) {
  return {
    isbn: row.isbn,
    name: row.name,
    slug: row.slug || slugify(row.name),
    description: row.description,
    price: row.price,
    compare_at_price: row.compare_at_price,
    category: row.category,
    images: row.images,
    stock: row.stock,
    featured: row.featured,
    published: row.published,
    metadata: { currency: 'PKR' },
  }
}

export interface ImportResult {
  created: number
  updated: number
  failed: number
  errors: string[]
}

export async function upsertProductsByIsbn(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  rows: ProductImportRow[]
): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, failed: 0, errors: [] }
  if (!rows.length) return result

  const isbns = rows.map((r) => r.isbn)
  const { data: existing } = await supabase
    .from('products')
    .select('isbn')
    .in('isbn', isbns)

  const existingSet = new Set((existing ?? []).map((e: { isbn: string }) => e.isbn))
  const payloads = rows.map(importRowToDbPayload)

  const { error } = await supabase
    .from('products')
    .upsert(payloads as never, { onConflict: 'isbn' })

  if (error) {
    result.failed = rows.length
    result.errors.push(error.message)
    return result
  }

  for (const row of rows) {
    if (existingSet.has(row.isbn)) result.updated++
    else result.created++
  }

  return result
}
