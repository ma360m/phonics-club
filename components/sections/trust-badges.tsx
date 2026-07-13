'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import type { SchoolLogo } from '@/lib/site-content'

function LogoTile({ logo }: { logo: SchoolLogo }) {
  const content = (
    <div className="flex h-16 min-w-40 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-5 shadow-sm sm:h-20 sm:min-w-48">
      {logo.imageUrl ? (
        <Image
          src={logo.imageUrl}
          alt={logo.name}
          width={160}
          height={64}
          className="max-h-12 w-auto object-contain sm:max-h-14"
          unoptimized
        />
      ) : (
        <span className="text-center text-sm font-bold text-[#1D4ED8] sm:text-base">
          {logo.name}
        </span>
      )}
    </div>
  )

  if (logo.href) {
    return (
      <a href={logo.href} target="_blank" rel="noreferrer" className="block">
        {content}
      </a>
    )
  }

  return content
}

export function TrustBadges({ logos }: { logos: SchoolLogo[] }) {
  const tickerLogos = logos.length ? [...logos, ...logos] : []

  return (
    <section className="border-y border-[#E2E8F0] bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <p className="text-sm font-medium uppercase tracking-wider text-[#475569]">
            Tested at schools throughout Pakistan
          </p>
        </motion.div>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />
          <div className="flex w-max gap-4 pr-4 [animation:logo-ticker_35s_linear_infinite] hover:[animation-play-state:paused]">
            {tickerLogos.map((logo, index) => (
              <LogoTile key={`${logo.id}-${index}`} logo={logo} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
