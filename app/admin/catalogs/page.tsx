import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getProfile, isAdminRole } from '@/lib/auth'
import { listShopCatalogs } from '@/lib/shop-catalogs'
import { Button } from '@/components/ui/button'
import { AdminCatalogsManager } from '@/components/admin/catalogs-manager'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminCatalogsPage() {
  const profile = await getProfile()
  if (!profile || !isAdminRole(profile.role)) {
    redirect('/dashboard')
  }

  const catalogs = await listShopCatalogs()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Catalog Manager</h1>
          <p className="text-muted-foreground">
            Upload PDF catalog files for Jolly Learning and Phonics Club product groups.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>

      <AdminCatalogsManager initialCatalogs={catalogs} />
    </div>
  )
}
