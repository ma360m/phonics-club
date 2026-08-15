'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import { evaluateProductOrderability } from '@/lib/products/inventory'
import type { ActionResult } from '@/types'

async function validateCartProductQuantity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  quantity: number
): Promise<ActionResult | null> {
  if (quantity <= 0) return null

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error || !product || product.published === false) {
    return { success: false, error: 'This product is not available.' }
  }

  const orderability = evaluateProductOrderability(product, quantity)
  if (!orderability.ok) {
    return {
      success: false,
      error: `${product.name}: ${orderability.message ?? 'This quantity is not available.'}`,
    }
  }

  return null
}

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

  const nextQuantity = (existing?.quantity ?? 0) + 1
  const unavailable = await validateCartProductQuantity(supabase, productId, nextQuantity)
  if (unavailable) return unavailable

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: nextQuantity })
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
    const unavailable = await validateCartProductQuantity(supabase, productId, quantity)
    if (unavailable) return unavailable

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
    const { data: item } = await supabase
      .from('cart_items')
      .select('product_id')
      .eq('id', cartItemId)
      .eq('user_id', user.id)
      .single()
    if (!item?.product_id) return { success: false, error: 'Cart item not found.' }

    const unavailable = await validateCartProductQuantity(supabase, item.product_id, quantity)
    if (unavailable) return unavailable

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
