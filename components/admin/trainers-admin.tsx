'use client'

import { useActionState } from 'react'
import { createTrainerAction, deleteTrainerAction, updateTrainerAction } from '@/actions/admin/trainers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Trash2 } from 'lucide-react'
import type { ActionResult } from '@/types'
import type { Trainer } from '@/types/database'

const initial: ActionResult = { success: false }

function listToText(value?: string[] | null) {
  return (value ?? []).join('\n')
}

function TrainerFields({ trainer }: { trainer?: Partial<Trainer> }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input name="name" defaultValue={trainer?.name ?? ''} required className="rounded-lg" />
        </div>
        <div className="space-y-2">
          <Label>Profile Slug</Label>
          <Input name="slug" defaultValue={trainer?.slug ?? ''} placeholder="fatima-tuz-zahra" className="rounded-lg" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input name="title" defaultValue={trainer?.title ?? 'Jolly Phonics Certified Trainer'} className="rounded-lg" />
        </div>
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input name="sort_order" type="number" defaultValue={trainer?.sort_order ?? 0} className="rounded-lg" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea name="bio" defaultValue={trainer?.bio ?? ''} className="rounded-lg" rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Profile Details</Label>
        <Textarea name="profile_details" defaultValue={trainer?.profile_details ?? ''} className="rounded-lg" rows={4} />
      </div>
      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input name="image_url" defaultValue={trainer?.image_url ?? ''} className="rounded-lg" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Achievements</Label>
          <Textarea name="achievements" defaultValue={listToText(trainer?.achievements)} className="rounded-lg" rows={5} placeholder="One achievement per line" />
        </div>
        <div className="space-y-2">
          <Label>Credentials</Label>
          <Textarea name="credentials" defaultValue={listToText(trainer?.credentials)} className="rounded-lg" rows={5} placeholder="One credential per line" />
        </div>
        <div className="space-y-2">
          <Label>Specialties</Label>
          <Textarea name="specialties" defaultValue={listToText(trainer?.specialties)} className="rounded-lg" rows={5} placeholder="One specialty per line" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={trainer?.published ?? true} /> Published
      </label>
    </>
  )
}

function TrainerCreateForm() {
  const [state, formAction, pending] = useActionState(createTrainerAction, initial)
  return (
    <form action={formAction} className="max-w-3xl space-y-4 rounded-lg border bg-card p-6">
      <h2 className="font-semibold">Add Trainer</h2>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Trainer added.</p> : null}
      <TrainerFields />
      <Button type="submit" disabled={pending} className="rounded-lg bg-[#1D4ED8]">
        {pending ? 'Adding...' : 'Add Trainer'}
      </Button>
    </form>
  )
}

function TrainerEditForm({ trainer }: { trainer: Trainer }) {
  const [state, formAction, pending] = useActionState(updateTrainerAction.bind(null, trainer.id), initial)

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{trainer.name}</h3>
          <p className="text-sm text-muted-foreground">/certified-trainers/{trainer.slug}</p>
        </div>
        <form action={deleteTrainerAction.bind(null, trainer.id)}>
          <Button type="submit" size="sm" variant="destructive" className="rounded-lg">
            <Trash2 className="h-4 w-4" />
          </Button>
        </form>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-600">Trainer updated.</p> : null}
      <form action={formAction} className="space-y-4">
        <TrainerFields trainer={trainer} />
        <Button type="submit" disabled={pending} className="rounded-lg bg-[#1D4ED8]">
          {pending ? 'Saving...' : 'Save Trainer'}
        </Button>
      </form>
    </div>
  )
}

export function TrainersAdmin({ trainers }: { trainers: Trainer[] }) {
  return (
    <div className="space-y-8">
      <TrainerCreateForm />
      <div className="space-y-5">
        {trainers.map((trainer) => (
          <TrainerEditForm key={trainer.id} trainer={trainer} />
        ))}
      </div>
    </div>
  )
}
