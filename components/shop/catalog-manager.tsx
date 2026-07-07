'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, Trash2, FileText } from 'lucide-react'

interface ShopCatalog {
  name: string
  label: 'uk' | 'local'
  url: string
  size: number
  uploadedAt: string
}

export function CatalogManager() {
  const [catalogs, setCatalogs] = useState<ShopCatalog[]>([])
  const [activeView, setActiveView] = useState<'all' | 'uk' | 'local'>('all')
  const [isPending, startTransition] = useTransition()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [catalogType, setCatalogType] = useState<'uk' | 'local'>('uk')

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
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          setIsAdmin(false)
          return
        }
        const data = await response.json()
        setIsAdmin(Boolean(data?.user && data?.profile?.role === 'admin'))
      } catch {
        setIsAdmin(false)
      }
    }

    checkAdmin()
  }, [])

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('label', catalogType)

    const response = await fetch('/api/shop/catalogs', { method: 'POST', body: formData })
    if (response.ok) {
      setFile(null)
      refreshCatalogs()
    }
  }

  const handleDelete = async (name: string) => {
    const response = await fetch(`/api/shop/catalogs?name=${encodeURIComponent(name)}`, { method: 'DELETE' })
    if (response.ok) {
      refreshCatalogs()
    }
  }

  const visibleCatalogs = catalogs.filter((catalog) => activeView === 'all' || catalog.label === activeView)

  return (
    <div className="space-y-4 rounded-2xl border bg-background/70 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Catalogs</h2>
          <p className="text-sm text-muted-foreground">View or download the latest catalog, and manage uploads.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant={activeView === 'all' ? 'default' : 'outline'} onClick={() => setActiveView('all')}>
            All
          </Button>
          <Button type="button" size="sm" variant={activeView === 'uk' ? 'default' : 'outline'} onClick={() => setActiveView('uk')}>
            Catalog UK
          </Button>
          <Button type="button" size="sm" variant={activeView === 'local' ? 'default' : 'outline'} onClick={() => setActiveView('local')}>
            Catalog Local
          </Button>
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
            onChange={(event) => setCatalogType(event.target.value as 'uk' | 'local')}
            className="rounded-xl border bg-background px-3 py-2 text-sm"
          >
            <option value="uk">UK</option>
            <option value="local">Local</option>
          </select>
          <Button type="submit" size="sm" disabled={!file || isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
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
                    {catalog.name.replace(/^\d+-/, '').replace(/^(uk|local)-/, '')}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {catalog.label.toUpperCase()} • {(catalog.size / 1024 / 1024).toFixed(2)} MB •{' '}
                    {new Date(catalog.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={catalog.url} target="_blank" rel="noreferrer" download={catalog.name}>
                    View / Download
                  </a>
                </Button>
                {isAdmin && (
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
