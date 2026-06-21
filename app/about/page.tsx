import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { buildMetadata } from '@/utils/seo'
import { COMPANY, LATEST_NEWS, WEEKLY_PLAN } from '@/lib/company'
import { Button } from '@/components/ui/button'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'

export const metadata = buildMetadata({
  title: 'About Us',
  description: COMPANY.description,
  path: '/about',
})

export default function AboutPage() {
  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">About {COMPANY.name}</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-6">{COMPANY.description}</p>
        <p className="text-muted-foreground mb-8">
          {COMPANY.legalName} was founded in {COMPANY.founded} and is an independent non-profit organization
          working to promote the synthetic phonics approach in Pakistan and abroad.
        </p>

        <div className="bg-card rounded-2xl border p-6 mb-10 glass">
          <h2 className="text-xl font-bold mb-3 text-[#D30000]">{LATEST_NEWS.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{LATEST_NEWS.body}</p>
          <p className="text-sm mt-4">
            Contact: {COMPANY.phone}, {COMPANY.phoneAlt} · {COMPANY.emails.join(' · ')}
          </p>
        </div>

        <h2 className="text-2xl font-bold mb-4">Our Services</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Link href="/trainings" className="bg-card rounded-2xl border p-5 hover:shadow-md transition-shadow">
            <h3 className="font-bold text-[#1D4ED8]">Training</h3>
            <p className="text-sm text-muted-foreground mt-2">Jolly Phonics & Grammar courses</p>
          </Link>
          <Link href="/consultancy" className="bg-card rounded-2xl border p-5 hover:shadow-md transition-shadow">
            <h3 className="font-bold text-[#1D4ED8]">Consultancy</h3>
            <p className="text-sm text-muted-foreground mt-2">Assessments & syllabus design</p>
          </Link>
          <Link href="/certified-trainers" className="bg-card rounded-2xl border p-5 hover:shadow-md transition-shadow">
            <h3 className="font-bold text-[#1D4ED8]">Certified Trainers</h3>
            <p className="text-sm text-muted-foreground mt-2">Meet our expert team</p>
          </Link>
        </div>

        <h2 className="text-2xl font-bold mb-4">Preschool Suggested Book List</h2>
        <div className="text-sm text-muted-foreground space-y-4 mb-10">
          <p><strong>Year 1 Playgroup (Age 3+):</strong> Fun Phonics Pack 1, Letters and Sounds Strip, optional Pack 2 & Picture Stories.</p>
          <p><strong>Year 2 Pre-K (Age 4+):</strong> JP Pupil Book 1, Orange Level readers, Little Word Books.</p>
          <p><strong>Year 3 Kindergarten (Age 5+):</strong> JP Pupil Book 2-3, Level 1 & 2 readers.</p>
          <p><strong>Grade 1-6:</strong> Jolly Literacy & Grammar programs with levelled readers.</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button asChild className="rounded-xl bg-[#1D4ED8]">
            <Link href="/shop">View Shop</Link>
          </Button>
          <WhatsAppButton />
        </div>
      </div>
      <Footer />
    </main>
  )
}
