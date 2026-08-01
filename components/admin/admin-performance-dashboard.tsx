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
import { ArrowUpRight, BookOpen, GraduationCap, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/utils/format'

export interface AdminPerformancePoint {
  label: string
  value: number
}

export interface AdminTopCourse {
  courseId: string
  title: string
  instructor: string
  students: number
  revenue: number
  href: string
}

export interface AdminTopInstructor {
  name: string
  courses: number
  students: number
}

export function AdminPerformanceDashboard({
  sales,
  students,
  topEnrolledCourses,
  topSellingCourses,
  topInstructors,
}: {
  sales: AdminPerformancePoint[]
  students: AdminPerformancePoint[]
  topEnrolledCourses: AdminTopCourse[]
  topSellingCourses: AdminTopCourse[]
  topInstructors: AdminTopInstructor[]
}) {
  const enrolledTotal = topEnrolledCourses.reduce((sum, item) => sum + item.students, 0)
  const salesTotal = topSellingCourses.reduce((sum, item) => sum + item.revenue, 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
        <PerformanceChart
          title="Net sales"
          rangeLabel="This year"
          data={sales}
          color="#10B981"
          valueFormatter={(value) => formatPrice(value)}
        />
        <PerformanceChart
          title="Students"
          rangeLabel="This week"
          data={students}
          color="#F59E0B"
          valueFormatter={(value) => String(value)}
        />
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-[#0F172A]">Top Instructors</h2>
          <div className="mt-5 space-y-4">
            {topInstructors.length ? (
              topInstructors.map((instructor) => (
                <div key={instructor.name} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1D4ED8]">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#0F172A]">{instructor.name}</p>
                    <p className="text-sm text-slate-500">
                      {instructor.courses} courses / {instructor.students} students
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 bg-[#F8FAFC] p-4 text-sm text-slate-500">
                Instructor metrics will appear after courses and enrollments are added.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <CourseRanking title="Top Enrolled Courses" total={`${enrolledTotal} students`} items={topEnrolledCourses} metric="students" />
        <CourseRanking title="Top Selling Courses" total={`${formatPrice(salesTotal)} revenue`} items={topSellingCourses} metric="revenue" />
      </div>
    </div>
  )
}

function PerformanceChart({
  title,
  rangeLabel,
  data,
  color,
  valueFormatter,
}: {
  title: string
  rangeLabel: string
  data: AdminPerformancePoint[]
  color: string
  valueFormatter: (value: number) => string
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#0F172A]">{title}</h2>
        <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-500">
          {rangeLabel}
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={`${title.replace(/\s+/g, '-')}-gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.34} />
                <stop offset="95%" stopColor={color} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              tickFormatter={(value) => valueFormatter(Number(value))}
              width={72}
            />
            <Tooltip
              formatter={(value) => valueFormatter(Number(value))}
              contentStyle={{ borderRadius: 12, borderColor: '#CBD5E1' }}
              labelStyle={{ color: '#0F172A', fontWeight: 700 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              fill={`url(#${title.replace(/\s+/g, '-')}-gradient)`}
            />
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
  metric,
}: {
  title: string
  total: string
  items: AdminTopCourse[]
  metric: 'students' | 'revenue'
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#0F172A]">{title}</h2>
        <span className="text-sm font-semibold text-slate-500">Total: {total}</span>
      </div>
      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={`${title}-${item.courseId}`} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#1D4ED8]">
                  {metric === 'students' ? <GraduationCap className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#0F172A]">{item.title}</p>
                  <p className="mt-1 truncate text-sm text-slate-500">by {item.instructor}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#1D4ED8]">
                  {metric === 'students' ? `${item.students} students` : formatPrice(item.revenue)}
                </span>
                <Button asChild size="icon" variant="outline" className="h-9 w-9 rounded-lg border-slate-200 bg-white" aria-label={`Open ${item.title}`}>
                  <Link href={item.href}>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-[#F8FAFC] p-4 text-sm text-slate-500">
            Course performance will appear after learners enroll and payments are recorded.
          </p>
        )}
      </div>
    </section>
  )
}
