import { getAdminProducts } from '@/actions/admin/products'
import { getAdminCourses } from '@/actions/admin/courses'
import { getAdminBlogPosts } from '@/actions/admin/blog'
import { getAllProfiles, getAllOrders } from '@/lib/data/queries'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, GraduationCap, FileText, Users, ShoppingBag, BookOpen, TrendingUp, Code2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/utils/format'
import {
  AdminPerformanceDashboard,
  type AdminPerformancePoint,
  type AdminTopCourse,
  type AdminTopInstructor,
} from '@/components/admin/admin-performance-dashboard'
import type { Course, CoursePayment, Enrollment, Order, Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

type EnrollmentMetricRow = Pick<Enrollment, 'id' | 'user_id' | 'course_id' | 'enrolled_at' | 'progress' | 'status'> & {
  courses?: Pick<Course, 'id' | 'title' | 'slug' | 'instructor'> | Pick<Course, 'id' | 'title' | 'slug' | 'instructor'>[] | null
}

type CoursePaymentMetricRow = Pick<CoursePayment, 'id' | 'course_id' | 'amount' | 'status' | 'created_at'> & {
  courses?: Pick<Course, 'id' | 'title' | 'slug' | 'instructor'> | Pick<Course, 'id' | 'title' | 'slug' | 'instructor'>[] | null
}

export default async function AdminDashboardPage() {
  const profile = await getProfile()
  if (profile?.role === 'instructor') redirect('/instructor')

  const [products, courses, posts, users, orders] = await Promise.all([
    getAdminProducts().catch(() => []),
    getAdminCourses().catch(() => []),
    getAdminBlogPosts().catch(() => []),
    getAllProfiles().catch(() => []),
    getAllOrders().catch(() => []),
  ])

  let enrollments: EnrollmentMetricRow[] = []
  let coursePayments: CoursePaymentMetricRow[] = []
  try {
    const supabase = await createClient()
    const [enrollmentsResult, coursePaymentsResult] = await Promise.all([
      supabase
        .from('enrollments')
        .select('id, user_id, course_id, enrolled_at, progress, status, courses(id, title, slug, instructor)'),
      supabase
        .from('course_payments')
        .select('id, course_id, amount, status, created_at, courses(id, title, slug, instructor)'),
    ])
    enrollments = (enrollmentsResult.data ?? []) as EnrollmentMetricRow[]
    coursePayments = (coursePaymentsResult.data ?? []) as CoursePaymentMetricRow[]
  } catch {
    enrollments = []
    coursePayments = []
  }

  const orderRevenue = orders
    .filter((order) => !['cancelled', 'refunded'].includes(String(order.status)))
    .reduce((sum, order) => sum + Number(order.total ?? 0), 0)
  const courseRevenue = coursePayments
    .filter((payment) => payment.status === 'paid')
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
  const revenue = orderRevenue + courseRevenue
  const studentCount = new Set(enrollments.map((enrollment) => enrollment.user_id).filter(Boolean)).size
  const totalInstructors = countInstructors(users, courses)
  const publishedCourses = courses.filter((course) => course.published).length
  const pendingCourses = courses.length - publishedCourses
  const performance = buildAdminPerformance({ orders, courses, enrollments, coursePayments })

  const stats = [
    { label: 'Total Courses', value: courses.length, icon: GraduationCap, color: 'text-[#D30000]' },
    { label: 'Published Courses', value: publishedCourses, icon: BookOpen, color: 'text-[#1D4ED8]' },
    { label: 'Pending Courses', value: pendingCourses, icon: FileText, color: 'text-[#F59E0B]' },
    { label: 'Total Students', value: studentCount, icon: Users, color: 'text-emerald-600' },
    { label: 'Total Instructors', value: totalInstructors, icon: GraduationCap, color: 'text-cyan-600' },
    { label: 'Revenue', value: formatPrice(revenue), icon: TrendingUp, color: 'text-[#FBBF24]' },
    { label: 'Orders', value: orders.length, icon: ShoppingBag, color: 'text-purple-600' },
    { label: 'Products', value: products.length, icon: Package, color: 'text-[#1D4ED8]' },
  ]

  const quickLinks = [
    { href: '/admin/courses', label: 'Course Dashboard' },
    { href: '/admin/enrollments', label: 'Course Enrollments' },
    { href: '/admin/activity-logs', label: 'Activity Logs' },
    { href: '/admin/training-sessions', label: 'Training Sessions' },
    { href: '/admin/developer-mode', label: 'Developer Mode' },
    { href: '/admin/courses/new', label: 'Create Course' },
    { href: '/admin/products', label: 'Manage Products' },
    { href: '/admin/settings/currency', label: 'Currency Settings' },
    { href: '/admin/settings/payment-methods', label: 'Payment Methods' },
    { href: '/admin/blog/new', label: 'New Blog Post' },
    { href: '/admin/users', label: 'View Users' },
    { href: '/admin/certificates', label: 'Certificates' },
    { href: '/admin/catalogs', label: 'Catalog Manager' },
    { href: '/admin/newsletters', label: 'Newsletter Archive' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">LMS & e-commerce management for PHONICS CLUB</p>

      <div className="grid grid-cols-1 gap-4 mb-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-2xl border border-slate-200 p-5 shadow-sm">
            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8FAFC]">
              <Icon className={`w-6 h-6 ${color}`} />
            </span>
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold text-[#0F172A]">{value}</p>
          </div>
        ))}
      </div>

      <AdminPerformanceDashboard
        sales={performance.sales}
        students={performance.students}
        topEnrolledCourses={performance.topEnrolledCourses}
        topSellingCourses={performance.topSellingCourses}
        topInstructors={performance.topInstructors}
      />

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#0F172A]">
              <Sparkles className="h-5 w-5 text-[#1D4ED8]" />
              Quick Actions
            </h2>
            <p className="mt-1 text-sm text-slate-500">Open the exact admin area needed for course creation, store updates, SEO content and launch work.</p>
          </div>
          <Button asChild className="rounded-xl bg-[#1D4ED8]">
            <Link href="/admin/courses/new">Add New Course</Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Button key={link.href} asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
              <Link href={link.href}>
                {link.href === '/admin/developer-mode' ? <Code2 className="h-4 w-4" /> : null}
                {link.label}
              </Link>
            </Button>
          ))}
        </div>
      </section>
    </div>
  )
}

