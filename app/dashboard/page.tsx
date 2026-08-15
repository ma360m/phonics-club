import Link from 'next/link'
import type { ReactNode } from 'react'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { getProfile, isAdminRole, isLmsManagerRole, requireAuth } from '@/lib/auth'
import { getUserEnrollments } from '@/actions/enrollments'
import { createClient } from '@/lib/supabase/server'
import { getContactSettings } from '@/lib/site-content'
import { getContactPhoneLinks } from '@/lib/contact-settings'
import { signOutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LmsShell } from '@/components/lms/lms-shell'
import { LmsEmptyState, LmsPageHeader, LmsStatusBadge } from '@/components/lms/lms-primitives'
import { BookOpen, CalendarDays, ChevronDown, Download, FileText, GraduationCap, Heart, Shield, ShoppingBag, UserRound, Wrench, type LucideIcon } from 'lucide-react'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'
import { CustomerOrderControls } from '@/components/orders/customer-order-controls'
import { getCustomerOrderStatusLabel } from '@/lib/order-status'
import { getCourseAccessState } from '@/lib/lms'
import { formatPrice, formatDate } from '@/utils/format'
import type { OrderItem } from '@/types'

export const dynamic = 'force-dynamic'

type TrainingRegistrationDashboardRow = {
  id: string
  training_type?: string | null
  event_title?: string | null
  event_date?: string | null
  preferred_month?: string | null
  status?: string | null
  created_at?: string | null
  certificate_url?: string | null
  certificate_download_url?: string | null
  certificate_file_url?: string | null
  certificate_uploaded_at?: string | null
  certificate_emailed_at?: string | null
}

function trainingTypeLabel(value?: string | null) {
  return value === 'online_webinar' ? 'Webinar' : 'Training'
}

function certificateState(registration: TrainingRegistrationDashboardRow) {
  const certificateUrl = registration.certificate_url || registration.certificate_download_url || registration.certificate_file_url || ''
  if (certificateUrl) {
    return {
      label: registration.certificate_uploaded_at ? `Uploaded ${formatDate(registration.certificate_uploaded_at)}` : 'Certificate uploaded',
      href: certificateUrl,
    }
  }
  if (registration.certificate_emailed_at) {
    return { label: `Emailed ${formatDate(registration.certificate_emailed_at)}`, href: '' }
  }
  return { label: 'Certificate not uploaded yet', href: '' }
}

