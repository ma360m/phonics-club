'use client'

import Link from 'next/link'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BookOpen,
  CheckSquare,
  Clock,
  GraduationCap,
  LibraryBig,
  Plus,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/utils/format'

interface ChartPoint {
  label: string
  value: number
}

interface Summary {
  totalCourses: number
  publishedCourses: number
  pendingCourses: number
  totalStudents: number
  totalInstructors: number
  totalRevenue: number
}

interface RankedCourse {
  id: string
  title: string
  instructor: string
  students: number
  revenue?: number
  sold?: number
}

interface RankedInstructor {
  name: string
  courses: number
  students: number
}

interface AdminPerformanceDashboardProps {
  summary: Summary
  monthlySales: ChartPoint[]
  weeklyStudents: ChartPoint[]
  topInstructors: RankedInstructor[]
  topEnrolledCourses: RankedCourse[]
  topSellingCourses: RankedCourse[]
}

const statCards = [
  { key: 'totalCourses', label: 'Total Courses', icon: LibraryBig, tone: 'bg-red-50 text-[#D30000]' },
  { key: 'publishedCourses', label: 'Published Courses', icon: CheckSquare, tone: 'bg-blue-50 text-[#1D4ED8]' },
  { key: 'pendingCourses', label: 'Pending Courses', icon: Clock, tone: 'bg-amber-50 text-[#D97706]' },
  { key: 'totalStudents', label: 'Total Students', icon: GraduationCap, tone: 'bg-emerald-50 text-emerald-600' },
  { key: 'totalInstructors', label: 'Total Instructors', icon: UserCheck, tone: 'bg-cyan-50 text-cyan-600' },
] as const

export function AdminPerformanceDashboard({
  summary,
  monthlySales,
  weeklyStudents,
  topInstructors,
  topEnrolledCourses,
  topSellingCourses,
}: AdminPerformanceDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Course, student and shop performance at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
            <Link href="/admin/courses/new">
              <Plus className="h-4 w-4" />
              Add New Course
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
            <Link href="/admin/courses">Manage Courses</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${tone}`}>
              <Icon className="h-6 w-6" />
            </span>
            <p className="mt-5 text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-[#111827]">{summary[key]}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_0.62fr]">
        <ChartCard title="Net sales" value={formatPrice(summary.totalRevenue)} data={monthlySales} color="#10B981" />
        <ChartCard title="Students" value={`${summary.totalStudents} learners`} data={weeklyStudents} color="#F59E0B" />
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-[#0F172A]">Top Instructors</h2>
          <div className="mt-6 space-y-4">
            {topInstructors.length === 0 ? (
              <p className="text-sm text-slate-500">No instructor data yet.</p>
            ) : (
              topInstructors.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                    {item.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#0F172A]">{item.name}</p>
                    <p className="text-sm text-slate-500">
                      {item.courses} courses - {item.students} students
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <CourseRanking title="Top Enrolled Courses" total={`${topEnrolledCourses.reduce((sum, item) => sum + item.students, 0)} students`} items={topEnrolledCourses} />
        <CourseRanking
          title="Top Selling Courses"
          total={`${formatPrice(topSellingCourses.reduce((sum, item) => sum + Number(item.revenue ?? 0), 0))} revenue`}
          items={topSellingCourses}
          showRevenue
        />
      </div>
    </div>
  )
}

function ChartCard({
  title,
  value,
  data,
  color,
}: {
  title: string
  value: string
  data: ChartPoint[]
  color: string
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{value}</p>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip formatter={(val) => String(val)} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fill={`url(#fill-${title.replace(/\s+/g, '-')})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function CourseRanking({
  title,
  total,
  items,
  showRevenue = false,
}: {
  title: string
  total: string
  items: RankedCourse[]
  showRevenue?: boolean
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[#0F172A]">{title}</h2>
        <p className="text-sm font-semibold text-slate-500">Total: {total}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No course data yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-[#F8FAFC] p-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-[#1D4ED8]">
                <BookOpen className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-[#0F172A]">{item.title}</p>
                <p className="text-sm text-slate-500">
                  Instructor: {item.instructor || 'Phonics Club'} - {item.students} students
                </p>
                {showRevenue && (
                  <p className="text-sm font-semibold text-[#D30000]">
                    Revenue: {formatPrice(Number(item.revenue ?? 0))} - {item.sold ?? 0} sold
                  </p>
                )}
              </div>
              {!showRevenue && (
                <span className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-[#1D4ED8]">
                  {item.students} students
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
