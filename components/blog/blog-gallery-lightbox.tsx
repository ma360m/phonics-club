'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { BlogGalleryImage } from '@/types/database'
import { Button } from '@/components/ui/button'

export function BlogGalleryLightbox({ images }: { images: BlogGalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const activeImage = activeIndex === null ? null : images[activeIndex]

  function close() {
    setActiveIndex(null)
  }

  function previous() {
    setActiveIndex((current) => current === null ? current : (current - 1 + images.length) % images.length)
  }

  function next() {
    setActiveIndex((current) => current === null ? current : (current + 1) % images.length)
  }

  useEffect(() => {
    if (activeIndex === null) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') previous()
      if (event.key === 'ArrowRight') next()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, images.length])

  if (!images.length) return null

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="group overflow-hidden rounded-lg border bg-card text-left shadow-sm outline-none transition hover:border-[#BFDBFE] focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            <span className="relative block aspect-[4/3] bg-[#F8FAFC]">
              <Image
                src={image.src}
                alt={image.alt ?? 'Phonics Club event photograph'}
                fill
                className="object-cover transition duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </span>
            {image.caption ? <span className="block px-4 py-3 text-sm text-muted-foreground">{image.caption}</span> : null}
          </button>
        ))}
      </div>

      {activeImage ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Event photo viewer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/90 p-4"
        >
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-white">
              {activeIndex! + 1} / {images.length}
            </span>
            <Button type="button" size="icon" variant="outline" className="rounded-full bg-white text-[#0F172A]" onClick={close} aria-label="Close gallery">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Button type="button" size="icon" variant="outline" className="absolute left-4 rounded-full bg-white text-[#0F172A]" onClick={previous} aria-label="Previous image">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="relative h-[72vh] w-full max-w-5xl">
            <Image
              src={activeImage.src}
              alt={activeImage.alt ?? 'Phonics Club event photograph'}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
          <Button type="button" size="icon" variant="outline" className="absolute right-4 rounded-full bg-white text-[#0F172A]" onClick={next} aria-label="Next image">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      ) : null}
    </>
  )
}

