import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getCartTotalQuantity } from '@/actions/cart'
import { getGuestCartFromCookie } from '@/lib/cart/guest'

export async function GET() {
  const user = await getSession()
  if (user) {
    const count = await getCartTotalQuantity(user.id)
    return NextResponse.json({ count })
  }

  const guestCart = await getGuestCartFromCookie()
  const count = guestCart.reduce((sum, e) => sum + e.quantity, 0)
  return NextResponse.json({ count })
}
