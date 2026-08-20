'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { productSchema } from '@/lib/validations/product'
import { updateProductComingSoonMetadata } from '@/lib/products/coming-soon'
import { slugify } from '@/utils/slug'
import type { ActionResult } from '@/types'

function parseProductForm(formData: FormData) {
  const imagesRaw = formData.get('images')
  const images = imagesRaw
    ? String(imagesRaw).split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const collection = String(formData.get('collection') ?? '').trim()
  const name = String(formData.get('name') ?? '')
  const requestedSlug = String(formData.get('slug') ?? '')
  const slug = slugify(requestedSlug || name) || `product-${Date.now().toString(36)}`
  const comingSoon = formData.get('coming_soon') === 'on'
  const parsed = productSchema.safeParse({
    name,
    slug,
    description: formData.get('description'),
    product_number: formData.get('product_number') || null,
    sku: formData.get('sku') || null,
    barcode: formData.get('barcode') || null,
    alternate_barcode: formData.get('alternate_barcode') || null,
    isbn: formData.get('isbn'),
    price: formData.get('price'),
    compare_at_price: formData.get('compare_at_price') || null,
    category: formData.get('category'),
    images,
    stock: formData.get('stock'),
    low_stock_threshold: formData.get('low_stock_threshold') || 20,
    stock_management_enabled: formData.get('stock_management_enabled') === 'on',
    backorder_policy: formData.get('backorder_policy') || 'disabled',
    max_backorder_quantity: formData.get('max_backorder_quantity') || null,
    max_purchase_quantity: formData.get('max_purchase_quantity') || null,
    estimated_availability_date: formData.get('estimated_availability_date') || null,
    backorder_message: formData.get('backorder_message') || null,
    sale_enabled: formData.get('sale_enabled') === 'on',
    sale_price: formData.get('sale_price') || null,
    sale_percentage: formData.get('sale_percentage') || null,
    sale_badge_text: formData.get('sale_badge_text') || 'saleee',
    featured: formData.get('featured') === 'on',
    published: formData.get('published') === 'on',
  })

  return {
    parsed,
    collection: collection === 'phonics-club' || collection === 'jolly-learning' ? collection : null,
    comingSoon,
  }
}

async function getUniqueProductSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseSlug: string,
  ignoreProductId?: string | null
) {
  const fallback = `product-${Date.now().toString(36)}`
  const root = slugify(baseSlug) || fallback
  let candidate = root

  for (let suffix = 2; suffix <= 50; suffix += 1) {
    let query = supabase.from('products').select('id').eq('slug', candidate).limit(1)
    if (ignoreProductId) query = query.neq('id', ignoreProductId)

    const { data, error } = await query.maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return candidate

    candidate = `${root}-${suffix}`
  }

  return `${root}-${Date.now().toString(36)}`
}

async function getProductIdByIsbn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  isbn: string | null | undefined
) {
  if (!isbn) return null
  const { data, error } = await supabase.from('products').select('id').eq('isbn', isbn).maybeSingle()
  if (error) throw new Error(error.message)
  return data?.id ?? null
}

export async function createProductAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()
  const { parsed, collection, comingSoon } = parseProductForm(formData)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }
  if (!comingSoon && !parsed.data.isbn) return { success: false, error: 'ISBN is required' }

  const supabase = await createClient()
  let existingProductId: string | null = null
  let slug = parsed.data.slug

  try {
    existingProductId = await getProductIdByIsbn(supabase, parsed.data.isbn)
    slug = await getUniqueProductSlug(supabase, parsed.data.slug, existingProductId)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not prepare product slug' }
  }

  const payload: Record<string, unknown> = { ...parsed.data, slug }
  const metadata = updateProductComingSoonMetadata({}, comingSoon)
  if (collection) metadata.collection = collection
  payload.metadata = metadata

  const mutation = parsed.data.isbn
    ? supabase.from('products').upsert(payload as never, { onConflict: 'isbn' })
    : supabase.from('products').insert(payload as never)
  const { error } = await mutation
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/shop')
  revalidatePath(`/shop/${slug}`)
  return { success: true }
}

export async function updateProductAction(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()
  const { parsed, collection, comingSoon } = parseProductForm(formData)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }
  if (!comingSoon && !parsed.data.isbn) return { success: false, error: 'ISBN is required' }

  const supabase = await createClient()
  const { data: existing } = await supabase.from('products').select('metadata').eq('id', id).single()
  const metadata = {
    ...((existing?.metadata as Record<string, unknown> | null) ?? {}),
  }
  if (collection) metadata.collection = collection
  else delete metadata.collection
  const nextMetadata = updateProductComingSoonMetadata(metadata, comingSoon)
  let slug = parsed.data.slug
  try {
    slug = await getUniqueProductSlug(supabase, parsed.data.slug, id)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not prepare product slug' }
  }

  const { error } = await supabase
    .from('products')
    .update({ ...parsed.data, slug, metadata: nextMetadata } as never)
    .eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/shop')
  revalidatePath(`/shop/${slug}`)
  return { success: true }
}

export async function deleteProductAction(id: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/products')
  revalidatePath('/shop')
}

export async function getAdminProducts() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
  return data ?? []
}

export async function getAdminProduct(id: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('*').eq('id', id).single()
  return data
}
