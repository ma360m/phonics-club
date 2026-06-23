'use client'

export const GUEST_CART_KEY = 'phonics_guest_cart'
export const CART_UPDATED_EVENT = 'phonics-cart-updated'

export type GuestCartEntry = { productId: string; quantity: number }

export function getGuestCart(): GuestCartEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GuestCartEntry[]
    return Array.isArray(parsed) ? parsed.filter((e) => e.productId && e.quantity > 0) : []
  } catch {
    return []
  }
}

export function setGuestCart(items: GuestCartEntry[]): void {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
}

export function addToGuestCart(productId: string, quantity: number): void {
  const cart = getGuestCart()
  const existing = cart.find((e) => e.productId === productId)
  if (existing) existing.quantity += quantity
  else cart.push({ productId, quantity })
  setGuestCart(cart)
  syncGuestCartCookie(cart)
}

export function updateGuestCartQuantity(productId: string, quantity: number): void {
  if (quantity <= 0) {
    setGuestCart(getGuestCart().filter((e) => e.productId !== productId))
  } else {
    const cart = getGuestCart()
    const entry = cart.find((e) => e.productId === productId)
    if (entry) entry.quantity = quantity
    else cart.push({ productId, quantity })
    setGuestCart(cart)
  }
  syncGuestCartCookie(getGuestCart())
}

export function clearGuestCart(): void {
  localStorage.removeItem(GUEST_CART_KEY)
  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
  fetch('/api/cart/guest', { method: 'DELETE' }).catch(() => {})
}

export function getGuestCartCount(): number {
  return getGuestCart().reduce((sum, e) => sum + e.quantity, 0)
}

export async function syncGuestCartCookie(items?: GuestCartEntry[]): Promise<void> {
  const cart = items ?? getGuestCart()
  await fetch('/api/cart/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cart }),
  })
}
