import { deleteTrainingEventAction, getAdminTrainingEvents, getTrainingRegistrations } from '@/actions/training'
import { TrainingEventForm } from '@/components/admin/training-event-form'
import { formatDate } from '@/utils/format'
import { Badge } from '@/components/ui/badge'
import { TRAINING_MONTHS_2026 } from '@/lib/company'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

const trainingMonthLabels = Object.fromEntries(TRAINING_MONTHS_2026.map((month) => [month.value, month.label]))

export default async function AdminTrainingsPage() {
  const [events, registrations] = await Promise.all([
    getAdminTrainingEvents(),
    getTrainingRegistrations(),
  ])

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold">Trainings & Webinars</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add upcoming onsite trainings and online webinars for the public Trainings page.
          </p>
        </div>
        <TrainingEventForm />

        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="rounded-2xl border border-dashed bg-card p-5 text-sm text-muted-foreground">
              No admin-managed training events yet. Apply migration 030 in Supabase, then add the first event here.
            </p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="rounded-2xl border bg-card p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.event_type === 'online_webinar' ? 'Online webinar' : 'Onsite training'}
                      {event.event_date ? ` - ${formatDate(event.event_date)}` : ''}
                      {event.season ? ` - ${event.season}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={event.published ? 'default' : 'outline'}>{event.published ? event.status : 'unpublished'}</Badge>
                    <form action={deleteTrainingEventAction.bind(null, event.id)}>
                      <Button type="submit" size="icon" variant="destructive" className="h-8 w-8 rounded-lg" aria-label={`Delete ${event.title}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>
                </div>
                <TrainingEventForm event={event} compact />
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold">Training Registrations</h2>
        {registrations.length === 0 ? (
          <p className="text-muted-foreground">No registrations yet. Run migration 002_trainings_coupons.sql in Supabase.</p>
        ) : (
          <div className="space-y-4">
            {registrations.map((r: Record<string, string | number | null>) => (
            <div key={String(r.id)} className="rounded-2xl border bg-card p-5">
              <div className="mb-2 flex flex-wrap justify-between gap-2">
                <h3 className="font-semibold">{r.full_name}</h3>
                <Badge>{r.training_type}</Badge>
              </div>
              <p className="text-sm">
                <strong>Event:</strong> {r.event_title}
              </p>
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                {r.preferred_month && (
                  <p>
                    <strong>Preferred month:</strong> {trainingMonthLabels[String(r.preferred_month)] ?? r.preferred_month}
                  </p>
                )}
                {r.approx_participants && (
                  <p>
                    <strong>Approx. participants:</strong> {r.approx_participants}
                  </p>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {r.email} - {r.phone || 'No phone'}
              </p>
              {r.organization && <p className="text-sm">{r.organization}</p>}
              {r.message && <p className="mt-2 whitespace-pre-line text-sm">{r.message}</p>}
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(String(r.created_at))}</p>
            </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
