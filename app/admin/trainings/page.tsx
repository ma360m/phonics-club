import { getTrainingRegistrations } from '@/actions/training'
import { formatDate } from '@/utils/format'
import { Badge } from '@/components/ui/badge'
import { TRAINING_MONTHS_2026 } from '@/lib/company'

const trainingMonthLabels = Object.fromEntries(TRAINING_MONTHS_2026.map((month) => [month.value, month.label]))

export default async function AdminTrainingsPage() {
  const registrations = await getTrainingRegistrations()

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Training Registrations</h1>
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
    </div>
  )
}
