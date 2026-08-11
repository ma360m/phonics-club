import Image from 'next/image'
import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { buildMetadata } from '@/utils/seo'
import { COMPANY } from '@/lib/company'
import { getAboutPageContent } from '@/lib/site-content'
import { Button } from '@/components/ui/button'
import { Award, BookOpen, CheckCircle2, GraduationCap, Handshake, LibraryBig, LineChart, Mail, Phone, School } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'About Us',
  description: COMPANY.description,
  path: '/about',
})

const serviceIcons = [GraduationCap, School, BookOpen, LineChart, LibraryBig, Handshake, Award, CheckCircle2]

function removeLegacyAboutCopy(text: string) {
  return text
    .replace(/^Since 2015,\s*/i, '')
    .replace(/^Established in 2015,\s*/i, '')
    .replace(/\bPioneer of Synthetic Phonics in Pakistan\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function isLegacyAboutHighlight(text: string) {
  return /^(Established in 2015|Pioneer of Synthetic Phonics in Pakistan)$/i.test(text.trim())
}

export default async function AboutPage() {
  const content = await getAboutPageContent()
  const heroSubtitle = removeLegacyAboutCopy(content.hero.subtitle)
  const overviewParagraphs = content.overview.paragraphs
    .map(removeLegacyAboutCopy)
    .filter(Boolean)
  const whyChoose = content.whyChoose.filter((reason) => !isLegacyAboutHighlight(reason))
  const impactStats = content.impact
    .filter((stat) => !/founded/i.test(stat.label))
    .map((stat) => (/schools/i.test(stat.label) ? { ...stat, value: '200+' } : stat))
  const heroImage = content.hero.image
  const galleryImages = content.galleryImages ?? []

  return (
    <main>
      <AnnouncementBar />
      <Navbar />

      <section className="relative isolate overflow-hidden bg-[#0F172A] text-white">
        {heroImage ? (
          <Image
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            priority
            className="absolute inset-0 -z-20 object-cover"
            sizes="100vw"
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0F172A]/95 via-[#0F172A]/78 to-[#1D4ED8]/30" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#FBBF24]">About Phonics Club</p>
            <h1 className="text-4xl font-bold tracking-normal text-white sm:text-5xl lg:text-6xl">
              {content.hero.title}
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/86">{heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1644C5]">
                <Link href={content.hero.primaryCta.href}>{content.hero.primaryCta.label}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-lg border-white/60 bg-white/10 text-white hover:bg-white hover:text-[#0F172A]">
                <Link href={content.hero.secondaryCta.href}>{content.hero.secondaryCta.label}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Organization Overview</p>
              <h2 className="mt-3 text-3xl font-bold">{content.overview.title}</h2>
            </div>
            <div className="space-y-5 text-base leading-8 text-muted-foreground">
              {overviewParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#D30000]">Mission</p>
            <p className="mt-3 text-lg leading-8 text-muted-foreground">{content.mission}</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Vision</p>
            <p className="mt-3 text-lg leading-8 text-muted-foreground">{content.vision}</p>
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">What We Do</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.whatWeDo.map((item) => (
              <article key={item.title} className="rounded-lg border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#1D4ED8]">{item.title}</h3>
                {item.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p> : null}
                {item.items?.length ? (
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {item.items.map((entry) => (
                      <li key={entry} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D30000]" />
                        <span>{entry}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <h2 className="text-3xl font-bold">Why Choose Phonics Club</h2>
              <p className="mt-4 text-muted-foreground">A literacy partner for teachers, schools, parents, and children.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {whyChoose.map((reason) => (
                <div key={reason} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#1D4ED8]" />
                  {reason}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-[#FFF8E1]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#D30000]">{content.jollyNotice.subtitle}</p>
          <h2 className="mt-3 text-3xl font-bold">{content.jollyNotice.title}</h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4 text-muted-foreground">
              {content.jollyNotice.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {content.jollyNotice.notice.length ? (
              <div className="rounded-lg border border-[#FBBF24]/60 bg-white p-5">
                <h3 className="font-bold">Important Notice</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {content.jollyNotice.notice.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D30000]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Services</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.services.map((service, index) => {
              const Icon = serviceIcons[index % serviceIcons.length]
              return (
                <div key={service} className="rounded-lg border bg-card p-5">
                  <Icon className="h-6 w-6 text-[#1D4ED8]" />
                  <p className="mt-4 font-semibold">{service}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <details className="group rounded-2xl border bg-white p-5 shadow-sm">
            <summary className="flex cursor-pointer list-none flex-col gap-4 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/40 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Gallery</p>
                <h2 className="mt-3 text-3xl font-bold">Phonics Club in Action</h2>
                <p className="mt-3 text-muted-foreground">
                  A visual record of classroom learning, teacher training, pilot projects, and school support.
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-semibold text-[#1D4ED8] transition-colors group-open:bg-[#1D4ED8] group-open:text-white">
                <span className="group-open:hidden">Show gallery ({galleryImages.length})</span>
                <span className="hidden group-open:inline">Hide gallery</span>
              </span>
            </summary>
            {galleryImages.length ? (
              <div className="mt-8 overflow-x-auto pb-4 [scrollbar-color:#1D4ED8_#DBEAFE] [scrollbar-width:thin]">
                <div className="flex snap-x snap-mandatory gap-5">
                {galleryImages.map((image) => (
                  <figure key={image.src} className="min-w-[82%] snap-start overflow-hidden rounded-xl border bg-white shadow-sm sm:min-w-[46%] lg:min-w-[31%]">
                    <div className="relative aspect-[4/3] bg-slate-50">
                      <Image src={image.src} alt={image.alt} fill className="object-contain p-2" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    </div>
                    {image.caption ? <figcaption className="px-4 py-3 text-sm text-muted-foreground">{image.caption}</figcaption> : null}
                  </figure>
                ))}
                </div>
              </div>
            ) : (
              <p className="mt-6 rounded-xl border bg-[#F8FAFC] p-4 text-sm text-muted-foreground">No gallery images are currently published.</p>
            )}
          </details>
        </div>
      </section>

      {content.showLearningPath ? (
        <section className="bg-[#F8FAFC]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold">Recommended Learning Path</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {content.learningPath.map((stage) => (
                <article key={stage.title} className="rounded-lg border bg-white p-5">
                  <h3 className="font-bold text-[#1D4ED8]">{stage.title}</h3>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {stage.items?.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-white">
        <div className="mx-auto w-full max-w-none px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Journey and Milestones</h2>
          <div className="mt-10 space-y-6">
            {content.milestones.map((milestone) => (
              <article key={milestone.year} className="grid w-full gap-4 rounded-lg border bg-card p-5 md:grid-cols-[120px_1fr]">
                <div>
                  <p className="text-3xl font-bold text-[#D30000]">{milestone.year}</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{milestone.title}</h3>
                  <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    {milestone.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1D4ED8]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-[#0F172A] text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Impact Numbers</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {impactStats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-white/10 bg-white/5 p-5">
                <p className="text-3xl font-bold text-[#FBBF24]">{stat.value}</p>
                <p className="mt-2 text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-bold">{content.cta.title}</h2>
            <p className="mt-4 max-w-3xl text-muted-foreground">{content.cta.description}</p>
            <Button asChild className="mt-6 rounded-lg bg-[#D30000]">
              <Link href={content.cta.href}>{content.cta.label}</Link>
            </Button>
          </div>
          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-bold">Contact Information</h3>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              {content.contact.phones.map((phone) => (
                <p key={phone} className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#1D4ED8]" />
                  {phone}
                </p>
              ))}
              {content.contact.emails.map((email) => (
                <p key={email} className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#1D4ED8]" />
                  {email}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
