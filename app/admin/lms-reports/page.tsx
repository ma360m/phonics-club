import { getAdminLmsReport } from '@/actions/admin/lms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, AlertTriangle, Award, BookOpenCheck, Clock, CreditCard, TrendingUp, Users } from 'lucide-react'

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

function KpiCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
}: {
  title: string
  value: string | number
  detail: string
  icon: typeof Users
  tone?: 'blue' | 'red' | 'gold' | 'green'
}) {
  const tones = {
    blue: 'bg-[#1D4ED8]/10 text-[#1D4ED8]',
    red: 'bg-[#D30000]/10 text-[#D30000]',
    gold: 'bg-[#FBBF24]/20 text-[#92400E]',
    green: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className={`rounded-xl p-2 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function AnalyticsBars({ title, rows }: { title: string; rows: Array<{ label: string; value: number; percentage: number }> }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-muted px-3 py-4 text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium capitalize">{row.label}</span>
                <span className="text-muted-foreground">
                  {row.value} ({row.percentage}%)
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-[#1D4ED8]" style={{ width: `${Math.max(row.percentage, 4)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function HealthPanel({
  title,
  percentage,
  body,
}: {
  title: string
  percentage: number
  body: string
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-8 border-[#1D4ED8]/15 bg-white text-xl font-bold text-[#1D4ED8]">
          {percentage}%
        </div>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-[#D30000]" style={{ width: `${percentage}%` }} />
      </div>
    </section>
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
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">LMS Reports</h1>
          <p className="text-sm text-muted-foreground">
            A simplified analytics view for enrollments, payments, progress, learning time, and review queues.
          </p>
        </div>
        <div className="rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">
          Total learning time: <span className="font-semibold text-foreground">{formatNumber(onlineMinutes + offlineApproved)} min</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Active Enrollments" value={formatNumber(enrollments.length)} detail="All enrollment records" icon={Users} />
        <KpiCard title="Payment Revenue" value={`PKR ${formatNumber(paymentTotal)}`} detail={`${pendingPayments.length} pending review`} icon={CreditCard} tone="green" />
        <KpiCard title="Completion Rate" value={`${completionRate}%`} detail={`${completedCourses.length} completed course records`} icon={BookOpenCheck} tone="blue" />
        <KpiCard title="Certificates" value={formatNumber(report.certificates.length)} detail="Issued certificate records" icon={Award} tone="gold" />
        <KpiCard title="Online Minutes" value={formatNumber(onlineMinutes)} detail="Credited online activity" icon={Clock} />
        <KpiCard title="Offline Minutes" value={formatNumber(offlineApproved)} detail="Approved offline work" icon={Activity} tone="green" />
        <KpiCard title="Quiz Pass Rate" value={`${quizPassRate}%`} detail={`${quizAttempts.length} quiz attempts`} icon={TrendingUp} tone="gold" />
        <KpiCard title="Flagged Sessions" value={formatNumber(flaggedSessions.length)} detail="Suspicious sessions needing review" icon={AlertTriangle} tone="red" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr_0.9fr]">
        <AnalyticsBars title="Enrollment Status" rows={statusRows(enrollments, 'status')} />
        <AnalyticsBars title="Payment Status" rows={statusRows(payments, 'status')} />
        <HealthPanel
          title="Course Completion Health"
          percentage={completionRate}
          body="Shows how many tracked completion records have reached the completed state."
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <AnalyticsBars title="Offline Activity Review" rows={statusRows(offline, 'status')} />
        <AnalyticsBars title="Assignment Review" rows={statusRows(assignments, 'status')} />
        <AnalyticsBars title="Session Quality" rows={statusRows(sessions, 'status')} />
      </div>
    </div>
  )
}
