import { requireAdmin } from '@/lib/auth'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { AdminCustomer } from '@/types/database'

export type AdminInvoiceCustomer = Pick<AdminCustomer, 'id' | 'user_id' | 'name' | 'email' | 'phone' | 'member_id' | 'address' | 'city' | 'zip' | 'country' | 'notes'> & {
  source: 'directory' | 'profile' | 'order'
}

export type CustomerReportRow = {
  key: string
  accountUserIds: string[]
  username: string
  passwordStatus: string
  name: string
  email: string
  phone: string
  address: string
  couponCodes: string[]
  memberIds: string[]
  enrolledCourses: string[]
  coursePaymentCourses: string[]
  trainingRegistrations: string[]
  webinarRegistrations: string[]
  productInvoices: string[]
  products: string[]
  lastActivityAt: string
}

type MutableCustomerRow = CustomerReportRow & {
  userIds: Set<string>
}

function clean(value: unknown) {
  return String(value ?? '').trim()
}

function uniquePush(items: string[], value: unknown) {
  const text = clean(value)
  if (text && !items.includes(text)) items.push(text)
}

function addressText(address: Record<string, unknown> | null | undefined) {
  if (!address) return ''
  return [
    address.address,
    address.city,
    address.zip,
    address.country,
  ].map(clean).filter(Boolean).join(', ')
}

function customerKey(input: { userId?: string | null; email?: string | null; phone?: string | null; fallback: string }) {
  const userId = clean(input.userId)
  const email = clean(input.email).toLowerCase()
  const phone = clean(input.phone).replace(/[^\d+]/g, '')
  if (userId) return `user:${userId}`
  if (email) return `email:${email}`
  if (phone) return `phone:${phone}`
  return input.fallback
}

function createRow(key: string): MutableCustomerRow {
  return {
    key,
    accountUserIds: [],
    username: '',
    passwordStatus: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    couponCodes: [],
    memberIds: [],
    enrolledCourses: [],
    coursePaymentCourses: [],
    trainingRegistrations: [],
    webinarRegistrations: [],
    productInvoices: [],
    products: [],
    lastActivityAt: '',
    userIds: new Set<string>(),
  }
}

function upsertCustomer(
  rows: Map<string, MutableCustomerRow>,
  input: {
    key: string
    userId?: string | null
    name?: string | null
    username?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    activityAt?: string | null
  },
) {
  const row = rows.get(input.key) ?? createRow(input.key)
  if (input.userId) row.userIds.add(input.userId)
  if (!row.name) row.name = clean(input.name)
  if (!row.username) row.username = clean(input.username)
  if (!row.email) row.email = clean(input.email)
  if (!row.username && row.email.includes('@')) row.username = row.email.split('@')[0]
  if (!row.phone) row.phone = clean(input.phone)
  if (!row.address) row.address = clean(input.address)
  if (input.activityAt && (!row.lastActivityAt || input.activityAt > row.lastActivityAt)) row.lastActivityAt = input.activityAt
  rows.set(input.key, row)
  return row
}

