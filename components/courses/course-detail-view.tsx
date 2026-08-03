import Link from 'next/link'
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  HelpCircle,
  Home,
  Layers3,
  LockKeyhole,
  MessageCircle,
  Star,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { saveCourseReviewAction } from '@/actions/lms'
import { EnrollButton } from '@/components/courses/enroll-button'
import { CourseImage } from '@/components/courses/course-image'
import { CourseResourceAccess } from '@/components/courses/course-resource-access'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  formatCourseCategory,
  getCourseDisplayMeta,
  getCoursePrice,
  slugifyInstructor,
  youtubeEmbedUrl,
  type CourseModuleWithLessons,
} from '@/lib/lms'
import { CurrencyDisplayNotice, PriceDisplay } from '@/components/currency/price-display'
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

function listOrFallback(items: string[] | undefined, fallback: string[]) {
  return items?.length ? items : fallback
}

function shortText(value: string | null | undefined, maxLength = 190) {
  if (!value) return ''
  const compact = value.replace(/\s+/g, ' ').trim()
  if (compact.length <= maxLength) return compact
  return `${compact.slice(0, maxLength).replace(/\s+\S*$/, '')}...`
}

function plural(value: number, singular: string, pluralLabel = `${singular}s`) {
  return `${value} ${value === 1 ? singular : pluralLabel}`
}

function courseMetadata(course: Course): Record<string, unknown> {
  return course.metadata && typeof course.metadata === 'object' ? course.metadata : {}
}

function metaString(course: Course, key: string): string {
  const value = courseMetadata(course)[key]
  return typeof value === 'string' ? value : ''
}

function metaNumber(course: Course, key: string): number | null {
  const value = courseMetadata(course)[key]
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(number) ? number : null
}

function instructorHelpPackage(course: Course) {
  if (courseMetadata(course).instructorHelpEnabled !== true) return null
  const totalPrice = metaNumber(course, 'instructorHelpTotalPrice')
  if (totalPrice === null) return null

  return {
    totalPrice,
    label: metaString(course, 'instructorHelpLabel') || 'Course + instructor help',
    note: metaString(course, 'instructorHelpNote') || 'Includes guided instructor support alongside course access.',
    contactUrl:
      metaString(course, 'instructorHelpContactUrl') ||
      `/contact?subject=${encodeURIComponent(`Instructor help for ${course.title}`)}`,
  }
}

function CourseFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#1D4ED8]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-slate-500">{label}</span>
        <span className="block truncate text-sm font-semibold text-[#0F172A]">{value}</span>
      </span>
    </li>
  )
}

