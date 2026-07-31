import Image from 'next/image'
import { Camera, Images } from 'lucide-react'
import type { ContentImage, HomepageGalleryContent } from '@/lib/site-content'

function GalleryGrid({ images, compact = false }: { images: ContentImage[]; compact?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {images.map((image, index) => {
        const featured = !compact && (index === 0 || index === 5)
        return (
          <figure
            key={image.src}
            className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
              featured ? 'sm:col-span-2' : ''
            }`}
          >
            <div className={`relative ${featured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                sizes={featured ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 100vw, 25vw'}
              />
            </div>
          </figure>
        )
      })}
    </div>
  )
}

export function PublicGallerySection({ gallery }: { gallery: HomepageGalleryContent }) {
  if (!gallery.enabled || !gallery.images.length) return null

  const featuredImages = gallery.images.slice(0, 8)
  const additionalImages = gallery.images.slice(8)

  return (
    <section className="border-y border-slate-200 bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#D30000]">
              <Camera className="h-4 w-4" />
              Gallery
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-[#0F172A] sm:text-4xl">
              {gallery.title}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            {gallery.subtitle}
          </p>
        </div>

        <GalleryGrid images={featuredImages} />

        {additionalImages.length > 0 ? (
          <details className="group mt-6">
            <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#1D4ED8] shadow-sm transition hover:border-[#1D4ED8]/40 hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]">
              <Images className="h-4 w-4" />
              <span className="group-open:hidden">See more gallery photos</span>
              <span className="hidden group-open:inline">Show fewer gallery photos</span>
            </summary>
            <div className="mt-5">
              <GalleryGrid images={additionalImages} compact />
            </div>
          </details>
        ) : null}
      </div>
    </section>
  )
}
