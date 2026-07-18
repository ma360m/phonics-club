'use client'

import Image from 'next/image'
import { useState } from 'react'

export function ProductImage({
  src,
  alt,
  className = '',
  priority = false,
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
}) {
  const [error, setError] = useState(false)

  if (error || !src) {
    return (
      <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1D4ED8]/10 to-[#60A5FA]/20 text-sm font-semibold text-muted-foreground ${className}`}>
        Image unavailable
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={`object-contain ${className}`}
      sizes="(max-width: 768px) 100vw, 50vw"
      loading={priority ? undefined : 'lazy'}
      priority={priority}
      onError={() => setError(true)}
    />
  )
}
