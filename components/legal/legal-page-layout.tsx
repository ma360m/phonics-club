import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { COMPANY } from '@/lib/company'
import { getContactSettings } from '@/lib/site-content'

export async function LegalPageLayout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const contactSettings = await getContactSettings()

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 border-b border-border pb-6">
          <p className="mb-3 text-sm font-semibold uppercase text-[#1D4ED8]">
            Phonics Club Policy
          </p>
          <h1 className="text-3xl font-bold tracking-normal text-foreground sm:text-4xl">
            {title}
          </h1>
        </div>

        <div className="space-y-5 rounded-2xl border bg-card p-6 leading-7 shadow-sm sm:p-8 [&_a]:font-semibold [&_a]:text-[#1D4ED8] [&_em]:text-foreground [&_h2]:border-t [&_h2]:border-border [&_h2]:pt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-muted-foreground [&_strong]:font-bold [&_strong]:text-foreground [&_ul]:space-y-2">
          {children}
        </div>

        <div className="mt-8 rounded-2xl border bg-muted/40 p-5 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">{COMPANY.name}</p>
          <p>{COMPANY.address}</p>
          <p>
            {COMPANY.adminEmail} | {contactSettings.phoneDisplay}
          </p>
        </div>
      </article>
      <Footer />
    </main>
  )
}
