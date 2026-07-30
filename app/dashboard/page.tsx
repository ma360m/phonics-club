import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { getProfile, isAdminRole, requireAuth } from '@/lib/auth'
import { getUserEnrollments } from '@/actions/enrollments'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LmsShell } from '@/components/lms/lms-shell'
import { LmsEmptyState, LmsPageHeader, LmsSectionCard, LmsStatusBadge } from '@/components/lms/lms-primitives'
import { BookOpen, Download, FileText, GraduationCap, Heart, Play, Shield, ShoppingBag } from 'lucide-react'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'
import { CustomerOrderControls } from '@/components/orders/customer-order-controls'
import { getCustomerOrderStatusLabel } from '@/lib/order-status'
import { getCourseAccessState } from '@/lib/lms'
import { formatPrice, formatDate } from '@/utils/format'

export default async function DashboardPage() {
  const user = await requireAuth()
  const profile = await getProfile()
  const enrollments = await getUserEnrollments()

  let orders: {
    id: string
    total: number
    status: string
    created_at: string
    payment_method?: string | null
    receipt_url?: string | null
    receipt_path?: string | null
    shipping_address?: Record<string, string> | null
    phone?: string | null
    guest_email?: string | null
  }[] = []
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('id, total, status, created_at, payment_method, receipt_url, receipt_path, shipping_address, phone, guest_email')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)
  orders = data ?? []

  const inProgress = enrollments.filter((e) => e.progress > 0 && e.progress < 100)
  const completed = enrollments.filter((e) => e.progress >= 100)
  const active = enrollments.filter((e) => getCourseAccessState(e as never).active)
  const pending = enrollments.filter((e) => getCourseAccessState(e as never).pendingPayment)
  const isAdmin = isAdminRole(profile?.role)

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <LmsShell userName={profile?.full_name} userEmail={profile?.email} isAdmin={isAdmin}>
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
              <WhatsAppButton className="!px-4 !py-2 !text-sm" />
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
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          <LmsSectionCard
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
                        <div className="flex items-center justify-between gap-3">
                          <Link href={`/course/${course?.id}/learn`} className="font-semibold text-[#0F172A] hover:text-[#1D4ED8]">
                            {course?.title}
                          </Link>
                          <LmsStatusBadge tone={access.active ? 'blue' : access.pendingPayment ? 'gold' : 'red'}>
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

                <details className="group mt-4 rounded-2xl border border-slate-200 bg-[#F8FAFC]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2">
                    <span>
                      <span className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                        <Play className="h-4 w-4 text-[#1D4ED8]" />
                        Progress and Continue Learning
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {inProgress.length} in progress, {completed.length} completed
                      </span>
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 group-open:text-[#1D4ED8]">
                      Toggle
                    </span>
                  </summary>
                  <div className="border-t border-slate-200 px-4 py-4">
                    {inProgress.length === 0 ? (
                      <p className="text-sm text-slate-500">Start a course lesson and your progress tasks will appear here.</p>
                    ) : (
                      <div className="grid gap-3">
                        {inProgress.map((e) => {
                          const course = e.courses as { id: string; title: string; slug: string }
                          const progress = Number(e.progress ?? 0)
                          return (
                            <Link
                              key={e.id}
                              href={`/course/${course?.id}/learn`}
                              className="rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-[#BFDBFE] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-semibold text-[#0F172A]">{course?.title}</p>
                                  <p className="mt-1 text-xs text-[#1D4ED8]">{progress}% complete</p>
                                </div>
                                <Play className="h-4 w-4 text-[#D30000]" />
                              </div>
                              <Progress value={progress} className="mt-3 h-2" />
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </details>
              </>
            )}
          </LmsSectionCard>

          <LmsSectionCard id="orders" title="Recent Orders" icon={ShoppingBag}>
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
                      <div className="flex items-center gap-1">
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
                    <CustomerOrderControls order={o} />
                  </li>
                ))}
              </ul>
            )}
          </LmsSectionCard>
        </div>

      </LmsShell>
      <Footer />
    </main>
  )
}
