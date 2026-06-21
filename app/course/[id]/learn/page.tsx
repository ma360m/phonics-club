import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { requireAuth, isSupabaseConfigured } from '@/lib/auth'
import { getUserEnrollments } from '@/actions/enrollments'
import { createClient } from '@/lib/supabase/server'
import { CourseLearnPlayer } from '@/components/courses/course-learn-player'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { SEED_COURSES } from '@/lib/data/seed'
import type { Course } from '@/types/database'

async function getCourseById(id: string): Promise<Course | null> {
  if (!isSupabaseConfigured()) {
    return SEED_COURSES.find((c) => c.id === id) ?? null
  }
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('*').eq('id', id).single()
  return data as Course | null
}

export default async function CourseLearnPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const course = await getCourseById(id)
  if (!course) notFound()

  const enrollments = await getUserEnrollments()
  const enrolled = enrollments.some((e) => e.course_id === id)
  if (!enrolled) redirect(`/courses/${course.slug}`)

  const enrollment = enrollments.find((e) => e.course_id === id)

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-4 rounded-xl">
          <Link href="/dashboard/my-courses">
            <ChevronLeft className="w-4 h-4 mr-1" /> My Courses
          </Link>
        </Button>
        <CourseLearnPlayer
          course={course}
          initialProgress={enrollment?.progress ?? 0}
        />
      </div>
      <Footer />
    </main>
  )
}
