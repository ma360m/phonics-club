import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CourseCard } from '@/components/courses/course-card'
import type { Course } from '@/types/database'

export function FeaturedCoursesGrid({ courses }: { courses: Course[] }) {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold">Featured Courses</h2>
            <p className="text-muted-foreground mt-2">Expert-led phonics programs for all ages</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/courses">
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  )
}
