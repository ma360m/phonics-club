'use client'

import { useActionState } from 'react'
import { createTrainerAction, deleteTrainerAction } from '@/actions/admin/trainers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Trash2 } from 'lucide-react'
import type { ActionResult } from '@/types'

const initial: ActionResult = { success: false }

function TrainerForm() {
  const [state, formAction, pending] = useActionState(createTrainerAction, initial)
  return (
    <form action={formAction} className="bg-card rounded-2xl border p-6 space-y-4 max-w-lg">
      <h2 className="font-semibold">Add Trainer</h2>
      {state.success && <p className="text-emerald-600 text-sm">Trainer added!</p>}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input name="name" required className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input name="title" defaultValue="Jolly Phonics Certified Trainer" className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea name="bio" className="rounded-xl" rows={2} />
      </div>
      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input name="image_url" className="rounded-xl" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked /> Published
      </label>
      <Button type="submit" disabled={pending} className="rounded-xl bg-[#1D4ED8]">Add Trainer</Button>
    </form>
  )
}

export function TrainersAdmin({ trainers }: { trainers: { id: string; name: string; title?: string }[] }) {
  return (
    <div className="space-y-8">
      <TrainerForm />
      <div className="space-y-3">
        {trainers.map((t) => (
          <div key={t.id} className="flex justify-between items-center bg-card rounded-xl border p-4">
            <div>
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.title}</p>
            </div>
            <form action={deleteTrainerAction.bind(null, t.id)}>
              <Button type="submit" size="sm" variant="destructive" className="rounded-lg">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
