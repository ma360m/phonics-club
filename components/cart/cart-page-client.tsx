'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { CartItemControls } from '@/components/shop/cart-item-controls'
import { GuestCartItemControls } from '@/components/shop/guest-cart-item-controls'
import { CART_UPDATED_EVENT } from '@/lib/guest-cart-client'
import { PriceDisplay, CurrencyDisplayNotice } from '@/components/currency/price-display'
import { useCurrency } from '@/components/currency/currency-provider'
import { formatCurrency } from '@/lib/currency'
import { SHIPPING_FEE_PKR } from '@/lib/commerce'

interface CartItem {
  id: string
  product_id?: string
  quantity: number
  products: {
    id: string
    name: string
    slug: string
    price: number
    images?: string[]
  }
}

export function CartPageClient() {
  const { currency, format } = useCurrency()
  const [items, setItems] = useState<CartItem[]>([])
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)

  function loadCart() {
    fetch('/api/cart/items')
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? [])
        setIsGuest(Boolean(d.isGuest))
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCart()
    const onUpdate = () => loadCart()
    window.addEventListener(CART_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpdate)
  }, [])

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.products?.price ?? 0) * item.quantity,
    0
  )
  const delivery = SHIPPING_FEE_PKR
  const total = subtotal + delivery

  if (loading) {
    return <p className="text-muted-foreground py-12 text-center">Loading cart...</p>
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-6">Your cart is empty</p>
        <Button asChild className="rounded-xl bg-[#1D4ED8]">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isGuest && (
        <p className="text-sm bg-muted/50 border rounded-xl p-3">
          Checking out as guest.{' '}
          <Link href="/auth/login?redirect=/checkout" className="text-[#1D4ED8] font-medium hover:underline">
            Sign in
          </Link>{' '}
          to save your cart and view orders in your dashboard.
        </p>
      )}
      {items.map((item) => {
        const product = item.products
        return (
          <div key={item.id} className="flex gap-4 bg-card rounded-2xl border p-4">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
              {product?.images?.[0] ? (
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-2xl">📚</div>
              )}
            </div>
            <div className="flex-1">
              <Link href={`/shop/${product.slug}`} className="font-semibold hover:text-[#1D4ED8]">
                {product.name}
              </Link>
              <p className="text-[#1D4ED8] font-bold mt-1">
                <PriceDisplay amountPkr={product.price} showApproxPkr={false} />
              </p>
              {isGuest ? (
                <GuestCartItemControls productId={product.id} quantity={item.quantity} onChange={loadCart} />
              ) : (
                <CartItemControls cartItemId={item.id} quantity={item.quantity} />
              )}
            </div>
            <p className="font-bold">
              <PriceDisplay amountPkr={product.price * item.quantity} showApproxPkr={false} />
            </p>
          </div>
        )
      })}
      <div className="space-y-3 pt-6 border-t">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-semibold">{format(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery</span>
          <span className="font-semibold">{format(delivery)}</span>
        </div>
        <div className="flex justify-between items-start">
          <span className="text-xl font-bold">Total</span>
          <span className="text-right">
            <span className="block text-2xl font-bold text-[#1D4ED8]">{format(total)}</span>
            {currency === 'USD' ? (
              <span className="mt-1 block text-xs text-muted-foreground">
                ≈ {formatCurrency(total, 'PKR', { freeLabel: false, useCode: true })}
              </span>
            ) : null}
          </span>
        </div>
        <CurrencyDisplayNotice className="rounded-xl border bg-muted/50 p-3" />
      </div>
      <Button asChild className="w-full rounded-xl bg-[#D30000] hover:bg-[#D30000]/90 h-12">
        <Link href="/checkout">Proceed to Checkout</Link>
      </Button>
    </div>
  )
}
