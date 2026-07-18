import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { BackButton } from '@/components/layout/back-button'
import { buildMetadata } from '@/utils/seo'
import { getTrainerBySlug } from '@/lib/site-content'
import { Award, CheckCircle2, GraduationCap, Star } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const trainer = await getTrainerBySlug(slug)
  if (!trainer) return {}

  return buildMetadata({
    title: trainer.name,
    description: trainer.bio ?? `${trainer.name} profile at Phonics Club`,
    path: `/certified-trainers/${slug}`,
    image: trainer.image_url ?? undefined,
  })
}

function DetailList({
  title,
  items,
  icon,
}: {
  title: string
  items?: string[] | null
  icon: ReactNode
}) {
  if (!items?.length) return null

  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        {icon}
        {title}
      </h2>
      <ul className="mt-4 space-y-3 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4ED8]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default async function CertifiedTrainerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const trainer = await getTrainerBySlug(slug)
  if (!trainer) notFound()

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <BackButton fallbackHref="/certified-trainers" />

        <section className="grid gap-8 rounded-lg border bg-white p-6 shadow-sm md:grid-cols-[220px_1fr] md:p-8">
          <div className="mx-auto flex h-44 w-44 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#1D4ED8]/20 to-[#FBBF24]/30 md:mx-0">
            {trainer.image_url ? (
              <Image src={trainer.image_url} alt={trainer.name} width={176} height={176} className="h-full w-full object-cover" />
            ) : (
              <Award className="h-20 w-20 text-[#1D4ED8]" />
            )}
          </div>
          <div className="flex flex-col justify-center text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#D30000]">Certified Trainer</p>
            <h1 className="mt-2 text-4xl font-bold">{trainer.name}</h1>
            <p className="mt-2 text-lg text-[#1D4ED8]">{trainer.title ?? 'Jolly Phonics Certified Trainer'}</p>
            {trainer.bio ? <p className="mt-5 max-w-3xl leading-8 text-muted-foreground">{trainer.bio}</p> : null}
          </div>
        </section>

        {trainer.profile_details ? (
          <section className="mt-8 rounded-lg border bg-card p-6">
            <h2 className="text-xl font-bold">Profile</h2>
            <p className="mt-4 whitespace-pre-line leading-8 text-muted-foreground">{trainer.profile_details}</p>
          </section>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <DetailList title="Achievements" items={trainer.achievements} icon={<Star className="h-5 w-5 text-[#D30000]" />} />
          <DetailList title="Credentials" items={trainer.credentials} icon={<GraduationCap className="h-5 w-5 text-[#1D4ED8]" />} />
          <DetailList title="Specialties" items={trainer.specialties} icon={<Award className="h-5 w-5 text-[#FBBF24]" />} />
        </div>

        <div className="mt-10 rounded-lg border bg-[#F8FAFC] p-6 text-center">
          <h2 className="text-2xl font-bold">Interested in training with {trainer.name}?</h2>
          <p className="mt-3 text-muted-foreground">Explore available Phonics Club courses or contact us for school training and consultancy.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/courses" className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white">
              Explore Courses
            </Link>
            <Link href="/contact" className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
