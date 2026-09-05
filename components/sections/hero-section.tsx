'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, BookOpen, Play, Star, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

function toYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    const pathParts = parsed.pathname.split('/').filter(Boolean)
    const videoId = host === 'youtu.be'
      ? pathParts[0]
      : host.includes('youtube.com')
        ? parsed.searchParams.get('v') ?? (pathParts[0] === 'embed' || pathParts[0] === 'shorts' ? pathParts[1] : undefined)
        : undefined
    const startSeconds = parsed.searchParams.get('t')?.replace('s', '') ?? ''
    const startParam = startSeconds ? `?start=${Number.parseInt(startSeconds, 10) || 0}` : ''
    return videoId ? `https://www.youtube.com/embed/${videoId}${startParam}` : null
  } catch {
    return null
  }
}

function isDirectVideo(url?: string | null) {
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url ?? '')
}

export function HeroSection({
  videoUrl,
  demoButtonUrl,
}: {
  videoUrl?: string | null
  demoButtonUrl?: string | null
}) {
  const embedUrl = toYouTubeEmbedUrl(videoUrl)
  const directVideo = isDirectVideo(videoUrl)
  const hasVideo = Boolean(videoUrl && (directVideo || embedUrl))

  return (
    <section className="relative max-w-full overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-white to-[#60A5FA]/10">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute right-10 top-20 h-72 w-72 rounded-full bg-[#1D4ED8]/10 blur-3xl" />
        <div className="absolute bottom-20 left-10 h-96 w-96 rounded-full bg-[#FBBF24]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-24">
        <div className={`grid min-w-0 items-center gap-8 lg:gap-16 ${hasVideo ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="min-w-0"
          >
            <div className="mb-4 inline-flex max-w-full items-start gap-2 rounded-full bg-[#1D4ED8]/10 px-4 py-2 sm:mb-6">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1D4ED8] animate-pulse" />
              <span className="min-w-0 break-words text-sm font-medium leading-5 text-[#1D4ED8]">
                PHONICS CLUB - Learn to read with confidence
              </span>
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-tight text-[#111827] sm:text-5xl lg:text-6xl">
              Teaching Children
              <br />
              to Read with
              <br />
              <span className="relative inline-block">
                Confidence.
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C50 4 150 4 198 10" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="mb-6 max-w-lg text-base text-[#475569] sm:mb-8 sm:text-lg">
              Premium phonics courses, workbooks, and tools trusted by parents and educators. Start your child&apos;s reading journey today.
            </p>

            <div className="mb-8 flex min-w-0 flex-col gap-3 sm:mb-10 sm:flex-row sm:gap-4">
              <Button asChild size="lg" className="h-11 w-full bg-[#D30000] px-4 text-sm text-white hover:bg-[#D30000]/90 sm:h-14 sm:w-auto sm:px-8 sm:text-base">
                <Link href="/courses">
                  Explore Courses
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              {demoButtonUrl || videoUrl ? (
                <Button asChild variant="outline" size="lg" className="h-11 w-full border-[#1D4ED8] px-4 text-sm text-[#1D4ED8] hover:bg-[#1D4ED8]/5 sm:h-14 sm:w-auto sm:text-base">
                  <a href={demoButtonUrl ?? videoUrl ?? '#'} target="_blank" rel="noreferrer">
                    <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Watch Demo
                  </a>
                </Button>
              ) : null}
            </div>

            <div className="grid max-w-full grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-8">
              <HeroStat icon={<Users className="h-5 w-5 text-[#1D4ED8] sm:h-6 sm:w-6" />} value="2.5K" label="Enrolled" tone="blue" />
              <HeroStat icon={<BookOpen className="h-5 w-5 text-[#FBBF24] sm:h-6 sm:w-6" />} value="200+" label="Courses" tone="gold" />
              <HeroStat icon={<Star className="h-5 w-5 text-[#D30000] sm:h-6 sm:w-6" />} value="4.9" label="Rating" tone="red" />
            </div>
          </motion.div>

          {hasVideo ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative min-w-0"
            >
              <div className="relative min-w-0">
                <div id="watch-demo" className="max-w-full scroll-mt-28 overflow-hidden rounded-xl bg-white p-3 shadow-xl sm:rounded-3xl sm:p-6 sm:shadow-2xl lg:p-8">
                  <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-black sm:mb-6 sm:rounded-2xl">
                    {directVideo ? (
                      <video src={videoUrl ?? ''} controls playsInline preload="metadata" className="h-full w-full object-contain" />
                    ) : (
                      <iframe
                        className="h-full w-full"
                        src={embedUrl ?? ''}
                        title="Meet Phonics Club"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    )}
                  </div>
                  <h3 className="mb-1 text-base font-bold text-[#111827] sm:mb-2 sm:text-lg">Meet Phonics Club</h3>
                  <p className="mb-1 text-xs text-[#475569] sm:mb-4 sm:text-sm">
                    An introduction to our phonics learning community and trusted educational resources.
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="absolute -left-4 top-1/4 hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xl sm:block lg:-left-8"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-[#1D4ED8] to-[#60A5FA]" />
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">2.5K</p>
                      <p className="text-xs text-[#475569]">Enrolled</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="absolute -right-4 bottom-1/4 hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xl sm:block lg:-right-8"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBBF24]/10">
                      <svg className="h-5 w-5 text-[#FBBF24]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">Certified</p>
                      <p className="text-xs text-[#475569]">Get Certificate</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function HeroStat({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode
  value: string
  label: string
  tone: 'blue' | 'gold' | 'red'
}) {
  const background = {
    blue: 'bg-[#1D4ED8]/10',
    gold: 'bg-[#FBBF24]/10',
    red: 'bg-[#D30000]/10',
  }[tone]

  return (
    <div className="min-w-0 rounded-2xl bg-white/55 p-2 sm:flex sm:items-center sm:gap-3 sm:bg-transparent sm:p-0">
      <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl sm:mx-0 sm:h-12 sm:w-12 ${background}`}>
        {icon}
      </div>
      <div className="min-w-0 text-center sm:text-left">
        <p className="text-base font-bold text-[#111827] sm:text-xl">{value}</p>
        <p className="break-words text-xs text-[#475569] sm:text-sm">{label}</p>
      </div>
    </div>
  )
}
