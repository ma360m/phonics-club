import Link from 'next/link'
import { Award, BarChart3, BookOpen, CheckCircle2, Clock, FileText, HelpCircle, Home, Layers3, Star, Users } from 'lucide-react'
import { EnrollButton } from '@/components/courses/enroll-button'
import { CourseCard } from '@/components/courses/course-card'
import { CourseImage } from '@/components/courses/course-image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { saveCourseReviewAction } from '@/actions/lms'
import {
  formatCourseCategory,
  getCourseDisplayMeta,
  slugifyInstructor,
  youtubeEmbedUrl,
  type CourseModuleWithLessons,
} from '@/lib/lms'
import { getCoursePathwayLabel } from '@/lib/lms-hierarchy'
import { formatPrice } from '@/utils/format'
import type { Course, CourseQuiz, CourseResource, CourseReview } from '@/types/database'

interface Props {
  course: Course
  modules: CourseModuleWithLessons[]
  relatedCourses?: Course[]
  reviews?: CourseReview[]
  resources?: CourseResource[]
  quizzes?: CourseQuiz[]
  enrolled?: boolean
}

function listOrFallback(items: string[], fallback: string[]) {
  return items.length ? items : fallback
}

function EnrolmentCard({ course, enrolled }: { course: Course; enrolled: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
      <div className="relative aspect-video">
        <CourseImage src={course.image_url} alt={course.title} priority />
      </div>
      <div className="space-y-4 p-6">
        <p className="text-3xl font-bold text-[#1D4ED8]">
          {Number(course.price) === 0 ? 'Free' : formatPrice(course.price)}
        </p>
        {enrolled ? (
          <Button asChild className="w-full rounded-xl bg-[#1D4ED8]">
            <Link href={`/course/${course.id}/learn`}>Continue Learning</Link>
          </Button>
        ) : (
          <EnrollButton courseId={course.id} courseSlug={course.slug} className="w-full rounded-xl bg-[#D30000] hover:bg-[#D30000]/90" />
        )}
        <p className="text-center text-xs text-muted-foreground">
          Secure account enrolment. Free courses never trust client-side pricing.
        </p>
      </div>
    </div>
  )
}

