'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'

export function WishlistNavLink() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => setIsLoggedIn(Boolean(d.user)))
      .catch(() => setIsLoggedIn(false))
  }, [])

  if (!isLoggedIn) return null

  return (
    <Link
      href="/wishlist"
      className="p-2 hover:bg-muted rounded-lg transition-colors"
      aria-label="Wishlist"
    >
      <Heart className="w-5 h-5 text-foreground/70" />
    </Link>
  )
}
