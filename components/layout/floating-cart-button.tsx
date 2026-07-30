'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { CART_UPDATED_EVENT } from '@/lib/guest-cart-client'

export function FloatingCartButton() {
  const [count, setCount] = useState(0)

  function refreshCount() {
    fetch('/api/cart/count')
      .then((response) => response.json())
      .then((data) => setCount(Number(data.count ?? 0)))
      .catch(() => setCount(0))
  }

  useEffect(() => {
    refreshCount()
    const onUpdate = () => refreshCount()
    window.addEventListener(CART_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpdate)
  }, [])

  if (count <= 0) return null

  return (
    <Link
      href="/cart"
      aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}
      className="fixed bottom-4 right-24 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/70 bg-[#D30000] text-white shadow-2xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FCA5A5]/60"
    >
      <ShoppingCart className="h-6 w-6" aria-hidden="true" />
      <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-[#1D4ED8] px-1 text-[11px] font-bold text-white">
        {count > 99 ? '99+' : count}
      </span>
    </Link>
  )
}
