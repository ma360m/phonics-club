import Image from 'next/image'
import type { BlogGalleryImage } from '@/types/database'

export function BlogGalleryLightbox({ images }: { images: BlogGalleryImage[] }) {
  if (!images.length) return null

  const tickerImages = images.length > 1 ? [...images, ...images] : images

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-none px-6 py-6 sm:px-8 lg:px-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Gallery</p>
            <h2 className="mt-2 text-2xl font-bold text-[#0F172A]">Event Photo Gallery</h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">{images.length} photo{images.length === 1 ? '' : 's'}</p>
        </div>
        <div className="pc-gallery-ticker overflow-hidden" aria-label="Event photo gallery ticker">
          <div className={`pc-gallery-ticker-track flex w-max gap-5 ${images.length === 1 ? 'pc-gallery-ticker-track-static' : ''}`}>
            {tickerImages.map((image, index) => (
              <figure
                key={`${image.src}-${index}`}
                aria-hidden={index >= images.length ? true : undefined}
                className="w-[76vw] shrink-0 overflow-hidden rounded-lg border bg-white shadow-sm sm:w-[340px] lg:w-[390px]"
              >
                <div className="relative aspect-[4/3] bg-slate-50">
                  <Image
                    src={image.src}
                    alt={image.alt ?? 'Phonics Club event photograph'}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 640px) 76vw, (max-width: 1024px) 340px, 390px"
                  />
                </div>
                {image.caption ? <figcaption className="px-4 py-3 text-sm text-muted-foreground">{image.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
