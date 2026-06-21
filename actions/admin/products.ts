'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { productSchema } from '@/lib/validations/product'
import type { ActionResult } from '@/types'

function parseProductForm(formData: FormData) {
  const imagesRaw = formData.get('images')
  const images = imagesRaw
    ? String(imagesRaw).split(',').map((s) => s.trim()).filter(Boolean)
    : []

  return productSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    isbn: formData.get('isbn'),
    price: formData.get('price'),
    compare_at_price: formData.get('compare_at_price') || null,
    category: formData.get('category'),
    images,
    stock: formData.get('stock'),
    featured: formData.get('featured') === 'on',
    published: formData.get('published') === 'on',
  })
}

export async function createProductAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()
  const parsed = parseProductForm(formData)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }
  if (!parsed.data.isbn) return { success: false, error: 'ISBN is required' }

  const supabase = await createClient()
  const { error } = await supabase.from('products').upsert(parsed.data as never, { onConflict: 'isbn' })
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return { success: true }
}

export async function updateProductAction(
  id: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()
  const parsed = parseProductForm(formData)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const supabase = await createClient()
  const { error } = await supabase.from('products').update(parsed.data as never).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/shop')
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
