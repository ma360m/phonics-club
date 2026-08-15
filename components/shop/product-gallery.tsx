'use client'

import { useState } from 'react'
import { ProductImage } from '@/components/shop/product-image'
import { PRODUCT_COMING_SOON_LABEL } from '@/lib/products/coming-soon'

export function ProductGallery({
  images,
  name,
  comingSoon = false,
}: {
  images: string[]
  name: string
  comingSoon?: boolean
}) {
  const cleanImages = images.filter(Boolean)
  const [active, setActive] = useState(cleanImages[0] ?? '')

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-white">
        {active ? (
          <ProductImage src={active} alt={name} priority className={`p-4 ${comingSoon ? 'opacity-75 saturate-75' : ''}`} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl text-muted-foreground">
            Book
          </div>
        )}
        {comingSoon ? (
          <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-[#0F172A]/90 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-lg backdrop-blur">
            {PRODUCT_COMING_SOON_LABEL}
          </div>
        ) : null}
      </div>

      {cleanImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {cleanImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(image)}
              className={`relative aspect-square overflow-hidden rounded-lg border bg-white transition ${
                active === image ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8]/20' : 'hover:border-[#1D4ED8]/50'
              }`}
              aria-label={`View ${name} image ${index + 1}`}
            >
              <ProductImage src={image} alt={`${name} thumbnail ${index + 1}`} className="p-1" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
