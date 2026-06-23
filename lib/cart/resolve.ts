import { createClient } from '@/lib/supabase/server'
import { getGuestCartFromCookie } from '@/lib/cart/guest'
import type { OrderItem } from '@/types'

export interface ResolvedCartItem {
  product_id: string
  name: string
  price: number
  quantity: number
  image?: string
}

export async function resolveCartForCheckout(
  userId: string | null,
  guestCartJson?: string | null
): Promise<ResolvedCartItem[]> {
  const supabase = await createClient()

  if (userId) {
    const { data } = await supabase
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', userId)

    return (data ?? []).map((item) => {
      const product = item.products as {
        id: string
        name: string
        price: number
        images?: string[]
      }
      return {
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: item.quantity,
        image: product.images?.[0],
      }
    })
  }

  let entries: { productId: string; quantity: number }[] = []
  if (guestCartJson) {
    try {
      entries = JSON.parse(guestCartJson) as { productId: string; quantity: number }[]
    } catch {
      entries = []
    }
  }
  if (!entries.length) {
    const fromCookie = await getGuestCartFromCookie()
    entries = fromCookie.map((e) => ({ productId: e.productId, quantity: e.quantity }))
  }
  if (!entries.length) return []

  const productIds = entries.map((e) => e.productId)
  const { data: products } = await supabase.from('products').select('*').in('id', productIds)
  const productMap = new Map((products ?? []).map((p) => [p.id, p]))

  const items: ResolvedCartItem[] = []
  for (const entry of entries) {
    const product = productMap.get(entry.productId)
    if (!product) continue
    items.push({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: entry.quantity,
      image: product.images?.[0],
    })
  }
  return items
}

export function cartItemsToOrderItems(items: ResolvedCartItem[]): OrderItem[] {
  return items.map((i) => ({
    product_id: i.product_id,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    image: i.image,
  }))
}
