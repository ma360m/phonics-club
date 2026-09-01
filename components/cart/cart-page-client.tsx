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
import { getProductPricing } from '@/lib/products/sale-pricing'
import { getProductStockNotice } from '@/lib/products/inventory'

interface CartItem {
  id: string
  product_id?: string
  quantity: number
  products: {
    id: string
    name: string
    slug: string
    price: number
    sale_enabled?: boolean | null
    sale_price?: number | null
    sale_percentage?: number | null
    sale_badge_text?: string | null
    images?: string[]
    stock?: number | null
    reserved_stock?: number | null
    low_stock_threshold?: number | null
    stock_management_enabled?: boolean | null
    backorder_policy?: string | null
    max_backorder_quantity?: number | null
    max_purchase_quantity?: number | null
    estimated_availability_date?: string | null
    backorder_message?: string | null
    metadata?: Record<string, unknown> | null
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

  const subtotal = items.reduce((sum, item) => sum + getProductPricing(item.products).displayPrice * item.quantity, 0)
  const totalQuantity = items.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0)
  const delivery = SHIPPING_FEE_PKR
  const total = subtotal + delivery
  const hasUnavailableItems = items.some((item) => getProductStockNotice(item.products, item.quantity)?.ok === false)

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
      {items.map((item, index) => {
        const product = item.products
        const pricing = getProductPricing(product)
        const stockNotice = getProductStockNotice(product, item.quantity)
        return (
          <div key={item.id} className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row">
            <div className="flex items-start gap-3 sm:block">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] font-mono text-xs font-bold text-[#1D4ED8]">
                {index + 1}
              </span>
            </div>
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
              {product?.images?.[0] ? (
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-2xl">📚</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/shop/${product.slug}`} className="break-words font-semibold hover:text-[#1D4ED8]">
                {product.name}
              </Link>
              <p className="text-[#1D4ED8] font-bold mt-1">
                <PriceDisplay amountPkr={pricing.displayPrice} showApproxPkr={false} />
                {pricing.hasSaleDiscount ? (
                  <PriceDisplay amountPkr={pricing.basePrice} showApproxPkr={false} className="ml-2 text-xs text-muted-foreground line-through" />
                ) : null}
              </p>
              {isGuest ? (
                <GuestCartItemControls productId={product.id} quantity={item.quantity} onChange={loadCart} />
              ) : (
                <CartItemControls cartItemId={item.id} quantity={item.quantity} />
              )}
              {stockNotice ? (
                <p className={`mt-2 text-xs font-medium ${stockNotice.ok ? 'text-amber-700' : 'text-destructive'}`}>
                  {stockNotice.message}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 text-right font-bold sm:text-left">
              <PriceDisplay amountPkr={pricing.displayPrice * item.quantity} showApproxPkr={false} />
            </p>
          </div>
        )
      })}
      <div className="space-y-3 pt-6 border-t">
        <div className="flex justify-between">
          <span>Total quantity</span>
          <span className="font-semibold">{totalQuantity}</span>
        </div>
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
      {hasUnavailableItems ? (
        <Button disabled className="h-12 w-full rounded-xl bg-[#D30000] hover:bg-[#D30000]/90">
          Remove unavailable items
        </Button>
      ) : (
        <Button asChild className="w-full rounded-xl bg-[#D30000] hover:bg-[#D30000]/90 h-12">
          <Link href="/checkout">Proceed to Checkout</Link>
        </Button>
      )}
    </div>
  )
}
