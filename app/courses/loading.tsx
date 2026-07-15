import { AnnouncementBar, Navbar, Footer } from '@/components/layout'

export default function CoursesLoading() {
  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 h-10 w-72 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="aspect-video animate-pulse bg-muted" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-6 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  )
}
