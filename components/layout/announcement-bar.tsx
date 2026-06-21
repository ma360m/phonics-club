'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Announcement } from '@/lib/site-content'

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true)
  const [items, setItems] = useState<Announcement[]>([])

  useEffect(() => {
    fetch('/api/site/announcements')
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]))
  }, [])

  if (!isVisible || !items.length) return null

  const active = items[0]

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-[#1D4ED8] text-white relative"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 text-sm flex-wrap">
        <span className="font-medium">PHONICS CLUB:</span>
        <span className="text-white/90">{active.message}</span>
        {active.couponCode && (
          <span className="bg-[#FBBF24] text-[#111827] px-2 py-0.5 rounded font-semibold text-xs">
            {active.couponCode}
          </span>
        )}
        {active.linkUrl && (
          <Link href={active.linkUrl} className="ml-2 underline underline-offset-2 hover:text-[#FBBF24]">
            {active.linkText ?? 'Learn more'}
          </Link>
        )}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
          aria-label="Close announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
