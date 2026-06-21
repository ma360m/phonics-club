'use client'

import { useState, useTransition } from 'react'
import { Minus, Plus, Heart, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setProductCartQuantityAction } from '@/actions/cart'
import { toggleWishlistAction } from '@/actions/wishlist'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Product } from '@/types/database'

interface Props {
  product: Product
  initialQty?: number
  inWishlist?: boolean
}

export function ProductShopActions({ product, initialQty = 0, inWishlist = false }: Props) {
  const router = useRouter()
  const [qty, setQty] = useState(initialQty || 1)
  const [wishlisted, setWishlisted] = useState(inWishlist)
  const [pending, startTransition] = useTransition()

  function addToCart() {
    startTransition(async () => {
      const result = await setProductCartQuantityAction(product.id, qty)
      if (result.success) {
        toast.success(`Added ${qty} to cart`)
        router.refresh()
      }
      else toast.error(result.error ?? 'Failed to add to cart')
    })
  }

  function toggleWishlist() {
    startTransition(async () => {
      const result = await toggleWishlistAction(product.id)
      if (result.success) {
        setWishlisted(result.data?.added ?? !wishlisted)
        toast.success(result.data?.added ? 'Added to wishlist' : 'Removed from wishlist')
      } else toast.error(result.error)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center border rounded-xl overflow-hidden">
        <button
          type="button"
          className="px-3 py-2 hover:bg-muted disabled:opacity-40"
          disabled={qty <= 1 || pending}
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="px-4 py-2 min-w-[3rem] text-center font-medium border-x">{qty}</span>
        <button
          type="button"
          className="px-3 py-2 hover:bg-muted disabled:opacity-40"
          disabled={pending || qty >= product.stock}
          onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <Button onClick={addToCart} disabled={pending || product.stock <= 0} className="rounded-xl bg-[#1D4ED8]">
        <ShoppingCart className="w-4 h-4 mr-2" />
        Add to Cart
      </Button>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-xl"
        disabled={pending}
        onClick={toggleWishlist}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={`w-4 h-4 ${wishlisted ? 'fill-[#D30000] text-[#D30000]' : ''}`} />
      </Button>
    </div>
  )
}

/** Compact actions for product cards on shop grid */
export function ProductCardActions({ product }: { product: Product }) {
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2 mt-3" onClick={(e) => e.preventDefault()}>
      <div className="flex items-center border rounded-lg text-sm">
        <button type="button" className="px-2 py-1 hover:bg-muted" onClick={() => setQty((q) => Math.max(1, q - 1))}>
          <Minus className="w-3 h-3" />
        </button>
        <span className="px-2 min-w-[1.5rem] text-center">{qty}</span>
        <button type="button" className="px-2 py-1 hover:bg-muted" onClick={() => setQty((q) => q + 1)}>
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <Button
        size="sm"
        disabled={pending}
        className="rounded-lg bg-[#1D4ED8] h-8 text-xs flex-1"
        onClick={() =>
          startTransition(async () => {
            const r = await setProductCartQuantityAction(product.id, qty)
            if (r.success) {
              toast.success('Added to cart')
              router.refresh()
            }
            else toast.error(r.error)
          })
        }
      >
        <ShoppingCart className="w-3 h-3 mr-1" /> Add
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="rounded-lg h-8 px-2"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await toggleWishlistAction(product.id)
            if (r.success) toast.success(r.data?.added ? 'Wishlisted' : 'Removed')
            else toast.error(r.error)
          })
        }
      >
        <Heart className="w-3 h-3" />
      </Button>
    </div>
  )
}
