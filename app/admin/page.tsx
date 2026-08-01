import { redirect } from 'next/navigation'
import { getAdminCourses } from '@/actions/admin/courses'
import { getAllOrders, getAllProfiles } from '@/lib/data/queries'
import { getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminPerformanceDashboard } from '@/components/admin/admin-performance-dashboard'
import type { Course, CoursePayment, Enrollment, Order, Profile } from '@/types/database'

const paidCourseStatuses = new Set(['paid', 'processing'])
const revenueOrderStatuses = new Set([
  'pending',
  'awaiting_payment',
  'payment_submitted',
  'payment_review',
  'payment_confirmed',
  'processing',
  'ready_to_dispatch',
  'shipped',
  'delivered',
])

export default async function AdminDashboardPage() {
  const profile = await getProfile()
  if (profile?.role === 'instructor') redirect('/admin/courses')

  const [courses, users, orders, enrollments, coursePayments] = await Promise.all([
    getAdminCourses().catch(() => [] as Course[]),
    getAllProfiles().catch(() => [] as Profile[]),
    getAllOrders().catch(() => [] as Order[]),
    getEnrollmentRows(),
    getCoursePaymentRows(),
  ])

  const enrollmentCountByCourse = new Map<string, number>()
  const studentIds = new Set<string>()

  enrollments.forEach((enrollment) => {
    if (enrollment.user_id) studentIds.add(enrollment.user_id)
    enrollmentCountByCourse.set(
      enrollment.course_id,
      (enrollmentCountByCourse.get(enrollment.course_id) ?? 0) + 1,
    )
  })

  users.filter((user) => user.role === 'user').forEach((user) => studentIds.add(user.id))

  const paidPayments = coursePayments.filter((payment) => paidCourseStatuses.has(payment.status))
  const paidCourseRevenue = paidPayments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
  const orderRevenue = orders
    .filter((order) => revenueOrderStatuses.has(order.status))
    .reduce((sum, order) => sum + Number(order.total ?? 0), 0)

  const instructorNames = new Set<string>()
  users
    .filter((user) => user.role === 'instructor' || user.role === 'admin')
    .forEach((user) => instructorNames.add(user.full_name || user.email))
  courses.forEach((course) => {
    if (course.instructor) instructorNames.add(course.instructor)
  })

  const monthlySales = buildMonthlySales(orders, paidPayments)
  const weeklyStudents = buildWeeklyStudents(enrollments)
  const topInstructors = buildTopInstructors(courses, enrollmentCountByCourse)
  const topEnrolledCourses = courses
    .map((course) => ({
      id: course.id,
      title: course.title,
      instructor: course.instructor ?? 'Phonics Club',
      students: enrollmentCountByCourse.get(course.id) ?? 0,
    }))
    .sort((a, b) => b.students - a.students)
    .slice(0, 5)

  const paymentsByCourse = new Map<string, { sold: number; revenue: number }>()
  paidPayments.forEach((payment) => {
    const existing = paymentsByCourse.get(payment.course_id) ?? { sold: 0, revenue: 0 }
    paymentsByCourse.set(payment.course_id, {
      sold: existing.sold + 1,
      revenue: existing.revenue + Number(payment.amount ?? 0),
    })
  })

  const topSellingCourses = courses
    .map((course) => {
      const sales = paymentsByCourse.get(course.id) ?? { sold: 0, revenue: 0 }
      return {
        id: course.id,
        title: course.title,
        instructor: course.instructor ?? 'Phonics Club',
        students: enrollmentCountByCourse.get(course.id) ?? 0,
        sold: sales.sold,
        revenue: sales.revenue,
      }
    })
    .filter((course) => course.sold > 0 || course.students > 0)
    .sort((a, b) => Number(b.revenue ?? 0) - Number(a.revenue ?? 0))
    .slice(0, 5)

  return (
    <AdminPerformanceDashboard
      summary={{
        totalCourses: courses.length,
        publishedCourses: courses.filter((course) => course.published).length,
        pendingCourses: courses.filter((course) => !course.published).length,
        totalStudents: studentIds.size,
        totalInstructors: instructorNames.size,
        totalRevenue: orderRevenue + paidCourseRevenue,
      }}
      monthlySales={monthlySales}
      weeklyStudents={weeklyStudents}
      topInstructors={topInstructors}
      topEnrolledCourses={topEnrolledCourses}
      topSellingCourses={topSellingCourses}
    />
  )
}

async function getEnrollmentRows(): Promise<Enrollment[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('enrollments')
      .select('id, user_id, course_id, progress, status, enrolled_at')
      .order('enrolled_at', { ascending: false })

    return (data as Enrollment[]) ?? []
  } catch {
    return []
  }
}

async function getCoursePaymentRows(): Promise<CoursePayment[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('course_payments')
      .select('id, user_id, course_id, amount, currency, status, created_at')
      .order('created_at', { ascending: false })

    return (data as CoursePayment[]) ?? []
  } catch {
    return []
  }
}

function buildMonthlySales(orders: Order[], paidPayments: CoursePayment[]) {
  const now = new Date()
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return {
      key,
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      value: 0,
    }
  })
  const monthMap = new Map(months.map((item) => [item.key, item]))

  orders
    .filter((order) => revenueOrderStatuses.has(order.status))
    .forEach((order) => {
      const date = new Date(order.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const point = monthMap.get(key)
      if (point) point.value += Number(order.total ?? 0)
    })

  paidPayments.forEach((payment) => {
    const date = new Date(payment.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const point = monthMap.get(key)
    if (point) point.value += Number(payment.amount ?? 0)
  })

  return months
}

function buildWeeklyStudents(enrollments: Enrollment[]) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    return { key, label: key.slice(5), value: 0 }
  })
  const dayMap = new Map(days.map((item) => [item.key, item]))
  const studentsByDay = new Map<string, Set<string>>()

  enrollments.forEach((enrollment) => {
    const key = new Date(enrollment.enrolled_at).toISOString().slice(0, 10)
    if (!dayMap.has(key)) return
    const set = studentsByDay.get(key) ?? new Set<string>()
    if (enrollment.user_id) set.add(enrollment.user_id)
    studentsByDay.set(key, set)
  })

  days.forEach((day) => {
    day.value = studentsByDay.get(day.key)?.size ?? 0
  })

  return days
}

function buildTopInstructors(courses: Course[], enrollmentCountByCourse: Map<string, number>) {
  const byInstructor = new Map<string, { name: string; courses: number; students: number }>()

  courses.forEach((course) => {
    const name = course.instructor || 'Phonics Club'
    const existing = byInstructor.get(name) ?? { name, courses: 0, students: 0 }
    byInstructor.set(name, {
      name,
      courses: existing.courses + 1,
      students: existing.students + (enrollmentCountByCourse.get(course.id) ?? 0),
    })
  })

  return Array.from(byInstructor.values())
    .sort((a, b) => b.students - a.students || b.courses - a.courses)
    .slice(0, 5)
}
