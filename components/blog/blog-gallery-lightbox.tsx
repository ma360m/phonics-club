import Image from 'next/image'
import type { BlogGalleryImage } from '@/types/database'

export function BlogGalleryLightbox({ images }: { images: BlogGalleryImage[] }) {
  if (!images.length) return null

  return (
    <details className="group rounded-2xl border bg-white p-5 shadow-sm">
      <summary className="flex cursor-pointer list-none flex-col gap-4 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Gallery</p>
          <h2 className="mt-2 text-2xl font-bold text-[#0F172A]">Event Photo Gallery</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A visual record from this Phonics Club event.
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-semibold text-[#1D4ED8] transition-colors group-open:bg-[#1D4ED8] group-open:text-white">
          <span className="group-open:hidden">Show gallery ({images.length})</span>
          <span className="hidden group-open:inline">Hide gallery</span>
        </span>
      </summary>
      <div className="mt-8 overflow-x-auto pb-4 [scrollbar-color:#1D4ED8_#DBEAFE] [scrollbar-width:thin]">
        <div className="flex snap-x snap-mandatory gap-5">
          {images.map((image, index) => (
            <figure key={`${image.src}-${index}`} className="min-w-[82%] snap-start overflow-hidden rounded-xl border bg-white shadow-sm sm:min-w-[46%] lg:min-w-[31%]">
              <div className="relative aspect-[4/3] bg-slate-50">
                <Image
                  src={image.src}
                  alt={image.alt ?? 'Phonics Club event photograph'}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              {image.caption ? <figcaption className="px-4 py-3 text-sm text-muted-foreground">{image.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      </div>
    </details>
  )
}
