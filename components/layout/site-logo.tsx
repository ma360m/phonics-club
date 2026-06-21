'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { APP_NAME } from '@/lib/constants'

export function SiteLogo() {
  const [useFallback, setUseFallback] = useState(false)

  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 lg:w-[72px] lg:h-[72px] shrink-0 rounded-xl overflow-hidden">
        {useFallback ? (
          <div className="w-full h-full bg-[#1D4ED8] rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
        ) : (
          <Image
            src="/logo.png"
            alt={`${APP_NAME} logo`}
            fill
            className="object-contain"
            sizes="72px"
            priority
            unoptimized
            onError={() => setUseFallback(true)}
          />
        )}
      </div>
      <span className="font-bold text-xl lg:text-2xl text-foreground leading-tight whitespace-nowrap">
        {APP_NAME}
      </span>
    </Link>
  )
}
