'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Award,
  BookOpen,
  ChevronLeft,
  GraduationCap,
  Home,
  LayoutDashboard,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingBag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface LmsShellProps {
  children: React.ReactNode
  userName?: string | null
  userEmail?: string | null
  isAdmin?: boolean
}

const learnerLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/my-courses', label: 'My Courses', icon: GraduationCap, match: ['/dashboard/my-courses', '/course/'] },
  { href: '/courses', label: 'Browse Courses', icon: BookOpen },
  { href: '/dashboard/my-courses#certificates', label: 'Certificates', icon: Award },
  { href: '/dashboard#orders', label: 'Orders', icon: ShoppingBag },
]

function isActive(pathname: string, href: string, match?: string[]) {
  const baseHref = href.split('#')[0]
  if (pathname === baseHref) return true
  return match?.some((item) => pathname === item || pathname.startsWith(item)) ?? false
}

function SidebarContent({
  pathname,
  onNavigate,
  userName,
  userEmail,
  isAdmin,
  compact = false,
  onToggleCompact,
}: {
  pathname: string
  onNavigate?: () => void
  userName?: string | null
  userEmail?: string | null
  isAdmin?: boolean
  compact?: boolean
  onToggleCompact?: () => void
}) {
  const initials = (userName || userEmail || 'PC')
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PC'

  return (
    <div className="flex h-full flex-col">
      <div className={cn('border-b border-slate-200 px-4 py-5', compact && 'px-3')}>
        <div className={cn('flex items-center gap-3', compact ? 'flex-col' : 'justify-between')}>
          <Link href="/dashboard" onClick={onNavigate} className={cn('flex min-w-0 items-center gap-3', compact && 'justify-center')}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1D4ED8] text-sm font-bold text-white shadow-sm">
              PC
            </span>
            {!compact && (
              <span>
                <span className="block text-sm font-bold text-[#0F172A]">Phonics Club</span>
                <span className="block text-xs text-slate-500">Learning space</span>
              </span>
            )}
          </Link>
          {onToggleCompact ? (
            <button
              type="button"
              onClick={onToggleCompact}
              aria-label={compact ? 'Expand learning sidebar' : 'Collapse learning sidebar'}
              title={compact ? 'Expand sidebar' : 'Collapse sidebar'}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-[#BFDBFE] hover:bg-[#EFF6FF] hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2"
            >
              {compact ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          ) : null}
        </div>
      </div>

      <nav className={cn('flex-1 space-y-1 overflow-y-auto px-3 py-4', compact && 'px-2')} aria-label="Learning navigation">
        {learnerLinks.map(({ href, label, icon: Icon, match }) => {
          const active = isActive(pathname, href, match)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-label={compact ? label : undefined}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2',
                active
                  ? 'bg-[#1D4ED8] text-white'
                  : 'text-slate-600 hover:bg-[#EFF6FF] hover:text-[#1D4ED8]',
                compact && 'justify-center px-2',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!compact && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className={cn('border-t border-slate-200 p-3', compact && 'px-2')}>
        {isAdmin && (
          <Link
            href="/admin"
            onClick={onNavigate}
            aria-label={compact ? 'Admin panel' : undefined}
            className={cn(
              'mb-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-[#7A1D1D] transition-colors hover:bg-[#D30000]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2',
              compact && 'justify-center px-2',
            )}
          >
            <Settings className="h-4 w-4" />
            {!compact && <span>Admin Panel</span>}
          </Link>
        )}
        <Link
          href="/"
          onClick={onNavigate}
          aria-label={compact ? 'Back to website' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2',
            compact && 'justify-center px-2',
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          {!compact && <span>Back to Website</span>}
        </Link>
        <div className={cn('mt-3 rounded-2xl bg-[#F8FAFC] p-3', compact && 'flex justify-center p-2')}>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FBBF24]/25 text-xs font-bold text-[#7A1D1D]">
              {initials}
            </span>
            {!compact && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#0F172A]">{userName || 'Learner'}</span>
                {userEmail && <span className="block truncate text-xs text-slate-500">{userEmail}</span>}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LmsShell({ children, userName, userEmail, isAdmin }: LmsShellProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const stored = window.localStorage.getItem('phonics-lms-sidebar-collapsed')
    if (stored) setSidebarCollapsed(stored === 'true')
  }, [])

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((value) => {
      const nextValue = !value
      window.localStorage.setItem('phonics-lms-sidebar-collapsed', String(nextValue))
      return nextValue
    })
  }

  return (
    <div className="bg-[#F4F8FF]">
      <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-[1480px] gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <aside
          className={cn(
            'sticky top-4 hidden h-[calc(100vh-2rem)] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-[width] duration-200 ease-out md:block',
            sidebarCollapsed ? 'w-[76px]' : 'w-72',
          )}
        >
          <div className="h-full">
            <SidebarContent
              pathname={pathname}
              userName={userName}
              userEmail={userEmail}
              isAdmin={isAdmin}
              compact={sidebarCollapsed}
              onToggleCompact={toggleSidebarCollapsed}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-slate-200 bg-white"
              onClick={() => setOpen(true)}
              aria-label="Open learning menu"
            >
              <Menu className="h-4 w-4" />
              Menu
            </Button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0F172A]"
            >
              <Home className="h-4 w-4 text-[#1D4ED8]" />
              LMS
            </Link>
          </div>

          {children}
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-80 max-w-[88vw] gap-0 border-r bg-white p-0">
          <SheetTitle className="sr-only">Learning menu</SheetTitle>
          <SheetDescription className="sr-only">Navigate your Phonics Club LMS pages.</SheetDescription>
          <SidebarContent
            pathname={pathname}
            onNavigate={() => setOpen(false)}
            userName={userName}
            userEmail={userEmail}
            isAdmin={isAdmin}
          />
          <div className="mx-4 mb-4 rounded-2xl border border-[#1D4ED8]/15 bg-[#EFF6FF] p-4 text-sm text-slate-600">
            <div className="mb-2 flex items-center gap-2 font-semibold text-[#1D4ED8]">
              <MessageCircle className="h-4 w-4" />
              Need help?
            </div>
            Course access, receipts and certificates are managed from your learning space.
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
