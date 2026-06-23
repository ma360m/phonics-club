'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import type { ActionResult } from '@/types'

export async function bulkDeleteProductsAction(ids: string[]): Promise<ActionResult<{ deleted: number }>> {
  await requireAdmin()
  if (!ids.length) return { success: false, error: 'No products selected' }

  const supabase = await createClient()
  const { error, count } = await supabase
    .from('products')
    .delete({ count: 'exact' })
    .in('id', ids)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return { success: true, data: { deleted: count ?? ids.length } }
}

export async function bulkUpdateProductsAction(
  ids: string[],
  updates: {
    price?: number
    stock?: number
    category?: string
    published?: boolean
    featured?: boolean
    pricePercent?: number
  }
): Promise<ActionResult<{ updated: number }>> {
  await requireAdmin()
  if (!ids.length) return { success: false, error: 'No products selected' }

  const supabase = await createClient()

  if (updates.pricePercent !== undefined) {
    const { data: products } = await supabase.from('products').select('id, price').in('id', ids)
    let updated = 0
    for (const p of products ?? []) {
      const newPrice = Math.round(Number(p.price) * (1 + updates.pricePercent / 100))
      const { error } = await supabase.from('products').update({ price: newPrice } as never).eq('id', p.id)
      if (!error) updated++
    }
    revalidatePath('/admin/products')
    revalidatePath('/shop')
    return { success: true, data: { updated } }
  }

  const payload: Record<string, unknown> = {}
  if (updates.price !== undefined) payload.price = updates.price
  if (updates.stock !== undefined) payload.stock = updates.stock
  if (updates.category) payload.category = updates.category
  if (updates.published !== undefined) payload.published = updates.published
  if (updates.featured !== undefined) payload.featured = updates.featured

  if (!Object.keys(payload).length) {
    return { success: false, error: 'No fields to update' }
  }

  const { error, count } = await supabase
    .from('products')
    .update(payload as never, { count: 'exact' })
    .in('id', ids)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return { success: true, data: { updated: count ?? ids.length } }
}

export async function deleteAllProductsAction(
  confirmText: string,
  adminEmail: string
): Promise<ActionResult<{ deleted: number }>> {
  const admin = await requireAdmin()
  if (confirmText !== 'DELETE ALL') {
    return { success: false, error: 'Type DELETE ALL to confirm' }
  }
  if (adminEmail.trim().toLowerCase() !== admin.email.toLowerCase()) {
    return { success: false, error: 'Admin email does not match your account' }
  }

  const supabase = await createClient()
  const { error, count } = await supabase
    .from('products')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return { success: true, data: { deleted: count ?? 0 } }
}

export async function importCatalogManifestAction(): Promise<ActionResult<ImportStats>> {
  await requireAdmin()
  const { IMAGE_CATALOG_PRODUCTS } = await import('@/lib/data/catalog-from-images')
  const { upsertProductsByIsbn } = await import('@/lib/products/upsert')

  const rows = IMAGE_CATALOG_PRODUCTS.map((p) => ({
    isbn: p.isbn!,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: Number(p.price),
    compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
    category: p.category,
    stock: p.stock,
    featured: p.featured,
    published: p.published,
    images: p.images,
  }))

  const supabase = await createClient()
  const result = await upsertProductsByIsbn(supabase, rows)

  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return {
    success: result.failed === 0,
    data: result,
    error: result.errors.length ? result.errors.slice(0, 3).join('; ') : undefined,
  }
}

interface ImportStats {
  created: number
  updated: number
  failed: number
  errors: string[]
}
