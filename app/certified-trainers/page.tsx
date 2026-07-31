import Image from 'next/image'
import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { BackButton } from '@/components/layout/back-button'
import { buildMetadata } from '@/utils/seo'
import { COMPANY } from '@/lib/company'
import { getTrainers } from '@/lib/site-content'
import { getTrainerImageUrl } from '@/lib/trainer-images'
import { slugify } from '@/utils/slug'
import { Award, ArrowRight } from 'lucide-react'

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
      <div className="mx-auto max-w-7xl px-4 py-12">
        <BackButton fallbackHref="/" />
        <h1 className="mb-2 text-center text-4xl font-bold">Our Certified Trainers</h1>
        <p className="mb-12 text-center text-muted-foreground">Jolly Phonics Certified Trainers at {COMPANY.name}</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trainers.map((trainer) => {
            const trainerSlug = (trainer.slug as string | undefined) || slugify(trainer.name)
            const trainerImageUrl = getTrainerImageUrl(trainer)
            return (
              <Link
                key={trainer.id}
                href={`/certified-trainers/${trainerSlug}`}
                className="group rounded-lg border bg-card p-8 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#1D4ED8]/20 to-[#FBBF24]/30">
                  {trainerImageUrl ? (
                    <Image src={trainerImageUrl} alt={trainer.name} width={96} height={96} className="h-full w-full object-cover" />
                  ) : (
                    <Award className="h-10 w-10 text-[#1D4ED8]" />
                  )}
                </div>
                <h3 className="text-lg font-bold">{trainer.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{trainer.title ?? 'Jolly Phonics Certified Trainer'}</p>
                {trainer.bio ? <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{trainer.bio}</p> : null}
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1D4ED8]">
                  View profile
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
      <Footer />
    </main>
  )
}
