import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { listShopCatalogs } from '@/lib/shop-catalogs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, ArrowLeft, Trash2, Download } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATALOG_LABELS = {
  'jolly-learning': 'Jolly Learning Products',
  'phonics-club': 'Phonics Club Products',
} as const

export default async function AdminCatalogsPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
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

      <Card>
        <CardHeader>
          <CardTitle>Upload new catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/api/shop/catalogs" method="post" encType="multipart/form-data" className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">PDF file</span>
              <input name="file" type="file" accept=".pdf" required className="rounded-xl border bg-background px-3 py-2" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Catalog type</span>
              <select name="label" defaultValue="jolly-learning" className="rounded-xl border bg-background px-3 py-2">
                <option value="jolly-learning">Jolly Learning Products</option>
                <option value="phonics-club">Phonics Club Products</option>
              </select>
            </label>
            <Button type="submit">Upload catalog</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current catalogs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {catalogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No catalogs uploaded yet.</p>
          ) : (
            catalogs.map((catalog) => (
              <div key={catalog.name} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[#1D4ED8]" />
                  <div>
                    <p className="font-medium">{catalog.name.replace(/^\d+-/, '').replace(/^(jolly-learning|phonics-club|uk|local)-/, '')}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATALOG_LABELS[catalog.label]} - {(catalog.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={catalog.url} target="_blank" rel="noreferrer" download={catalog.name}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                  <form action={`/api/shop/catalogs?name=${encodeURIComponent(catalog.name)}`} method="post">
                    <input type="hidden" name="_method" value="delete" />
                    <Button type="submit" size="sm" variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
