'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Play } from 'lucide-react'
import { COMPANY } from '@/lib/company'
import type { SocialReel } from '@/lib/site-content'

const GRADIENTS = [
  'from-[#1D4ED8] to-[#60A5FA]',
  'from-[#D30000] to-[#FF6B6B]',
  'from-[#FBBF24] to-[#FCD34D]',
]

export function SocialProof({ reels }: { reels: SocialReel[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-[#D30000] uppercase tracking-wider">Follow Us</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#111827] mt-2 mb-4">Join Our Community</h2>
          <p className="text-[#475569] max-w-2xl mx-auto mb-6">
            Follow PHONICS CLUB on social media for phonics tips, training highlights, and classroom success stories
          </p>
          <Link
            href={COMPANY.social.instagram}
            target="_blank"
            className="inline-flex items-center gap-2 text-[#D30000] font-medium hover:text-[#D30000]/80"
          >
            <Instagram className="w-5 h-5" />
            @phonics.club
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {reels.map((reel, index) => {
            const isPlaying = activeId === reel.id
            const hasVideo = Boolean(reel.videoUrl)
            const gradient = GRADIENTS[index % GRADIENTS.length]

            return (
              <motion.div
                key={reel.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                onMouseEnter={() => hasVideo && setActiveId(reel.id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={() => {
                  if (hasVideo) setActiveId(isPlaying ? null : reel.id)
                  else if (reel.videoUrl) window.open(reel.videoUrl, '_blank')
                }}
              >
                {isPlaying && hasVideo ? (
                  <div className="absolute inset-0 bg-black flex items-center justify-center p-2">
                    <p className="text-white text-xs text-center">{reel.title}</p>
                    <a href={reel.videoUrl} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="w-10 h-10 text-white" />
                    </a>
                  </div>
                ) : reel.thumbnail ? (
                  <Image src={reel.thumbnail} alt={reel.title} fill className="object-cover" unoptimized />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
                    <div className="absolute inset-0 flex items-center justify-center text-white/40 text-3xl">
                      {index % 3 === 0 ? '📚' : index % 3 === 1 ? '✏️' : '🎓'}
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <p className="text-white text-xs font-medium">{reel.title}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
