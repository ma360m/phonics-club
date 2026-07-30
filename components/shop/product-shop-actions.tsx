'use client'

import { useState, useTransition } from 'react'
import { Heart, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setProductCartQuantityAction } from '@/actions/cart'
import { toggleWishlistAction } from '@/actions/wishlist'
import { addToGuestCart, CART_UPDATED_EVENT, syncGuestCartCookie } from '@/lib/guest-cart-client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Product } from '@/types/database'
import { QuantityStepper } from '@/components/shop/quantity-stepper'

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
        window.dispatchEvent(new Event(CART_UPDATED_EVENT))
        toast.success(`Added ${qty} to cart`, { duration: 1200 })
        router.refresh()
      } else if (result.error?.toLowerCase().includes('sign in')) {
        addToGuestCart(product.id, qty)
        await syncGuestCartCookie()
        toast.success(`Added ${qty} to cart`, { duration: 1200 })
      } else toast.error(result.error ?? 'Failed to add to cart')
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
      <QuantityStepper
        value={qty}
        onChange={setQty}
        min={1}
        max={product.stock > 0 ? product.stock : 99}
        disabled={pending}
      />

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
      <QuantityStepper
        value={qty}
        onChange={setQty}
        min={1}
        max={product.stock > 0 ? product.stock : 99}
        disabled={pending}
        className="rounded-lg"
        buttonClassName="h-8 w-8"
        inputClassName="h-8 w-10 text-xs"
      />
      <Button
        size="sm"
        disabled={pending || product.stock <= 0}
        className="rounded-lg bg-[#1D4ED8] h-8 text-xs flex-1"
        onClick={() =>
          startTransition(async () => {
            const r = await setProductCartQuantityAction(product.id, qty)
            if (r.success) {
              window.dispatchEvent(new Event(CART_UPDATED_EVENT))
              toast.success('Added to cart', { duration: 1200 })
              router.refresh()
            } else if (r.error?.toLowerCase().includes('sign in')) {
              addToGuestCart(product.id, qty)
              await syncGuestCartCookie()
              toast.success('Added to cart', { duration: 1200 })
            } else toast.error(r.error)
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
