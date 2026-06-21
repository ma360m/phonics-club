'use client'

import { useActionState, useState } from 'react'
import { createProductAction, updateProductAction } from '@/actions/admin/products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from './image-upload'
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from '@/lib/constants'
import type { Product } from '@/types/database'
import type { ActionResult } from '@/types'

const initial: ActionResult = { success: false }

function getIsbn(product?: Product) {
  return product?.isbn ?? (product?.metadata?.isbn as string | undefined) ?? ''
}

export function ProductForm({ product }: { product?: Product }) {
  const action = product
    ? updateProductAction.bind(null, product.id)
    : createProductAction
  const [state, formAction, pending] = useActionState(action, initial)
  const [images, setImages] = useState(product?.images?.join(', ') ?? '')

  return (
    <form action={formAction} className="space-y-4 max-w-2xl">
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state.success && <p className="text-emerald-600 text-sm">Saved successfully!</p>}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input name="name" defaultValue={product?.name} required className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input name="slug" defaultValue={product?.slug} required className="rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>ISBN *</Label>
          <Input name="isbn" defaultValue={getIsbn(product)} required placeholder="978-969-..." className="rounded-xl" />
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
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea name="description" defaultValue={product?.description ?? ''} className="rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Price (PKR)</Label>
          <Input name="price" type="number" step="1" defaultValue={product?.price} required className="rounded-xl" />
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
      <div className="space-y-2">
        <Label>Image path or URL (comma-separated)</Label>
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
          onUpload={(url) => setImages((prev) => (prev ? `${prev}, ${url}` : url))}
        />
        <p className="text-xs text-muted-foreground">Local images: place file in public/images/ and use path above.</p>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={product?.featured} /> Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={product?.published ?? true} /> Published
        </label>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="rounded-xl bg-[#1D4ED8]">
          {pending ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
        </Button>
        {product && (
          <Button type="button" variant="outline" className="rounded-xl" asChild>
            <a href="/admin/products">Cancel</a>
          </Button>
        )}
      </div>
    </form>
  )
}
