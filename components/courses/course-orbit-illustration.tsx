'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

const orbitBalls = [
  { color: '#1D4ED8', angle: '0deg' },
  { color: '#60A5FA', angle: '60deg' },
  { color: '#FBBF24', angle: '120deg' },
  { color: '#F87171', angle: '180deg' },
  { color: '#10B981', angle: '240deg' },
  { color: '#8B5CF6', angle: '300deg' },
]

export function CourseOrbitIllustration() {
  const [orbitStarted, setOrbitStarted] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (orbitStarted) return

    const startOnScroll = () => {
      if (window.scrollY > 24) setOrbitStarted(true)
    }

    startOnScroll()
    window.addEventListener('scroll', startOnScroll, { passive: true })
    return () => window.removeEventListener('scroll', startOnScroll)
  }, [orbitStarted])

  useEffect(() => {
    if (orbitStarted) return

    const mobileAutoStart = window.matchMedia('(hover: none), (pointer: coarse)').matches
    const timer = mobileAutoStart ? window.setTimeout(() => setOrbitStarted(true), 500) : undefined
    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(
          ([entry]) => {
            if (entry?.isIntersecting) setOrbitStarted(true)
          },
          { threshold: 0.35 },
        )
      : null

    if (rootRef.current && observer) observer.observe(rootRef.current)
    return () => {
      if (timer) window.clearTimeout(timer)
      observer?.disconnect()
    }
  }, [orbitStarted])

  return (
    <div
      ref={rootRef}
      className="group/orbit relative mx-auto flex aspect-square w-full max-w-[340px] items-center justify-center sm:max-w-[390px] lg:max-w-none"
      onMouseEnter={() => setOrbitStarted(true)}
      onTouchStart={() => setOrbitStarted(true)}
      aria-hidden="true"
    >
      <style>{`
        @keyframes courseOrbit {
          from { transform: rotate(var(--orbit-angle)); }
          to { transform: rotate(calc(var(--orbit-angle) + 360deg)); }
        }
      `}</style>
      <div className="absolute inset-[8%] rounded-full border border-[#BFDBFE]/70" />
      {orbitBalls.map(({ color, angle }) => (
        <span
          key={angle}
          className={cn(
            'absolute left-1/2 top-1/2 h-0 w-0 motion-reduce:animate-none',
            orbitStarted && 'motion-safe:animate-[courseOrbit_10s_linear_infinite]',
          )}
          style={{ '--orbit-angle': angle } as CSSProperties}
        >
          <span
            className="block h-4 w-4 rounded-full shadow-sm ring-4 ring-white/70 sm:h-5 sm:w-5"
            style={{ backgroundColor: color, transform: 'translateX(clamp(132px, 21vw, 205px))' }}
          />
        </span>
      ))}

      <div className="relative flex h-[72%] w-[72%] flex-col items-center justify-center rounded-full border border-[#BFDBFE]/80 bg-white/50 text-center shadow-[0_24px_70px_rgba(29,78,216,0.16)] backdrop-blur-xl transition duration-300 group-hover/orbit:scale-[1.03] group-hover/orbit:shadow-[0_28px_90px_rgba(29,78,216,0.24)] motion-reduce:transition-none">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/65 text-[#1D4ED8] shadow-sm backdrop-blur">
          <GraduationCap className="h-9 w-9" />
        </div>
        <p className="text-2xl font-bold leading-tight tracking-normal text-[#0F172A] sm:text-3xl">
          Learning
          <br />
          Has No Limits
        </p>
        <p className="mt-4 text-sm font-medium text-slate-500">Learn &bull; Grow &bull; Achieve</p>
      </div>
    </div>
  )
}