function countInstructors(users: Profile[], courses: Course[]) {
  const instructorProfiles = users.filter((user) => ['instructor', 'admin', 'super_admin'].includes(user.role)).length
  const courseInstructors = new Set(courses.map((course) => (course.instructor ?? '').trim()).filter(Boolean)).size
  return Math.max(instructorProfiles, courseInstructors)
}

function buildAdminPerformance({
  orders,
  courses,
  enrollments,
  coursePayments,
}: {
  orders: Order[]
  courses: Course[]
  enrollments: EnrollmentMetricRow[]
  coursePayments: CoursePaymentMetricRow[]
}) {
  const courseMap = new Map(courses.map((course) => [course.id, course]))
  const sales = buildMonthlySales(orders, coursePayments)
  const students = buildWeeklyStudents(enrollments)
  const topEnrolledCourses = buildTopEnrolledCourses(enrollments, courseMap)
  const topSellingCourses = buildTopSellingCourses(coursePayments, courseMap)
  const topInstructors = buildTopInstructors(courses, enrollments)

  return { sales, students, topEnrolledCourses, topSellingCourses, topInstructors }
}

function buildMonthlySales(orders: Order[], coursePayments: CoursePaymentMetricRow[]): AdminPerformancePoint[] {
  const now = new Date()
  const months = Array.from({ length: 12 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - 11 + index, 1))
  const values = new Map(months.map((date) => [monthKey(date), 0]))

  orders.forEach((order) => {
    if (['cancelled', 'refunded'].includes(String(order.status))) return
    addByMonth(values, order.created_at, Number(order.total ?? 0))
  })
  coursePayments.forEach((payment) => {
    if (payment.status !== 'paid') return
    addByMonth(values, payment.created_at, Number(payment.amount ?? 0))
  })

  return months.map((date) => ({
    label: date.toLocaleDateString('en-US', { month: 'short' }),
    value: values.get(monthKey(date)) ?? 0,
  }))
}

