import Link from 'next/link'
import { getAdminCourseEnrollmentRows } from '@/lib/admin/operational-visibility'
import { Button } from '@/components/ui/button'
import { LmsEmptyState, LmsPageHeader, LmsSectionCard, LmsStatCard, LmsStatusBadge } from '@/components/lms/lms-primitives'
import { Activity, AlertTriangle, Clock, CreditCard, GraduationCap, KeyRound, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

type EnrollmentRow = Record<string, any>

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? '').trim()
    if (text) return text
  }
  return ''
}

function formatDateTime(value?: unknown) {
  const raw = firstText(value)
  if (!raw) return 'Not recorded'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatDate(value?: unknown) {
  const raw = firstText(value)
  if (!raw) return 'Not recorded'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleDateString('en-PK', { dateStyle: 'medium' })
}

function formatMinutes(seconds?: unknown) {
  const value = Number(seconds ?? 0)
  if (!Number.isFinite(value) || value <= 0) return '0 min'
  const minutes = Math.max(1, Math.round(value / 60))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

function statusTone(status?: unknown): 'blue' | 'red' | 'gold' | 'green' | 'navy' {
  const value = firstText(status).toLowerCase()
  if (['active', 'completed', 'paid'].includes(value)) return 'green'
  if (['expired', 'cancelled', 'refunded', 'rejected'].includes(value)) return 'red'
  if (['pending', 'awaiting_payment', 'submitted', 'processing'].includes(value)) return 'gold'
  return 'blue'
}

function learnerName(row: EnrollmentRow) {
  return firstText(row.profile?.full_name, row.profile?.email, row.user_id, 'Unknown learner')
}

function learnerEmail(row: EnrollmentRow) {
  return firstText(row.profile?.email)
}

function courseTitle(row: EnrollmentRow) {
  return firstText(row.course?.title, row.course_id, 'Unknown course')
}

function latestPaymentStatus(row: EnrollmentRow) {
  return firstText(row.latestPayment?.status, row.payment_status, 'not recorded')
}

function ProgressBar({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-[#E2E8F0]">
      <div className="h-full rounded-full bg-[#1D4ED8]" style={{ width: `${width}%` }} />
    </div>
  )
}

function Warnings({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" />
        Some enrollment data needs attention
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  )
}

function EnrollmentCard({ row }: { row: EnrollmentRow }) {
  const progress = Math.round(Number(row.progress ?? row.completion?.progress ?? 0))
  const paymentStatus = latestPaymentStatus(row)
  const completion = row.completion
  const completed = Boolean(completion?.completed || row.status === 'completed' || row.completed_at)
  const courseHref = row.course?.id ? `/admin/courses/${row.course.id}/builder` : '/admin/courses'

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <LmsStatusBadge tone={statusTone(row.status)}>{firstText(row.status, 'active')}</LmsStatusBadge>
            <LmsStatusBadge tone={statusTone(paymentStatus)}>{paymentStatus}</LmsStatusBadge>
            {completed ? <LmsStatusBadge tone="green">completed</LmsStatusBadge> : null}
          </div>
          <h2 className="mt-3 break-words text-lg font-bold text-[#0F172A]">{courseTitle(row)}</h2>
          <p className="mt-2 text-sm font-semibold text-[#0F172A]">Student: {learnerName(row)}</p>
          {learnerEmail(row) ? <p className="mt-1 break-all text-xs text-slate-500">{learnerEmail(row)}</p> : null}
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-3 xl:min-w-[420px]">
          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Enrolled</p>
            <p className="mt-1 font-semibold text-[#0F172A]">{formatDate(row.enrolled_at ?? row.created_at)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Access expires</p>
            <p className="mt-1 font-semibold text-[#0F172A]">{formatDate(row.expires_at ?? row.access_extended_until)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Last access</p>
            <p className="mt-1 font-semibold text-[#0F172A]">{formatDateTime(row.last_accessed_at ?? row.latestSession?.last_heartbeat_at)}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
        <div className="space-y-3">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-[#0F172A]">Course progress</span>
              <span className="text-slate-500">{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <p className="text-xs text-slate-500">Lessons</p>
              <p className="font-semibold text-[#0F172A]">
                {Number(completion?.lessons_completed ?? 0)} / {Number(completion?.lessons_required ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <p className="text-xs text-slate-500">Online minutes</p>
              <p className="font-semibold text-[#0F172A]">{Number(completion?.online_minutes ?? 0).toLocaleString('en-PK')}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <p className="text-xs text-slate-500">Session time</p>
              <p className="font-semibold text-[#0F172A]">{formatMinutes(row.totalCreditedSeconds)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <p className="text-xs text-slate-500">Quiz score</p>
              <p className="font-semibold text-[#0F172A]">{completion?.final_quiz_score ?? 'Not recorded'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 text-sm">
          <p className="font-bold text-[#0F172A]">Payment and access</p>
          <dl className="mt-3 space-y-2 text-slate-600">
            <div className="flex justify-between gap-3">
              <dt>Latest payment</dt>
              <dd className="font-semibold capitalize text-[#0F172A]">{paymentStatus.replace(/_/g, ' ')}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Licence unlocked</dt>
              <dd className="text-right font-semibold text-[#0F172A]">{formatDateTime(row.license_unlocked_at)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Certificate eligible</dt>
              <dd className="font-semibold text-[#0F172A]">{completion?.eligible_for_certificate ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-xl border-slate-200 bg-white">
              <Link href={courseHref}>Open course</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl border-slate-200 bg-white">
              <Link href="/admin/course-payments">Payments</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default async function AdminEnrollmentsPage() {
  const { rows: enrollments, warnings } = await getAdminCourseEnrollmentRows()
  const active = enrollments.filter((row) => firstText(row.status, 'active') === 'active').length
  const completed = enrollments.filter((row) => row.completion?.completed || row.status === 'completed' || row.completed_at).length
  const pendingPayment = enrollments.filter((row) => ['pending', 'pending_payment', 'awaiting_payment'].includes(latestPaymentStatus(row))).length
  const expired = enrollments.filter((row) => {
    const expiresAt = row.expires_at ? new Date(row.expires_at) : null
    return expiresAt ? expiresAt.getTime() < Date.now() : false
  }).length

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <LmsPageHeader
        eyebrow="Course Enrollments"
        title="Enrollment visibility"
        description="Every course enrollment with student, course, payment, access, progress and completion details in one place."
        action={
          <Button asChild className="rounded-xl bg-[#1D4ED8]">
            <Link href="/admin/course-payments">
              <CreditCard className="mr-2 h-4 w-4" />
              Review Payments
            </Link>
          </Button>
        }
      />

      <Warnings warnings={warnings} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <LmsStatCard title="Enrollments" value={enrollments.length.toLocaleString('en-PK')} detail="Loaded records" icon={Users} />
        <LmsStatCard title="Active" value={active.toLocaleString('en-PK')} detail="Current access" icon={Activity} tone="green" />
        <LmsStatCard title="Completed" value={completed.toLocaleString('en-PK')} detail="Completion records" icon={GraduationCap} tone="blue" />
        <LmsStatCard title="Pending Payment" value={pendingPayment.toLocaleString('en-PK')} detail="Needs payment review" icon={CreditCard} tone="gold" />
        <LmsStatCard title="Expired" value={expired.toLocaleString('en-PK')} detail="Access date passed" icon={Clock} tone="red" />
      </div>

      <LmsSectionCard
        title="Recent Enrollment Records"
        description="Newest records are shown first. Payment and access details use the latest matching course-payment and learning-session data."
        icon={KeyRound}
      >
        {enrollments.length ? (
          <div className="space-y-4">
            {enrollments.map((row) => (
              <EnrollmentCard key={String(row.id)} row={row} />
            ))}
          </div>
        ) : (
          <LmsEmptyState
            icon={Users}
            title="No enrollments visible"
            description="No course enrollment records were returned. Check Supabase migrations and row-level policies if students have enrolled."
          />
        )}
      </LmsSectionCard>
    </div>
  )
}