export async function getAdminCustomerRows(): Promise<CustomerReportRow[]> {
  await requireAdmin()
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? await createServiceClient() : await createClient()
  const [ordersResult, enrollmentsResult, paymentsResult, registrationsResult, courseInvoicesResult] = await Promise.all([
    supabase.from('orders').select('id, user_id, guest_email, phone, shipping_address, items, invoice_number, coupon_code, member_id, created_at'),
    supabase.from('enrollments').select('id, user_id, course_id, status, created_at'),
    supabase.from('course_payments').select('id, user_id, course_id, status, created_at'),
    supabase.from('training_registrations').select('id, user_id, full_name, email, phone, event_title, training_type, created_at'),
    supabase.from('course_invoices').select('id, user_id, course_id, invoice_number, issued_at'),
  ])

  const relatedUserIds = new Set<string>()
  const relatedCourseIds = new Set<string>()
  for (const enrollment of enrollmentsResult.data ?? []) {
    const userId = clean(enrollment.user_id)
    const courseId = clean(enrollment.course_id)
    if (userId) relatedUserIds.add(userId)
    if (courseId) relatedCourseIds.add(courseId)
  }
  for (const payment of paymentsResult.data ?? []) {
    const userId = clean(payment.user_id)
    const courseId = clean(payment.course_id)
    if (userId) relatedUserIds.add(userId)
    if (courseId) relatedCourseIds.add(courseId)
  }
  for (const invoice of courseInvoicesResult.data ?? []) {
    const userId = clean(invoice.user_id)
    const courseId = clean(invoice.course_id)
    if (userId) relatedUserIds.add(userId)
    if (courseId) relatedCourseIds.add(courseId)
  }

  const [profilesResult, coursesResult] = await Promise.all([
    relatedUserIds.size
      ? supabase.from('profiles').select('id, full_name, email, username').in('id', [...relatedUserIds])
      : Promise.resolve({ data: [] }),
    relatedCourseIds.size
      ? supabase.from('courses').select('id, title').in('id', [...relatedCourseIds])
      : Promise.resolve({ data: [] }),
  ])
  const profilesById = new Map((profilesResult.data ?? []).map((profile: any) => [profile.id, profile]))
  const coursesById = new Map((coursesResult.data ?? []).map((course: any) => [course.id, course]))

  const rows = new Map<string, MutableCustomerRow>()
  const userIdToKey = new Map<string, string>()

  for (const order of ordersResult.data ?? []) {
    const address = order.shipping_address as Record<string, unknown> | null
    const email = clean(address?.email ?? order.guest_email)
    const phone = clean(order.phone ?? address?.phone)
    const key = customerKey({ userId: order.user_id, email, phone, fallback: `order:${order.id}` })
    if (order.user_id) userIdToKey.set(order.user_id, key)
    const row = upsertCustomer(rows, {
      key,
      userId: order.user_id,
      name: clean(address?.fullName ?? address?.name),
      email,
      phone,
      address: addressText(address),
      activityAt: order.created_at,
    })

    uniquePush(row.productInvoices, order.invoice_number ?? order.id)
    uniquePush(row.couponCodes, order.coupon_code)
    uniquePush(row.memberIds, order.member_id)
    const items = Array.isArray(order.items) ? order.items : []
    items.forEach((item: any) => uniquePush(row.products, item?.name))
  }

  for (const enrollment of enrollmentsResult.data ?? []) {
    const profile = profilesById.get(enrollment.user_id) as { full_name?: string | null; email?: string | null; username?: string | null } | null
    const course = coursesById.get(enrollment.course_id) as { title?: string | null } | null
    const key = userIdToKey.get(enrollment.user_id) ?? customerKey({
      userId: enrollment.user_id,
      email: profile?.email,
      fallback: `enrollment:${enrollment.id}`,
    })
    userIdToKey.set(enrollment.user_id, key)
    const row = upsertCustomer(rows, {
      key,
      userId: enrollment.user_id,
      name: profile?.full_name,
      username: profile?.username,
      email: profile?.email,
      activityAt: enrollment.created_at,
    })
    uniquePush(row.enrolledCourses, course?.title ?? enrollment.course_id)
  }

  for (const payment of paymentsResult.data ?? []) {
    const profile = profilesById.get(payment.user_id) as { full_name?: string | null; email?: string | null; username?: string | null } | null
    const course = coursesById.get(payment.course_id) as { title?: string | null } | null
    const key = userIdToKey.get(payment.user_id) ?? customerKey({
      userId: payment.user_id,
      email: profile?.email,
      fallback: `course-payment:${payment.id}`,
    })
    userIdToKey.set(payment.user_id, key)
    const row = upsertCustomer(rows, {
      key,
      userId: payment.user_id,
      name: profile?.full_name,
      username: profile?.username,
      email: profile?.email,
      activityAt: payment.created_at,
    })
    uniquePush(row.coursePaymentCourses, course?.title ?? payment.course_id)
  }

  for (const invoice of courseInvoicesResult.data ?? []) {
    const key = userIdToKey.get(invoice.user_id) ?? customerKey({
      userId: invoice.user_id,
      fallback: `course-invoice:${invoice.id}`,
    })
    const row = upsertCustomer(rows, {
      key,
      userId: invoice.user_id,
      activityAt: invoice.issued_at,
    })
    uniquePush(row.productInvoices, invoice.invoice_number)
  }

  for (const registration of registrationsResult.data ?? []) {
    const email = clean(registration.email)
    const phone = clean(registration.phone)
    const key = userIdToKey.get(clean(registration.user_id)) ?? customerKey({
      userId: registration.user_id,
      email,
      phone,
      fallback: `training:${registration.id}`,
    })
    if (registration.user_id) userIdToKey.set(registration.user_id, key)
    const row = upsertCustomer(rows, {
      key,
      userId: registration.user_id,
      name: registration.full_name,
      email,
      phone,
      activityAt: registration.created_at,
    })
    if (registration.training_type === 'online_webinar') {
      uniquePush(row.webinarRegistrations, registration.event_title)
    } else {
      uniquePush(row.trainingRegistrations, registration.event_title)
    }
  }

  const profileIds = [...userIdToKey.keys()].filter(Boolean)
  if (profileIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, username')
      .in('id', profileIds)

    for (const profile of profiles ?? []) {
      const key = userIdToKey.get(profile.id)
      if (!key) continue
      upsertCustomer(rows, {
        key,
        userId: profile.id,
        name: profile.full_name,
        username: profile.username,
        email: profile.email,
      })
    }
  }

  return [...rows.values()]
    .map(({ userIds, ...row }) => ({
      ...row,
      accountUserIds: [...userIds],
      passwordStatus: userIds.size
        ? 'Supabase-managed. Password is not visible or stored here.'
        : 'Guest or external customer. No website password is stored here.',
    }))
    .sort((a, b) => (b.lastActivityAt || '').localeCompare(a.lastActivityAt || ''))
}

