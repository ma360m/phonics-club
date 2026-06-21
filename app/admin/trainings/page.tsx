import { getTrainingRegistrations } from '@/actions/training'
import { formatDate } from '@/utils/format'
import { Badge } from '@/components/ui/badge'

export default async function AdminTrainingsPage() {
  const registrations = await getTrainingRegistrations()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Training Registrations</h1>
      {registrations.length === 0 ? (
        <p className="text-muted-foreground">No registrations yet. Run migration 002_trainings_coupons.sql in Supabase.</p>
      ) : (
        <div className="space-y-4">
          {registrations.map((r: Record<string, string>) => (
            <div key={r.id} className="bg-card rounded-2xl border p-5">
              <div className="flex flex-wrap justify-between gap-2 mb-2">
                <h3 className="font-semibold">{r.full_name}</h3>
                <Badge>{r.training_type}</Badge>
              </div>
              <p className="text-sm"><strong>Event:</strong> {r.event_title}</p>
              <p className="text-sm text-muted-foreground">{r.email} · {r.phone}</p>
              {r.organization && <p className="text-sm">{r.organization}</p>}
              {r.message && <p className="text-sm mt-2">{r.message}</p>}
              <p className="text-xs text-muted-foreground mt-2">{formatDate(r.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
