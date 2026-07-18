import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { buildMetadata } from '@/utils/seo'
import { COMPANY } from '@/lib/company'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'

export const metadata = buildMetadata({
  title: 'FAQs',
  description: 'Frequently asked questions about orders, returns, training, courses, payments, and Phonics Club support',
  path: '/faqs',
})

const faqs = [
  {
    q: 'What does Phonics Club do?',
    a: [
      'Phonics Club Pvt. Ltd. promotes Synthetic Phonics for strong reading, writing, spelling, and communication skills.',
      'We support teachers, schools, parents, and students through certified training, consultancy, curriculum development, literacy assessments, books, classroom resources, and online learning.',
    ],
  },
  {
    q: 'What is Vortex Learning?',
    a: [
      'Vortex Learning is a company focused on providing students with different courses and online classes all over the world.',
      'Phonics Club highlights Vortex Learning as an online education partner for students and educators who need flexible learning support.',
    ],
  },
  {
    q: 'Which course should I choose first?',
    a: [
      'For teachers new to Synthetic Phonics, begin with a Jolly Phonics or introductory teacher training course. For schools, start with a literacy audit or teacher training pathway. For parents, choose a course or workshop that matches your child age and reading stage.',
      'If you are unsure, contact us and share your goal, student age group, and whether you prefer online or in-house training.',
    ],
  },
  {
    q: 'What is the classroom course cancellation policy?',
    a: [
      'By completing registration for a classroom or in-house course and making full or installment payment, you agree to the course terms and conditions.',
      'Any classroom course cancelled after registration carries a 30% admin fee, which is not refunded. The remaining deposit may be refunded if cancellation is requested at least 15 working days before the course starting date.',
      'You are not eligible for a refund if cancellation is requested less than 15 working days before the course starting date.',
      'If Phonics Club cancels a course because the minimum number of delegates is not reached, or because of an unforeseen circumstance affecting a safe training environment, management will arrange an alternative course date or offer a 70% refund of the fee paid.',
      'Once a course has been redeemed, login details have been issued, course outlines have been arranged, or live/online training access has started, refunds cannot be granted. Eligible refunds are processed within 30 days. Posted study material must be returned before refund processing.',
      'Refund requests can be sent to info@phonicsclub.com.',
    ],
  },
  {
    q: 'Can I postpone a classroom course?',
    a: [
      'Yes. Classroom or in-house course postponement requests must be made at least 5 working days before the course starting date, and there is no postponement cost.',
      'Requests made less than 5 working days before the course starting date cannot be postponed.',
    ],
  },
  {
    q: 'What payment options are available?',
    a: [
      'Bank Transfer: Allied Bank, Title: Phonics Club Consultancy, Account No: 0010033565850013, IBAN: PK76ABPA0010033565850013.',
      'Standard Chartered: Title: Fatima Tuz Zahra, Account: 001917781701.',
      'JazzCash: Fatima Tuz Zahra, 03084432015.',
      'EasyPaisa: Fatima Tuz Zahra, 03084432015.',
      'For payment confirmation, contact 03084432015 and upload or share your payment receipt where requested.',
    ],
  },
  {
    q: 'How can I order books or classroom resources?',
    a: [
      'You can order from the website shop, by email, by phone, or through WhatsApp. Website orders are placed through /shop and checkout.',
      `For help, contact ${COMPANY.email}, ${COMPANY.adminEmail}, or WhatsApp ${COMPANY.phoneDisplay}.`,
    ],
  },
  {
    q: 'Are Jolly Learning books PCTB approved?',
    a: [
      'Almost all approved Jolly Learning books are available with the required PCTB approvals, with little or no editing.',
      'School administrations, distributors, and retailers should buy only through authorized Phonics Club channels. Customers with previous stock purchased from Phonics Club should claim official QR Code verification stickers where applicable.',
    ],
  },
  {
    q: 'How can I cancel a product order?',
    a: [
      'A product order can be cancelled only if it is still in process and has not been dispatched.',
      'Once an order has entered processing or shipping, cancellation may not be possible.',
    ],
  },
  {
    q: 'What is your returns or exchange policy?',
    a: [
      'Returns or exchanges are considered only if the disputed item was not on your order or the item had a production imperfection or verified transit damage.',
      'Report issues within 24 to 48 hours of receipt and keep original packaging. Clear photos of the item, package, and shipping label may be required.',
    ],
  },
  {
    q: 'Can schools request consultancy or custom training?',
    a: [
      'Yes. Schools can request literacy audits, teacher mentoring, curriculum planning, reading assessments, English language improvement programs, and custom professional development.',
      'Contact us with your school name, city, teacher count, grade levels, and the support required.',
    ],
  },
  {
    q: 'What if the AI assistant cannot answer my question?',
    a: [
      'The assistant is designed to guide you through courses, products, training, payments, orders, certificates, research, Vortex Learning, and support routes.',
      `For complex or account-specific questions, it will guide you to contact Phonics Club at ${COMPANY.phoneDisplay}, ${COMPANY.phoneAltDisplay}, ${COMPANY.email}, or ${COMPANY.adminEmail}.`,
    ],
  },
]

export default function FAQsPage() {
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
