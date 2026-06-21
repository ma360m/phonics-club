'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import type { ActionResult } from '@/types'

export async function addToCartAction(productId: string): Promise<ActionResult> {
  const user = await getSession()
  if (!user) return { success: false, error: 'Please sign in to add items to cart' }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + 1 })
      .eq('id', existing.id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({ user_id: user.id, product_id: productId, quantity: 1 })
    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/cart')
  revalidatePath('/shop')
  return { success: true }
}

export async function setProductCartQuantityAction(
  productId: string,
  quantity: number
): Promise<ActionResult> {
  const user = await getSession()
  if (!user) return { success: false, error: 'Please sign in to add items to cart' }

  const supabase = await createClient()

  if (quantity <= 0) {
    await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', productId)
  } else {
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', existing.id)
      if (error) return { success: false, error: error.message }
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({ user_id: user.id, product_id: productId, quantity })
      if (error) return { success: false, error: error.message }
    }
  }

  revalidatePath('/cart')
  revalidatePath('/shop')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function getCartTotalQuantity(userId: string): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase.from('cart_items').select('quantity').eq('user_id', userId)
  return (data ?? []).reduce((sum, row) => sum + row.quantity, 0)
}

export async function updateCartQuantityAction(
  cartItemId: string,
  quantity: number
): Promise<ActionResult> {
  const user = await getSession()
  if (!user) return { success: false, error: 'Unauthorized' }

  const supabase = await createClient()

  if (quantity <= 0) {
    const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId).eq('user_id', user.id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .eq('user_id', user.id)
    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/cart')
  return { success: true }
}

export async function removeFromCartAction(cartItemId: string): Promise<ActionResult> {
  const user = await getSession()
  if (!user) return { success: false, error: 'Unauthorized' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/cart')
  return { success: true }
}

export async function getCartItems() {
  const user = await getSession()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('cart_items')
    .select('*, products(*)')
    .eq('user_id', user.id)

  return data ?? []
}
