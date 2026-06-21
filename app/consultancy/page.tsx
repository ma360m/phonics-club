import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { buildMetadata } from '@/utils/seo'
import { COMPANY } from '@/lib/company'
import { Button } from '@/components/ui/button'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'
import { ClipboardList, BookOpen, School } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Consultancy',
  description: 'School assessments, syllabus design and phonics implementation consultancy',
  path: '/consultancy',
})

export default function ConsultancyPage() {
  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Consultancy Services</h1>
        <p className="text-lg text-muted-foreground mb-10">{COMPANY.description}</p>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: School, title: 'School Assessments', desc: 'Evaluate your phonics and literacy programs with expert review.' },
            { icon: BookOpen, title: 'Syllabus Design', desc: 'Custom syllabi aligned with Jolly Phonics and national standards.' },
            { icon: ClipboardList, title: 'Implementation Support', desc: 'On-site guidance for teachers and administrators.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card rounded-2xl border p-6">
              <Icon className="w-8 h-8 text-[#1D4ED8] mb-4" />
              <h3 className="font-bold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <WhatsAppButton />
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/contact">Contact Form</Link>
          </Button>
          <Button asChild className="rounded-xl bg-[#1D4ED8]">
            <Link href="/trainings">View Training</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </main>
  )
}
