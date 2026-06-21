'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'

const SCHOOL_STRIPS = [
  { src: '/images/schools/partners-strip-1.png', alt: 'Quixotic Academy, GMCI, Ayan Montessori, Purple Pulpo, Froebels, LGS' },
  { src: '/images/schools/partners-strip-2.png', alt: 'Beaconhouse, RWIS, Dynamic International, Academus, ALDA, Horizon School' },
]

const SCHOOL_NAMES = [
  'Starfish School', 'Quixotic Academy', 'LGS', "Froebel's International", 'Ayan Montessori',
  'Beaconhouse', 'RWIS', 'Dynamic International', 'Academus', 'ALDA', 'Horizon School System',
]

export function TrustBadges() {
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' })

  return (
    <section className="py-12 bg-white border-y border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <p className="text-sm font-medium text-[#475569] uppercase tracking-wider">
            Tested at schools throughout Pakistan
          </p>
          <p className="text-xs text-muted-foreground mt-2 max-w-2xl mx-auto">
            {SCHOOL_NAMES.join(' · ')}
          </p>
        </motion.div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-8">
            {SCHOOL_STRIPS.map((strip) => (
              <div key={strip.src} className="flex-[0_0_100%] min-w-0 px-4">
                <div className="relative h-20 sm:h-24 w-full">
                  <Image
                    src={strip.src}
                    alt={strip.alt}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
