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
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

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
  { href: '/admin/catalogs', label: 'Catalogs', icon: FileText },
  { href: '/admin/newsletters', label: 'Newsletters', icon: FileText },
  { href: '/admin/trainings', label: 'Registrations', icon: Calendar },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/certificates', label: 'Certificates', icon: Award },
]

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <Link href="/admin" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1D4ED8]">
            <span className="font-bold text-white">P</span>
          </div>
          <div>
            <p className="text-sm font-bold">{APP_NAME}</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onNavigate} aria-label="Close menu">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              pathname === href || (href !== '/admin' && pathname.startsWith(href))
                ? 'bg-[#1D4ED8] text-white'
                : 'text-foreground/70 hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <Link href="/" className="block px-4 py-4 text-sm text-muted-foreground hover:text-[#1D4ED8]" onClick={onNavigate}>
        ← Back to site
      </Link>
    </div>
  )
}

export function AdminSidebar() {
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
          className="fixed right-4 top-4 z-50 h-12 w-24 rounded-full border bg-background/95 shadow-lg backdrop-blur md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
        >
          <Menu className="mr-1 h-4 w-4" />
          <span className="text-xs font-medium">Menu</span>
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-80 max-w-[85vw] border-r bg-card/95 p-0 backdrop-blur">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <SheetDescription className="sr-only">Open admin pages from here.</SheetDescription>
            <SidebarContent pathname={pathname} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-border bg-card/50 p-4 glass md:block">
      <SidebarContent pathname={pathname} />
    </aside>
  )
}
