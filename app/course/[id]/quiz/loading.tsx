import { AnnouncementBar, Footer, Navbar } from '@/components/layout'
import { LmsPageSkeleton } from '@/components/lms/lms-loading'

export default function CourseQuizLoading() {
  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <LmsPageSkeleton />
      <Footer />
    </main>
  )
}
