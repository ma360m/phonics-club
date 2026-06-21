import Image from 'next/image'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { BackButton } from '@/components/layout/back-button'
import { buildMetadata } from '@/utils/seo'
import { COMPANY } from '@/lib/company'
import { getTrainers } from '@/lib/site-content'
import { Award } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Certified Trainers',
  description: 'Jolly Phonics certified trainers at Phonics Club Pakistan',
  path: '/certified-trainers',
})

export default async function CertifiedTrainersPage() {
  const trainers = await getTrainers()

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <BackButton fallbackHref="/" />
        <h1 className="text-4xl font-bold mb-2 text-center">Our Certified Trainers</h1>
        <p className="text-muted-foreground text-center mb-12">Jolly Phonics Certified Trainers — {COMPANY.name}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((trainer) => (
            <div
              key={trainer.id}
              className="bg-card rounded-2xl border p-8 text-center shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1D4ED8]/20 to-[#FBBF24]/30 flex items-center justify-center overflow-hidden">
                {trainer.image_url ? (
                  <Image src={trainer.image_url} alt={trainer.name} width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <Award className="w-10 h-10 text-[#1D4ED8]" />
                )}
              </div>
              <h3 className="font-bold text-lg">{trainer.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{trainer.title ?? 'Jolly Phonics Certified Trainer'}</p>
              {trainer.bio && <p className="text-xs text-muted-foreground mt-3">{trainer.bio}</p>}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  )
}
