'use client'

import { useState } from 'react'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'
import { COMPANY } from '@/lib/company'
import { Mail, Phone, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export default function ContactPage() {
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    await new Promise((r) => setTimeout(r, 800))
    toast.success('Message sent! We will reply to your email shortly.')
    setPending(false)
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4 text-center">Contact Us</h1>
        <p className="text-muted-foreground text-center mb-12">{COMPANY.name}</p>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <a href={`mailto:${COMPANY.adminEmail}`} className="flex items-center gap-3 text-muted-foreground hover:text-[#1D4ED8]">
              <Mail className="w-5 h-5 shrink-0" />
              <span>{COMPANY.adminEmail}</span>
            </a>
            <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-3 text-muted-foreground hover:text-[#1D4ED8]">
              <Mail className="w-5 h-5 shrink-0" />
              <span>{COMPANY.email}</span>
            </a>
            <a href={`tel:${COMPANY.phoneIntl}`} className="flex items-center gap-3 text-muted-foreground hover:text-[#1D4ED8]">
              <Phone className="w-5 h-5 shrink-0" />
              <span>{COMPANY.phoneDisplay}</span>
            </a>
            <a href={`tel:${COMPANY.phoneAltIntl}`} className="flex items-center gap-3 text-muted-foreground hover:text-[#1D4ED8]">
              <Phone className="w-5 h-5 shrink-0" />
              <span>{COMPANY.phoneAltDisplay}</span>
            </a>
            <p className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="w-5 h-5 shrink-0" />
              {COMPANY.address}
            </p>
            <WhatsAppButton />
          </div>

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
        </div>
      </div>
      <Footer />
    </main>
  )
}
