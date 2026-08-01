'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function ContactForm() {
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    toast.success('Message sent! We will reply to your email shortly.')
    setPending(false)
    event.currentTarget.reset()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl border p-6 space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input name="name" required className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input name="email" type="email" required className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea name="message" required rows={5} className="rounded-xl" />
      </div>
      <Button type="submit" disabled={pending} className="w-full rounded-xl bg-[#D30000]">
        {pending ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  )
}