export function customerRowsToCsv(rows: CustomerReportRow[]) {
  const headers = [
    'Customer Name',
    'Username',
    'Password Status',
    'Email',
    'Phone',
    'Address',
    'Member IDs Used',
    'Coupons Used',
    'Enrolled Courses',
    'Course Payments',
    'Training Registrations',
    'Webinar Registrations',
    'Product/Invoice Numbers',
    'Products Bought',
    'Last Activity',
  ]
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const lines = rows.map((row) => [
    row.name,
    row.username,
    row.passwordStatus,
    row.email,
    row.phone,
    row.address,
    row.memberIds.join('; '),
    row.couponCodes.join('; '),
    row.enrolledCourses.join('; '),
    row.coursePaymentCourses.join('; '),
    row.trainingRegistrations.join('; '),
    row.webinarRegistrations.join('; '),
    row.productInvoices.join('; '),
    row.products.join('; '),
    row.lastActivityAt,
  ].map(escape).join(','))

  return [headers.map(escape).join(','), ...lines].join('\n')
}

function directoryKey(input: { userId?: string | null; email?: string | null; phone?: string | null; fallback: string }) {
  const userId = clean(input.userId)
  const email = clean(input.email).toLowerCase()
  const phone = clean(input.phone).replace(/[^\d+]/g, '')
  if (userId) return `user:${userId}`
  if (email) return `email:${email}`
  if (phone) return `phone:${phone}`
  return input.fallback
}

