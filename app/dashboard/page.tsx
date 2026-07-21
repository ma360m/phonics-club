import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { requireAuth, getProfile } from '@/lib/auth'
import { getUserEnrollments } from '@/actions/enrollments'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LmsShell } from '@/components/lms/lms-shell'
import { LmsEmptyState, LmsPageHeader, LmsSectionCard, LmsStatCard, LmsStatusBadge } from '@/components/lms/lms-primitives'
import { Award, BookOpen, Download, FileText, GraduationCap, Heart, Play, Shield, ShoppingBag } from 'lucide-react'
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
    shipping_address?: Record<string, string> | null
    phone?: string | null
    guest_email?: string | null
  }[] = []
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('id, total, status, created_at, payment_method, receipt_url, shipping_address, phone, guest_email')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)
  orders = data ?? []

  const inProgress = enrollments.filter((e) => e.progress > 0 && e.progress < 100)
  const completed = enrollments.filter((e) => e.progress >= 100)
  const active = enrollments.filter((e) => getCourseAccessState(e as never).active)
  const pending = enrollments.filter((e) => getCourseAccessState(e as never).pendingPayment)

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <LmsShell userName={profile?.full_name} userEmail={profile?.email} isAdmin={profile?.role === 'admin'}>
        <LmsPageHeader
          eyebrow="Student Dashboard"
          title={`Welcome, ${profile?.full_name ?? 'Learner'}`}
          description="A simple place to continue courses, review payments, open invoices and manage your Phonics Club learning."
          meta={profile?.role === 'admin' ? (
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <LmsStatCard title="Active Courses" value={active.length} detail={`${pending.length} waiting for payment approval`} icon={GraduationCap} />
          <LmsStatCard title="In Progress" value={inProgress.length} detail="Courses with saved lesson progress" icon={Play} tone="red" />
          <LmsStatCard title="Completed" value={completed.length} detail="Completed enrollments and certificate pathways" icon={Award} tone="gold" />
          <LmsStatCard title="Recent Orders" value={orders.length} detail="Latest shop orders on your account" icon={ShoppingBag} tone="navy" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { href: '/dashboard/my-courses', label: 'My Courses', icon: GraduationCap, count: enrollments.length },
            { href: '/cart', label: 'Cart', icon: ShoppingBag },
            { href: '/wishlist', label: 'Wishlist', icon: Heart },
            { href: '/courses', label: 'Browse Courses', icon: BookOpen },
          ].map(({ href, label, icon: Icon, count }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-[#0F172A] shadow-sm transition-colors hover:border-[#BFDBFE] hover:bg-[#EFF6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                {label}
                {count !== undefined && <span className="ml-1 text-slate-500">({count})</span>}
              </span>
            </Link>
          ))}
        </div>

        {inProgress.length > 0 && (
          <LmsSectionCard
            title="Continue Learning"
            description="Pick up from your latest active course."
            icon={Play}
            className="mt-6"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {inProgress.map((e) => {
                const course = e.courses as { id: string; title: string; slug: string }
                return (
                  <Link
                    key={e.id}
                    href={`/course/${course?.id}/learn`}
                    className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 transition-colors hover:border-[#BFDBFE] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[#0F172A]">{course?.title}</p>
                        <p className="mt-1 text-sm text-[#1D4ED8]">{e.progress}% complete</p>
                      </div>
                      <Play className="h-5 w-5 text-[#D30000]" />
                    </div>
                    <Progress value={Number(e.progress ?? 0)} className="mt-4 h-2" />
                  </Link>
                )
              })}
            </div>
          </LmsSectionCard>
        )}

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
