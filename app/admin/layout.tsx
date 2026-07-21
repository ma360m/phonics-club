import { requireLmsManager } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminBackToTop } from '@/components/admin/admin-back-to-top'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireLmsManager()

  return (
    <div className="flex h-screen min-h-screen overflow-hidden bg-background">
      <AdminSidebar isAdmin={profile.role === 'admin'} roleLabel={profile.role === 'admin' ? 'Admin' : 'Instructor'} />
      <main id="admin-scroll-root" className="flex-1 overflow-y-scroll p-6 scroll-smooth [scrollbar-gutter:stable] lg:p-8">
        {children}
      </main>
      <AdminBackToTop />
    </div>
  )
}
