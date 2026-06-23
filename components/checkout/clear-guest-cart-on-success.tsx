'use client'

import { useEffect } from 'react'
import { clearGuestCart } from '@/lib/guest-cart-client'

export function ClearGuestCartOnSuccess() {
  useEffect(() => {
    clearGuestCart()
  }, [])
  return null
}
