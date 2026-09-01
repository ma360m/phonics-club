'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, Trash2, FileText } from 'lucide-react'
import { uploadShopCatalogDirect } from '@/lib/shop-catalog-upload'
import {
  displayCatalogName,
  MAX_CATALOG_SIZE,
  type CatalogLabel,
  type ShopCatalog,
} from '@/lib/shop-catalog-shared'

export function CatalogManager({
  activeCollection,
}: {
  activeCollection?: 'jolly-learning' | 'phonics-club'
}) {
  const [catalogs, setCatalogs] = useState<ShopCatalog[]>([])
  const [activeView, setActiveView] = useState<CatalogLabel>(activeCollection ?? 'jolly-learning')
  const [isPending, startTransition] = useTransition()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [catalogType, setCatalogType] = useState<CatalogLabel>(activeCollection ?? 'jolly-learning')
  const [uploading, setUploading] = useState(false)

  const refreshCatalogs = () => {
    startTransition(async () => {
      const response = await fetch('/api/shop/catalogs')
      if (!response.ok) return
      const data = await response.json()
      setCatalogs(data.catalogs ?? [])
    })
  }

  useEffect(() => {
    refreshCatalogs()
  }, [])

  useEffect(() => {
    if (activeCollection) {
      setActiveView(activeCollection)
      setCatalogType(activeCollection)
    }
  }, [activeCollection])

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          setIsAdmin(false)
          return
        }
        const data = await response.json()
        setIsAdmin(Boolean(data?.user && ['admin', 'super_admin'].includes(data?.profile?.role)))
      } catch {
        setIsAdmin(false)
      }
    }

    checkAdmin()
  }, [])

  const handleUpload = async (event: React.FormEvent) => {
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
      refreshCatalogs()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Catalog upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (name: string) => {
    const response = await fetch(`/api/shop/catalogs?name=${encodeURIComponent(name)}`, { method: 'DELETE' })
    if (response.ok || response.redirected) refreshCatalogs()
  }

  const visibleCatalogs = catalogs.filter((catalog) => catalog.label === activeView)

  return (
    <div className="space-y-4 rounded-2xl border bg-background/70 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Catalogs</h2>
          <p className="text-sm text-muted-foreground">
            View or download the latest product catalogs.
          </p>
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={activeView === 'jolly-learning' ? 'default' : 'outline'}
              onClick={() => setActiveView('jolly-learning')}
            >
              Jolly Learning Products
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeView === 'phonics-club' ? 'default' : 'outline'}
              onClick={() => setActiveView('phonics-club')}
            >
              Phonics Club Products
            </Button>
          </div>
        </div>
      </div>

      {isAdmin && (
        <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-2">
          <Label htmlFor="catalog-upload" className="sr-only">
            Upload catalog
          </Label>
          <Input
            id="catalog-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <select
            value={catalogType}
            onChange={(event) => setCatalogType(event.target.value as CatalogLabel)}
            className="rounded-xl border bg-background px-3 py-2 text-sm"
          >
            <option value="jolly-learning">Jolly Learning Products</option>
            <option value="phonics-club">Phonics Club Products</option>
          </select>
          <Button type="submit" size="sm" disabled={!file || uploading || isPending}>
            {uploading || isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload
          </Button>
        </form>
      )}

      {visibleCatalogs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No catalogs available yet.</p>
      ) : (
        <div className="space-y-2">
          {visibleCatalogs.map((catalog) => (
            <div key={catalog.name} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[#1D4ED8]" />
                <div>
                  <a href={catalog.url} target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline">
                    {displayCatalogName(catalog.name)}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={catalog.url} target="_blank" rel="noreferrer" download={catalog.name}>
                    View / Download
                  </a>
                </Button>
                {isAdmin && catalog.source !== 'local' && (
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(catalog.name)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
