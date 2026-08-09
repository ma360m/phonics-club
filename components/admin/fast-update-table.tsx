'use client'

import { useMemo, useState, useTransition } from 'react'
import { Save, Search } from 'lucide-react'
import { fastUpdateProductsAction, type FastUpdateProductInput } from '@/actions/admin/fast-update'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Product } from '@/types/database'

type Row = FastUpdateProductInput & {
  name: string
  sku?: string | null
  isbn?: string | null
  category: string
}

function toRow(product: Product): Row {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    isbn: product.isbn ?? (product.metadata?.isbn as string | undefined) ?? '',
    category: product.category,
    price: Number(product.price ?? 0),
    stock: Number(product.stock ?? 0),
    low_stock_threshold: Number(product.low_stock_threshold ?? 20),
    stock_management_enabled: product.stock_management_enabled ?? true,
    backorder_policy: product.backorder_policy === 'enabled' || product.backorder_policy === 'enabled_with_warning' ? product.backorder_policy : 'disabled',
    max_backorder_quantity: product.max_backorder_quantity == null ? null : Number(product.max_backorder_quantity),
    sale_enabled: Boolean(product.sale_enabled),
    sale_price: product.sale_price == null ? null : Number(product.sale_price),
    sale_percentage: product.sale_percentage == null ? null : Number(product.sale_percentage),
    published: product.published,
    featured: product.featured,
  }
}

export function FastUpdateTable({ products }: { products: Product[] }) {
  const [rows, setRows] = useState<Row[]>(() => products.map(toRow))
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const visibleRows = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((row) =>
      [row.name, row.category, row.sku, row.isbn].filter(Boolean).some((value) => String(value).toLowerCase().includes(term))
    )
  }, [query, rows])

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
    setSelectedIds((current) => new Set(current).add(id))
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleAllVisible(checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      visibleRows.forEach((row) => {
        if (checked) next.add(row.id)
        else next.delete(row.id)
      })
      return next
    })
  }

  function saveSelected() {
    const updates = rows
      .filter((row) => selectedIds.has(row.id))
      .map(({ id, isbn, price, stock, low_stock_threshold, stock_management_enabled, backorder_policy, max_backorder_quantity, sale_enabled, sale_price, sale_percentage, published, featured }) => ({
        id,
        isbn: String(isbn ?? '').trim(),
        price,
        stock,
        low_stock_threshold,
        stock_management_enabled,
        backorder_policy,
        max_backorder_quantity,
        sale_enabled,
        sale_price,
        sale_percentage,
        published,
        featured,
      }))

    setMessage(null)
    startTransition(async () => {
      const result = await fastUpdateProductsAction(updates)
      if (result.success) {
        setSelectedIds(new Set())
        setMessage(`${result.data?.updated ?? updates.length} products updated.`)
      } else {
        setMessage(result.error ?? 'Fast update failed.')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, SKU, ISBN, category..."
            className="rounded-xl pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
          <Button type="button" onClick={saveSelected} disabled={isPending || selectedIds.size === 0} className="rounded-xl bg-[#1D4ED8]">
            <Save className="h-4 w-4" />
            {isPending ? 'Saving...' : 'Save Selected'}
          </Button>
        </div>
      </div>

      {message && <p className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">{message}</p>}

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1440px] w-full text-sm">
            <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all visible products"
                    checked={visibleRows.length > 0 && visibleRows.every((row) => selectedIds.has(row.id))}
                    onChange={(event) => toggleAllVisible(event.target.checked)}
                  />
                </th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">ISBN</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Low Alert</th>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3">Backorder</th>
                <th className="px-4 py-3">Backorder Max</th>
                <th className="px-4 py-3">Sale</th>
                <th className="px-4 py-3">Sale Price</th>
                <th className="px-4 py-3">Sale %</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Featured</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleRows.map((row) => (
                <tr key={row.id} className="align-middle">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.name}`}
                      checked={selectedIds.has(row.id)}
                      onChange={(event) => toggleSelected(row.id, event.target.checked)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{row.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[row.category, row.sku ? `SKU ${row.sku}` : null, row.isbn ? `ISBN ${row.isbn}` : null].filter(Boolean).join(' | ')}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={row.isbn ?? ''}
                      onChange={(event) => updateRow(row.id, { isbn: event.target.value })}
                      className="h-9 w-44 rounded-lg font-mono text-xs"
                      placeholder="ISBN"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min={0}
                      value={row.price}
                      onChange={(event) => updateRow(row.id, { price: Number(event.target.value) })}
                      className="h-9 w-28 rounded-lg"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min={0}
                      value={row.stock}
                      onChange={(event) => updateRow(row.id, { stock: Number(event.target.value) })}
                      className="h-9 w-24 rounded-lg"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min={0}
                      value={row.low_stock_threshold}
                      onChange={(event) => updateRow(row.id, { low_stock_threshold: Number(event.target.value) })}
                      className="h-9 w-24 rounded-lg"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={row.stock_management_enabled}
                      onChange={(event) => updateRow(row.id, { stock_management_enabled: event.target.checked })}
                      aria-label={`Stock tracking for ${row.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.backorder_policy}
                      onChange={(event) => updateRow(row.id, { backorder_policy: event.target.value as Row['backorder_policy'] })}
                      className="h-9 w-40 rounded-lg border bg-background px-2 text-xs"
                    >
                      <option value="disabled">Disabled</option>
                      <option value="enabled">Enabled</option>
                      <option value="enabled_with_warning">With warning</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min={0}
                      value={row.max_backorder_quantity ?? ''}
                      onChange={(event) => updateRow(row.id, { max_backorder_quantity: event.target.value === '' ? null : Number(event.target.value) })}
                      className="h-9 w-24 rounded-lg"
                      placeholder="Any"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={row.sale_enabled}
                      onChange={(event) => updateRow(row.id, { sale_enabled: event.target.checked })}
                      aria-label={`Sale status for ${row.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min={0}
                      value={row.sale_price ?? ''}
                      onChange={(event) => updateRow(row.id, { sale_price: event.target.value === '' ? null : Number(event.target.value) })}
                      className="h-9 w-28 rounded-lg"
                      placeholder="Optional"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={row.sale_percentage ?? ''}
                      onChange={(event) => updateRow(row.id, { sale_percentage: event.target.value === '' ? null : Number(event.target.value) })}
                      className="h-9 w-24 rounded-lg"
                      placeholder="Optional"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={row.published}
                      onChange={(event) => updateRow(row.id, { published: event.target.checked })}
                      aria-label={`Published status for ${row.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={row.featured}
                      onChange={(event) => updateRow(row.id, { featured: event.target.checked })}
                      aria-label={`Featured status for ${row.name}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visibleRows.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">No products match your search.</p>
        )}
      </div>
    </div>
  )
}
