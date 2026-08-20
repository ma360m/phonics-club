import type { Metadata } from 'next'
import { AnnouncementBar, Footer, Navbar } from '@/components/layout'
import { CourseCatalogueExperience } from '@/components/courses/course-catalogue-experience'
import { getCourseCatalogueContent } from '@/lib/site-content'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Professional Course Catalogue Preview | Phonics Club',
  description:
    'A preview of the Phonics Club Learning Academy course catalogue for children, parents, teachers, early years professionals and schools.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function CourseCataloguePreviewPage() {
  const content = await getCourseCatalogueContent()

  return (
    <main className="min-h-screen bg-[#F6F8FC] text-[#0F172A]">
      <AnnouncementBar />
      <Navbar />
      <CourseCatalogueExperience content={content} />
      <Footer />
    </main>
  )
}
