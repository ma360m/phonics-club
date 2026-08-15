import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { buildMetadata } from '@/utils/seo'
import { COMPANY } from '@/lib/company'
import { getContactSettings, getFaqs } from '@/lib/site-content'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'

export const metadata = buildMetadata({
  title: 'FAQs',
  description: 'Frequently asked questions about orders, returns, training, courses, payments, and Phonics Club support',
  path: '/faqs',
})

export default async function FAQsPage() {
  const [faqs, contactSettings] = await Promise.all([
    getFaqs(),
    getContactSettings(),
  ])

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#F8FBFF] via-white to-[#EEF7FF]">
        <style>{`
          @keyframes pcBranchSway {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(3deg); }
          }
          @keyframes pcLeafFloat {
            0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
            50% { transform: translate3d(0, -8px, 0) rotate(5deg); }
          }
          @keyframes pcTinyFlight {
            0% { transform: translate3d(0, 0, 0) scale(1); opacity: .55; }
            50% { transform: translate3d(-18px, -16px, 0) scale(1.08); opacity: .95; }
            100% { transform: translate3d(0, 0, 0) scale(1); opacity: .55; }
          }
          @keyframes pcObjectDrift {
            0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
            50% { transform: translate3d(14px, -18px, 0) rotate(6deg); }
          }
          @keyframes pcObjectPulse {
            0%, 100% { transform: scale(1); opacity: .46; }
            50% { transform: scale(1.12); opacity: .82; }
          }
          @media (prefers-reduced-motion: no-preference) {
            .pc-branch-sway { transform-origin: 82px 215px; animation: pcBranchSway 5.8s ease-in-out infinite; }
            .pc-branch-sway-alt { transform-origin: 94px 260px; animation: pcBranchSway 7.2s ease-in-out infinite reverse; }
            .pc-leaf-float { animation: pcLeafFloat 4.8s ease-in-out infinite; }
            .pc-tiny-flight { animation: pcTinyFlight 6.5s ease-in-out infinite; }
            .pc-tiny-flight:nth-child(2) { animation-delay: 1.4s; }
            .pc-tiny-flight:nth-child(3) { animation-delay: 2.8s; }
            .pc-object-drift { animation: pcObjectDrift 7.8s ease-in-out infinite; }
            .pc-object-pulse { animation: pcObjectPulse 5.6s ease-in-out infinite; }
            .pc-object-drift:nth-child(2n) { animation-delay: 1.2s; animation-direction: reverse; }
            .pc-object-drift:nth-child(3n) { animation-delay: 2.1s; }
            .pc-object-pulse:nth-child(2n) { animation-delay: 1.7s; }
          }
        `}</style>

        <div className="pointer-events-none absolute left-0 top-20 -z-10 hidden h-[760px] w-[330px] opacity-95 lg:block" aria-hidden="true">
          <svg viewBox="0 0 320 760" className="h-full w-full">
            <path d="M119 742 C126 644 111 548 125 454 C134 391 112 341 141 287 C154 262 180 248 168 218 C154 185 117 179 113 150 C108 109 165 72 205 50 C231 36 253 23 284 22" fill="none" stroke="#7A3E16" strokeWidth="18" strokeLinecap="round" />
            <path className="pc-branch-sway" d="M136 284 C89 263 66 231 55 192 C49 171 55 151 67 134" fill="none" stroke="#7A3E16" strokeWidth="14" strokeLinecap="round" />
            <path className="pc-branch-sway-alt" d="M146 226 C196 198 223 161 228 117 C231 94 246 78 267 66" fill="none" stroke="#7A3E16" strokeWidth="13" strokeLinecap="round" />
            <path d="M119 496 C83 474 60 443 48 405" fill="none" stroke="#7A3E16" strokeWidth="12" strokeLinecap="round" />
            {[
              ['70', '122', '#22C55E'], ['102', '98', '#84CC16'], ['136', '74', '#16A34A'], ['186', '56', '#22C55E'],
              ['225', '80', '#65A30D'], ['246', '126', '#16A34A'], ['213', '163', '#86EFAC'], ['171', '151', '#22C55E'],
              ['64', '190', '#86EFAC'], ['93', '222', '#16A34A'], ['43', '401', '#22C55E'], ['80', '438', '#65A30D'],
            ].map(([cx, cy, fill], index) => (
              <ellipse key={`${cx}-${cy}`} className="pc-leaf-float" cx={cx} cy={cy} rx="24" ry="13" fill={fill} opacity="0.86" transform={`rotate(${index % 2 ? -24 : 24} ${cx} ${cy})`} />
            ))}
          </svg>
        </div>

        <div className="pointer-events-none absolute right-8 top-32 -z-10 hidden h-[520px] w-[230px] lg:block" aria-hidden="true">
          <span className="pc-tiny-flight absolute right-16 top-6 h-3 w-3 rounded-full bg-[#00A6C8] shadow-[0_0_22px_rgba(0,166,200,0.35)]" />
          <span className="pc-tiny-flight absolute right-2 top-40 h-4 w-4 rounded-full bg-[#FBBF24] shadow-[0_0_22px_rgba(251,191,36,0.35)]" />
          <span className="pc-tiny-flight absolute right-24 top-72 h-3 w-3 rounded-full bg-[#D30000] shadow-[0_0_22px_rgba(211,0,0,0.25)]" />
          <div className="pc-tiny-flight absolute right-12 top-20 text-[#1D4ED8]">
            <span className="block h-2 w-5 rounded-full bg-current opacity-60" />
            <span className="mx-auto mt-0.5 block h-2 w-2 rounded-full bg-current" />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <span className="pc-object-drift absolute left-[18%] top-24 h-3 w-12 rounded-full bg-[#93C5FD]/60 shadow-[0_0_24px_rgba(147,197,253,0.35)]" />
          <span className="pc-object-pulse absolute left-[30%] top-[42%] h-4 w-4 rounded-full bg-[#FBBF24]/80 shadow-[0_0_20px_rgba(251,191,36,0.3)]" />
          <span className="pc-object-drift absolute left-[45%] top-20 h-5 w-5 rounded-full border-2 border-[#1D4ED8]/35 bg-white/70" />
          <span className="pc-object-pulse absolute left-[58%] top-[54%] h-3 w-3 rounded-full bg-[#D30000]/70 shadow-[0_0_20px_rgba(211,0,0,0.22)]" />
          <span className="pc-object-drift absolute left-[70%] top-[18%] h-2.5 w-10 rounded-full bg-[#22C55E]/55" />
          <span className="pc-object-pulse absolute bottom-20 left-[24%] h-5 w-5 rounded-full bg-[#C084FC]/55 shadow-[0_0_20px_rgba(192,132,252,0.26)]" />
          <span className="pc-object-drift absolute bottom-32 left-[50%] h-4 w-9 rounded-full bg-[#00A6C8]/45" />
          <span className="pc-object-pulse absolute bottom-24 right-[18%] h-3.5 w-3.5 rounded-full bg-[#1D4ED8]/60" />
          <span className="pc-object-drift absolute right-[8%] top-[58%] h-3 w-12 rounded-full bg-[#F87171]/40" />
        </div>

        <div className="mx-auto max-w-5xl px-4 py-14 lg:py-16">
          <h1 className="mb-4 text-center text-4xl font-bold text-[#0F172A] sm:text-5xl">Frequently Asked Questions</h1>
          <p className="mb-10 text-center text-muted-foreground">
            {COMPANY.name}: courses, books, payments, policies, and support
          </p>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={`faq-${i}`} className="rounded-2xl border border-slate-200 bg-white/92 px-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:shadow-md motion-reduce:hover:translate-y-0">
                <AccordionTrigger className="text-left font-semibold text-[#0F172A]">{faq.q}</AccordionTrigger>
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
            <WhatsAppButton contactSettings={contactSettings} />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
