'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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
  BarChart3,
  CreditCard,
  DollarSign,
  Code2,
  BookOpen,
  Palette,
  TableProperties,
  Menu,
  ArrowLeft,
  UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

const instructorLinks = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'My Courses', icon: GraduationCap },
  { href: '/admin/users', label: 'Students', icon: Users },
  { href: '/admin/lms-reports', label: 'Reports & Reviews', icon: BarChart3 },
  { href: '/dashboard', label: 'Profile', icon: UserRound },
]

const adminLinks = [
  { href: '/admin/fast-update', label: 'Fast Update', icon: TableProperties },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/course-payments', label: 'Course Payments', icon: CreditCard },
  { href: '/admin/settings/payment-methods', label: 'Payment Methods', icon: CreditCard },
  { href: '/admin/settings/currency', label: 'Currency', icon: DollarSign },
  { href: '/admin/settings/appearance', label: 'Appearance', icon: Palette },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/content', label: 'Content & Videos', icon: Megaphone },
  { href: '/admin/developer-mode', label: 'Developer Mode', icon: Code2 },
  { href: '/admin/trainers', label: 'Trainers', icon: Award },
  { href: '/admin/upload', label: 'Upload', icon: Upload },
  { href: '/admin/catalogs', label: 'Catalogs', icon: FileText },
  { href: '/admin/newsletters', label: 'Newsletters', icon: FileText },
  { href: '/admin/trainings', label: 'Registrations', icon: Calendar },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/certificates', label: 'Certificates', icon: Award },
]

function linkActive(pathname: string, href: string) {
  const baseHref = href.split('#')[0]
  if (baseHref === '/admin') return pathname === '/admin'
  return pathname === baseHref || pathname.startsWith(baseHref)
}

function SidebarContent({
  pathname,
  onNavigate,
  compact = false,
  isAdmin,
  roleLabel,
}: {
  pathname: string
  onNavigate?: () => void
  compact?: boolean
  isAdmin: boolean
  roleLabel: string
}) {
  const visibleInstructorLinks = isAdmin
    ? instructorLinks
    : instructorLinks.filter((link) => ['/admin', '/admin/courses', '/dashboard'].includes(link.href))

  return (
    <div className="flex h-full flex-col">
      <div className={`flex items-center justify-between border-b border-slate-200 px-4 py-4 ${compact ? 'px-3' : ''}`}>
        <Link href="/admin" className={`flex items-center gap-2 ${compact ? 'justify-center' : ''}`} onClick={onNavigate}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#1D4ED8]">
            <span className="font-bold text-white">P</span>
          </div>
          {!compact && (
          <div>
            <p className="text-sm font-bold">{APP_NAME}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
          )}
        </Link>
      </div>

      <div className={`border-b border-slate-200 p-3 ${compact ? 'px-2' : 'px-4'}`}>
        <Link
          href="/admin/manual"
          onClick={onNavigate}
          aria-label={compact ? 'Admin manual' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-2xl border border-[#1D4ED8]/20 bg-[#EFF6FF] px-3 py-2.5 text-sm font-semibold text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2',
            linkActive(pathname, '/admin/manual') && 'bg-[#1D4ED8] text-white hover:bg-[#1D4ED8]',
            compact && 'justify-center px-2',
          )}
        >
          <BookOpen className="h-4 w-4" />
          {!compact && 'Admin Manual'}
        </Link>
      </div>

      <nav className={`flex-1 overflow-y-auto p-4 ${compact ? 'px-2' : ''}`} aria-label="Admin navigation">
        <div className="space-y-1">
          {visibleInstructorLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-label={compact ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2',
                linkActive(pathname, href)
                  ? 'bg-[#1D4ED8] text-white'
                  : 'text-slate-600 hover:bg-[#EFF6FF] hover:text-[#1D4ED8]',
                compact && 'justify-center px-2',
              )}
            >
              <Icon className="h-4 w-4" />
              {!compact && label}
            </Link>
          ))}
        </div>

        {isAdmin && (
          <>
            {!compact && <p className="mt-5 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Store and site</p>}
            <div className="mt-2 space-y-1">
              {adminLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-label={compact ? label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2',
                    linkActive(pathname, href)
                      ? 'bg-[#1D4ED8] text-white'
                      : 'text-slate-600 hover:bg-[#EFF6FF] hover:text-[#1D4ED8]',
                    compact && 'justify-center px-2',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!compact && label}
                </Link>
              ))}
            </div>
          </>
        )}
      </nav>

      <Link
        href="/"
        className={cn(
          'block border-t border-slate-200 px-4 py-4 text-sm text-slate-500 hover:text-[#1D4ED8]',
          compact && 'text-center',
        )}
        onClick={onNavigate}
        aria-label={compact ? 'Back to website' : undefined}
      >
        {compact ? <ArrowLeft className="mx-auto h-4 w-4" /> : 'Back to Website'}
      </Link>
    </div>
  )
}

export function AdminSidebar({ isAdmin = true, roleLabel = 'Admin' }: { isAdmin?: boolean; roleLabel?: string }) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  if (isMobile) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="fixed right-4 top-4 z-50 h-12 w-24 rounded-full border border-slate-200 bg-white shadow-sm md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
        >
          <Menu className="mr-1 h-4 w-4" />
          <span className="text-xs font-medium">Menu</span>
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-80 max-w-[85vw] border-r bg-white p-0">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <SheetDescription className="sr-only">Open admin pages from here.</SheetDescription>
            <SidebarContent pathname={pathname} onNavigate={() => setOpen(false)} isAdmin={isAdmin} roleLabel={roleLabel} />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <aside className="hidden min-h-screen w-20 shrink-0 border-r border-slate-200 bg-white p-3 md:block xl:w-72">
      <div className="hidden h-full xl:block">
        <SidebarContent pathname={pathname} isAdmin={isAdmin} roleLabel={roleLabel} />
      </div>
      <div className="block h-full xl:hidden">
        <SidebarContent pathname={pathname} compact isAdmin={isAdmin} roleLabel={roleLabel} />
      </div>
    </aside>
  )
}
