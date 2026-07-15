import Link from 'next/link'
import type { Course } from '@/types/database'
import { formatPrice } from '@/utils/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CourseImage } from '@/components/courses/course-image'
import { CourseWishlistButton } from '@/components/courses/course-wishlist-button'
import { formatCourseCategory, getCourseDisplayMeta } from '@/lib/lms'
import { Award, BarChart3, BookOpen, Clock, Layers3, Star, UserRound } from 'lucide-react'

export function CourseCard({ course }: { course: Course }) {
  const meta = getCourseDisplayMeta(course)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
      <div className="relative aspect-video bg-gradient-to-br from-[#1D4ED8]/20 to-[#D30000]/10">
        <CourseImage src={course.image_url} alt={course.title} className="transition-transform duration-500 group-hover:scale-105" />
        {course.featured && (
          <Badge className="absolute left-3 top-3 bg-[#1D4ED8] text-white">Featured</Badge>
        )}
        <CourseWishlistButton courseId={course.id} className="absolute right-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full">
            {formatCourseCategory(course.category)}
          </Badge>
          {meta.certificateEnabled && (
            <Badge className="rounded-full bg-[#FBBF24] text-[#111827]">
              <Award className="mr-1 h-3 w-3" />
              Certificate
            </Badge>
          )}
        </div>

        <Link href={`/courses/${course.slug}`} className="group/title">
          <h3 className="line-clamp-2 text-lg font-semibold transition-colors group-hover/title:text-[#1D4ED8]">
            {course.title}
          </h3>
        </Link>

        {course.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{course.excerpt}</p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {course.instructor && (
            <span className="flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5 text-[#1D4ED8]" /> {course.instructor}
            </span>
          )}
          {course.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#1D4ED8]" /> {course.duration}
            </span>
          )}
          <span className="flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5 text-[#1D4ED8]" /> {formatCourseCategory(course.level)}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-[#1D4ED8]" /> {meta.lessonCount || 0} lessons
          </span>
          <span className="flex items-center gap-1">
            <Layers3 className="h-3.5 w-3.5 text-[#1D4ED8]" /> {meta.moduleCount || 0} modules
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[#FBBF24] text-[#FBBF24]" /> {meta.rating.toFixed(1)}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <p className="text-xl font-bold text-[#1D4ED8]">
            {Number(course.price) === 0 ? 'Free' : formatPrice(course.price)}
          </p>
          <Button asChild size="sm" className="rounded-xl bg-[#D30000] hover:bg-[#D30000]/90">
            <Link href={`/courses/${course.slug}`}>View Course</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
