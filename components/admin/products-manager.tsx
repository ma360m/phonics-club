'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Database,
  ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatPrice } from '@/utils/format'
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from '@/lib/constants'
import { bulkDeleteProductsAction, bulkUpdateProductsAction, importCatalogManifestAction } from '@/actions/admin/products-bulk'
import { deleteProductAction } from '@/actions/admin/products'
import { toast } from 'sonner'
import type { Product } from '@/types/database'

interface Props {
  products: Product[]
  supabaseConnected: boolean
}

export function ProductsManager({ products: initialProducts, supabaseConnected }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()
  const [importing, setImporting] = useState(false)
  const [uploadIsbn, setUploadIsbn] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const allSelected = selected.size === initialProducts.length && initialProducts.length > 0

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(initialProducts.map((p) => p.id)))
  }

  function toggleOne(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  async function handleImport(file: File) {
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/products/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      toast.success(data.message)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  async function handleImageUpload(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    if (uploadIsbn) formData.append('isbn', uploadIsbn)
    const res = await fetch('/api/admin/products/upload-image', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Upload failed')
    toast.success(uploadIsbn ? `Image attached to ISBN ${uploadIsbn}` : 'Image uploaded to Supabase Storage')
    router.refresh()
  }

  function handleBulkDelete() {
    const ids = Array.from(selected)
    startTransition(async () => {
      const result = await bulkDeleteProductsAction(ids)
      if (result.success) {
        toast.success(`Deleted ${result.data?.deleted} products`)
        setSelected(new Set())
        router.refresh()
      } else toast.error(result.error)
    })
  }

  function handleSeedCatalog() {
    startTransition(async () => {
      const result = await importCatalogManifestAction()
      if (result.success || result.data) {
        toast.success(
          `Catalog import: ${result.data?.created} created, ${result.data?.updated} updated`
        )
        router.refresh()
      } else toast.error(result.error)
    })
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button asChild className="rounded-xl bg-[#1D4ED8]">
          <Link href="/admin/products/new"><Plus className="w-4 h-4 mr-2" /> Add Product</Link>
        </Button>

        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => window.open('/api/admin/products/export?format=csv', '_blank')}
        >
          <FileText className="w-4 h-4 mr-2" /> Export CSV
        </Button>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => window.open('/api/admin/products/export?format=xlsx', '_blank')}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
        </Button>

        <Button
          variant="outline"
          className="rounded-xl"
          disabled={importing}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          {importing ? 'Importing...' : 'Import CSV/Excel'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleImport(f)
            e.target.value = ''
          }}
        />

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-xl">
              <ImageIcon className="w-4 h-4 mr-2" /> Upload Image
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload to Supabase Storage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ISBN (optional — attach to product)</Label>
                <Input
                  value={uploadIsbn}
                  onChange={(e) => setUploadIsbn(e.target.value)}
                  placeholder="978-969-..."
                  className="rounded-xl"
                />
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleImageUpload(f).catch((err) => toast.error(err.message))
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          className="rounded-xl"
          disabled={pending}
          onClick={handleSeedCatalog}
        >
          <Database className="w-4 h-4 mr-2" /> Import Catalog ({initialProducts.length || '112'})
        </Button>

        <Button variant="ghost" className="rounded-xl" onClick={() => router.refresh()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-muted/50 rounded-2xl border">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <BulkUpdateDialog
            ids={Array.from(selected)}
            onDone={() => {
              setSelected(new Set())
              router.refresh()
            }}
          />
          <Button
            variant="destructive"
            size="sm"
            className="rounded-xl"
            disabled={pending}
            onClick={handleBulkDelete}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Bulk Delete
          </Button>
        </div>
      )}

      {!supabaseConnected && (
        <div className="mb-6 p-4 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-sm">
          <strong>Supabase not connected.</strong> Add keys to <code>.env.local</code> and run migrations in SQL Editor.
          See <code>supabase/migrations/004_isbn_unique_storage.sql</code>
        </div>
      )}

      <p className="text-sm text-muted-foreground mb-4">
        Imports upsert by <strong>ISBN</strong> — existing ISBN updates, new ISBN creates. Columns: isbn, name, slug, description, price, compare_at_price, category, stock, featured, published, images
      </p>

      {/* Table */}
      <div className="bg-card rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </th>
              <th className="text-left p-3 w-14">Img</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">ISBN</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Stock</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-muted-foreground">
                  No products in database. Click &quot;Import Catalog&quot; or import a CSV/Excel file.
                </td>
              </tr>
            ) : (
              initialProducts.map((p) => {
                const isbn = p.isbn ?? (p.metadata?.isbn as string) ?? '—'
                const img = p.images?.[0]
                return (
                  <tr key={p.id} className={`border-t ${selected.has(p.id) ? 'bg-[#1D4ED8]/5' : ''}`}>
                    <td className="p-3">
                      <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleOne(p.id)} />
                    </td>
                    <td className="p-2">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted">
                        {img ? (
                          <Image src={img} alt="" fill className="object-cover" sizes="48px" unoptimized />
                        ) : (
                          <span className="flex items-center justify-center h-full text-lg">📚</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-medium max-w-[180px] truncate">{p.name}</td>
                    <td className="p-3 font-mono text-xs">{isbn}</td>
                    <td className="p-3 text-xs">{PRODUCT_CATEGORY_LABELS[p.category] ?? p.category}</td>
                    <td className="p-3">{formatPrice(p.price)}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild size="sm" variant="outline" className="rounded-lg h-8">
                          <Link href={`/admin/products/${p.id}`}><Pencil className="w-3.5 h-3.5" /></Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg h-8"
                          onClick={() => {
                            setUploadIsbn(String(isbn))
                            imageInputRef.current?.click()
                          }}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                        </Button>
                        {supabaseConnected && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-lg h-8"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await deleteProductAction(p.id)
                                toast.success('Deleted')
                                router.refresh()
                              })
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleImageUpload(f).catch((err) => toast.error(err.message))
          e.target.value = ''
        }}
      />
    </div>
  )
}

function BulkUpdateDialog({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl">
          <Download className="w-4 h-4 mr-1" /> Bulk Update
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Update {ids.length} Products</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              const result = await bulkUpdateProductsAction(ids, {
                stock: fd.get('stock') ? Number(fd.get('stock')) : undefined,
                price: fd.get('price') ? Number(fd.get('price')) : undefined,
                pricePercent: fd.get('pricePercent') ? Number(fd.get('pricePercent')) : undefined,
                category: String(fd.get('category') || '') || undefined,
                published: fd.get('published') === 'on' ? true : fd.get('published') === 'off' ? false : undefined,
                featured: fd.get('featured') === 'on' ? true : undefined,
              })
              if (result.success) {
                toast.success(`Updated ${result.data?.updated} products`)
                setOpen(false)
                onDone()
              } else toast.error(result.error)
            })
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Set Stock</Label>
              <Input name="stock" type="number" placeholder="Leave empty to skip" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Set Price (PKR)</Label>
              <Input name="price" type="number" placeholder="Leave empty to skip" className="rounded-xl" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Price Change %</Label>
              <Input name="pricePercent" type="number" placeholder="e.g. 10 for +10%" className="rounded-xl" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Category</Label>
              <select name="category" className="w-full rounded-xl border px-3 py-2" defaultValue="">
                <option value="">— No change —</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{PRODUCT_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="published" value="on" /> Publish all
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="featured" value="on" /> Feature all
            </label>
          </div>
          <Button type="submit" disabled={pending} className="w-full rounded-xl bg-[#1D4ED8]">
            {pending ? 'Updating...' : 'Apply Bulk Update'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