function EnrollmentCard({
  course,
  enrolled,
  moduleCount,
  lessonCount,
  quizCount,
  certificateEnabled,
}: {
  course: Course
  enrolled: boolean
  moduleCount: number
  lessonCount: number
  quizCount: number
  certificateEnabled: boolean
}) {
  const price = getCoursePrice(course)
  const helpPackage = instructorHelpPackage(course)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Course access</p>
        <p className="mt-2 text-3xl font-bold tracking-normal text-[#1D4ED8]">
          <PriceDisplay amountPkr={price} className="text-3xl font-bold tracking-normal text-[#1D4ED8]" />
        </p>
        <CurrencyDisplayNotice className="mt-2" />
        <div className="mt-4 space-y-2">
          <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-[#0F172A]">Self-paced course</span>
              <PriceDisplay amountPkr={price} className="shrink-0 font-bold text-[#1D4ED8]" />
            </div>
          </div>
          {helpPackage && (
            <div className="rounded-xl border border-[#FBBF24]/60 bg-[#FFFBEB] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#0F172A]">{helpPackage.label}</span>
                <PriceDisplay amountPkr={helpPackage.totalPrice} className="shrink-0 font-bold text-[#7A1D1D]" />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">{helpPackage.note}</p>
              <Button asChild variant="outline" className="mt-3 h-10 w-full rounded-xl border-[#FBBF24]/70 bg-white">
                {helpPackage.contactUrl.startsWith('http') ? (
                  <a href={helpPackage.contactUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact Instructor
                  </a>
                ) : (
                  <Link href={helpPackage.contactUrl}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact Instructor
                  </Link>
                )}
              </Button>
            </div>
          )}
        </div>
        <div className="mt-4">
          {enrolled ? (
            <Button asChild className="h-11 w-full rounded-xl bg-[#1D4ED8] text-white hover:bg-[#1D4ED8]/90">
              <Link href={`/course/${course.id}/learn`}>Continue Learning</Link>
            </Button>
          ) : (
            <EnrollButton
              courseId={course.id}
              courseSlug={course.slug}
              className="h-11 w-full rounded-xl bg-[#8B1E2D] text-white hover:bg-[#8B1E2D]/90"
            />
          )}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Enrollment and payment checks use the existing Phonics Club course flow.
        </p>
      </div>

      <ul className="mt-5 space-y-2.5" aria-label="Course details">
        <CourseFact icon={Clock} label="Duration" value={course.duration ?? 'Self-paced'} />
        <CourseFact icon={Layers3} label="Modules" value={plural(moduleCount, 'module')} />
        {enrolled ? (
          <>
            <CourseFact icon={BookOpen} label="Lessons" value={plural(lessonCount, 'lesson')} />
            <CourseFact icon={HelpCircle} label="Quizzes" value={plural(quizCount, 'quiz', 'quizzes')} />
          </>
        ) : (
          <CourseFact icon={BookOpen} label="Lessons" value="Unlock after enrollment" />
        )}
        <CourseFact icon={Award} label="Level" value={formatCourseCategory(course.level)} />
        <CourseFact
          icon={FileText}
          label="Certificate"
          value={certificateEnabled ? 'Available' : 'Not included'}
        />
      </ul>
    </div>
  )
}

export function CourseDetailView({
  course,
  modules,
  reviews = [],
  resources = [],
  quizzes = [],
  enrolled = false,
}: Props) {
  const meta = getCourseDisplayMeta(course, modules)
  const previewUrl = meta.previewVideoUrl ?? course.hero_video_url ?? null
  const embedUrl = youtubeEmbedUrl(previewUrl)
  const description = course.rich_description ?? course.description ?? course.excerpt ?? ''
  const summary = course.subtitle ?? course.excerpt ?? shortText(description)
  const thumbnail = course.thumbnail_url ?? course.image_url
  const bannerImage = course.banner_url ?? thumbnail
  const titleDescription = description || summary
  const objectives = listOrFallback(course.objectives, [
    'Build confidence with structured phonics routines.',
    'Plan clear lessons for reading, writing and sound recognition.',
    'Use practice and assessment to support learners at the right time.',
  ])
  const requirements = listOrFallback(course.requirements, [
    'A stable internet connection.',
    'Notebook or printed materials for practice tasks.',
    'Interest in structured phonics instruction.',
  ])
  const quizCount = quizzes.length || meta.quizCount
  const instructorName = course.instructor ?? 'Phonics Club'
  const instructorImage = course.instructor_image_url ?? course.instructor_avatar
  const showReviews = enrolled || reviews.length > 0
  const resourceItems = [...resources].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  return (
    <div className="pb-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-[#1D4ED8]">
          <Home className="h-4 w-4" aria-hidden="true" />
          Home
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <Link href="/courses" className="transition-colors hover:text-[#1D4ED8]">
          Courses
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <Link
          href={`/courses?category=${encodeURIComponent(course.category)}`}
          className="font-medium text-[#1D4ED8] transition-colors hover:text-[#8B1E2D]"
        >
          {formatCourseCategory(course.category)}
        </Link>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0 space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {bannerImage && (
              <div className="relative -mx-6 -mt-6 mb-6 aspect-[5/2] overflow-hidden rounded-t-2xl bg-[#EFF6FF] sm:-mx-8 sm:-mt-8">
                <CourseImage src={bannerImage} alt={`${course.title} banner`} priority />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[#1D4ED8] hover:bg-[#EFF6FF]">
                {formatCourseCategory(course.category)}
              </Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 px-3 py-1 text-slate-600">
                {formatCourseCategory(course.level)}
              </Badge>
              {meta.certificateEnabled && (
                <Badge className="rounded-full bg-[#FBBF24]/20 px-3 py-1 text-[#7A1D1D] hover:bg-[#FBBF24]/20">
                  Certificate
                </Badge>
              )}
            </div>

            <h1 className="mt-5 max-w-4xl text-3xl font-bold tracking-normal text-[#0F172A] sm:text-4xl lg:text-5xl">
              {course.title}
            </h1>
            {titleDescription && (
              <p className="mt-4 max-w-4xl whitespace-pre-line text-base leading-8 text-slate-600 sm:text-lg">
                {titleDescription}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 sm:flex-row sm:items-center">
              {instructorImage ? (
                <img
                  src={instructorImage}
                  alt={instructorName}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-[#1D4ED8]">
                  <UserRound className="h-7 w-7" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Instructor</p>
                <h2 className="text-base font-semibold text-[#0F172A]">{instructorName}</h2>
                {course.instructor_bio && (
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{course.instructor_bio}</p>
                )}
              </div>
              {course.instructor && (
                <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                  <Link href={`/instructors/${slugifyInstructor(course.instructor)}`}>View Profile</Link>
                </Button>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-video bg-[#EFF6FF]">
              {embedUrl ? (
                <iframe
                  className="h-full w-full"
                  src={embedUrl}
                  title={`${course.title} preview`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <CourseImage src={thumbnail} alt={course.title} priority />
              )}
            </div>
          </section>

          <div className="lg:hidden">
            <EnrollmentCard
              course={course}
              enrolled={enrolled}
              moduleCount={meta.moduleCount}
              lessonCount={meta.lessonCount}
              quizCount={quizCount}
              certificateEnabled={meta.certificateEnabled}
            />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <Accordion type="single" collapsible>
              <AccordionItem value="learn" className="border-0">
                <AccordionTrigger className="py-0 text-left hover:no-underline">
                  <span className="text-2xl font-bold tracking-normal text-[#0F172A]">What You Will Learn</span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {objectives.map((item) => (
                      <li key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 text-sm leading-6 text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1D4ED8]" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <Accordion type="single" collapsible>
              <AccordionItem value="curriculum" className="border-0">
                <AccordionTrigger className="py-0 text-left hover:no-underline">
                  <span>
                    <span className="block text-2xl font-bold tracking-normal text-[#0F172A]">Course Curriculum</span>
                    <span className="mt-1 block text-sm font-normal text-slate-500">
                      {enrolled
                        ? `${plural(meta.moduleCount, 'module')} and ${plural(meta.lessonCount, 'lesson')}`
                        : `${plural(meta.moduleCount, 'module')} visible. Lesson details unlock after enrollment.`}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>

            {modules.length > 0 && !enrolled ? (
              <div className="mt-5 space-y-3">
                {modules.map((module, moduleIndex) => (
                  <article key={module.id} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-[#0F172A]">Module {moduleIndex + 1}</h3>
                      <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-600">
                        Details locked
                      </Badge>
                    </div>
                    {module.description && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                    )}
                  </article>
                ))}
              </div>
            ) : modules.length > 0 ? (
              <Accordion type="single" collapsible className="mt-5 space-y-3">
                {modules.map((module, moduleIndex) => (
                  <AccordionItem
                    key={module.id}
                    value={module.id}
                    className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-4"
                  >
                    <AccordionTrigger className="gap-4 text-left hover:no-underline">
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#0F172A]">
                          Module {moduleIndex + 1}: {module.title}
                        </span>
                        <span className="mt-1 block text-xs font-normal text-slate-500">
                          {plural(module.lessons.length, 'lesson')}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {module.description && (
                        <p className="mb-3 rounded-lg bg-white p-3 text-sm leading-6 text-slate-600">
                          {module.description}
                        </p>
                      )}
                      <ul className="space-y-2 pb-2">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <li
                            key={lesson.id}
                            className="flex flex-col gap-2 rounded-lg bg-white px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="flex min-w-0 items-center gap-2 font-medium text-[#0F172A]">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#EFF6FF] text-xs font-semibold text-[#1D4ED8]">
                                {lessonIndex + 1}
                              </span>
                              <span className="min-w-0">{lesson.title}</span>
                            </span>
                            <span className="flex flex-wrap gap-2 pl-9 sm:pl-0">
                              {lesson.duration_minutes ? (
                                <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-600">
                                  {lesson.duration_minutes} min
                                </Badge>
                              ) : null}
                              {lesson.lesson_type && (
                                <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-600">
                                  {formatCourseCategory(lesson.lesson_type)}
                                </Badge>
                              )}
                              {lesson.is_preview && (
                                <Badge className="rounded-full bg-[#FBBF24]/20 text-[#7A1D1D] hover:bg-[#FBBF24]/20">
                                  Preview
                                </Badge>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-[#F8FAFC] p-6 text-sm text-slate-600">
                Curriculum details will appear here when lessons are published.
              </div>
            )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <Accordion type="single" collapsible>
              <AccordionItem value="requirements" className="border-0">
                <AccordionTrigger className="py-0 text-left hover:no-underline">
                  <span className="text-2xl font-bold tracking-normal text-[#0F172A]">Course Requirements</span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="mt-5 space-y-3">
                    {requirements.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1D4ED8]" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {resourceItems.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-normal text-[#0F172A]">Course Resources</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                    Worksheets, reading packs, presentations, teacher notes and downloadable course material are collected here for quick access.
                  </p>
                </div>
                <Badge variant="outline" className="w-fit rounded-full border-slate-200 bg-[#F8FAFC] px-3 py-1 text-slate-600">
                  {plural(resourceItems.length, 'resource')}
                </Badge>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {resourceItems.map((resource) => {
                  const directUrl = resource.external_url ?? resource.resource_url
                  const isPublic = resource.visibility === 'public'
                  const canOpen = enrolled || isPublic
                  const label = resource.is_downloadable ? 'Download' : 'Open'

                  return (
                    <article key={resource.id} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                      <div className="flex gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#1D4ED8]">
                          {canOpen ? <Download className="h-5 w-5" aria-hidden="true" /> : <LockKeyhole className="h-5 w-5" aria-hidden="true" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-[#0F172A]">{resource.title}</h3>
                            {resource.is_compulsory && (
                              <Badge className="rounded-full bg-[#FBBF24]/20 text-[#7A1D1D] hover:bg-[#FBBF24]/20">
                                Required
                              </Badge>
                            )}
                          </div>
                          {resource.description && (
                            <p className="mt-1 text-sm leading-6 text-slate-600">{resource.description}</p>
                          )}
                          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{formatCourseCategory(resource.resource_type || 'file')}</span>
                            {resource.original_filename && (
                              <>
                                <span>/</span>
                                <span className="truncate">{resource.original_filename}</span>
                              </>
                            )}
                          </p>
                          <div className="mt-3">
                            {canOpen ? (
                              <CourseResourceAccess resourceId={resource.id} directUrl={directUrl} label={label} />
                            ) : (
                              <Button type="button" size="sm" disabled className="rounded-xl">
                                Enroll to unlock
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          {meta.certificateEnabled && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FBBF24]/20 text-[#7A1D1D]">
                  <Award className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-normal text-[#0F172A]">Certificate Information</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    A Phonics Club certificate is available after the course completion requirements are met.
                    {course.passing_quiz_percentage
                      ? ` The quiz passing requirement is ${course.passing_quiz_percentage}%.`
                      : ''}
                  </p>
                </div>
              </div>
            </section>
          )}

          {showReviews && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold tracking-normal text-[#0F172A]">Student Feedback</h2>
              {reviews.length > 0 && (
                <div className="mt-5 space-y-3">
                  {reviews.map((review) => (
                    <article key={review.id} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-[#FBBF24] text-[#FBBF24]" aria-hidden="true" />
                        <span className="font-semibold text-[#0F172A]">{review.rating}/5</span>
                        <span className="text-sm text-slate-500">{review.profiles?.full_name ?? 'Student'}</span>
                      </div>
                      {review.comment && <p className="mt-2 text-sm leading-6 text-slate-600">{review.comment}</p>}
                    </article>
                  ))}
                </div>
              )}

              {enrolled && (
                <form action={saveCourseReviewAction.bind(null, course.id)} className="mt-5 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                  <h3 className="font-semibold text-[#0F172A]">Leave a review</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr_auto]">
                    <label className="sr-only" htmlFor="course-rating">Rating</label>
                    <select
                      id="course-rating"
                      name="rating"
                      defaultValue="5"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>{rating} stars</option>
                      ))}
                    </select>
                    <label className="sr-only" htmlFor="course-review">Review</label>
                    <input
                      id="course-review"
                      name="comment"
                      placeholder="Share your experience"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
                    />
                    <Button type="submit" className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
                      Submit
                    </Button>
                  </div>
                </form>
              )}
            </section>
          )}
        </main>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <EnrollmentCard
            course={course}
            enrolled={enrolled}
            moduleCount={meta.moduleCount}
            lessonCount={meta.lessonCount}
            quizCount={quizCount}
            certificateEnabled={meta.certificateEnabled}
          />
        </aside>
      </div>
    </div>
  )
}
