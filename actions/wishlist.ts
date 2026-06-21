'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import type { ActionResult } from '@/types'

export async function toggleWishlistAction(productId: string): Promise<ActionResult<{ added: boolean }>> {
  const user = await getSession()
  if (!user) return { success: false, error: 'Please sign in' }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single()

  if (existing) {
    const { error } = await supabase.from('wishlist_items').delete().eq('id', existing.id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/wishlist')
    return { success: true, data: { added: false } }
  }

  const { error } = await supabase
    .from('wishlist_items')
    .insert({ user_id: user.id, product_id: productId } as never)

  if (error) return { success: false, error: error.message }
  revalidatePath('/wishlist')
  return { success: true, data: { added: true } }
}

export async function getWishlistItems() {
  const user = await getSession()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('wishlist_items')
    .select('*, products(*)')
    .eq('user_id', user.id)

  return data ?? []
}
