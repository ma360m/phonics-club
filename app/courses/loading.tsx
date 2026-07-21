import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { Skeleton } from '@/components/ui/skeleton'

export default function CoursesLoading() {
  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Skeleton className="h-4 w-32 bg-slate-200" />
          <Skeleton className="mt-4 h-12 w-[620px] max-w-full bg-slate-200" />
          <Skeleton className="mt-3 h-5 w-[520px] max-w-full bg-slate-200" />
          <Skeleton className="mt-7 h-14 w-[780px] max-w-full rounded-2xl bg-slate-200" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-16 w-full rounded-2xl bg-slate-200" />
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Skeleton className="aspect-video w-full rounded-none bg-slate-200" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-4 w-24 bg-slate-200" />
                <Skeleton className="h-6 w-full bg-slate-200" />
                <Skeleton className="h-4 w-4/5 bg-slate-200" />
                <Skeleton className="h-10 w-full rounded-xl bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  )
}
