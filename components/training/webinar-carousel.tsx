'use client'

import { useRef } from 'react'
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrainingRegistrationForm } from '@/components/training/training-registration-form'
import { formatDate } from '@/utils/format'

interface Webinar {
  title: string
  date: string
  status: string
}

export function WebinarCarousel({ webinars }: { webinars: Webinar[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const webinarNames = webinars.map((webinar) => webinar.title)

  const scroll = (direction: 'left' | 'right') => {
    const scroller = scrollerRef.current
    if (!scroller) return
    scroller.scrollBy({
      left: direction === 'left' ? -scroller.clientWidth * 0.85 : scroller.clientWidth * 0.85,
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Swipe sideways to browse webinars.</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="icon" className="rounded-full" onClick={() => scroll('left')} aria-label="Previous webinar">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" className="rounded-full" onClick={() => scroll('right')} aria-label="Next webinar">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:thin]"
      >
        {webinars.map((webinar) => (
          <article
            key={webinar.title}
            className="min-w-[min(88vw,460px)] snap-start rounded-2xl border bg-card p-6 shadow-sm md:min-w-[520px]"
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge className={webinar.status === 'open' ? 'bg-emerald-600' : ''}>{webinar.status}</Badge>
                <h3 className="mt-3 text-xl font-bold">{webinar.title}</h3>
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(webinar.date)}
                </p>
              </div>
            </div>
            <TrainingRegistrationForm
              trainingType="online_webinar"
              eventTitle={webinar.title}
              eventDate={webinar.date}
              eventOptions={webinarNames}
            />
          </article>
        ))}
      </div>
    </div>
  )
}
