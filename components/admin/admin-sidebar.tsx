'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  GraduationCap,
  FileText,
  Users,
  ShoppingBag,
  Upload,
  Ticket,
  Award,
  Megaphone,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'

const links = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/courses', label: 'Courses', icon: GraduationCap },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/content', label: 'Site Content', icon: Megaphone },
  { href: '/admin/trainers', label: 'Trainers', icon: Award },
  { href: '/admin/upload', label: 'Upload', icon: Upload },
  { href: '/admin/trainings', label: 'Registrations', icon: Calendar },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/certificates', label: 'Certificates', icon: Award },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card/50 glass min-h-screen p-4">
      <Link href="/admin" className="flex items-center gap-2 mb-8 px-2">
        <div className="w-9 h-9 bg-[#1D4ED8] rounded-xl flex items-center justify-center">
          <span className="text-white font-bold">P</span>
        </div>
        <div>
          <p className="font-bold text-sm">{APP_NAME}</p>
          <p className="text-xs text-muted-foreground">Admin</p>
        </div>
      </Link>
      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              pathname === href || (href !== '/admin' && pathname.startsWith(href))
                ? 'bg-[#1D4ED8] text-white'
                : 'text-foreground/70 hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <Link
        href="/"
        className="mt-8 block px-3 py-2 text-sm text-muted-foreground hover:text-[#1D4ED8]"
      >
        ← Back to site
      </Link>
    </aside>
  )
}
