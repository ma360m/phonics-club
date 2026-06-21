'use client'

import { useActionState } from 'react'
import { submitTrainingRegistrationAction } from '@/actions/training'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ActionResult } from '@/types'

const initial: ActionResult = { success: false }

interface Props {
  trainingType: 'online_webinar' | 'onsite_classroom'
  eventTitle: string
  eventDate?: string
}

export function TrainingRegistrationForm({ trainingType, eventTitle, eventDate }: Props) {
  const [state, formAction, pending] = useActionState(submitTrainingRegistrationAction, initial)

  if (state.success) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-2xl p-6 text-center">
        <p className="font-semibold text-emerald-800 dark:text-emerald-200">Registration submitted!</p>
        <p className="text-sm text-muted-foreground mt-2">We will contact you at your email shortly.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4 bg-card rounded-2xl border p-6">
      <input type="hidden" name="training_type" value={trainingType} />
      <input type="hidden" name="event_title" value={eventTitle} />
      {eventDate && <input type="hidden" name="event_date" value={eventDate} />}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Name *</Label>
          <Input name="full_name" required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input name="email" type="email" required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Phone / WhatsApp</Label>
          <Input name="phone" className="rounded-xl" placeholder="03084432015" />
        </div>
        <div className="space-y-2">
          <Label>School / Organization</Label>
          <Input name="organization" className="rounded-xl" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea name="message" rows={3} className="rounded-xl" placeholder="Any questions or special requirements..." />
      </div>
      <Button type="submit" disabled={pending} className="w-full rounded-xl bg-[#1D4ED8]">
        {pending ? 'Submitting...' : 'Register / Request Training'}
      </Button>
    </form>
  )
}
