'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, GraduationCap, Instagram, Play, X } from 'lucide-react'
import { COMPANY } from '@/lib/company'
import type { SocialReel } from '@/lib/site-content'

const GRADIENTS = [
  'from-[#1D4ED8] to-[#60A5FA]',
  'from-[#D30000] to-[#FF6B6B]',
  'from-[#FBBF24] to-[#FCD34D]',
]

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url)
}

function isStudentProgressTile(title: string) {
  return /student\s+(progress|success)/i.test(title)
}

export function SocialProof({
  reels,
  studentSuccessVideoUrl,
}: {
  reels: SocialReel[]
  studentSuccessVideoUrl?: string | null
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-[#D30000]">Follow Us</span>
          <h2 className="mb-4 mt-2 text-3xl font-bold text-[#111827] lg:text-4xl">Join Our Community</h2>
          <p className="mx-auto mb-6 max-w-2xl text-[#475569]">
            Follow PHONICS CLUB on social media for phonics tips, training highlights, and classroom success stories.
          </p>
          <Link
            href={COMPANY.social.instagram}
            target="_blank"
            className="inline-flex items-center gap-2 font-medium text-[#D30000] hover:text-[#D30000]/80"
          >
            <Instagram className="h-5 w-5" />
            @phonics.club
          </Link>
          <p className="mx-auto mt-5 max-w-4xl text-base font-bold leading-7 text-[#0F172A] sm:text-lg">
            Learning in Action | At Beginning International School, Kashmir | Ms Nadia Habib
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {reels.map((reel, index) => {
            const studentTile = isStudentProgressTile(reel.title)
            const videoUrl = isStudentProgressTile(reel.title) && studentSuccessVideoUrl
              ? studentSuccessVideoUrl
              : reel.videoUrl
            const directVideo = isDirectVideo(videoUrl)
            const showFloatingVideo = directVideo && (activeId === reel.id || hoveredId === reel.id)
            const hasExternalVideo = Boolean(reel.videoUrl) && !directVideo
            const gradient = studentTile ? 'from-[#1D4ED8] to-[#FBBF24]' : GRADIENTS[index % GRADIENTS.length]
            const Icon = studentTile ? BookOpen : index % 2 === 0 ? BookOpen : GraduationCap

            return (
              <motion.div
                key={reel.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative aspect-square"
                onMouseEnter={() => {
                  if (directVideo) setHoveredId(reel.id)
                }}
                onMouseLeave={() => {
                  if (hoveredId === reel.id) setHoveredId(null)
                }}
              >
                {showFloatingVideo ? (
                  <div className="absolute bottom-[calc(100%+12px)] left-1/2 z-30 w-[min(82vw,360px)] -translate-x-1/2 overflow-hidden rounded-lg border border-white/30 bg-black shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setActiveId(null)
                        setHoveredId(null)
                      }}
                      className="absolute right-2 top-2 z-10 rounded-full bg-white/95 p-1.5 text-[#111827] shadow hover:text-[#D30000]"
                      aria-label={`Close ${reel.title} video`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <video
                      src={videoUrl}
                      autoPlay
                      muted
                      playsInline
                      controls
                      className="aspect-video h-full w-full object-contain"
                    />
                  </div>
                ) : null}

                <button
                  type="button"
                  className="group relative h-full w-full cursor-pointer overflow-hidden rounded-lg bg-muted text-left outline-none ring-[#1D4ED8] focus-visible:ring-2"
                  onFocus={() => {
                    if (directVideo) setHoveredId(reel.id)
                  }}
                  onBlur={() => {
                    if (hoveredId === reel.id) setHoveredId(null)
                  }}
                  onClick={() => {
                    if (directVideo) setActiveId(activeId === reel.id ? null : reel.id)
                    else if (hasExternalVideo) window.open(reel.videoUrl, '_blank', 'noopener,noreferrer')
                  }}
                  aria-label={directVideo ? `Play ${reel.title} video` : reel.title}
                >
                  {reel.thumbnail ? (
                    <Image src={reel.thumbnail} alt={reel.title} fill className="object-cover" unoptimized />
                  ) : directVideo && !studentTile ? (
                    <video src={videoUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
                      <div className="absolute inset-0 flex items-center justify-center text-white/70">
                        <Icon className="h-10 w-10" />
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 transition-opacity group-hover:bg-black/40">
                    {videoUrl ? (
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#1D4ED8] shadow">
                        <Play className="h-5 w-5 fill-current" />
                      </span>
                    ) : null}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-xs font-medium text-white">{reel.title}</p>
                  </div>
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
