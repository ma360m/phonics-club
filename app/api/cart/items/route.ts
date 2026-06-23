import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getGuestCartFromCookie } from '@/lib/cart/guest'

export async function GET() {
  const user = await getSession()
  const supabase = await createClient()

  if (user) {
    const { data } = await supabase
      .from('cart_items')
      .select('*, products(*)')
      .eq('user_id', user.id)
    return NextResponse.json({ items: data ?? [], isGuest: false })
  }

  const guestCart = await getGuestCartFromCookie()
  if (!guestCart.length) return NextResponse.json({ items: [], isGuest: true })

  const productIds = guestCart.map((e) => e.productId)
  const { data: products } = await supabase.from('products').select('*').in('id', productIds)

  const productMap = new Map((products ?? []).map((p) => [p.id, p]))
  const items = guestCart
    .map((entry) => {
      const product = productMap.get(entry.productId)
      if (!product) return null
      return {
        id: `guest-${entry.productId}`,
        product_id: entry.productId,
        quantity: entry.quantity,
        products: product,
      }
    })
    .filter(Boolean)

  return NextResponse.json({ items, isGuest: true })
}
