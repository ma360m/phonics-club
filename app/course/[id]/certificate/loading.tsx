import { AnnouncementBar, Footer, Navbar } from '@/components/layout'
import { LmsPageSkeleton } from '@/components/lms/lms-loading'

export default function CourseCertificateLoading() {
  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <LmsPageSkeleton />
      <Footer />
    </main>
  )
}