function DashboardDisclosureCard({
  id,
  title,
  icon: Icon,
  action,
  children,
}: {
  id?: string
  title: string
  icon: LucideIcon
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <details id={id} open className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none flex-col gap-3 rounded-2xl p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <span className="flex min-w-0 items-center gap-2 text-xl font-bold text-[#0F172A]">
          <Icon className="h-5 w-5 shrink-0 text-[#1D4ED8]" />
          <span className="break-words">{title}</span>
        </span>
        <span className="flex flex-wrap items-center gap-2">
          {action}
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 transition-colors group-open:bg-[#EFF6FF] group-open:text-[#1D4ED8]">
            Toggle
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
          </span>
        </span>
      </summary>
      <div className="border-t border-slate-200 p-5 sm:p-6">{children}</div>
    </details>
  )
}

export default async function DashboardPage() {
  const user = await requireAuth()
  const profile = await getProfile()
  const [enrollments, contactSettings] = await Promise.all([
    getUserEnrollments(),
    getContactSettings(),
  ])
  const supportPhoneLinks = getContactPhoneLinks(contactSettings)

  let orders: {
    id: string
    total: number
    status: string
    created_at: string
    payment_method?: string | null
    receipt_url?: string | null
    receipt_path?: string | null
    subtotal?: number | null
    items?: OrderItem[] | null
    shipping_address?: Record<string, string> | null
    phone?: string | null
    guest_email?: string | null
  }[] = []
  const supabase = await createClient()
  const [ordersResult, userTrainingResult, emailTrainingResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, subtotal, status, created_at, payment_method, receipt_url, receipt_path, items, shipping_address, phone, guest_email')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('training_registrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    profile?.email
      ? supabase
          .from('training_registrations')
          .select('*')
          .eq('email', profile.email)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])
  const { data } = ordersResult
  orders = data ?? []
  const trainingRegistrationMap = new Map<string, TrainingRegistrationDashboardRow>()
  ;[
    ...((userTrainingResult.data ?? []) as TrainingRegistrationDashboardRow[]),
    ...((emailTrainingResult.data ?? []) as TrainingRegistrationDashboardRow[]),
  ].forEach((registration) => {
    if (registration.id) trainingRegistrationMap.set(registration.id, registration)
  })
  const trainingRegistrations = [...trainingRegistrationMap.values()]
    .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
    .slice(0, 6)

  const inProgress = enrollments.filter((e) => e.progress > 0 && e.progress < 100)
  const completed = enrollments.filter((e) => e.progress >= 100)
  const active = enrollments.filter((e) => getCourseAccessState(e as never).active)
  const pending = enrollments.filter((e) => getCourseAccessState(e as never).pendingPayment)
  const isAdmin = isAdminRole(profile?.role)
  const isLmsManager = isLmsManagerRole(profile?.role)
  const isInstructor = profile?.role === 'instructor'

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <LmsShell userName={profile?.full_name} userEmail={profile?.email} isAdmin={isAdmin} isLmsManager={isLmsManager}>
        <LmsPageHeader
          eyebrow="Student Dashboard"
          title={`Welcome, ${profile?.full_name ?? 'Learner'}`}
          description="A simple place to continue courses, review payments, open invoices and manage your Phonics Club learning."
          meta={isAdmin ? (
            <Badge className="rounded-full bg-[#1D4ED8]">
              <Shield className="mr-1 h-3 w-3" />
              Admin
            </Badge>
          ) : null}
          action={(
            <div className="flex flex-wrap gap-2">
              <WhatsAppButton contactSettings={contactSettings} className="!px-4 !py-2 !text-sm" />
              <form action={signOutAction}>
                <Button type="submit" variant="outline" className="rounded-xl border-slate-200 bg-white">
                  Sign Out
                </Button>
              </form>
            </div>
          )}
        />

        <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none flex-col gap-4 rounded-2xl px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 lg:flex-row lg:items-center lg:justify-between">
            <span className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-base font-bold text-[#0F172A]">Dashboard shortcuts</span>
                <span className="mt-0.5 block text-sm text-slate-500">
                  My Courses now includes active course status, progress, and payment approval notes.
                </span>
              </span>
            </span>
            <span className="grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-4 lg:min-w-[520px]">
              <span className="rounded-full border border-slate-200 bg-[#F8FAFC] px-3 py-1.5">
                {active.length} active
              </span>
              <span className="rounded-full border border-slate-200 bg-[#F8FAFC] px-3 py-1.5">
                {inProgress.length} in progress
              </span>
              <span className="rounded-full border border-slate-200 bg-[#F8FAFC] px-3 py-1.5">
                {completed.length} completed
              </span>
              <span className="rounded-full border border-slate-200 bg-[#F8FAFC] px-3 py-1.5">
                {orders.length} orders
              </span>
            </span>
            <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 group-open:bg-[#EFF6FF] group-open:text-[#1D4ED8]">
              Toggle
            </span>
          </summary>

          <div className="border-t border-slate-200 p-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <Link
                href="/dashboard/my-courses"
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#BFDBFE] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <span>
                  <span className="block">My Courses ({enrollments.length})</span>
                  <span className="mt-1 block text-xs font-medium text-slate-500">
                    {active.length} active · {pending.length} waiting approval
                  </span>
                </span>
              </Link>

              {[
                { href: '/cart', label: 'Cart', icon: ShoppingBag, detail: 'Open checkout items' },
                { href: '/wishlist', label: 'Wishlist', icon: Heart, detail: 'Saved books and courses' },
                { href: '/courses', label: 'Browse Courses', icon: BookOpen, detail: 'Find another course' },
                { href: '/dashboard#trainings', label: 'Trainings', icon: CalendarDays, detail: 'Your registrations' },
                ...(isInstructor
                  ? [
                      { href: '/instructor', label: 'Instructor Dashboard', icon: Wrench, detail: 'Builder, profile and reviews' },
                      { href: '/dashboard/profile', label: 'Instructor Profile', icon: UserRound, detail: 'Profile and account' },
                    ]
                  : []),
              ].map(({ href, label, icon: Icon, detail }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#BFDBFE] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block">{label}</span>
                    <span className="mt-1 block text-xs font-medium text-slate-500">{detail}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </details>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
          <DashboardDisclosureCard
            id="my-courses"
            title="My Courses"
            icon={BookOpen}
            action={<Link href="/dashboard/my-courses" className="text-sm font-semibold text-[#1D4ED8] hover:underline">View all</Link>}
          >
            {enrollments.length === 0 ? (
              <LmsEmptyState
                icon={BookOpen}
                title="No enrollments yet"
                description="Choose a course to begin your Phonics Club learning path."
                action={<Button asChild className="rounded-xl bg-[#1D4ED8]"><Link href="/courses">Browse Courses</Link></Button>}
              />
            ) : (
              <>
                <ul className="space-y-3">
                  {enrollments.slice(0, 5).map((e) => {
                    const course = e.courses as { id: string; title: string; slug: string }
                    const progress = Number(e.progress ?? 0)
                    const access = getCourseAccessState(e as never)
                    return (
                      <li key={e.id} className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <Link href={`/course/${course?.id}/learn`} className="min-w-0 break-words text-sm font-semibold text-[#0F172A] hover:text-[#1D4ED8] sm:text-base">
                            {course?.title}
                          </Link>
                          <LmsStatusBadge tone={access.active ? 'blue' : access.pendingPayment ? 'gold' : 'red'} className="w-fit shrink-0">
                            {access.status.replace(/_/g, ' ')}
                          </LmsStatusBadge>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <Progress value={progress} className="h-2 flex-1" />
                          <span className="text-sm font-semibold text-[#0F172A]">{progress}%</span>
                        </div>
                      </li>
                    )
                  })}
                </ul>

              </>
            )}
          </DashboardDisclosureCard>

          <DashboardDisclosureCard id="orders" title="Recent Orders" icon={ShoppingBag}>
            {orders.length === 0 ? (
              <LmsEmptyState icon={ShoppingBag} title="No orders yet" description="Shop orders and invoices linked to your account will appear here." />
            ) : (
              <ul className="space-y-4">
                {orders.map((o) => (
                  <li key={o.id} className="space-y-4 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-slate-500">{formatDate(o.created_at)}</span>
                      <span className="font-bold text-[#1D4ED8]">{formatPrice(o.total)}</span>
                      <Badge variant="outline" className="rounded-full bg-white">
                        {getCustomerOrderStatusLabel(o.status, o.payment_method)}
                      </Badge>
                      <div className="flex flex-wrap items-center gap-1">
                        <Button asChild size="sm" variant="ghost" className="h-8 rounded-lg px-2">
                          <Link href={`/api/orders/${o.id}/invoice`} target="_blank">
                            <FileText className="mr-1 h-3.5 w-3.5" />
                            Invoice
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-8 rounded-lg px-2">
                          <Link href={`/api/orders/${o.id}/invoice?format=pdf`} target="_blank">
                            <Download className="mr-1 h-3.5 w-3.5" />
                            PDF
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <CustomerOrderControls order={o} supportPhoneLinks={supportPhoneLinks} />
                  </li>
                ))}
              </ul>
            )}
          </DashboardDisclosureCard>
        </div>

        <details id="trainings" className="group mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none flex-col gap-3 rounded-2xl px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
                <CalendarDays className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-base font-bold text-[#0F172A]">Your Trainings & Webinars</span>
                <span className="mt-0.5 block text-sm text-slate-500">
                  {trainingRegistrations.length} registration{trainingRegistrations.length === 1 ? '' : 's'} linked to your account
                </span>
              </span>
            </span>
            <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 group-open:bg-[#EFF6FF] group-open:text-[#1D4ED8]">
              Toggle
            </span>
          </summary>
          <div className="border-t border-slate-200 p-4">
            {trainingRegistrations.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {trainingRegistrations.map((registration) => {
                  const certificate = certificateState(registration)
                  return (
                  <article key={registration.id} className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">
                      {trainingTypeLabel(registration.training_type)}
                    </p>
                    <p className="mt-1 font-semibold text-[#0F172A]">{registration.event_title ?? 'Training registration'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {registration.event_date ? formatDate(registration.event_date) : registration.preferred_month ?? 'Date to be announced'}
                      {registration.status ? ` - ${registration.status}` : ''}
                    </p>
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600">
                      <p className="font-semibold text-[#0F172A]">Certificate</p>
                      <p className="mt-1">{certificate.label}</p>
                      {certificate.href && (
                        <Button asChild size="sm" variant="outline" className="mt-2 h-8 rounded-lg border-slate-200 bg-white text-xs">
                          <Link href={certificate.href} target="_blank">Open certificate</Link>
                        </Button>
                      )}
                    </div>
                  </article>
                )})}
              </div>
            ) : (
              <LmsEmptyState
                icon={CalendarDays}
                title="No registered trainings yet"
                description="Trainings and webinars you register for will appear here with certificate upload or email status."
                action={<Button asChild className="rounded-xl bg-[#1D4ED8]"><Link href="/trainings">Open Trainings</Link></Button>}
              />
            )}
          </div>
        </details>

      </LmsShell>
      <Footer />
    </main>
  )
}
