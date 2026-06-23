import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { GUEST_CART_COOKIE, serializeGuestCart, type GuestCartEntry } from '@/lib/cart/guest'

export async function POST(request: Request) {
  const body = (await request.json()) as { items?: GuestCartEntry[] }
  const items = (body.items ?? []).filter((e) => e.productId && e.quantity > 0)
  const cookieStore = await cookies()
  cookieStore.set(GUEST_CART_COOKIE, serializeGuestCart(items), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return NextResponse.json({ ok: true, count: items.reduce((s, e) => s + e.quantity, 0) })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(GUEST_CART_COOKIE)
  return NextResponse.json({ ok: true })
}
