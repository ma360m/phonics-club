import Link from 'next/link'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Eye,
  GraduationCap,
  MessageSquareText,
  Pencil,
  Plus,
  Star,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react'
import { getInstructorDashboardData } from '@/actions/admin/courses'
import { AnnouncementBar, Footer, Navbar } from '@/components/layout'
import { LmsShell } from '@/components/lms/lms-shell'
import { LmsEmptyState, LmsPageHeader, LmsSectionCard, LmsStatCard, LmsStatusBadge } from '@/components/lms/lms-primitives'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isAdminRole, isLmsManagerRole, requireLmsManager } from '@/lib/auth'
import { formatCourseCategory, slugifyInstructor } from '@/lib/lms'
import { normalizeMediaUrl } from '@/lib/media-url'

export const dynamic = 'force-dynamic'

function formatDate(value?: string | null) {
  if (!value) return 'No recent activity'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No recent activity'
  return date.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function visibilityLabel(course: any) {
  if (course.archived || course.visibility_status === 'archived') return 'archived'
  if (!course.published || course.visibility_status === 'draft') return 'draft'
  if (course.unlisted || course.visibility_status === 'unlisted') return 'hidden'
  return 'listed'
}

function visibilityTone(course: any): 'green' | 'gold' | 'red' | 'navy' {
  if (course.archived || course.visibility_status === 'archived') return 'red'
  if (!course.published || course.visibility_status === 'draft') return 'gold'
  if (course.unlisted || course.visibility_status === 'unlisted') return 'navy'
  return 'green'
}

function initials(name?: string | null, email?: string | null) {
  return (name || email || 'PC')
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PC'
}

function ratingLabel(value: number) {
  return value > 0 ? `${value.toFixed(1)}/5` : 'No reviews'
}

export default async function InstructorDashboardPage() {
  const currentProfile = await requireLmsManager()
  const dashboard = await getInstructorDashboardData()
  const isAdmin = isAdminRole(currentProfile.role)
  const firstCourse = dashboard.courses[0]?.course
  const publicInstructorHref = firstCourse?.instructor ? `/instructors/${slugifyInstructor(firstCourse.instructor)}` : null

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <LmsShell
        userName={currentProfile.full_name}
        userEmail={currentProfile.email}
        isAdmin={isAdmin}
        isLmsManager={isLmsManagerRole(currentProfile.role)}
      >
        <LmsPageHeader
          eyebrow="Instructor Dashboard"
          title={`Welcome${currentProfile.full_name ? `, ${currentProfile.full_name}` : ''}`}
          description="A focused workspace for course building, profile updates, learner progress signals and course reviews."
          meta={(
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-[#1D4ED8]">
                <GraduationCap className="mr-1 h-3.5 w-3.5" />
                {isAdmin ? 'Admin view' : 'Instructor'}
              </Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 bg-white">
                {dashboard.courses.length} assigned course{dashboard.courses.length === 1 ? '' : 's'}
              </Badge>
            </div>
          )}
          action={(
            <div className="flex flex-wrap gap-2">
              <Button asChild className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
                <Link href="/admin/courses">
                  <Wrench className="mr-2 h-4 w-4" />
                  Course Builder
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                <Link href="/dashboard/profile">
                  <UserRound className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </Button>
            </div>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <LmsStatCard title="Courses" value={dashboard.courses.length} detail="Assigned to this account" icon={BookOpen} />
          <LmsStatCard title="Published" value={dashboard.summary.publishedCourses} detail="Live or visible courses" icon={CheckCircle2} tone="green" />
          <LmsStatCard title="Drafts" value={dashboard.summary.draftCourses} detail="Need review before launch" icon={Pencil} tone="gold" />
          <LmsStatCard title="Students" value={dashboard.summary.totalStudents} detail="Across assigned courses" icon={Users} tone="navy" />
          <LmsStatCard title="Reviews" value={ratingLabel(dashboard.summary.averageRating)} detail={`${dashboard.summary.reviewCount} total review${dashboard.summary.reviewCount === 1 ? '' : 's'}`} icon={Star} tone="red" />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <LmsSectionCard
            id="course-builder"
            title="Course Builder"
            description="Create courses, edit details, build modules and preview lessons."
            icon={Wrench}
            action={(
              <Button asChild className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
                <Link href="/admin/courses/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Course
                </Link>
              </Button>
            )}
          >
            {dashboard.courses.length === 0 ? (
              <LmsEmptyState
                icon={BookOpen}
                title="No assigned courses"
                description="Create a course or ask an admin to assign an existing course to your instructor account."
                action={<Button asChild className="rounded-xl bg-[#1D4ED8]"><Link href="/admin/courses/new">Create Course</Link></Button>}
              />
            ) : (
              <div className="space-y-4">
                {dashboard.courses.map(({ course, studentCount, averageCompletion, moduleCount, lessonCount, quizCount, reviewCount, averageRating }) => {
                  const imageUrl = normalizeMediaUrl(course.thumbnail_url ?? course.image_url)
                  return (
                    <article key={course.id} className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
                      <div className="grid gap-4 lg:grid-cols-[140px_minmax(0,1fr)]">
                        <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-white lg:aspect-square">
                          {imageUrl ? (
                            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#1D4ED8]">
                              <BookOpen className="h-8 w-8" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <LmsStatusBadge tone={course.published ? 'green' : 'gold'}>
                              {course.published ? 'published' : 'draft'}
                            </LmsStatusBadge>
                            <LmsStatusBadge tone={visibilityTone(course)}>{visibilityLabel(course)}</LmsStatusBadge>
                            <span className="text-xs font-medium text-slate-500">{formatCourseCategory(course.category)}</span>
                          </div>

                          <h2 className="mt-2 text-xl font-bold text-[#0F172A]">{course.title}</h2>
                          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                            <span>{studentCount} students</span>
                            <span>{averageCompletion}% completion</span>
                            <span>{moduleCount} modules / {lessonCount} lessons / {quizCount} quizzes</span>
                            <span>{reviewCount ? `${averageRating.toFixed(1)}/5 from ${reviewCount}` : 'No reviews yet'}</span>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button asChild className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
                              <Link href={`/admin/courses/${course.id}/builder`}>
                                <Wrench className="mr-2 h-4 w-4" />
                                Open Builder
                              </Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                              <Link href={`/admin/courses/${course.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Details
                              </Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                              <Link href={`/course/${course.id}/learn?preview=admin`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Preview Lessons
                              </Link>
                            </Button>
                            <Button asChild variant="ghost" className="rounded-xl">
                              <Link href={`/courses/${course.slug}`}>Public Page</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </LmsSectionCard>

          <div className="space-y-6">
            <LmsSectionCard title="Profile" icon={UserRound}>
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FBBF24]/25 text-sm font-bold text-[#7A1D1D]">
                  {initials(currentProfile.full_name, currentProfile.email)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-[#0F172A]">{currentProfile.full_name ?? 'Instructor'}</p>
                  <p className="mt-1 truncate text-sm text-slate-500">{currentProfile.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" className="rounded-xl bg-[#1D4ED8]">
                      <Link href="/dashboard/profile">Edit Profile</Link>
                    </Button>
                    {publicInstructorHref && (
                      <Button asChild size="sm" variant="outline" className="rounded-xl border-slate-200 bg-white">
                        <Link href={publicInstructorHref}>Public Profile</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </LmsSectionCard>

            <LmsSectionCard title="Reviews" description="Recent course feedback." icon={MessageSquareText}>
              {dashboard.recentReviews.length === 0 ? (
                <LmsEmptyState icon={MessageSquareText} title="No reviews yet" description="Course reviews will appear here after enrolled learners submit feedback." />
              ) : (
                <ul className="space-y-3">
                  {dashboard.recentReviews.map((review) => (
                    <li key={review.id} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-semibold text-[#0F172A]">{review.courseTitle}</p>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-2.5 py-1 text-xs font-bold text-[#92400E]">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {review.rating}/5
                        </span>
                      </div>
                      {review.comment && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{review.comment}</p>}
                      <p className="mt-2 text-xs text-slate-400">{formatDate(review.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </LmsSectionCard>

            <LmsSectionCard title="Needs Attention" icon={AlertTriangle}>
              {dashboard.attentionItems.length === 0 ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                  No course content warnings found.
                </div>
              ) : (
                <ul className="space-y-3">
                  {dashboard.attentionItems.slice(0, 6).map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0F172A]">{item.issue}</p>
                        <p className="mt-1 truncate text-sm text-slate-500">{item.courseTitle}</p>
                      </div>
                      <Button asChild size="sm" variant="outline" className="shrink-0 rounded-xl border-slate-200 bg-white">
                        <Link href={`/admin/courses/${item.courseId}/builder`}>Fix</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </LmsSectionCard>
          </div>
        </div>
      </LmsShell>
      <Footer />
    </main>
  )
}
