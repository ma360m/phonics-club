'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ShoppingCart } from 'lucide-react'

export function CartBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetch('/api/cart/count')
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? 0))
      .catch(() => setCount(0))
  }, [])

  return (
    <Link href="/cart" className="p-2 hover:bg-muted rounded-lg transition-colors relative" aria-label={`Cart${count ? `, ${count} items` : ''}`}>
      <ShoppingCart className="w-5 h-5 text-foreground/70" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#D30000] text-white text-[10px] font-bold">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
