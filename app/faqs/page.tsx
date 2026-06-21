import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { buildMetadata } from '@/utils/seo'
import { COMPANY } from '@/lib/company'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'

export const metadata = buildMetadata({
  title: 'FAQs',
  description: 'Frequently asked questions about orders, returns, training, and Jolly Phonics products',
  path: '/faqs',
})

const faqs = [
  {
    q: 'How can I cancel my order?',
    a: 'You can cancel your order only if it is still in process and has not been dispatched.',
  },
  {
    q: 'What is your returns policy?',
    a: 'We accept returns only if: (i) the disputed item was not on your order, or (ii) it had a production imperfection. Report within 24 hours of receipt with original packing within 3 working days.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'There is no general refund policy. Eligible replacement/refund claims must meet our returns criteria.',
  },
  {
    q: 'How can I order?',
    a: 'Website orders, email orders, telephone orders, and SMS orders are accepted. Contact info@phonicsclub.com or WhatsApp 03084432015.',
  },
  {
    q: 'Are Jolly Learning books PCTB approved?',
    a: 'Almost all books are PCTB approved. Buy only from authorized Phonics Club dealers. Contact us for NOC details and QR code stickers on previous stock.',
  },
  {
    q: 'Classroom course cancellation policy?',
    a: 'Cancel 15+ working days before start: 30% admin fee, remainder refunded. Less than 15 days: no refund. Phonics Club may cancel if minimum delegates not reached (70% refund or alternate date).',
  },
  {
    q: 'Can I postpone my classroom course?',
    a: 'Yes, request 5+ working days before the course start date at no cost. Requests within 5 days cannot be postponed.',
  },
  {
    q: 'How do I become an admin?',
    a: 'Admin access is granted by Phonics Club staff. Contact phonicsclub@gmail.com for dashboard access to manage stock, prices, coupons, and certificates.',
  },
]

export default function FAQsPage() {
  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4 text-center">Frequently Asked Questions</h1>
        <p className="text-muted-foreground text-center mb-10">
          {COMPANY.name} — orders, training, books & support
        </p>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-2xl border px-4">
              <AccordionTrigger className="font-semibold text-left">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <WhatsAppButton />
        </div>
      </div>
      <Footer />
    </main>
  )
}
