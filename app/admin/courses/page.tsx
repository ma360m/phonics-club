import Link from 'next/link'
import {
  AlertTriangle,
  Archive,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  FileQuestion,
  GraduationCap,
  ImageIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  PlayCircle,
  Settings,
  Users,
} from 'lucide-react'
import { getInstructorDashboardData, installChildrenPhonicsCoursesAction } from '@/actions/admin/courses'
import { getProfile, isAdminRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LmsEmptyState, LmsStatCard, LmsStatusBadge } from '@/components/lms/lms-primitives'
import { formatCourseCategory, getCourseEnrollmentAvailability } from '@/lib/lms'
import { normalizeMediaUrl } from '@/lib/media-url'

export const dynamic = 'force-dynamic'

function formatDate(value?: string | null) {
  if (!value) return 'Not updated'
  return new Date(value).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function AttentionIcon({ issue }: { issue: string }) {
  if (issue.includes('thumbnail')) return <ImageIcon className="h-4 w-4 text-[#8B1E2D]" />
  if (issue.includes('Quiz')) return <FileQuestion className="h-4 w-4 text-[#8B1E2D]" />
  if (issue.includes('Unpublished')) return <Eye className="h-4 w-4 text-[#8B1E2D]" />
  return <AlertTriangle className="h-4 w-4 text-[#8B1E2D]" />
}

function courseMatchesQuery(course: { title?: string | null; category?: string | null; instructor?: string | null }, query: string) {
  if (!query) return true
  const searchText = [course.title, course.category, course.instructor].filter(Boolean).join(' ').toLowerCase()
  return query.split(/\s+/).filter(Boolean).every((word) => searchText.includes(word))
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

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; pageSize?: string }>
}) {
  const { q = '', status = 'all', pageSize = '20' } = await searchParams
  const [dashboard, profile] = await Promise.all([
    getInstructorDashboardData(),
    getProfile(),
  ])
  const cleanQuery = q.trim().toLowerCase()
  const selectedStatus = ['all', 'published', 'draft', 'hidden', 'archived', 'featured', 'coming_soon'].includes(status) ? status : 'all'
  const selectedPageSize = [10, 20, 50].includes(Number(pageSize)) ? Number(pageSize) : 20
  const filteredCourses = dashboard.courses.filter(({ course }) => {
    const statusMatches =
      selectedStatus === 'all' ||
      (selectedStatus === 'published' && course.published) ||
      (selectedStatus === 'draft' && !course.published) ||
      (selectedStatus === 'hidden' && (course.unlisted || course.visibility_status === 'unlisted')) ||
      (selectedStatus === 'archived' && (course.archived || course.visibility_status === 'archived')) ||
      (selectedStatus === 'featured' && course.featured) ||
      (selectedStatus === 'coming_soon' && getCourseEnrollmentAvailability(course).status === 'coming_soon')
    return statusMatches && courseMatchesQuery(course, cleanQuery)
  })
  const visibleCourses = filteredCourses.slice(0, selectedPageSize)

  return (
    <div className="w-full max-w-none space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Instructor Dashboard</p>
            <h1 className="mt-1 text-3xl font-bold tracking-normal text-[#0F172A]">
              Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage course content, student progress and publish readiness from one calm workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
              <Link href="/admin/courses/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-xl border-slate-200 bg-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FBBF24]/25 text-xs font-bold text-[#7A1D1D]">
                    {(profile?.full_name || profile?.email || 'PC').slice(0, 1).toUpperCase()}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block truncate">{profile?.full_name ?? 'Instructor'}</span>
                  {profile?.email && <span className="block truncate text-xs font-normal text-slate-500">{profile.email}</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/">Back to Website</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {dashboard.missingChildrenCourses.length > 0 && (
        <section className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Children Course Setup</p>
              <h2 className="mt-1 text-xl font-bold text-[#0F172A]">Install missing Jolly Phonics children courses</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                These course pages can be previewed now, but they need to be installed into Supabase before students can enroll and before admins or instructors can edit every module and lesson.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {dashboard.missingChildrenCourses.map((course) => (
                  <Button key={course.slug} asChild variant="outline" className="rounded-xl border-[#BFDBFE] bg-white">
                    <Link href={`/courses/${course.slug}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview {course.metadata?.coursePart === 2 ? 'Groups 4-7' : 'Groups 1-3'}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
            {isAdminRole(profile?.role) && (
              <form action={installChildrenPhonicsCoursesAction}>
                <Button type="submit" className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Install Courses
                </Button>
              </form>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LmsStatCard title="Published Courses" value={dashboard.summary.publishedCourses} detail="Visible to learners" icon={CheckCircle2} tone="green" />
        <LmsStatCard title="Draft Courses" value={dashboard.summary.draftCourses} detail="Not visible publicly" icon={BookOpen} tone="gold" />
        <LmsStatCard title="Total Students" value={dashboard.summary.totalStudents} detail="Unique enrolled learners" icon={Users} />
        <LmsStatCard title="Average Completion" value={`${dashboard.summary.averageCompletion}%`} detail="Across enrollment records" icon={GraduationCap} tone="red" />
      </div>

      <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">My Courses</h2>
            <p className="mt-1 text-sm text-slate-500">
              Course status, student count and completion at a glance. Showing {visibleCourses.length} of {filteredCourses.length}.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
            <Link href="/admin/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              New Course
            </Link>
          </Button>
        </div>

        <form action="/admin/courses" className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 lg:grid-cols-[minmax(0,1fr)_180px_150px_auto_auto] lg:items-end">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#0F172A]">Search</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by title, category or instructor"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/30"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#0F172A]">Status</span>
            <select
              name="status"
              defaultValue={selectedStatus}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/30"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="hidden">Hidden</option>
              <option value="archived">Archived</option>
              <option value="featured">Featured</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[#0F172A]">Items per page</span>
            <select
              name="pageSize"
              defaultValue={String(selectedPageSize)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-colors focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/30"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </label>
          <Button type="submit" className="h-11 rounded-xl bg-[#1D4ED8]">Filter</Button>
          <Button asChild variant="outline" className="h-11 rounded-xl border-slate-200 bg-white">
            <Link href="/admin/courses">Reset</Link>
          </Button>
        </form>

        {dashboard.courses.length === 0 ? (
          <LmsEmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Create the first course, then add modules and lessons from the course builder."
            action={<Button asChild className="rounded-xl bg-[#1D4ED8]"><Link href="/admin/courses/new">Create Course</Link></Button>}
          />
        ) : filteredCourses.length === 0 ? (
          <LmsEmptyState
            icon={BookOpen}
            title="No courses match"
            description="Change the search or status filter to see more courses."
            action={<Button asChild variant="outline" className="rounded-xl bg-white"><Link href="/admin/courses">Reset Filters</Link></Button>}
          />
        ) : (
          <div className="w-full max-w-none space-y-3">
            {visibleCourses.map(({ course, studentCount, averageCompletion }) => {
              const imageUrl = normalizeMediaUrl(course.thumbnail_url ?? course.image_url)
              const availability = getCourseEnrollmentAvailability(course)
              return (
                <article key={course.id} className="w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-[#BFDBFE]">
                  <div className="grid min-w-0 gap-4 xl:grid-cols-[128px_minmax(0,1fr)_auto] xl:items-center">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-[#EFF6FF] xl:aspect-square">
                      {imageUrl ? (
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-8 w-8 text-[#1D4ED8]" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <LmsStatusBadge tone={course.published ? 'green' : 'gold'}>
                          {course.published ? 'published' : 'draft'}
                        </LmsStatusBadge>
                        <LmsStatusBadge tone={visibilityTone(course)}>
                          {visibilityLabel(course)}
                        </LmsStatusBadge>
                        {course.featured && <LmsStatusBadge tone="blue">featured</LmsStatusBadge>}
                        {availability.status === 'coming_soon' && <LmsStatusBadge tone="gold">coming soon</LmsStatusBadge>}
                        <span className="text-xs text-slate-500">{formatCourseCategory(course.category)}</span>
                      </div>
                      <h3 className="truncate text-lg font-bold text-[#0F172A]">{course.title}</h3>
                      <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                        <span className="inline-flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#1D4ED8]" />
                          {studentCount} students
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-[#1D4ED8]" />
                          {averageCompletion}% complete
                        </span>
                        <span className="inline-flex items-center gap-2">
                          {course.archived ? (
                            <Archive className="h-4 w-4 text-[#8B1E2D]" />
                          ) : course.unlisted ? (
                            <EyeOff className="h-4 w-4 text-[#1D4ED8]" />
                          ) : (
                            <CalendarClock className="h-4 w-4 text-[#1D4ED8]" />
                          )}
                          {course.archived
                            ? 'Archived'
                            : course.unlisted
                              ? 'Hidden from Courses page'
                              : formatDate(course.updated_at ?? course.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                        <Link href={`/courses/${course.slug}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Public page
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                        <Link href={`/course/${course.id}/learn?preview=admin`}>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Lessons
                        </Link>
                      </Button>
                      <Button asChild className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
                        <Link href={`/admin/courses/${course.id}/builder`}>Manage</Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="rounded-xl border-slate-200 bg-white" aria-label={`More actions for ${course.title}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/courses/${course.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit settings
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/courses/${course.id}/builder`}>
                              <Settings className="mr-2 h-4 w-4" />
                              Open builder
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/courses/${course.slug}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View public page
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/course/${course.id}/learn?preview=admin`}>
                              <BookOpen className="mr-2 h-4 w-4" />
                              Preview modules and lessons
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/course/${course.id}/quiz?preview=admin`}>
                              <FileQuestion className="mr-2 h-4 w-4" />
                              Preview quiz page
                            </Link>
                          </DropdownMenuItem>
                          {course.certificate_enabled !== false && (
                            <DropdownMenuItem asChild>
                              <Link href={`/course/${course.id}/certificate?preview=admin`}>
                                <GraduationCap className="mr-2 h-4 w-4" />
                                Preview certificate page
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {dashboard.recentActivity.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold text-[#0F172A]">Recent Student Activity</h2>
            <ul className="mt-4 space-y-3">
              {dashboard.recentActivity.map((activity) => (
                <li key={activity.id} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#1D4ED8]">
                      {activity.completed ? <CheckCircle2 className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#0F172A]">{activity.lessonTitle}</p>
                      <p className="mt-1 text-sm text-slate-500">{activity.courseTitle}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDate(activity.updatedAt)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-[#0F172A]">Courses Needing Attention</h2>
          {dashboard.attentionItems.length === 0 ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              No course content warnings found.
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {dashboard.attentionItems.slice(0, 8).map((item) => (
                <li key={item.id} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
                        <AttentionIcon issue={item.issue} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0F172A]">{item.issue}</p>
                        <p className="mt-1 truncate text-sm text-slate-500">{item.courseTitle}</p>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="rounded-xl border-slate-200 bg-white">
                      <Link href={`/admin/courses/${item.courseId}/builder`}>Fix</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
