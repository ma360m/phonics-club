import { getAdminLmsReport } from '@/actions/admin/lms'
import { LmsEmptyState, LmsPageHeader, LmsSectionCard, LmsStatCard } from '@/components/lms/lms-primitives'
import { Activity, AlertTriangle, Award, BarChart3, BookOpenCheck, Clock, CreditCard, TrendingUp, Users } from 'lucide-react'
import type { ReactNode } from 'react'

type ReportRow = Record<string, unknown>

function countBy(rows: ReportRow[], key: string) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = String(row[key] ?? 'unknown').replace(/_/g, ' ')
    acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {})
}

function minutes(seconds: number) {
  return Math.round(seconds / 60)
}

function percent(value: number, total: number) {
  if (total <= 0) return 0
  return Math.round((value / total) * 100)
}

function formatNumber(value: number) {
  return value.toLocaleString('en-PK')
}

function statusRows(rows: ReportRow[], key: string) {
  const counts = countBy(rows, key)
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0)
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, percentage: percent(value, total) }))
}

function StatusBars({ title, rows }: { title: string; rows: Array<{ label: string; value: number; percentage: number }> }) {
  return (
    <LmsSectionCard title={title} icon={BarChart3}>
      {rows.length === 0 ? (
        <LmsEmptyState icon={BarChart3} title="No data yet" description="This report will populate as learners use the LMS." />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium capitalize text-[#0F172A]">{row.label}</span>
                <span className="text-slate-500">
                  {row.value} ({row.percentage}%)
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#E2E8F0]">
                <div className="h-full rounded-full bg-[#1D4ED8]" style={{ width: `${Math.max(row.percentage, 4)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </LmsSectionCard>
  )
}

function ReportGroup({
  id,
  title,
  description,
  children,
  defaultOpen = true,
}: {
  id?: string
  title: string
  description: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details id={id} open={defaultOpen} className="group mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2">
        <span>
          <span className="block text-lg font-bold text-[#0F172A]">{title}</span>
          <span className="mt-1 block text-sm text-slate-500">{description}</span>
        </span>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 group-open:bg-[#EFF6FF] group-open:text-[#1D4ED8]">
          Toggle
        </span>
      </summary>
      <div className="border-t border-slate-200 p-5">
        {children}
      </div>
    </details>
  )
}

export default async function AdminLmsReportsPage() {
  const report = await getAdminLmsReport()
  const payments = report.payments as ReportRow[]
  const enrollments = report.enrollments as ReportRow[]
  const sessions = report.sessions as ReportRow[]
  const completion = report.completion as ReportRow[]
  const offline = report.offline as ReportRow[]
  const quizAttempts = report.quizAttempts as ReportRow[]
  const assignments = report.assignments as ReportRow[]

  const paymentTotal = payments.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const onlineMinutes = minutes(sessions.reduce((sum, row) => sum + Number(row.credited_seconds ?? 0), 0))
  const offlineApproved = offline.reduce((sum, row) => sum + Number(row.approved_minutes ?? 0), 0)
  const completedCourses = completion.filter((row) => Boolean(row.completed))
  const completionRate = percent(completedCourses.length, completion.length || enrollments.length)
  const flaggedSessions = sessions.filter((row) => Boolean(row.suspicious))
  const pendingPayments = payments.filter((row) => ['pending', 'submitted', 'processing'].includes(String(row.status ?? '')))
  const passedQuizzes = quizAttempts.filter((row) => Boolean(row.passed))
  const quizPassRate = percent(passedQuizzes.length, quizAttempts.length)

  return (
    <div className="mx-auto max-w-7xl">
      <LmsPageHeader
        eyebrow="LMS Reports"
        title="Learning overview"
        description="A simple operational view of enrollments, payments, completion, study time and review queues."
        meta={(
          <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm text-slate-600">
            Total credited learning time: <span className="font-bold text-[#0F172A]">{formatNumber(onlineMinutes + offlineApproved)} min</span>
          </div>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LmsStatCard title="Enrollments" value={formatNumber(enrollments.length)} detail="All enrollment records" icon={Users} />
        <LmsStatCard title="Course Revenue" value={`PKR ${formatNumber(paymentTotal)}`} detail={`${pendingPayments.length} pending review`} icon={CreditCard} tone="green" />
        <LmsStatCard title="Completion Rate" value={`${completionRate}%`} detail={`${completedCourses.length} completed records`} icon={BookOpenCheck} tone="blue" />
        <LmsStatCard title="Certificates" value={formatNumber(report.certificates.length)} detail="Issued certificate records" icon={Award} tone="gold" />
        <LmsStatCard title="Online Minutes" value={formatNumber(onlineMinutes)} detail="Credited online activity" icon={Clock} />
        <LmsStatCard title="Offline Minutes" value={formatNumber(offlineApproved)} detail="Approved offline work" icon={Activity} tone="green" />
        <LmsStatCard title="Quiz Pass Rate" value={`${quizPassRate}%`} detail={`${quizAttempts.length} quiz attempts`} icon={TrendingUp} tone="gold" />
        <LmsStatCard title="Flagged Sessions" value={formatNumber(flaggedSessions.length)} detail="Sessions needing attention" icon={AlertTriangle} tone="red" />
      </div>

      <ReportGroup
        title="Core Reports"
        description="Enrollment, payment and completion status in one compact area."
      >
        <div className="grid gap-6 xl:grid-cols-3">
          <StatusBars title="Enrollment Status" rows={statusRows(enrollments, 'status')} />
          <StatusBars title="Payment Status" rows={statusRows(payments, 'status')} />
          <LmsSectionCard title="Completion Health" icon={BookOpenCheck}>
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[10px] border-[#DBEAFE] bg-white text-2xl font-bold text-[#1D4ED8]">
                {completionRate}%
              </div>
              <p className="text-sm leading-6 text-slate-500">
                Shows how many tracked completion records have reached the completed state.
              </p>
            </div>
          </LmsSectionCard>
        </div>
      </ReportGroup>

      <ReportGroup
        id="assessments"
        title="Assessments and Review Queues"
        description="Open this when you need quizzes, assignments, offline activity or flagged session review."
        defaultOpen={false}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <StatusBars title="Offline Activity Review" rows={statusRows(offline, 'status')} />
          <StatusBars title="Assignment Review" rows={statusRows(assignments, 'status')} />
          <StatusBars title="Session Quality" rows={statusRows(sessions, 'status')} />
        </div>
      </ReportGroup>
    </div>
  )
}
