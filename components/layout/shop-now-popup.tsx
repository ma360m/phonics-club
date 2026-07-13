'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'phonics-club-shop-popup-seen'

export function ShopNowPopup() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (pathname.startsWith('/admin')) return
    if (window.sessionStorage.getItem(STORAGE_KEY)) return

    const timer = window.setTimeout(() => setOpen(true), 900)
    return () => window.clearTimeout(timer)
  }, [pathname])

  const close = () => {
    window.sessionStorage.setItem(STORAGE_KEY, 'true')
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0F172A]/55 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-[#475569] shadow-sm transition-colors hover:text-[#D30000]"
          aria-label="Close shop popup"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-[#0F172A] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white">
              <Image src="/logo.png" alt="Phonics Club logo" fill className="object-contain p-1" unoptimized />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#FBBF24]">Official Resources</p>
              <h2 className="text-xl font-bold">Ready to order?</h2>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <p className="text-sm leading-6 text-muted-foreground">
            Shop approved phonics books, workbooks, readers, and classroom resources from Phonics Club.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild className="rounded-xl bg-[#1D4ED8]" onClick={close}>
              <Link href="/shop?collection=jolly-learning">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Shop Now
              </Link>
            </Button>
            <Button asChild className="rounded-xl bg-[#D30000] hover:bg-[#D30000]/90" onClick={close}>
              <Link href="/shop?collection=phonics-club">
                Order Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
