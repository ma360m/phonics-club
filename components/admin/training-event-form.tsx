'use client'

import { useActionState } from 'react'
import { upsertTrainingEventAction } from '@/actions/training'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ActionResult } from '@/types'
import type { TrainingEvent } from '@/types/database'

const initialState: ActionResult = { success: false }

export function TrainingEventForm({ event, compact = false }: { event?: TrainingEvent; compact?: boolean }) {
  const [state, formAction, pending] = useActionState(upsertTrainingEventAction, initialState)

  return (
    <form action={formAction} className={compact ? 'grid gap-3 md:grid-cols-12 md:items-end' : 'rounded-2xl border bg-card p-5 shadow-sm'}>
      {event?.id ? <input type="hidden" name="id" value={event.id} /> : null}

      {!compact && (
        <div className="mb-4">
          <h2 className="text-lg font-bold">Add Upcoming Training or Webinar</h2>
          <p className="mt-1 text-sm text-muted-foreground">Published items appear on the public Trainings page.</p>
        </div>
      )}

      {state.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-12">{state.error}</p>}
      {state.success && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-12">Training event saved.</p>}

      <label className={compact ? 'space-y-1 md:col-span-3' : 'space-y-2'}>
        <Label>Title</Label>
        <Input name="title" defaultValue={event?.title ?? ''} required className="rounded-xl" />
      </label>

      <label className={compact ? 'space-y-1 md:col-span-2' : 'mt-4 block space-y-2'}>
        <Label>Type</Label>
        <select name="event_type" defaultValue={event?.event_type ?? 'onsite_training'} className="w-full rounded-xl border bg-background px-3 py-2 text-sm">
          <option value="onsite_training">Onsite training</option>
          <option value="online_webinar">Online webinar</option>
        </select>
      </label>

      <label className={compact ? 'space-y-1 md:col-span-2' : 'mt-4 block space-y-2'}>
        <Label>Date</Label>
        <Input name="event_date" type="date" defaultValue={event?.event_date ?? ''} className="rounded-xl" />
      </label>

      <label className={compact ? 'space-y-1 md:col-span-2' : 'mt-4 block space-y-2'}>
        <Label>Status</Label>
        <select name="status" defaultValue={event?.status ?? 'open'} className="w-full rounded-xl border bg-background px-3 py-2 text-sm">
          <option value="open">Open</option>
          <option value="upcoming">Upcoming</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
          <option value="draft">Draft</option>
        </select>
      </label>

      <label className={compact ? 'space-y-1 md:col-span-1' : 'mt-4 block space-y-2'}>
        <Label>Sort</Label>
        <Input name="sort_order" type="number" min={0} defaultValue={event?.sort_order ?? 100} className="rounded-xl" />
      </label>

      <label className={compact ? 'space-y-1 md:col-span-2' : 'mt-4 block space-y-2'}>
        <Label>Season</Label>
        <Input name="season" defaultValue={event?.season ?? ''} placeholder="August Cohort" className="rounded-xl" />
      </label>

      <label className={compact ? 'space-y-1 md:col-span-10' : 'mt-4 block space-y-2'}>
        <Label>Description</Label>
        <Textarea name="description" defaultValue={event?.description ?? ''} rows={compact ? 2 : 3} className="rounded-xl" />
      </label>

      <div className={compact ? 'flex items-center justify-between gap-3 md:col-span-2' : 'mt-4 flex flex-wrap items-center justify-between gap-3'}>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={event?.published ?? true} />
          Published
        </label>
        <Button type="submit" disabled={pending} size={compact ? 'sm' : 'default'} className="rounded-xl bg-[#1D4ED8]">
          {pending ? 'Saving...' : event ? 'Save' : 'Add'}
        </Button>
      </div>
    </form>
  )
}
