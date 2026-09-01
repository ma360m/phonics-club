import { requireAdmin } from '@/lib/auth'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type AnyRecord = Record<string, any>

export interface AdminDataResult<T> {
  rows: T
  warnings: string[]
}

async function getAdminSupabase() {
  await requireAdmin()
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : createClient()
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? '').trim()
    if (text) return text
  }
  return ''
}

function normalizeRows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : []
}

function tableWarning(label: string, error: AnyRecord | null | undefined) {
  const message = firstText(error?.message, error?.details, error?.hint)
  return message ? `${label}: ${message}` : `${label}: table could not be loaded.`
}

function uniqueIds(rows: AnyRecord[], keys: string[]) {
  const ids = new Set<string>()
  rows.forEach((row) => {
    keys.forEach((key) => {
      const value = firstText(row[key])
      if (value) ids.add(value)
    })
  })
  return [...ids]
}

function byId(rows: AnyRecord[]) {
  return new Map(rows.map((row) => [String(row.id), row]))
}

async function selectProfiles(supabase: any, ids: string[]) {
  if (!ids.length) return new Map<string, AnyRecord>()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, username, role, created_at')
    .in('id', ids)
  return byId(normalizeRows<AnyRecord>(data))
}

async function selectCourses(supabase: any, ids: string[]) {
  if (!ids.length) return new Map<string, AnyRecord>()
  const { data } = await supabase
    .from('courses')
    .select('id, title, slug, instructor, price, discounted_price, currency, published')
    .in('id', ids)
  return byId(normalizeRows<AnyRecord>(data))
}

async function selectLessons(supabase: any, ids: string[]) {
  if (!ids.length) return new Map<string, AnyRecord>()
  const { data } = await supabase
    .from('course_lessons')
    .select('id, title, course_id, lesson_type')
    .in('id', ids)
  return byId(normalizeRows<AnyRecord>(data))
}

async function selectTableRows(
  supabase: any,
  table: string,
  select: string,
  options: { orderColumn: string; ascending?: boolean; limit?: number },
) {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .order(options.orderColumn, { ascending: options.ascending ?? false })
    .limit(options.limit ?? 80)

  return { rows: normalizeRows<AnyRecord>(data), error }
}

function enrichWithLookups(
  rows: AnyRecord[],
  lookups: {
    profiles: Map<string, AnyRecord>
    courses: Map<string, AnyRecord>
    lessons?: Map<string, AnyRecord>
  },
) {
  return rows.map((row) => ({
    ...row,
    profile: row.user_id ? lookups.profiles.get(String(row.user_id)) ?? null : null,
    actorProfile: row.actor_id ? lookups.profiles.get(String(row.actor_id)) ?? null : null,
    course: row.course_id ? lookups.courses.get(String(row.course_id)) ?? null : null,
    lesson: row.lesson_id && lookups.lessons ? lookups.lessons.get(String(row.lesson_id)) ?? null : null,
  }))
}

export async function getAdminCourseEnrollmentRows(): Promise<AdminDataResult<AnyRecord[]>> {
  const supabase = await getAdminSupabase()
  const warnings: string[] = []
  const preferredSelect = [
    'id',
    'user_id',
    'course_id',
    'progress',
    'status',
    'payment_status',
    'purchase_date',
    'activated_at',
    'expires_at',
    'completed_at',
    'last_accessed_at',
    'access_extended_until',
    'payment_id',
    'license_key',
    'license_unlocked_at',
    'admin_notes',
    'enrolled_at',
  ].join(', ')

  let { rows: enrollments, error } = await selectTableRows(supabase, 'enrollments', preferredSelect, {
    orderColumn: 'enrolled_at',
    limit: 300,
  })

  if (error) {
    const fallback = await selectTableRows(supabase, 'enrollments', 'id, user_id, course_id, progress, enrolled_at', {
      orderColumn: 'enrolled_at',
      limit: 300,
    })
    if (fallback.error) {
      warnings.push(tableWarning('Course enrollments', fallback.error))
      enrollments = []
    } else {
      warnings.push('Course enrollments loaded with basic fields only. Run the LMS operations migrations for access/payment columns.')
      enrollments = fallback.rows
    }
  }

  const userIds = uniqueIds(enrollments, ['user_id'])
  const courseIds = uniqueIds(enrollments, ['course_id'])
  const enrollmentIds = uniqueIds(enrollments, ['id'])

  const [
    profiles,
    courses,
    completionResult,
    paymentsResult,
    sessionsResult,
  ] = await Promise.all([
    selectProfiles(supabase, userIds),
    selectCourses(supabase, courseIds),
    enrollmentIds.length
      ? selectTableRows(
          supabase,
          'course_completion_status',
          'id, user_id, course_id, enrollment_id, completed, eligible_for_certificate, lessons_completed, lessons_required, online_minutes, offline_minutes, final_quiz_score, evaluated_at',
          { orderColumn: 'evaluated_at', limit: 500 },
        )
      : Promise.resolve({ rows: [], error: null }),
    enrollmentIds.length
      ? selectTableRows(
          supabase,
          'course_payments',
          'id, user_id, course_id, enrollment_id, amount, currency, status, payment_method, submitted_at, verified_at, rejected_at, created_at',
          { orderColumn: 'created_at', limit: 500 },
        )
      : Promise.resolve({ rows: [], error: null }),
    enrollmentIds.length
      ? selectTableRows(
          supabase,
          'learning_sessions',
          'id, user_id, course_id, enrollment_id, lesson_id, device_id, started_at, last_heartbeat_at, ended_at, credited_seconds, status, suspicious, created_at',
          { orderColumn: 'created_at', limit: 500 },
        )
      : Promise.resolve({ rows: [], error: null }),
  ])

  if (completionResult.error) warnings.push(tableWarning('Completion status', completionResult.error))
  if (paymentsResult.error) warnings.push(tableWarning('Course payments', paymentsResult.error))
  if (sessionsResult.error) warnings.push(tableWarning('Learning sessions', sessionsResult.error))

  const completionByEnrollment = new Map<string, AnyRecord>()
  completionResult.rows.forEach((row) => {
    const key = firstText(row.enrollment_id, `${row.user_id}:${row.course_id}`)
    if (key && !completionByEnrollment.has(key)) completionByEnrollment.set(key, row)
  })

  const paymentsByEnrollment = new Map<string, AnyRecord[]>()
  paymentsResult.rows.forEach((row) => {
    const key = firstText(row.enrollment_id, `${row.user_id}:${row.course_id}`)
    if (!key) return
    paymentsByEnrollment.set(key, [...(paymentsByEnrollment.get(key) ?? []), row])
  })

  const sessionsByEnrollment = new Map<string, AnyRecord[]>()
  sessionsResult.rows.forEach((row) => {
    const key = firstText(row.enrollment_id, `${row.user_id}:${row.course_id}`)
    if (!key) return
    sessionsByEnrollment.set(key, [...(sessionsByEnrollment.get(key) ?? []), row])
  })

  const rows = enrollments.map((enrollment) => {
    const profile = enrollment.user_id ? profiles.get(String(enrollment.user_id)) ?? null : null
    const course = enrollment.course_id ? courses.get(String(enrollment.course_id)) ?? null : null
    const lookupKey = firstText(enrollment.id, `${enrollment.user_id}:${enrollment.course_id}`)
    const altKey = `${enrollment.user_id}:${enrollment.course_id}`
    const payments = paymentsByEnrollment.get(lookupKey) ?? paymentsByEnrollment.get(altKey) ?? []
    const sessions = sessionsByEnrollment.get(lookupKey) ?? sessionsByEnrollment.get(altKey) ?? []
    const completion = completionByEnrollment.get(lookupKey) ?? completionByEnrollment.get(altKey) ?? null
    const totalCreditedSeconds = sessions.reduce((sum, session) => sum + Number(session.credited_seconds ?? 0), 0)

    return {
      ...enrollment,
      profile,
      course,
      completion,
      payments,
      latestPayment: payments[0] ?? null,
      latestSession: sessions[0] ?? null,
      sessionCount: sessions.length,
      totalCreditedSeconds,
    }
  })

  return { rows, warnings }
}

