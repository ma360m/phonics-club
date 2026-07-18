'use client'

import Image from 'next/image'
import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { normalizeMediaUrl } from '@/lib/media-url'

export function CourseImage({
  src,
  alt,
  className = '',
  priority = false,
}: {
  src?: string | null
  alt: string
  className?: string
  priority?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const safeSrc = normalizeMediaUrl(src)

  if (!safeSrc || failed) {
    return (
      <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#D30000]/10 via-white to-[#60A5FA]/20 ${className}`}>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
          <BookOpen className="h-8 w-8 text-[#1D4ED8]" />
        </div>
      </div>
    )
  }

  return (
    <Image
      src={safeSrc}
      alt={alt}
      fill
      className={`object-cover ${className}`}
      sizes="(max-width: 768px) 100vw, 33vw"
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      onError={() => setFailed(true)}
    />
  )
}
