'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setProductCartQuantityAction } from '@/actions/cart'
import { removeWishlistItemAction, toggleWishlistAction } from '@/actions/wishlist'
import { addToGuestCart, CART_UPDATED_EVENT, syncGuestCartCookie } from '@/lib/guest-cart-client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Product } from '@/types/database'
import { QuantityStepper } from '@/components/shop/quantity-stepper'
import { evaluateProductOrderability, getProductPurchaseLimit, getProductStockNotice } from '@/lib/products/inventory'
import { isProductComingSoon } from '@/lib/products/coming-soon'

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
  const comingSoon = isProductComingSoon(product)
  const orderability = evaluateProductOrderability(product, qty)
  const stockNotice = getProductStockNotice(product, qty)

  function addToCart() {
    startTransition(async () => {
      const result = await setProductCartQuantityAction(product.id, qty)
      if (result.success) {
        window.dispatchEvent(new Event(CART_UPDATED_EVENT))
        toast.success(`Added ${qty} to cart`, { duration: 800 })
        router.refresh()
      } else if (result.error?.toLowerCase().includes('sign in')) {
        addToGuestCart(product.id, qty)
        await syncGuestCartCookie()
        toast.success(`Added ${qty} to cart`, { duration: 800 })
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
        max={getProductPurchaseLimit(product)}
        disabled={pending || comingSoon}
      />

      <Button onClick={addToCart} disabled={pending || !orderability.ok} className="rounded-xl bg-[#1D4ED8]">
        <ShoppingCart className="w-4 h-4 mr-2" />
        {comingSoon ? 'Coming Soon' : orderability.status === 'backorder' ? 'Backorder' : 'Add to Cart'}
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
      {stockNotice ? (
        <p className={`basis-full text-xs font-medium ${stockNotice.ok ? 'text-amber-700' : 'text-destructive'}`}>
          {stockNotice.message}
        </p>
      ) : null}
    </div>
  )
}

/** Compact actions for product cards on shop grid */
export function ProductCardActions({ product, wishlistMode = false }: { product: Product; wishlistMode?: boolean }) {
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [wishlisted, setWishlisted] = useState(wishlistMode)
  const [pending, startTransition] = useTransition()
  const comingSoon = isProductComingSoon(product)
  const orderability = evaluateProductOrderability(product, qty)
  const stockNotice = getProductStockNotice(product, qty)

  function addToCart() {
    startTransition(async () => {
      const result = await setProductCartQuantityAction(product.id, qty)
      if (result.success) {
        window.dispatchEvent(new Event(CART_UPDATED_EVENT))
        toast.success('Added to cart', { duration: 800 })
        router.refresh()
      } else if (result.error?.toLowerCase().includes('sign in')) {
        addToGuestCart(product.id, qty)
        await syncGuestCartCookie()
        toast.success('Added to cart', { duration: 800 })
      } else toast.error(result.error)
    })
  }

  function toggleWishlist() {
    startTransition(async () => {
      const result = await toggleWishlistAction(product.id)
      if (result.success) {
        setWishlisted(result.data?.added ?? !wishlisted)
        toast.success(result.data?.added ? 'Wishlisted' : 'Removed')
        router.refresh()
      } else toast.error(result.error)
    })
  }

  function removeFromWishlist() {
    startTransition(async () => {
      const result = await removeWishlistItemAction(product.id)
      if (result.success) {
        setWishlisted(false)
        toast.success('Removed from wishlist')
        router.refresh()
      } else toast.error(result.error)
    })
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
      <QuantityStepper
        value={qty}
        onChange={setQty}
        min={1}
        max={getProductPurchaseLimit(product)}
        disabled={pending || comingSoon}
        className="rounded-lg"
        buttonClassName="h-8 w-8"
        inputClassName="h-8 w-10 text-xs"
      />
      <Button
        size="sm"
        disabled={pending || !orderability.ok}
        className="h-8 flex-1 rounded-lg bg-[#1D4ED8] text-xs"
        onClick={addToCart}
      >
        <ShoppingCart className="w-3 h-3 mr-1" /> {comingSoon ? 'Soon' : orderability.status === 'backorder' ? 'Backorder' : 'Add'}
      </Button>
      {wishlistMode ? (
        <>
          <Button asChild size="sm" variant="outline" className="h-8 rounded-lg border-slate-200 px-3 text-xs">
            <Link href="/cart">Cart</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg border-rose-200 px-3 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            disabled={pending}
            onClick={removeFromWishlist}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Remove
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-8 rounded-lg px-2"
          disabled={pending}
          onClick={toggleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-3 h-3 ${wishlisted ? 'fill-[#D30000] text-[#D30000]' : ''}`} />
        </Button>
      )}
      {stockNotice ? (
        <p className={`basis-full text-xs font-medium ${stockNotice.ok ? 'text-amber-700' : 'text-destructive'}`}>
          {stockNotice.message}
        </p>
      ) : null}
    </div>
  )
}
