import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export type CustomerReportRow = {
  key: string
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
  const supabase = await createClient()
  const [ordersResult, enrollmentsResult, paymentsResult, registrationsResult, courseInvoicesResult] = await Promise.all([
    supabase.from('orders').select('id, user_id, guest_email, phone, shipping_address, items, invoice_number, coupon_code, member_id, created_at'),
    supabase.from('enrollments').select('id, user_id, course_id, status, created_at, courses(title), profiles(full_name,email,username)'),
    supabase.from('course_payments').select('id, user_id, course_id, status, created_at, courses(title), profiles(full_name,email,username)'),
    supabase.from('training_registrations').select('id, user_id, full_name, email, phone, event_title, training_type, created_at'),
    supabase.from('course_invoices').select('id, user_id, course_id, invoice_number, issued_at, courses(title)'),
  ])

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
    const profile = enrollment.profiles as { full_name?: string | null; email?: string | null; username?: string | null } | null
    const course = enrollment.courses as { title?: string | null } | null
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
    const profile = payment.profiles as { full_name?: string | null; email?: string | null; username?: string | null } | null
    const course = payment.courses as { title?: string | null } | null
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
