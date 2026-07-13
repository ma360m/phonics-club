'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { uploadShopCatalogDirect } from '@/lib/shop-catalog-upload'
import {
  CATALOG_LABELS,
  displayCatalogName,
  MAX_CATALOG_SIZE,
  type CatalogLabel,
  type ShopCatalog,
} from '@/lib/shop-catalog-shared'

function formatMegabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

async function fetchCatalogs(): Promise<ShopCatalog[]> {
  const response = await fetch('/api/shop/catalogs', { cache: 'no-store' })
  if (!response.ok) throw new Error('Could not refresh catalogs.')
  const data = await response.json()
  return data.catalogs ?? []
}

export function AdminCatalogsManager({ initialCatalogs }: { initialCatalogs: ShopCatalog[] }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [catalogs, setCatalogs] = useState(initialCatalogs)
  const [catalogType, setCatalogType] = useState<CatalogLabel>('jolly-learning')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isDeleting, startDeleteTransition] = useTransition()

  const refreshCatalogs = async () => {
    const refreshed = await fetchCatalogs()
    setCatalogs(refreshed)
    router.refresh()
  }

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) return

    if (file.size > MAX_CATALOG_SIZE) {
      toast.error('Catalog file must be 50 MB or smaller.')
      return
    }

    setUploading(true)
    try {
      await uploadShopCatalogDirect(file, catalogType)
      toast.success('Catalog uploaded to Supabase Storage.')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      await refreshCatalogs()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Catalog upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (name: string) => {
    startDeleteTransition(async () => {
      try {
        const response = await fetch(`/api/shop/catalogs?name=${encodeURIComponent(name)}`, {
          method: 'DELETE',
        })
        if (!response.ok && !response.redirected) throw new Error('Could not remove catalog.')
        toast.success('Catalog removed.')
        await refreshCatalogs()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Catalog removal failed.')
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload new catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">PDF file</span>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                required
                className="rounded-xl border bg-background px-3 py-2"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Catalog type</span>
              <select
                value={catalogType}
                onChange={(event) => setCatalogType(event.target.value as CatalogLabel)}
                className="rounded-xl border bg-background px-3 py-2"
              >
                <option value="jolly-learning">Jolly Learning Products</option>
                <option value="phonics-club">Phonics Club Products</option>
              </select>
            </label>
            <Button type="submit" disabled={!file || uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload catalog
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Files upload directly to Supabase Storage, so large catalogs do not pass through Vercel.
          </p>
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
                    <p className="font-medium">{displayCatalogName(catalog.name)}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATALOG_LABELS[catalog.label]} - {formatMegabytes(catalog.size)}
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
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={() => handleDelete(catalog.name)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
