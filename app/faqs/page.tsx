import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { buildMetadata } from '@/utils/seo'
import { COMPANY } from '@/lib/company'
import { getFaqs } from '@/lib/site-content'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'

export const metadata = buildMetadata({
  title: 'FAQs',
  description: 'Frequently asked questions about orders, returns, training, courses, payments, and Phonics Club support',
  path: '/faqs',
})

export default async function FAQsPage() {
  const faqs = await getFaqs()

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-4 text-center text-4xl font-bold">Frequently Asked Questions</h1>
        <p className="mb-10 text-center text-muted-foreground">
          {COMPANY.name}: courses, books, payments, policies, and support
        </p>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={faq.q} value={`faq-${i}`} className="rounded-lg border bg-card px-4">
              <AccordionTrigger className="text-left font-semibold">{faq.q}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 text-muted-foreground">
                  {faq.a.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-12 text-center">
          <p className="mb-4 text-muted-foreground">Still have questions?</p>
          <WhatsAppButton />
        </div>
      </div>
      <Footer />
    </main>
  )
}