export async function getAdminActivityLogRows(): Promise<AdminDataResult<Record<string, AnyRecord[]>>> {
  const supabase = await getAdminSupabase()
  const warnings: string[] = []
  const [
    lmsAudit,
    mobileAudit,
    learningSessions,
    paymentEvents,
    resourceDownloads,
    notificationEvents,
  ] = await Promise.all([
    selectTableRows(
      supabase,
      'lms_audit_logs',
      'id, actor_id, user_id, course_id, entity_type, entity_id, action, previous_values, new_values, metadata, created_at',
      { orderColumn: 'created_at', limit: 80 },
    ),
    selectTableRows(
      supabase,
      'mobile_audit_events',
      'id, user_id, event_type, entity_type, entity_id, request_id, ip_hash, user_agent, metadata, created_at',
      { orderColumn: 'created_at', limit: 80 },
    ),
    selectTableRows(
      supabase,
      'learning_sessions',
      'id, user_id, course_id, lesson_id, enrollment_id, device_id, started_at, last_heartbeat_at, ended_at, credited_seconds, inactivity_seconds, status, validation_flags, suspicious, created_at',
      { orderColumn: 'created_at', limit: 80 },
    ),
    selectTableRows(
      supabase,
      'course_payment_events',
      'id, payment_id, course_id, user_id, previous_status, new_status, event_type, actor_id, payload, created_at',
      { orderColumn: 'created_at', limit: 80 },
    ),
    selectTableRows(
      supabase,
      'course_resource_downloads',
      'id, resource_id, user_id, course_id, downloaded_at, ip_hash, user_agent',
      { orderColumn: 'downloaded_at', limit: 80 },
    ),
    selectTableRows(
      supabase,
      'notification_events',
      'id, user_id, course_id, event_type, recipient_email, subject, sent_at, provider, status, created_at',
      { orderColumn: 'created_at', limit: 80 },
    ),
  ])

  const results = [
    ['LMS audit logs', lmsAudit],
    ['Mobile audit events', mobileAudit],
    ['Learning access sessions', learningSessions],
    ['Course payment events', paymentEvents],
    ['Resource download access logs', resourceDownloads],
    ['Notification events', notificationEvents],
  ] as const

  results.forEach(([label, result]) => {
    if (result.error) warnings.push(tableWarning(label, result.error))
  })

  const allRows = results.flatMap(([, result]) => result.rows)
  const profiles = await selectProfiles(supabase, uniqueIds(allRows, ['user_id', 'actor_id']))
  const courses = await selectCourses(supabase, uniqueIds(allRows, ['course_id']))
  const lessons = await selectLessons(supabase, uniqueIds(allRows, ['lesson_id']))

  return {
    warnings,
    rows: {
      lmsAudit: enrichWithLookups(lmsAudit.rows, { profiles, courses }),
      mobileAudit: enrichWithLookups(mobileAudit.rows, { profiles, courses }),
      learningSessions: enrichWithLookups(learningSessions.rows, { profiles, courses, lessons }),
      paymentEvents: enrichWithLookups(paymentEvents.rows, { profiles, courses }),
      resourceDownloads: enrichWithLookups(resourceDownloads.rows, { profiles, courses }),
      notificationEvents: enrichWithLookups(notificationEvents.rows, { profiles, courses }),
    },
  }
}
