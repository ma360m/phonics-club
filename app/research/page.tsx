import Image from 'next/image'
import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { buildMetadata } from '@/utils/seo'
import { getResearchPageContent } from '@/lib/site-content'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, MapPin, School } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Research',
  description: 'Phonics Club research, pilot study projects, and Synthetic Phonics implementation work',
  path: '/research',
})

export default async function ResearchPage() {
  const content = await getResearchPageContent()

  return (
    <main>
      <AnnouncementBar />
      <Navbar />

      <section className="relative isolate overflow-hidden bg-[#0F172A] text-white">
        {content.hero.image ? (
          <Image
            src={content.hero.image.src}
            alt={content.hero.image.alt}
            fill
            priority
            className="absolute inset-0 -z-20 object-cover"
            sizes="100vw"
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0F172A]/95 via-[#0F172A]/76 to-[#1D4ED8]/24" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#FBBF24]">Evidence and Implementation</p>
            <h1 className="text-4xl font-bold tracking-normal text-white sm:text-5xl">
              {content.hero.title}
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/86">{content.hero.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="border-y bg-[#F8FAFC]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <h2 className="text-3xl font-bold">Research Focus</h2>
          <div className="space-y-4 text-muted-foreground">
            {content.overview
              .filter((paragraph) => !/Admins can update this page/i.test(paragraph))
              .map((paragraph) => (
              <p key={paragraph} className="leading-8">{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {content.supportImages.length > 0 ? (
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
            {content.supportImages.map((image) => (
              <figure key={image.src} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <div className="relative aspect-[16/9] bg-slate-50">
                  <Image src={image.src} alt={image.alt} fill className="object-contain p-2" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
                {image.caption ? <figcaption className="px-4 py-3 text-sm text-muted-foreground">{image.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {content.projects.map((project, index) => (
              <article key={project.title} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Badge className="mb-3 bg-[#1D4ED8]">Project {index + 1}</Badge>
                    <h2 className="text-2xl font-bold">{project.title}</h2>
                  </div>
                  {project.period ? <span className="rounded-full border px-3 py-1 text-sm text-muted-foreground">{project.period}</span> : null}
                </div>

                <div className="mt-5 space-y-4 text-muted-foreground">
                  {project.summary.map((paragraph) => (
                    <p key={paragraph} className="leading-8">{paragraph}</p>
                  ))}
                </div>

                {project.schools?.length ? (
                  <div className="mt-6">
                    <h3 className="flex items-center gap-2 font-bold">
                      <School className="h-5 w-5 text-[#1D4ED8]" />
                      Pilot Schools
                    </h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {project.schools.map((school) => (
                        <div key={school} className="rounded-lg border bg-white px-4 py-3 text-sm">{school}</div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {project.cities?.length ? (
                  <div className="mt-6">
                    <h3 className="flex items-center gap-2 font-bold">
                      <MapPin className="h-5 w-5 text-[#D30000]" />
                      Cities Conducted
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.cities.map((city) => (
                        <span key={city} className="rounded-full border bg-white px-3 py-1 text-sm">{city}</span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {project.images?.length ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {project.images.map((image) => (
                      <figure key={image.src} className="overflow-hidden rounded-lg border bg-white">
                        <div className="relative aspect-[4/3] bg-slate-50">
                          <Image src={image.src} alt={image.alt} fill className="object-contain p-2" sizes="(max-width: 768px) 100vw, 50vw" />
                        </div>
                        {image.caption ? <figcaption className="px-4 py-3 text-sm text-muted-foreground">{image.caption}</figcaption> : null}
                      </figure>
                    ))}
                  </div>
                ) : null}

                {project.links?.length ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {project.links.map((link) => (
                      <Button key={link.href} asChild variant="outline" className="rounded-lg">
                        <Link href={link.href} target="_blank" rel="noreferrer">
                          {link.label}
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