function buildWeeklyStudents(enrollments: EnrollmentMetricRow[]): AdminPerformancePoint[] {
  const now = new Date()
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now)
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - 6 + index)
    return day
  })
  const values = new Map(days.map((date) => [dayKey(date), 0]))
  enrollments.forEach((enrollment) => addByDay(values, enrollment.enrolled_at, 1))

  return days.map((date) => ({
    label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: values.get(dayKey(date)) ?? 0,
  }))
}

function buildTopEnrolledCourses(enrollments: EnrollmentMetricRow[], courseMap: Map<string, Course>): AdminTopCourse[] {
  const rows = new Map<string, AdminTopCourse>()

  enrollments.forEach((enrollment) => {
    const course = courseMap.get(enrollment.course_id) ?? relatedCourse(enrollment.courses)
    if (!course) return
    const existing = rows.get(enrollment.course_id) ?? topCourseFromCourse(course)
    rows.set(enrollment.course_id, { ...existing, students: existing.students + 1 })
  })

  return [...rows.values()].sort((a, b) => b.students - a.students).slice(0, 5)
}

function buildTopSellingCourses(coursePayments: CoursePaymentMetricRow[], courseMap: Map<string, Course>): AdminTopCourse[] {
  const rows = new Map<string, AdminTopCourse>()

  coursePayments.forEach((payment) => {
    if (payment.status !== 'paid') return
    const course = courseMap.get(payment.course_id) ?? relatedCourse(payment.courses)
    if (!course) return
    const existing = rows.get(payment.course_id) ?? topCourseFromCourse(course)
    rows.set(payment.course_id, {
      ...existing,
      revenue: existing.revenue + Number(payment.amount ?? 0),
      students: existing.students + 1,
    })
  })

  return [...rows.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
}

function buildTopInstructors(courses: Course[], enrollments: EnrollmentMetricRow[]): AdminTopInstructor[] {
  const studentsByCourse = new Map<string, number>()
  enrollments.forEach((enrollment) => studentsByCourse.set(enrollment.course_id, (studentsByCourse.get(enrollment.course_id) ?? 0) + 1))

  const rows = new Map<string, AdminTopInstructor>()
  courses.forEach((course) => {
    const name = (course.instructor ?? 'Phonics Club').trim() || 'Phonics Club'
    const current = rows.get(name) ?? { name, courses: 0, students: 0 }
    rows.set(name, {
      name,
      courses: current.courses + 1,
      students: current.students + (studentsByCourse.get(course.id) ?? 0),
    })
  })

  return [...rows.values()].sort((a, b) => b.students - a.students || b.courses - a.courses).slice(0, 5)
}

function topCourseFromCourse(course: Pick<Course, 'id' | 'title' | 'slug' | 'instructor'>): AdminTopCourse {
  return {
    courseId: course.id,
    title: course.title,
    instructor: course.instructor ?? 'Phonics Club',
    students: 0,
    revenue: 0,
    href: `/admin/courses/${course.id}/builder`,
  }
}

function relatedCourse(course: EnrollmentMetricRow['courses'] | CoursePaymentMetricRow['courses']) {
  return Array.isArray(course) ? course[0] : course ?? null
}

function addByMonth(values: Map<string, number>, value: string | null | undefined, amount: number) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return
  const key = monthKey(date)
  if (!values.has(key)) return
  values.set(key, (values.get(key) ?? 0) + amount)
}

function addByDay(values: Map<string, number>, value: string | null | undefined, amount: number) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return
  const key = dayKey(date)
  if (!values.has(key)) return
  values.set(key, (values.get(key) ?? 0) + amount)
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}
