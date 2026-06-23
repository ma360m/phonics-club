import { cookies } from 'next/headers'

export const GUEST_CART_COOKIE = 'guest_cart'

export type GuestCartEntry = { productId: string; quantity: number }

export async function getGuestCartFromCookie(): Promise<GuestCartEntry[]> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(GUEST_CART_COOKIE)?.value
  if (!raw) return []
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as GuestCartEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((e) => e.productId && e.quantity > 0)
  } catch {
    return []
  }
}

export function serializeGuestCart(items: GuestCartEntry[]): string {
  return encodeURIComponent(JSON.stringify(items))
}
