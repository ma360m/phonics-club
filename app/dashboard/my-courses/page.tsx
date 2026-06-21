import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { requireAuth } from '@/lib/auth'
import { getUserEnrollments } from '@/actions/enrollments'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Play, Award } from 'lucide-react'

export default async function MyCoursesPage() {
  await requireAuth()
  const enrollments = await getUserEnrollments()

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground mt-1">{enrollments.length} enrolled</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">You haven&apos;t enrolled in any courses yet.</p>
            <Button asChild className="rounded-xl bg-[#1D4ED8]">
              <Link href="/courses">Explore Courses</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((e) => {
              const course = e.courses as {
                id: string
                title: string
                slug: string
                image_url?: string
                duration?: string
              }
              return (
                <div key={e.id} className="bg-card rounded-2xl border p-6 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <h2 className="font-semibold text-lg">{course?.title}</h2>
                    <p className="text-sm text-muted-foreground mb-3">{course?.duration ?? 'Self-paced'}</p>
                    <div className="flex items-center gap-3 mb-2">
                      <Progress value={e.progress} className="flex-1 h-2" />
                      <span className="text-sm font-medium">{e.progress}%</span>
                    </div>
                    {e.progress >= 100 && (
                      <p className="text-sm text-emerald-600 flex items-center gap-1">
                        <Award className="w-4 h-4" /> Certificate available
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button asChild className="rounded-xl bg-[#1D4ED8]">
                      <Link href={`/course/${course?.id}/learn`}>
                        <Play className="w-4 h-4 mr-2" />
                        {e.progress > 0 ? 'Continue' : 'Start Learning'}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link href={`/courses/${course?.slug}`}>Course Details</Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
