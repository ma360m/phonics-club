import { getAdminTrainers } from '@/actions/admin/trainers'
import { TrainersAdmin } from '@/components/admin/trainers-admin'

export default async function AdminTrainersPage() {
  const trainers = await getAdminTrainers().catch(() => [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Certified Trainers</h1>
      <p className="text-muted-foreground mb-8">Add, edit, or remove trainers shown on /certified-trainers</p>
      <TrainersAdmin trainers={trainers as { id: string; name: string; title?: string }[]} />
    </div>
  )
}
