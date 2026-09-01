import Link from 'next/link'
import { deleteTrainingEventAction, getAdminTrainingEvents, getTrainingRegistrations } from '@/actions/training'
import { TrainingEventForm } from '@/components/admin/training-event-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LmsEmptyState, LmsPageHeader, LmsSectionCard, LmsStatCard } from '@/components/lms/lms-primitives'
import { Calendar, CalendarClock, FileText, Trash2, Users } from 'lucide-react'
import type { TrainingEvent } from '@/types/database'

export const dynamic = 'force-dynamic'

type RegistrationRow = Record<string, any>

function formatDate(value?: string | null) {
  if (!value) return 'Date not set'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-PK', { dateStyle: 'medium' })
}

function sessionTypeLabel(type: TrainingEvent['event_type']) {
  return type === 'online_webinar' ? 'Online webinar' : 'Onsite training'
}

function sessionTone(status: TrainingEvent['status']): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'cancelled') return 'destructive'
  if (status === 'closed' || status === 'draft') return 'outline'
  if (status === 'upcoming') return 'secondary'
  return 'default'
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function isUpcomingSession(event: TrainingEvent) {
  if (event.status === 'cancelled' || event.status === 'draft' || event.published === false) return false
  if (!event.event_date) return ['open', 'upcoming'].includes(event.status)
  return event.event_date >= todayKey()
}

function eventRegistrationKey(title?: unknown, date?: unknown) {
  return `${String(title ?? '').trim().toLowerCase()}|${String(date ?? '').trim()}`
}

function registrationCounts(registrations: RegistrationRow[]) {
  const counts = new Map<string, number>()
  registrations.forEach((registration) => {
    const key = eventRegistrationKey(registration.event_title, registration.event_date)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  return counts
}

function TrainingSessionCard({
  event,
  registrationCount,
}: {
  event: TrainingEvent
  registrationCount: number
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={sessionTone(event.status)} className="capitalize">{event.status}</Badge>
            <Badge variant={event.published ? 'secondary' : 'outline'}>{event.published ? 'Published' : 'Hidden'}</Badge>
            <Badge variant="outline">{registrationCount} registration{registrationCount === 1 ? '' : 's'}</Badge>
          </div>
          <h2 className="mt-3 break-words text-xl font-bold text-[#0F172A]">{event.title}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {sessionTypeLabel(event.event_type)} · {formatDate(event.event_date)}
            {event.season ? ` · ${event.season}` : ''}
          </p>
          {event.description ? <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-500">{event.description}</p> : null}
        </div>
        <form action={deleteTrainingEventAction.bind(null, event.id)}>
          <Button type="submit" size="sm" variant="destructive" className="w-fit rounded-xl">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </form>
      </div>
      <TrainingEventForm event={event} compact />
    </article>
  )
}

export default async function AdminTrainingSessionsPage() {
  const [events, registrations] = await Promise.all([
    getAdminTrainingEvents(),
    getTrainingRegistrations().catch(() => []),
  ])
  const counts = registrationCounts(registrations as RegistrationRow[])
  const upcomingEvents = events.filter(isUpcomingSession)
  const openEvents = events.filter((event) => event.status === 'open').length
  const webinarEvents = events.filter((event) => event.event_type === 'online_webinar').length

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <LmsPageHeader
        eyebrow="Training Sessions"
        title="Upcoming trainings and webinars"
        description="Separate admin view for scheduled onsite trainings and online webinars. Registration requests remain available in the Training Registrations tab."
        action={
          <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
            <Link href="/admin/trainings">
              <FileText className="mr-2 h-4 w-4" />
              Registrations
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LmsStatCard title="Upcoming" value={upcomingEvents.length} detail="Published future/open sessions" icon={CalendarClock} />
        <LmsStatCard title="All Sessions" value={events.length} detail="Admin-managed events" icon={Calendar} tone="blue" />
        <LmsStatCard title="Open" value={openEvents} detail="Accepting registration" icon={Users} tone="green" />
        <LmsStatCard title="Webinars" value={webinarEvents} detail="Online sessions" icon={FileText} tone="gold" />
      </div>

      <LmsSectionCard title="Add Training Session" icon={Calendar}>
        <TrainingEventForm />
      </LmsSectionCard>

      <LmsSectionCard
        title="Upcoming Sessions"
        description="These are the sessions admins need to see first."
        icon={CalendarClock}
      >
        {upcomingEvents.length ? (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <TrainingSessionCard
                key={event.id}
                event={event}
                registrationCount={counts.get(eventRegistrationKey(event.title, event.event_date)) ?? 0}
              />
            ))}
          </div>
        ) : (
          <LmsEmptyState
            icon={CalendarClock}
            title="No upcoming sessions visible"
            description="Add a published session with an upcoming date, or apply migration 030 if the training_events table is missing."
          />
        )}
      </LmsSectionCard>

      <LmsSectionCard title="All Training Sessions" icon={Calendar} className="mt-6">
        {events.length ? (
          <div className="space-y-4">
            {events.map((event) => (
              <TrainingSessionCard
                key={event.id}
                event={event}
                registrationCount={counts.get(eventRegistrationKey(event.title, event.event_date)) ?? 0}
              />
            ))}
          </div>
        ) : (
          <LmsEmptyState
            icon={Calendar}
            title="No training sessions found"
            description="Admin-managed training sessions will appear here after the training_events migration is applied."
          />
        )}
      </LmsSectionCard>
    </div>
  )
}
