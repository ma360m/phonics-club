import { getAdminActivityLogRows } from '@/lib/admin/operational-visibility'
import { LmsEmptyState, LmsPageHeader, LmsSectionCard, LmsStatCard, LmsStatusBadge } from '@/components/lms/lms-primitives'
import { Activity, AlertTriangle, Bell, Clock, CreditCard, Download, ShieldCheck, Smartphone } from 'lucide-react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

type LogRow = Record<string, any>

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

function formatDuration(seconds?: unknown) {
  const value = Number(seconds ?? 0)
  if (!Number.isFinite(value) || value <= 0) return '0 min'
  const minutes = Math.max(1, Math.round(value / 60))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

function titleCase(value?: unknown) {
  return firstText(value, 'not recorded')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function personName(profile?: LogRow | null, fallback?: unknown) {
  return firstText(profile?.full_name, profile?.email, fallback, 'Unknown user')
}

function courseName(row: LogRow) {
  return firstText(row.course?.title, row.course_id, 'No course linked')
}

function jsonSnippet(value: unknown) {
  if (!value || (typeof value === 'object' && Object.keys(value as object).length === 0)) return ''
  try {
    const text = JSON.stringify(value)
    return text.length > 220 ? `${text.slice(0, 220)}...` : text
  } catch {
    return firstText(value)
  }
}

function WarningPanel({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" />
        Some log sources could not be loaded
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  )
}

function LogCard({
  title,
  subtitle,
  time,
  badges = [],
  details = [],
  metadata,
}: {
  title: string
  subtitle?: string
  time?: string
  badges?: Array<{ label: string; tone?: 'blue' | 'red' | 'gold' | 'green' | 'navy' }>
  details?: Array<{ label: string; value: string }>
  metadata?: unknown
}) {
  const meta = jsonSnippet(metadata)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {badges.map((badge) => (
              <LmsStatusBadge key={badge.label} tone={badge.tone ?? 'blue'}>{badge.label}</LmsStatusBadge>
            ))}
          </div>
          <h3 className="mt-3 break-words text-base font-bold text-[#0F172A]">{title}</h3>
          {subtitle ? <p className="mt-1 break-words text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {time ? <p className="shrink-0 text-sm font-semibold text-slate-500">{time}</p> : null}
      </div>

      {details.length ? (
        <dl className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {details.map((detail) => (
            <div key={`${detail.label}-${detail.value}`} className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{detail.label}</dt>
              <dd className="mt-1 break-words text-sm font-semibold text-[#0F172A]">{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {meta ? (
        <pre className="mt-4 max-h-28 overflow-auto rounded-xl border border-slate-200 bg-[#0F172A] p-3 text-xs leading-5 text-slate-100">
          {meta}
        </pre>
      ) : null}
    </article>
  )
}

function LogSection({
  title,
  description,
  icon,
  rows,
  emptyTitle,
  emptyDescription,
  render,
}: {
  title: string
  description: string
  icon: LucideIcon
  rows: LogRow[]
  emptyTitle: string
  emptyDescription: string
  render: (row: LogRow) => ReactNode
}) {
  return (
    <LmsSectionCard title={title} description={description} icon={icon} className="mt-6">
      {rows.length ? (
        <div className="space-y-3">
          {rows.map(render)}
        </div>
      ) : (
        <LmsEmptyState icon={icon} title={emptyTitle} description={emptyDescription} />
      )}
    </LmsSectionCard>
  )
}

export default async function AdminActivityLogsPage() {
  const { rows: logs, warnings } = await getAdminActivityLogRows()
  const suspiciousSessions = logs.learningSessions.filter((row) => Boolean(row.suspicious)).length
  const failedNotifications = logs.notificationEvents.filter((row) => String(row.status ?? '') === 'failed').length

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <LmsPageHeader
        eyebrow="Admin Logs"
        title="Activity, access and event logs"
        description="Operational visibility for admin/LMS audit records, learner access sessions, mobile events, payment workflow events, resource downloads and notification delivery."
      />

      <WarningPanel warnings={warnings} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <LmsStatCard title="Admin Activity" value={logs.lmsAudit.length} detail="LMS audit rows" icon={ShieldCheck} />
        <LmsStatCard title="Access Sessions" value={logs.learningSessions.length} detail={`${suspiciousSessions} suspicious`} icon={Clock} tone={suspiciousSessions ? 'red' : 'green'} />
        <LmsStatCard title="Mobile Events" value={logs.mobileAudit.length} detail="API audit events" icon={Smartphone} tone="blue" />
        <LmsStatCard title="Payment Events" value={logs.paymentEvents.length} detail="Workflow changes" icon={CreditCard} tone="gold" />
        <LmsStatCard title="Downloads" value={logs.resourceDownloads.length} detail="Resource access" icon={Download} tone="navy" />
        <LmsStatCard title="Notifications" value={logs.notificationEvents.length} detail={`${failedNotifications} failed`} icon={Bell} tone={failedNotifications ? 'red' : 'green'} />
      </div>

      <LogSection
        title="Admin Activity Logs"
        description="Recent LMS audit records for admin or instructor actions when the database records them."
        icon={ShieldCheck}
        rows={logs.lmsAudit}
        emptyTitle="No admin activity logs yet"
        emptyDescription="The lms_audit_logs table is available, but no audit rows were returned."
        render={(row) => (
          <LogCard
            key={String(row.id)}
            title={`${titleCase(row.action)} ${firstText(row.entity_type, 'record')}`}
            subtitle={`${personName(row.actorProfile, row.actor_id)} acted on ${personName(row.profile, row.user_id)} · ${courseName(row)}`}
            time={formatDateTime(row.created_at)}
            badges={[
              { label: titleCase(row.action), tone: 'blue' },
              { label: titleCase(row.entity_type), tone: 'navy' },
            ]}
            details={[
              { label: 'Actor', value: personName(row.actorProfile, row.actor_id) },
              { label: 'Student/User', value: personName(row.profile, row.user_id) },
              { label: 'Entity ID', value: firstText(row.entity_id, '-') },
            ]}
            metadata={{ previous: row.previous_values, next: row.new_values, metadata: row.metadata }}
          />
        )}
      />

      <LogSection
        title="Access Logs"
        description="Recent course access sessions and suspicious learning-session validation flags."
        icon={Clock}
        rows={logs.learningSessions}
        emptyTitle="No access sessions"
        emptyDescription="Learner course-access sessions will appear here after the LMS session tracker records activity."
        render={(row) => (
          <LogCard
            key={String(row.id)}
            title={`${personName(row.profile, row.user_id)} opened ${courseName(row)}`}
            subtitle={firstText(row.lesson?.title, 'No lesson linked')}
            time={formatDateTime(row.started_at ?? row.created_at)}
            badges={[
              { label: titleCase(row.status), tone: row.suspicious ? 'red' : 'green' },
              { label: row.suspicious ? 'Suspicious' : 'Normal', tone: row.suspicious ? 'red' : 'green' },
            ]}
            details={[
              { label: 'Device', value: firstText(row.device_id, '-') },
              { label: 'Credited time', value: formatDuration(row.credited_seconds) },
              { label: 'Last heartbeat', value: formatDateTime(row.last_heartbeat_at) },
            ]}
            metadata={{ validationFlags: row.validation_flags, inactivitySeconds: row.inactivity_seconds }}
          />
        )}
      />

      <LogSection
        title="Resource Download Logs"
        description="Recent course resource-download access records."
        icon={Download}
        rows={logs.resourceDownloads}
        emptyTitle="No resource downloads"
        emptyDescription="Downloaded course resources will appear here when the LMS records resource access."
        render={(row) => (
          <LogCard
            key={String(row.id)}
            title={`${personName(row.profile, row.user_id)} downloaded a resource`}
            subtitle={courseName(row)}
            time={formatDateTime(row.downloaded_at)}
            badges={[{ label: 'Download', tone: 'navy' }]}
            details={[
              { label: 'Resource ID', value: firstText(row.resource_id, '-') },
              { label: 'IP hash', value: firstText(row.ip_hash, '-') },
              { label: 'User agent', value: firstText(row.user_agent, '-') },
            ]}
          />
        )}
      />

      <LogSection
        title="Event Logs"
        description="Mobile API audit events, course-payment workflow events, and notification delivery records."
        icon={Activity}
        rows={[...logs.mobileAudit, ...logs.paymentEvents, ...logs.notificationEvents].sort((a, b) => {
          const aTime = new Date(firstText(a.created_at, a.sent_at)).getTime()
          const bTime = new Date(firstText(b.created_at, b.sent_at)).getTime()
          return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0)
        })}
        emptyTitle="No events recorded"
        emptyDescription="Mobile, payment and notification event records will appear here after those workflows run."
        render={(row) => {
          const isPaymentEvent = Boolean(row.payment_id)
          const isNotification = Boolean(row.recipient_email)
          const eventType = firstText(row.event_type, row.subject, 'event')
          const title = isNotification
            ? `Notification: ${titleCase(eventType)}`
            : isPaymentEvent
              ? `Payment event: ${titleCase(eventType)}`
              : `Mobile event: ${titleCase(eventType)}`
          return (
            <LogCard
              key={`${isPaymentEvent ? 'payment' : isNotification ? 'notification' : 'mobile'}-${String(row.id)}`}
              title={title}
              subtitle={`${personName(row.profile, row.user_id)} · ${courseName(row)}`}
              time={formatDateTime(row.created_at ?? row.sent_at)}
              badges={[
                { label: isNotification ? titleCase(row.status) : titleCase(eventType), tone: isNotification && row.status === 'failed' ? 'red' : isPaymentEvent ? 'gold' : 'blue' },
              ]}
              details={[
                { label: 'Entity', value: firstText(row.entity_type, row.payment_id ? 'course payment' : '-') },
                { label: 'Reference', value: firstText(row.entity_id, row.payment_id, row.request_id, row.recipient_email, '-') },
                { label: 'User agent', value: firstText(row.user_agent, row.subject, '-') },
              ]}
              metadata={firstText(row.previous_status, row.new_status)
                ? { previousStatus: row.previous_status, newStatus: row.new_status, payload: row.payload }
                : row.metadata}
            />
          )
        }}
      />
    </div>
  )
}
