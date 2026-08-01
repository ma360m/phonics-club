import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { ContactForm } from '@/components/contact/contact-form'
import { Button } from '@/components/ui/button'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'
import { COMPANY } from '@/lib/company'
import { buildMetadata } from '@/utils/seo'
import { Mail, MapPin, Phone } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Contact Us',
  description: 'Contact Phonics Club for orders, courses, training, consultancy, and account support.',
  path: '/contact',
})

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>
}) {
  const { topic } = await searchParams
  const isAccountRecovery = topic === 'account-recovery'
  const defaultSubject = isAccountRecovery ? 'Account recovery request' : ''
  const defaultMessage = isAccountRecovery
    ? 'Hello Phonics Club, I need admin help securing and resetting my account.\n\nRegistered email:\nFull name:\nPhone / WhatsApp:\n'
    : ''

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4 text-center">
          {isAccountRecovery ? 'Account Recovery Support' : 'Contact Us'}
        </h1>
        <p className="text-muted-foreground text-center mb-12">
          {isAccountRecovery
            ? 'For your protection, password reset requests are verified by Phonics Club admin before new login details are issued.'
            : COMPANY.name}
        </p>

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
            <div className="flex flex-col gap-3 sm:flex-row">
              <WhatsAppButton />
              {isAccountRecovery && (
                <Button asChild variant="outline" className="rounded-xl">
                  <a href={`mailto:${COMPANY.adminEmail}?subject=${encodeURIComponent('Account recovery request')}`}>
                    Email admin
                  </a>
                </Button>
              )}
            </div>
          </div>

          <ContactForm
            defaultSubject={defaultSubject}
            defaultMessage={defaultMessage}
            recoveryMode={isAccountRecovery}
          />
        </div>
      </div>
      <Footer />
    </main>
  )
}
