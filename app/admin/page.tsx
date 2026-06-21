import { getAdminProducts } from '@/actions/admin/products'
import { getAdminCourses } from '@/actions/admin/courses'
import { getAdminBlogPosts } from '@/actions/admin/blog'
import { getAllProfiles, getAllOrders } from '@/lib/data/queries'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Package, GraduationCap, FileText, Users, ShoppingBag, BookOpen, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/utils/format'

export default async function AdminDashboardPage() {
  const [products, courses, posts, users, orders] = await Promise.all([
    getAdminProducts().catch(() => []),
    getAdminCourses().catch(() => []),
    getAdminBlogPosts().catch(() => []),
    getAllProfiles().catch(() => []),
    getAllOrders().catch(() => []),
  ])

  let enrollmentCount = 0
  try {
    const supabase = await createClient()
    const { count } = await supabase.from('enrollments').select('*', { count: 'exact', head: true })
    enrollmentCount = count ?? 0
  } catch {
    enrollmentCount = 0
  }

  const revenue = orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0)

  const stats = [
    { label: 'Students', value: users.length, icon: Users, color: 'text-[#D30000]' },
    { label: 'Courses', value: courses.length, icon: GraduationCap, color: 'text-[#60A5FA]' },
    { label: 'Enrollments', value: enrollmentCount, icon: BookOpen, color: 'text-emerald-600' },
    { label: 'Products', value: products.length, icon: Package, color: 'text-[#1D4ED8]' },
    { label: 'Revenue', value: formatPrice(revenue), icon: TrendingUp, color: 'text-[#FBBF24]' },
    { label: 'Orders', value: orders.length, icon: ShoppingBag, color: 'text-purple-600' },
    { label: 'Blog Posts', value: posts.length, icon: FileText, color: 'text-orange-500' },
  ]

  const quickLinks = [
    { href: '/admin/courses/new', label: 'Create Course' },
    { href: '/admin/products', label: 'Manage Products' },
    { href: '/admin/blog/new', label: 'New Blog Post' },
    { href: '/admin/users', label: 'View Users' },
    { href: '/admin/certificates', label: 'Certificates' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">LMS & e-commerce management for PHONICS CLUB</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-2xl border p-5 shadow-sm">
            <Icon className={`w-7 h-7 ${color} mb-2`} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="flex flex-wrap gap-2">
        {quickLinks.map((link) => (
          <Button key={link.href} asChild variant="outline" className="rounded-xl">
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
