'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function ReadingSuccessVideo({ videoUrl }: { videoUrl?: string | null }) {
  const [expanded, setExpanded] = useState(false)
  if (!videoUrl) return null

  return (
    <section className="bg-[#F8FAFC] px-4 py-16">
      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-semibold uppercase text-[#D30000]">Reading Success</p>
          <h2 className="mt-2 text-3xl font-bold text-[#111827]">Watch the Transformation</h2>
          <p className="mt-4 max-w-xl leading-7 text-[#475569]">
            See how confident reading begins to take shape when children receive explicit, joyful phonics instruction.
          </p>
        </div>

        <button
          type="button"
          onMouseEnter={() => setExpanded(true)}
          onFocus={() => setExpanded(true)}
          onClick={() => setExpanded(true)}
          className="group relative aspect-video overflow-hidden rounded-lg border bg-black text-left shadow-lg outline-none ring-[#1D4ED8] transition-transform hover:scale-[1.02] focus-visible:ring-2"
          aria-label="Play reading success video"
        >
          <video src={videoUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
          <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#1D4ED8] shadow">
            Play
          </span>
        </button>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center bg-[#0F172A]/82 px-4 py-6 backdrop-blur-sm">
          <div
            className="relative mt-6 w-full max-w-6xl overflow-hidden rounded-lg border border-white/20 bg-black shadow-2xl"
            onMouseLeave={() => setExpanded(false)}
          >
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/95 p-2 text-[#111827] shadow transition-colors hover:text-[#D30000]"
              aria-label="Close video"
            >
              <X className="h-5 w-5" />
            </button>
            <video src={videoUrl} autoPlay muted playsInline controls className="aspect-video h-full w-full object-contain" />
          </div>
        </div>
      )}
    </section>
  )
}
