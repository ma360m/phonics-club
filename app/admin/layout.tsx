import { isAdminRole, requireLmsManager } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminBackToTop } from '@/components/admin/admin-back-to-top'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireLmsManager()

  return (
    <div className="flex h-screen min-h-screen overflow-hidden bg-background">
      <AdminSidebar isAdmin={isAdminRole(profile.role)} roleLabel={isAdminRole(profile.role) ? 'Admin' : 'Instructor'} />
      <main id="admin-scroll-root" className="min-w-0 w-full flex-1 overflow-y-scroll p-6 scroll-smooth [scrollbar-gutter:stable] lg:p-8">
        {children}
      </main>
      <AdminBackToTop />
    </div>
  )
}