export async function getAdminInvoiceCustomers(): Promise<AdminInvoiceCustomer[]> {
  await requireAdmin()
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? await createServiceClient() : await createClient()
  const [directoryResult, profilesResult, ordersResult] = await Promise.all([
    supabase.from('admin_customers').select('id, user_id, name, email, phone, member_id, address, city, zip, country, notes').order('name', { ascending: true }),
    supabase.from('profiles').select('id, full_name, email, role').not('role', 'in', '(admin,super_admin)'),
    supabase.from('orders').select('id, user_id, guest_email, phone, shipping_address, member_id, created_at').order('created_at', { ascending: false }).limit(1000),
  ])

  const rows = new Map<string, AdminInvoiceCustomer>()
  const userToKey = new Map<string, string>()

  function addCustomer(input: {
    id: string
    source: AdminInvoiceCustomer['source']
    userId?: string | null
    name?: unknown
    email?: unknown
    phone?: unknown
    memberId?: unknown
    address?: unknown
    city?: unknown
    zip?: unknown
    country?: unknown
    notes?: unknown
  }) {
    const email = clean(input.email).toLowerCase()
    const phone = clean(input.phone)
    const key = userToKey.get(clean(input.userId)) ?? directoryKey({ userId: input.userId, email, phone, fallback: input.id })
    const existing = rows.get(key)
    const next: AdminInvoiceCustomer = existing ?? {
      id: input.id,
      user_id: clean(input.userId) || null,
      name: clean(input.name),
      email: email || null,
      phone: phone || null,
      member_id: clean(input.memberId) || null,
      address: clean(input.address) || null,
      city: clean(input.city) || null,
      zip: clean(input.zip) || null,
      country: clean(input.country) || 'Pakistan',
      notes: clean(input.notes) || null,
      source: input.source,
    }
    if (input.userId) {
      next.user_id = input.userId
      userToKey.set(input.userId, key)
    }
    if (!next.name) next.name = clean(input.name)
    if (!next.email && email) next.email = email
    if (!next.phone && phone) next.phone = phone
    if (!next.member_id && clean(input.memberId)) next.member_id = clean(input.memberId)
    if (!next.address && clean(input.address)) next.address = clean(input.address)
    if (!next.city && clean(input.city)) next.city = clean(input.city)
    if (!next.zip && clean(input.zip)) next.zip = clean(input.zip)
    if (!next.country && clean(input.country)) next.country = clean(input.country)
    rows.set(key, next)
  }

  for (const customer of (directoryResult.data ?? []) as AdminCustomer[]) {
    addCustomer({
      id: customer.id,
      source: 'directory',
      userId: customer.user_id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      memberId: customer.member_id,
      address: customer.address,
      city: customer.city,
      zip: customer.zip,
      country: customer.country,
      notes: customer.notes,
    })
  }

  for (const profile of profilesResult.data ?? []) {
    if (profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'instructor') continue
    addCustomer({ id: `profile:${profile.id}`, source: 'profile', userId: profile.id, name: profile.full_name, email: profile.email })
  }

  for (const order of ordersResult.data ?? []) {
    const address = order.shipping_address as Record<string, unknown> | null
    const email = clean(address?.email ?? order.guest_email)
    const phone = clean(order.phone ?? address?.phone)
    addCustomer({
      id: `order:${order.id}`,
      source: 'order',
      userId: order.user_id,
      name: address?.fullName ?? address?.name,
      email,
      phone,
      memberId: order.member_id,
      address: address?.address,
      city: address?.city,
      zip: address?.zip,
      country: address?.country,
    })
  }

  return [...rows.values()]
    .filter((customer) => customer.name || customer.email || customer.phone)
    .sort((a, b) => `${a.name} ${a.email ?? ''}`.localeCompare(`${b.name} ${b.email ?? ''}`))
}

export function studentRowsToCsv(rows: CustomerReportRow[]) {
  const studentRows = rows.filter((row) => row.enrolledCourses.length || row.coursePaymentCourses.length)
  const headers = [
    'Student Name',
    'Username',
    'Email',
    'Phone',
    'Enrolled Courses',
    'Course Payments',
    'Training Registrations',
    'Webinar Registrations',
    'Last Activity',
  ]
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const lines = studentRows.map((row) => [
    row.name,
    row.username,
    row.email,
    row.phone,
    row.enrolledCourses.join('; '),
    row.coursePaymentCourses.join('; '),
    row.trainingRegistrations.join('; '),
    row.webinarRegistrations.join('; '),
    row.lastActivityAt,
  ].map(escape).join(','))

  return [headers.map(escape).join(','), ...lines].join('\n')
}
