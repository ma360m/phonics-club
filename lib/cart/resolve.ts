import { createClient } from '@/lib/supabase/server'
import { getGuestCartFromCookie } from '@/lib/cart/guest'
import { getProductPricing } from '@/lib/products/sale-pricing'
import { evaluateProductOrderability, type ProductStockStatus } from '@/lib/products/inventory'
import type { OrderItem } from '@/types'

export interface ResolvedCartItem {
  product_id: string
  name: string
  price: number
  quantity: number
  image?: string
  stock_status?: ProductStockStatus
  stock_note?: string
  stock_available?: number
}

type CartProduct = {
  id: string
  name: string
  price: number
  sale_enabled?: boolean | null
  sale_price?: number | null
  sale_percentage?: number | null
  sale_badge_text?: string | null
  images?: string[]
  stock?: number | null
  reserved_stock?: number | null
  low_stock_threshold?: number | null
  stock_management_enabled?: boolean | null
  backorder_policy?: string | null
  max_backorder_quantity?: number | null
  max_purchase_quantity?: number | null
  estimated_availability_date?: string | null
  backorder_message?: string | null
  metadata?: Record<string, unknown> | null
}

function resolvedCartItemFromProduct(product: CartProduct, quantity: number): ResolvedCartItem {
  const pricing = getProductPricing(product)
  const stock = evaluateProductOrderability(product, quantity)
  return {
    product_id: product.id,
    name: product.name,
    price: pricing.displayPrice,
    quantity,
    image: product.images?.[0],
    ...(stock.status !== 'in_stock' ? {
      stock_status: stock.status,
      stock_note: stock.message,
      ...(typeof stock.available === 'number' ? { stock_available: stock.available } : {}),
    } : {}),
  }
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

    return (data ?? []).flatMap((item) => item.products ? [resolvedCartItemFromProduct(item.products as CartProduct, item.quantity)] : [])
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
    items.push(resolvedCartItemFromProduct(product as CartProduct, entry.quantity))
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
    stock_status: i.stock_status,
    stock_note: i.stock_note,
    stock_available: i.stock_available,
  }))
}
