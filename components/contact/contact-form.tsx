'use client'

import { useActionState } from 'react'
import { submitContactAction } from '@/actions/contact'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false }

interface ContactFormProps {
  defaultSubject?: string
  defaultMessage?: string
  recoveryMode?: boolean
}

export function ContactForm({
  defaultSubject = '',
  defaultMessage = '',
  recoveryMode = false,
}: ContactFormProps) {
  const [state, formAction, pending] = useActionState(submitContactAction, initialState)

  if (state.success) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-2xl p-6 text-center">
        <p className="font-semibold text-emerald-800 dark:text-emerald-200">Message sent.</p>
        <p className="text-sm text-muted-foreground mt-2">
          We will reply to your email shortly.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="bg-card rounded-2xl border p-6 space-y-4">
      <input type="hidden" name="recovery_mode" value={recoveryMode ? 'true' : 'false'} />

      {recoveryMode && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          For account protection, include your registered email, phone or WhatsApp number, and full name. Admin will verify the request before issuing a new username and password.
        </div>
      )}
      {state.error && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input id="contact-name" name="name" required className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input id="contact-email" name="email" type="email" required className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input id="contact-subject" name="subject" defaultValue={defaultSubject} className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          defaultValue={defaultMessage}
          className="rounded-xl"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full rounded-xl bg-[#D30000]">
        {pending ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  )
}