export function CourseDetailView({
  course,
  modules,
  relatedCourses = [],
  reviews = [],
  resources = [],
  quizzes = [],
  enrolled = false,
}: Props) {
  const meta = getCourseDisplayMeta(course, modules)
  const embedUrl = youtubeEmbedUrl(meta.previewVideoUrl)
  const objectives = listOrFallback(course.objectives ?? [], [
    'Build confidence with synthetic phonics teaching routines',
    'Plan structured reading and writing lessons',
    'Use assessment to support learners at the right time',
  ])
  const requirements = listOrFallback(course.requirements ?? [], [
    'A stable internet connection',
    'Notebook for activities and reflections',
    'Interest in structured phonics instruction',
  ])
  const highlights = listOrFallback(meta.highlights, objectives)
  const coreMaterials = listOrFallback(
    meta.coreMaterials,
    resources.map((resource) => resource.title),
  )
  const audience = listOrFallback(meta.intendedAudience, [
    'Teachers',
    'School leaders',
    'Parents supporting early reading',
  ])
  const pathwayLabel = getCoursePathwayLabel(course)

  return (
    <div className="pb-24 lg:pb-0">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-1 hover:text-[#1D4ED8]">
          <Home className="h-4 w-4" />
          Home
        </Link>
        <span>/</span>
        <Link href="/courses" className="hover:text-[#1D4ED8]">Courses</Link>
        <span>/</span>
        <span className="font-medium text-foreground">{course.title}</span>
      </nav>

      <section className="grid gap-8 rounded-3xl border bg-white p-6 shadow-sm lg:grid-cols-[1fr_380px] lg:p-8">
        <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge className="rounded-full bg-[#D30000] text-white">{formatCourseCategory(course.category)}</Badge>
            <Badge variant="outline" className="rounded-full bg-white">{pathwayLabel}</Badge>
            <Badge variant="outline" className="rounded-full">{formatCourseCategory(course.level)}</Badge>
            {Number(course.price) === 0 && <Badge className="rounded-full bg-emerald-600">Free</Badge>}
            {meta.certificateEnabled && <Badge className="rounded-full bg-[#FBBF24] text-[#111827]">Certificate</Badge>}
          </div>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">{course.title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
            {course.excerpt ?? course.description}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Instructor', value: course.instructor ?? 'Phonics Club', icon: Award },
              { label: 'Duration', value: course.duration ?? 'Self-paced', icon: Clock },
              { label: 'Modules', value: String(meta.moduleCount), icon: Layers3 },
              { label: 'Lessons', value: String(meta.lessonCount), icon: BookOpen },
              { label: 'Quizzes', value: String(quizzes.length || meta.quizCount), icon: HelpCircle },
              { label: 'Rating', value: meta.rating.toFixed(1), icon: Star },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border bg-[#F8FAFC] p-4">
                <Icon className="mb-2 h-5 w-5 text-[#1D4ED8]" />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-24 lg:h-fit">
          <EnrolmentCard course={course} enrolled={enrolled} />
        </aside>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {embedUrl && (
            <section className="rounded-3xl border bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">Preview Video</h2>
              <div className="aspect-video overflow-hidden rounded-2xl border bg-black">
                <iframe
                  className="h-full w-full"
                  src={embedUrl}
                  title={`${course.title} preview video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-2xl font-bold">Course Highlights</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <li key={item} className="flex gap-2 rounded-2xl border bg-card p-4 text-sm shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <h2 className="mb-3 text-2xl font-bold">Overview</h2>
            <p className="leading-7 text-muted-foreground">{course.description}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Reading', value: 'Article, PDF, flipbook, slides' },
                { label: 'Practice', value: 'Activities and reflection tasks' },
                { label: 'Progress', value: 'Lessons, quiz and certificate' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-[#F8FAFC] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#D30000]">{item.label}</p>
                  <p className="mt-1 text-sm font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
              <BarChart3 className="h-6 w-6 text-[#1D4ED8]" />
              Curriculum
            </h2>
            <Accordion type="single" collapsible className="space-y-3">
              {modules.map((module, moduleIndex) => (
                <AccordionItem key={module.id} value={module.id} className="rounded-2xl border bg-card px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="text-left font-semibold">
                      Module {moduleIndex + 1}: {module.title}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({module.lessons.length} lessons)
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pb-2">
                      {module.lessons.map((lesson) => (
                        <li key={lesson.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm">
                          <span className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-[#1D4ED8]" />
                            {lesson.title}
                          </span>
                          <span className="flex flex-wrap gap-2">
                            {lesson.reading_type && <Badge variant="outline">{lesson.reading_type.replace(/_/g, ' ')}</Badge>}
                            {lesson.is_preview && <Badge variant="outline">Preview</Badge>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-3xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">Learning Outcomes</h2>
              <ul className="space-y-3">
                {objectives.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-3xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">Requirements</h2>
              <ul className="space-y-3">
                {requirements.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1D4ED8]" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">Core Materials</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {coreMaterials.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#F8FAFC] p-4 text-sm font-medium">
                  <FileText className="h-5 w-5 text-[#D30000]" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold">Intended Audience</h2>
            <div className="flex flex-wrap gap-2">
              {audience.map((item) => (
                <Badge key={item} variant="outline" className="rounded-full px-3 py-1">
                  <Users className="mr-1 h-3 w-3" />
                  {item}
                </Badge>
              ))}
            </div>
          </section>

          {course.instructor && (
            <section className="rounded-3xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">Instructor Profile</h2>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {course.instructor_image_url || course.instructor_avatar ? (
                  <img
                    src={course.instructor_image_url ?? course.instructor_avatar ?? ''}
                    alt={course.instructor}
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#1D4ED8]/10">
                    <Award className="h-8 w-8 text-[#1D4ED8]" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{course.instructor}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{course.instructor_bio}</p>
                </div>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href={`/instructors/${slugifyInstructor(course.instructor)}`}>View Profile</Link>
                </Button>
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-2xl font-bold">Reviews</h2>
            <div className="space-y-3">
              {reviews.length ? reviews.map((review) => (
                <article key={review.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 fill-[#FBBF24] text-[#FBBF24]" />
                    <span className="font-semibold">{review.rating}/5</span>
                    <span className="text-sm text-muted-foreground">
                      {review.profiles?.full_name ?? 'Student'}
                    </span>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                </article>
              )) : (
                <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">
                  Reviews will appear after enrolled students submit feedback.
                </div>
              )}
            </div>
            {enrolled && (
              <form action={saveCourseReviewAction.bind(null, course.id)} className="mt-4 rounded-2xl border bg-card p-5 shadow-sm">
                <h3 className="font-semibold">Leave a review</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr_auto]">
                  <select name="rating" defaultValue="5" className="rounded-xl border bg-background px-3 py-2 text-sm">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>{rating} stars</option>
                    ))}
                  </select>
                  <input name="comment" placeholder="Share your experience" className="rounded-xl border bg-background px-3 py-2 text-sm" />
                  <Button type="submit" className="rounded-xl bg-[#1D4ED8]">Submit</Button>
                </div>
              </form>
            )}
          </section>

          {meta.faq.length > 0 && (
            <section>
              <h2 className="mb-4 text-2xl font-bold">FAQ</h2>
              <Accordion type="single" collapsible className="space-y-3">
                {meta.faq.map((item) => (
                  <AccordionItem key={item.question} value={item.question} className="rounded-2xl border bg-card px-4 shadow-sm">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">{item.question}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="font-bold">This course includes</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><BookOpen className="h-4 w-4 text-[#1D4ED8]" /> {meta.lessonCount} lessons</li>
              <li className="flex gap-2"><Layers3 className="h-4 w-4 text-[#1D4ED8]" /> {meta.moduleCount} modules</li>
              <li className="flex gap-2"><HelpCircle className="h-4 w-4 text-[#1D4ED8]" /> {quizzes.length || meta.quizCount} quizzes</li>
              <li className="flex gap-2"><Award className="h-4 w-4 text-[#1D4ED8]" /> Certificate status tracking</li>
            </ul>
          </div>
        </aside>
      </div>

      {relatedCourses.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold">Related Courses</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCourses.map((related) => (
              <CourseCard key={related.id} course={related} />
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white p-3 shadow-2xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <p className="font-bold text-[#1D4ED8]">{Number(course.price) === 0 ? 'Free' : formatPrice(course.price)}</p>
          {enrolled ? (
            <Button asChild className="rounded-xl bg-[#1D4ED8]">
              <Link href={`/course/${course.id}/learn`}>Continue</Link>
            </Button>
          ) : (
            <EnrollButton courseId={course.id} courseSlug={course.slug} className="rounded-xl bg-[#D30000] hover:bg-[#D30000]/90" />
          )}
        </div>
      </div>
    </div>
  )
}
