import Link from 'next/link'
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileQuestion,
  GraduationCap,
  ImageIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  PlayCircle,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import { getInstructorDashboardData, installChildrenPhonicsCoursesAction } from '@/actions/admin/courses'
import { getProfile } from '@/lib/auth'
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
import { formatCourseCategory } from '@/lib/lms'
import { normalizeMediaUrl } from '@/lib/media-url'

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

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; pageSize?: string }>
}) {
  const params = await searchParams
  const searchQuery = (params.q ?? '').trim()
  const statusFilter = params.status ?? 'all'
  const pageSize = [10, 20, 50].includes(Number(params.pageSize)) ? Number(params.pageSize) : 20
  const [dashboard, profile] = await Promise.all([
    getInstructorDashboardData(),
    getProfile(),
  ])
  const filteredCourseRows = dashboard.courses
    .filter(({ course }) => {
      if (statusFilter === 'published' && !course.published) return false
      if (statusFilter === 'draft' && course.published) return false
      if (statusFilter === 'featured' && !course.featured) return false
      return true
    })
    .filter(({ course }) => {
      if (!searchQuery) return true
      const haystack = [
        course.title,
        course.category,
        course.instructor,
        course.level,
        course.duration,
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(searchQuery.toLowerCase())
    })
  const visibleCourseRows = filteredCourseRows.slice(0, pageSize)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
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
                  <Link href="/dashboard">Profile</Link>
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
            {profile?.role === 'admin' && (
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">My Courses</h2>
            <p className="mt-1 text-sm text-slate-500">Course status, student count and completion at a glance.</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
            <Link href="/admin/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              New Course
            </Link>
          </Button>
        </div>

        <form action="/admin/courses" className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 md:grid-cols-[minmax(220px,1fr)_180px_150px_auto_auto] md:items-end">
          <div className="space-y-2">
            <label htmlFor="course-search" className="text-sm font-semibold text-[#0F172A]">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="course-search"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search by title"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/30"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="course-status" className="text-sm font-semibold text-[#0F172A]">Status</label>
            <select
              id="course-status"
              name="status"
              defaultValue={statusFilter}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/30"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="featured">Featured</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="course-page-size" className="text-sm font-semibold text-[#0F172A]">Items per page</label>
            <select
              id="course-page-size"
              name="pageSize"
              defaultValue={pageSize}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/30"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <Button type="submit" className="h-11 rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
            Filter
          </Button>
          <Button asChild variant="ghost" className="h-11 rounded-xl text-[#1D4ED8]">
            <Link href="/admin/courses">Reset</Link>
          </Button>
        </form>

        <p className="mb-4 text-sm text-slate-500">
          Showing {visibleCourseRows.length} of {filteredCourseRows.length} courses.
        </p>

        {dashboard.courses.length === 0 ? (
          <LmsEmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Create the first course, then add modules and lessons from the course builder."
            action={<Button asChild className="rounded-xl bg-[#1D4ED8]"><Link href="/admin/courses/new">Create Course</Link></Button>}
          />
        ) : visibleCourseRows.length === 0 ? (
          <LmsEmptyState
            icon={BookOpen}
            title="No courses match"
            description="Adjust the title or status filters to find the course you need."
            action={<Button asChild variant="outline" className="rounded-xl bg-white"><Link href="/admin/courses">Reset Filters</Link></Button>}
          />
        ) : (
          <div className="space-y-3">
            {visibleCourseRows.map(({ course, studentCount, averageCompletion }) => {
              const imageUrl = normalizeMediaUrl(course.thumbnail_url ?? course.image_url)
              return (
                <article key={course.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-[#BFDBFE]">
                  <div className="grid gap-4 lg:grid-cols-[96px_minmax(0,1fr)_auto] lg:items-center">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-[#EFF6FF] lg:aspect-square">
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
                        {course.featured && <LmsStatusBadge tone="blue">featured</LmsStatusBadge>}
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
                          <CalendarClock className="h-4 w-4 text-[#1D4ED8]" />
                          {formatDate(course.updated_at ?? course.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
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
                          <DropdownMenuItem asChild>
                            <Link href={`/course/${course.id}/certificate?preview=admin`}>
                              <GraduationCap className="mr-2 h-4 w-4" />
                              Preview certificate page
                            </Link>
                          </DropdownMenuItem>
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
