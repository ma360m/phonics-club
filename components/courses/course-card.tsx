import Link from 'next/link'
import Image from 'next/image'
import type { Course } from '@/types/database'
import { formatPrice } from '@/utils/format'
import { Badge } from '@/components/ui/badge'
import { Clock, BarChart3 } from 'lucide-react'

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="relative aspect-video bg-gradient-to-br from-[#1D4ED8]/20 to-[#D30000]/10">
        {course.image_url ? (
          <Image
            src={course.image_url}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 33vw"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">🎓</div>
        )}
        {course.featured && (
          <Badge className="absolute top-3 left-3 bg-[#1D4ED8] text-white">Featured</Badge>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{course.category}</p>
        <h3 className="font-semibold text-lg group-hover:text-[#1D4ED8] transition-colors line-clamp-2">
          {course.title}
        </h3>
        {course.excerpt && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{course.excerpt}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          {course.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {course.duration}
            </span>
          )}
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" /> {course.level}
          </span>
        </div>
        <p className="text-xl font-bold text-[#1D4ED8] mt-3">{formatPrice(course.price)}</p>
      </div>
    </Link>
  )
}
