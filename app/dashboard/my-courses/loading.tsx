import { AnnouncementBar, Footer, Navbar } from '@/components/layout'
import { LmsPageSkeleton } from '@/components/lms/lms-loading'

export default function MyCoursesLoading() {
  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <LmsPageSkeleton />
      <Footer />
    </main>
  )
}
