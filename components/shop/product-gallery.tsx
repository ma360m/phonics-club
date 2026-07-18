'use client'

import { useState } from 'react'
import { ProductImage } from '@/components/shop/product-image'

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const cleanImages = images.filter(Boolean)
  const [active, setActive] = useState(cleanImages[0] ?? '')

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-white">
        {active ? (
          <ProductImage src={active} alt={name} priority className="p-4" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl text-muted-foreground">
            Book
          </div>
        )}
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
