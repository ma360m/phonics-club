import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { ContactForm } from '@/components/contact/contact-form'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'
import { COMPANY } from '@/lib/company'
import { getContactSettings } from '@/lib/site-content'
import { getContactPhoneLinks } from '@/lib/contact-settings'
import { buildMetadata } from '@/utils/seo'
import { Mail, Phone, MapPin } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Contact Us',
  description: 'Contact Phonics Club for Jolly Phonics books, synthetic phonics training, school consultancy and course support in Pakistan.',
  path: '/contact',
})

export default async function ContactPage() {
  const contactSettings = await getContactSettings()
  const phoneLinks = getContactPhoneLinks(contactSettings)

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
            {phoneLinks.map((phone) => (
              <a key={phone.href} href={phone.href} className="flex items-center gap-3 text-muted-foreground hover:text-[#1D4ED8]">
                <Phone className="w-5 h-5 shrink-0" />
                <span>{phone.display}</span>
              </a>
            ))}
            <p className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="w-5 h-5 shrink-0" />
              {COMPANY.address}
            </p>
            <WhatsAppButton contactSettings={contactSettings} />
          </div>

          <ContactForm />
        </div>
      </div>
      <Footer />
    </main>
  )
}
