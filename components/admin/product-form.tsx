'use client'

import { useActionState, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { createProductAction, updateProductAction } from '@/actions/admin/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from './image-upload'
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { isProductComingSoon } from '@/lib/products/coming-soon'
import { slugify } from '@/utils/slug'
import type { Product } from '@/types/database'
import type { ActionResult } from '@/types'

const initial: ActionResult = { success: false }

function getIsbn(product?: Product) {
  return product?.isbn ?? (product?.metadata?.isbn as string | undefined) ?? ''
}

function getCollection(product?: Product) {
  const collection = product?.metadata?.collection
  return collection === 'phonics-club' || collection === 'jolly-learning' ? collection : ''
}

export function ProductForm({
  product,
  className,
  cancelHref = product ? '/admin/products' : null,
  submitLabel,
}: {
  product?: Product
  className?: string
  cancelHref?: string | null
  submitLabel?: string
}) {
  const action = product
    ? updateProductAction.bind(null, product.id)
    : createProductAction
  const [state, formAction, pending] = useActionState(action, initial)
  const [images, setImages] = useState(product?.images?.join(', ') ?? '')
  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [comingSoon, setComingSoon] = useState(product ? isProductComingSoon(product) : false)

  function handleAutoGenerateSlug() {
    const nextSlug = slugify(name) || `product-${Date.now().toString(36)}`
    setSlug(nextSlug)
  }

  return (
    <form action={formAction} className={cn('max-w-2xl space-y-4', className)}>
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state.success && <p className="text-emerald-600 text-sm">Saved successfully!</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input name="name" value={name} onChange={(event) => setName(event.target.value)} required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Slug</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAutoGenerateSlug} className="rounded-xl">
              <Sparkles className="h-4 w-4" />
              Auto gen
            </Button>
          </div>
          <Input
            name="slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="Auto-generated from name"
            className="rounded-xl"
          />
        </div>
      </div>
      <label className="flex w-fit items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="coming_soon"
          checked={comingSoon}
          onChange={(event) => setComingSoon(event.target.checked)}
        /> Coming Soon
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>ISBN{comingSoon ? '' : ' *'}</Label>
          <Input name="isbn" defaultValue={getIsbn(product)} required={!comingSoon} placeholder="978-969-..." className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <select name="category" defaultValue={product?.category ?? 'pupil-books'} className="w-full rounded-xl border px-3 py-2">
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{PRODUCT_CATEGORY_LABELS[c] ?? c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Product Number</Label>
          <Input name="product_number" defaultValue={product?.product_number ?? ''} placeholder="PC-000123" className="rounded-xl font-mono" />
        </div>
        <div className="space-y-2">
          <Label>SKU</Label>
          <Input name="sku" defaultValue={product?.sku ?? ''} className="rounded-xl font-mono" />
        </div>
        <div className="space-y-2">
          <Label>Barcode</Label>
          <Input name="barcode" defaultValue={product?.barcode ?? ''} className="rounded-xl font-mono" />
        </div>
        <div className="space-y-2">
          <Label>Alternate Barcode</Label>
          <Input name="alternate_barcode" defaultValue={product?.alternate_barcode ?? ''} className="rounded-xl font-mono" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Product group</Label>
        <select name="collection" defaultValue={getCollection(product)} className="w-full rounded-xl border px-3 py-2">
          <option value="">Auto-detect from product name</option>
          <option value="jolly-learning">Jolly Learning Products</option>
          <option value="phonics-club">Phonics Club Products</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea name="description" defaultValue={product?.description ?? ''} className="rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Price (PKR)</Label>
          <Input name="price" type="number" step="1" defaultValue={product?.price} required={!comingSoon} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Compare Price</Label>
          <Input name="compare_at_price" type="number" step="1" defaultValue={product?.compare_at_price ?? ''} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Stock</Label>
          <Input name="stock" type="number" defaultValue={product?.stock ?? 100} className="rounded-xl" />
        </div>
      </div>
      <div className="rounded-2xl border bg-muted/30 p-4">
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="stock_management_enabled" defaultChecked={product?.stock_management_enabled ?? true} /> Track stock
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Low Stock Alert</Label>
            <Input name="low_stock_threshold" type="number" min={0} step="1" defaultValue={product?.low_stock_threshold ?? 20} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Backorder</Label>
            <select name="backorder_policy" defaultValue={product?.backorder_policy ?? 'disabled'} className="w-full rounded-xl border bg-background px-3 py-2">
              <option value="disabled">Disabled</option>
              <option value="enabled">Enabled</option>
              <option value="enabled_with_warning">Enabled with warning</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Max Backorder Qty</Label>
            <Input name="max_backorder_quantity" type="number" min={0} step="1" defaultValue={product?.max_backorder_quantity ?? ''} placeholder="Optional" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Max Purchase Qty</Label>
            <Input name="max_purchase_quantity" type="number" min={1} step="1" defaultValue={product?.max_purchase_quantity ?? ''} placeholder="Optional" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Estimated Availability</Label>
            <Input name="estimated_availability_date" type="date" defaultValue={product?.estimated_availability_date ?? ''} className="rounded-xl" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Label>Backorder / Low Stock Message</Label>
          <Input
            name="backorder_message"
            defaultValue={product?.backorder_message ?? ''}
            maxLength={240}
            placeholder="Admin will confirm availability before processing."
            className="rounded-xl"
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Backorder-enabled items can be ordered even when stock is low. Customers will see that admin must confirm availability first.
        </p>
      </div>
      <div className="rounded-2xl border bg-muted/30 p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="sale_enabled" defaultChecked={product?.sale_enabled ?? false} /> Mark product as sale item
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Sale Price (PKR)</Label>
            <Input name="sale_price" type="number" min={0} step="1" defaultValue={product?.sale_price ?? ''} placeholder="Optional" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Sale Discount %</Label>
            <Input name="sale_percentage" type="number" min={0} max={100} step="1" defaultValue={product?.sale_percentage ?? ''} placeholder="Optional" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Sale Banner Text</Label>
            <Input name="sale_badge_text" defaultValue={product?.sale_badge_text ?? 'saleee'} maxLength={32} className="rounded-xl" />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Use either a fixed sale price or a percentage. Checkout calculates from the saved product values, not customer input.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Image paths or URLs (comma-separated)</Label>
        <Input
          name="images"
          value={images}
          onChange={(e) => setImages(e.target.value)}
          placeholder="/images/Pupilbooks/Phonics-Pupil-Book-1-color.jpg"
          className="rounded-xl"
        />
        <ImageUpload
          storage
          isbn={getIsbn(product) || undefined}
          multiple
          onUpload={(url) => setImages((prev) => (prev ? `${prev}, ${url}` : url))}
        />
        <p className="text-xs text-muted-foreground">Upload one or more supporting pictures. Local images can also be placed in public/images/ and added as paths above.</p>
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={product?.featured} /> Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={product?.published ?? true} /> Published
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending} className="rounded-xl bg-[#1D4ED8]">
          {pending ? 'Saving...' : submitLabel ?? (product ? 'Update Product' : 'Add Product')}
        </Button>
        {product && cancelHref && (
          <Button type="button" variant="outline" className="rounded-xl" asChild>
            <a href={cancelHref}>Cancel</a>
          </Button>
        )}
      </div>
    </form>
  )
}
