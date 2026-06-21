import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { APP_NAME } from '@/lib/constants'
import { COMPANY } from '@/lib/company'

export function LegalPageLayout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <article className="max-w-3xl mx-auto px-4 py-12 prose prose-slate">
        <h1>{title}</h1>
        {children}
        <hr />
        <p className="text-sm text-muted-foreground">
          {COMPANY.name} · {COMPANY.address} · {COMPANY.adminEmail}
        </p>
      </article>
      <Footer />
    </main>
  )
}
