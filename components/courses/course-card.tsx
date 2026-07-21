import Link from 'next/link'
import type { Course, Enrollment } from '@/types/database'
import { formatPrice } from '@/utils/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CourseImage } from '@/components/courses/course-image'
import { CourseWishlistButton } from '@/components/courses/course-wishlist-button'
import { formatCourseCategory, getCourseAccessState, getCourseDisplayMeta, getCoursePrice } from '@/lib/lms'
import { ArrowRight, BarChart3, BookOpen, Clock, Layers3, Play, UserRound } from 'lucide-react'

export function CourseCard({
  course,
  enrollment = null,
  showWishlist = true,
}: {
  course: Course
  enrollment?: Enrollment | null
  showWishlist?: boolean
}) {
  const meta = getCourseDisplayMeta(course)
  const price = getCoursePrice(course)
  const progress = Number(enrollment?.progress ?? 0)
  const access = enrollment ? getCourseAccessState(enrollment) : null
  const lessonsOrModules = meta.lessonCount > 0
    ? `${meta.lessonCount} lesson${meta.lessonCount === 1 ? '' : 's'}`
    : `${meta.moduleCount || 0} module${meta.moduleCount === 1 ? '' : 's'}`

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors duration-200 hover:border-[#BFDBFE] hover:shadow-md motion-reduce:transition-none">
      <div className="relative aspect-video bg-[#EFF6FF]">
        <CourseImage src={course.thumbnail_url ?? course.image_url} alt={course.title} className="transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
        {course.featured && (
          <Badge className="absolute left-3 top-3 rounded-full bg-[#1D4ED8] text-white">Featured</Badge>
        )}
        {showWishlist && <CourseWishlistButton courseId={course.id} className="absolute right-3 top-3" />}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]">
            {formatCourseCategory(course.category)}
          </Badge>
          {price === 0 ? (
            <Badge className="rounded-full bg-emerald-600 text-white">Free</Badge>
          ) : (
            <Badge className="rounded-full bg-[#FBBF24]/25 text-[#7A1D1D]">Paid</Badge>
          )}
        </div>

        <Link href={`/courses/${course.slug}`} className="group/title">
          <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-snug text-[#0F172A] transition-colors group-hover/title:text-[#1D4ED8]">
            {course.title}
          </h3>
        </Link>

        <div className="mt-4 space-y-2 text-sm text-slate-500">
          {course.instructor && (
            <span className="flex items-center gap-1">
              <UserRound className="h-4 w-4 text-[#1D4ED8]" /> {course.instructor}
            </span>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {course.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#1D4ED8]" /> {course.duration}
              </span>
            )}
            <span className="flex items-center gap-1">
              {meta.lessonCount > 0 ? <BookOpen className="h-3.5 w-3.5 text-[#1D4ED8]" /> : <Layers3 className="h-3.5 w-3.5 text-[#1D4ED8]" />}
              {lessonsOrModules}
            </span>
            {course.level && (
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5 text-[#1D4ED8]" /> {formatCourseCategory(course.level)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-5">
          {enrollment && (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Progress</span>
                <span className="font-semibold text-[#0F172A]">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
          <p className="text-xl font-bold text-[#1D4ED8]">
            {price === 0 ? 'Free' : formatPrice(price)}
          </p>
          <Button asChild size="sm" className={enrollment && access?.active ? 'rounded-xl bg-[#1D4ED8]' : 'rounded-xl bg-[#D30000] hover:bg-[#D30000]/90'}>
            <Link href={enrollment && access?.active ? `/course/${course.id}/learn` : `/courses/${course.slug}`}>
              {enrollment && access?.active ? (
                <>
                  Continue
                  <Play className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  View Course
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Link>
          </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
