import Image from 'next/image'
import Link from 'next/link'
import { Star, Users, Clock, BarChart3, CheckCircle2, BookOpen, Award } from 'lucide-react'
import { EnrollButton } from '@/components/courses/enroll-button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { formatPrice } from '@/utils/format'
import type { Course } from '@/types/database'

interface Props {
  course: Course
  relatedCourses?: Course[]
}

function getObjectives(course: Course): string[] {
  if (course.objectives?.length) return course.objectives
  const meta = course.metadata?.objectives
  if (Array.isArray(meta)) return meta as string[]
  return [
    'Master synthetic phonics teaching principles',
    'Implement Jolly Phonics in your classroom',
    'Plan effective phonics lessons',
    'Assess student reading progress',
  ]
}

function getRequirements(course: Course): string[] {
  if (course.requirements?.length) return course.requirements
  const meta = course.metadata?.requirements
  if (Array.isArray(meta)) return meta as string[]
  return ['Basic teaching experience recommended', 'Internet access for online lessons', 'Notebook for practice']
}

export function CourseDetailView({ course, relatedCourses = [] }: Props) {
  const rating = course.rating ?? Number(course.metadata?.rating ?? 4.8)
  const students = course.students_count ?? Number(course.metadata?.students ?? 120)
  const lessonCount =
    course.curriculum?.reduce((n, m) => n + m.lessons.length, 0) ??
    Number(course.metadata?.lessons ?? 0)
  const objectives = getObjectives(course)
  const requirements = getRequirements(course)

  return (
    <div>
      {/* Hero */}
      <div className="grid lg:grid-cols-3 gap-8 mb-16">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge>{course.level}</Badge>
            <Badge variant="outline">{course.category.replace(/-/g, ' ')}</Badge>
            {course.price === 0 && <Badge className="bg-emerald-600">Free</Badge>}
            {course.featured && <Badge className="bg-[#FBBF24] text-black">Featured</Badge>}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">{course.title}</h1>
          {course.excerpt && (
            <p className="text-lg text-muted-foreground mb-6">{course.excerpt}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            {course.instructor && (
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-[#1D4ED8]" />
                {course.instructor}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]" />
              {rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {students}+ students
            </span>
            {course.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {course.duration}
              </span>
            )}
            {lessonCount > 0 && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {lessonCount} lessons
              </span>
            )}
          </div>
          {course.description && (
            <p className="text-muted-foreground leading-relaxed">{course.description}</p>
          )}
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-card rounded-2xl border shadow-lg overflow-hidden">
            <div className="relative aspect-video bg-gradient-to-br from-[#1D4ED8]/20 to-[#D30000]/10">
              {course.image_url ? (
                <Image src={course.image_url} alt={course.title} fill className="object-cover" sizes="400px" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-6xl">🎓</div>
              )}
            </div>
            <div className="p-6">
              <p className="text-3xl font-bold text-[#1D4ED8] mb-4">
                {course.price === 0 ? 'Free' : formatPrice(course.price)}
              </p>
              <EnrollButton courseId={course.id} className="w-full mb-3" />
              <p className="text-xs text-center text-muted-foreground">Full lifetime access · Certificate included</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Learning outcomes */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              What you&apos;ll learn
            </h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {objectives.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Curriculum */}
          {course.curriculum?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-[#1D4ED8]" />
                Curriculum
              </h2>
              <Accordion type="single" collapsible className="space-y-3">
                {course.curriculum.map((module, i) => (
                  <AccordionItem key={i} value={`module-${i}`} className="bg-card rounded-2xl border px-4">
                    <AccordionTrigger className="font-semibold hover:no-underline">
                      <span>
                        Module {i + 1}: {module.title}
                        <span className="text-muted-foreground font-normal text-sm ml-2">
                          ({module.lessons.length} lessons)
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 pb-2">
                        {module.lessons.map((lesson, j) => (
                          <li key={j} className="flex justify-between text-sm text-muted-foreground py-1.5 border-b border-border/50 last:border-0">
                            <span className="flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5" />
                              {lesson.title}
                            </span>
                            {lesson.duration && <span>{lesson.duration}</span>}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {/* Requirements */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Requirements</h2>
            <ul className="space-y-2">
              {requirements.map((req, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-[#1D4ED8]">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </section>

          {/* Instructor */}
          {course.instructor && (
            <section className="bg-card rounded-2xl border p-6">
              <h2 className="text-2xl font-bold mb-4">Instructor</h2>
              <div className="flex gap-4 items-start">
                <div className="w-16 h-16 rounded-full bg-[#1D4ED8]/10 flex items-center justify-center text-2xl shrink-0">
                  {course.instructor_avatar ? (
                    <Image src={course.instructor_avatar} alt="" width={64} height={64} className="rounded-full" />
                  ) : (
                    '👩‍🏫'
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{course.instructor}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {course.instructor_bio ??
                      'Certified Jolly Phonics trainer with years of classroom experience across Pakistan.'}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border p-6">
            <h3 className="font-semibold mb-4">This course includes</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><BookOpen className="w-4 h-4 text-[#1D4ED8]" /> {lessonCount || 'Multiple'} video lessons</li>
              <li className="flex gap-2"><Award className="w-4 h-4 text-[#1D4ED8]" /> Certificate of completion</li>
              <li className="flex gap-2"><Clock className="w-4 h-4 text-[#1D4ED8]" /> {course.duration ?? 'Self-paced'} access</li>
              <li className="flex gap-2"><Users className="w-4 h-4 text-[#1D4ED8]" /> Instructor support</li>
            </ul>
          </div>

          {relatedCourses.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4">Related courses</h3>
              <ul className="space-y-3">
                {relatedCourses.map((c) => (
                  <li key={c.id}>
                    <Link href={`/courses/${c.slug}`} className="text-sm hover:text-[#1D4ED8] font-medium">
                      {c.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c.price === 0 ? 'Free' : formatPrice(c.price)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
