import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { requireAuth, getProfile } from '@/lib/auth'
import { getUserEnrollments } from '@/actions/enrollments'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ShoppingBag, Heart, GraduationCap, Shield, Award, Play } from 'lucide-react'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'
import { formatPrice, formatDate } from '@/utils/format'

export default async function DashboardPage() {
  const user = await requireAuth()
  const profile = await getProfile()
  const enrollments = await getUserEnrollments()

  let orders: { id: string; total: number; status: string; created_at: string }[] = []
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('id, total, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)
  orders = data ?? []

  const inProgress = enrollments.filter((e) => e.progress > 0 && e.progress < 100)
  const completed = enrollments.filter((e) => e.progress >= 100)

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {profile?.full_name ?? 'Learner'}</h1>
            <p className="text-muted-foreground mt-1">{profile?.email}</p>
            {profile?.role === 'admin' && (
              <Badge className="mt-2 bg-[#1D4ED8]">
                <Shield className="w-3 h-3 mr-1" /> Admin
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <WhatsAppButton className="!py-2 !px-4 !text-sm" />
            {profile?.role === 'admin' && (
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/admin">Admin Panel</Link>
              </Button>
            )}
            <form action={signOutAction}>
              <Button type="submit" variant="outline" className="rounded-xl">Sign Out</Button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { href: '/dashboard/my-courses', label: 'My Courses', icon: GraduationCap, count: enrollments.length },
            { href: '/cart', label: 'Cart', icon: ShoppingBag },
            { href: '/wishlist', label: 'Wishlist', icon: Heart },
            { href: '/courses', label: 'Browse', icon: BookOpen },
          ].map(({ href, label, icon: Icon, count }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 bg-card rounded-2xl border p-4 hover:shadow-md transition-shadow"
            >
              <Icon className="w-5 h-5 text-[#1D4ED8]" />
              <span className="text-sm font-medium">
                {label}
                {count !== undefined && <span className="text-muted-foreground ml-1">({count})</span>}
              </span>
            </Link>
          ))}
        </div>

        {inProgress.length > 0 && (
          <section className="mb-8 bg-[#1D4ED8]/5 rounded-2xl border border-[#1D4ED8]/20 p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-[#1D4ED8]" /> Continue Learning
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {inProgress.map((e) => {
                const course = e.courses as { id: string; title: string; slug: string }
                return (
                  <Link
                    key={e.id}
                    href={`/course/${course?.id}/learn`}
                    className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow"
                  >
                    <p className="font-medium">{course?.title}</p>
                    <p className="text-sm text-[#1D4ED8] mt-1">{e.progress}% complete →</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <section className="bg-card rounded-2xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">My Courses</h2>
              <Link href="/dashboard/my-courses" className="text-sm text-[#1D4ED8] hover:underline">View all</Link>
            </div>
            {enrollments.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No enrollments yet.{' '}
                <Link href="/courses" className="text-[#1D4ED8] hover:underline">Browse courses</Link>
              </p>
            ) : (
              <ul className="space-y-3">
                {enrollments.slice(0, 5).map((e) => {
                  const course = e.courses as { id: string; title: string; slug: string }
                  return (
                    <li key={e.id} className="flex justify-between items-center">
                      <Link href={`/course/${course?.id}/learn`} className="font-medium hover:text-[#1D4ED8]">
                        {course?.title}
                      </Link>
                      <span className="text-sm text-muted-foreground">{e.progress}%</span>
                    </li>
                  )
                })}
              </ul>
            )}
            {completed.length > 0 && (
              <p className="text-sm text-emerald-600 mt-4 flex items-center gap-1">
                <Award className="w-4 h-4" /> {completed.length} course(s) completed
              </p>
            )}
          </section>

          <section className="bg-card rounded-2xl border p-6">
            <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No orders yet.</p>
            ) : (
              <ul className="space-y-3">
                {orders.map((o) => (
                  <li key={o.id} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{formatDate(o.created_at)}</span>
                    <span className="font-medium">{formatPrice(o.total)}</span>
                    <Badge variant="outline">{o.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
