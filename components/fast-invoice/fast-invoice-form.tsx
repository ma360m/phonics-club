'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import { placeFastInvoiceOrderAction } from '@/actions/fast-invoice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QuantityStepper } from '@/components/shop/quantity-stepper'
import { useCurrency } from '@/components/currency/currency-provider'
import { CurrencyDisplayNotice } from '@/components/currency/price-display'
import { SHIPPING_FEE_PKR } from '@/lib/commerce'
import { formatCurrency } from '@/lib/currency'
import { evaluateProductOrderability, getProductPurchaseLimit, type ProductStockStatus } from '@/lib/products/inventory'
import { getProductPricing } from '@/lib/products/sale-pricing'
import { shopPaymentLabel, shopPaymentNeedsReceipt, type ShopPaymentMethod } from '@/lib/payment-methods'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false }

interface FastInvoiceProduct {
  id: string
  name: string
  category: string
  price: number
  sale_enabled?: boolean | null
  sale_price?: number | null
  sale_percentage?: number | null
  sale_badge_text?: string | null
  stock?: number | null
  reserved_stock?: number | null
  low_stock_threshold?: number | null
  stock_management_enabled?: boolean | null
  backorder_policy?: string | null
  max_backorder_quantity?: number | null
  max_purchase_quantity?: number | null
  estimated_availability_date?: string | null
  backorder_message?: string | null
}

interface PaymentOption {
  value: ShopPaymentMethod
  title: string
  description: string
}

interface CouponPreview {
  valid: boolean
  code?: string
  memberId?: string | null
  discount?: number
  couponDiscount?: number
  memberDiscount?: number
  couponDiscountPercent?: number
  memberDiscountPercent?: number
  shippingDiscount?: number
  error?: string
}

interface SelectedItem {
  productId: string
  quantity: number
}

export function FastInvoiceForm({
  token,
  products,
  paymentOptions,
  recipientEmail,
  requiredMemberId,
}: {
  token: string
  products: FastInvoiceProduct[]
  paymentOptions: PaymentOption[]
  recipientEmail?: string | null
  requiredMemberId?: string | null
}) {
  const { currency, settings, format } = useCurrency()
  const [state, formAction, pending] = useActionState(placeFastInvoiceOrderAction, initialState)
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? '')
  const [searchTerm, setSearchTerm] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addQuantity, setAddQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<ShopPaymentMethod>(paymentOptions[0]?.value ?? 'cod')
  const [couponCode, setCouponCode] = useState('')
  const [memberId, setMemberId] = useState(requiredMemberId ?? '')
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null)
  const [couponChecking, setCouponChecking] = useState(false)
  const [previewReady, setPreviewReady] = useState(false)

  const invoiceItems = selectedItems.flatMap((item) => {
    const product = productMap.get(item.productId)
    if (!product) return []
    const pricing = getProductPricing(product)
    const stock = evaluateProductOrderability(product, item.quantity)
    return [{
      ...item,
      product,
      price: pricing.displayPrice,
      lineTotal: pricing.displayPrice * item.quantity,
      stock,
    }]
  })
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0)

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return products.slice(0, 12)
    return products
      .filter((product) => [product.name, product.category].some((value) => value.toLowerCase().includes(term)))
      .slice(0, 18)
  }, [products, searchTerm])

  useEffect(() => {
    const code = couponCode.trim()
    const member = memberId.trim()
    if ((!code && !member) || subtotal <= 0) {
      setCouponPreview(null)
      setCouponChecking(false)
      return
    }

    if ((code && code.length < 3) || (member && member.length < 3)) {
      setCouponPreview({ valid: false, error: 'Enter at least 3 characters.' })
      setCouponChecking(false)
      return
    }

    const controller = new AbortController()
    setCouponPreview(null)
    setCouponChecking(true)
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/coupons/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: code || undefined,
            memberId: member || undefined,
            subtotal,
            shipping: SHIPPING_FEE_PKR,
          }),
          signal: controller.signal,
        })
        const result = (await response.json()) as CouponPreview
        if (!controller.signal.aborted) setCouponPreview(result)
      } catch {
        if (!controller.signal.aborted) setCouponPreview({ valid: false, error: 'Discount could not be checked.' })
      } finally {
        if (!controller.signal.aborted) setCouponChecking(false)
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [couponCode, memberId, subtotal])

  const shippingDiscount = couponPreview?.valid ? couponPreview.shippingDiscount ?? 0 : 0
  const chargedShipping = Math.max(0, SHIPPING_FEE_PKR - shippingDiscount)
  const couponDiscount = couponPreview?.valid ? couponPreview.couponDiscount ?? couponPreview.discount ?? 0 : 0
  const memberDiscount = couponPreview?.valid ? couponPreview.memberDiscount ?? 0 : 0
  const totalDiscount = couponPreview?.valid ? couponPreview.discount ?? couponDiscount + memberDiscount : 0
  const payableTotal = Math.max(0, subtotal + chargedShipping - totalDiscount)
  const itemsJson = JSON.stringify(selectedItems)

  function selectProduct(product: FastInvoiceProduct) {
    setSelectedProductId(product.id)
    setSearchTerm(`${product.name} - ${format(getProductPricing(product).displayPrice)}`)
    setPickerOpen(false)
  }

  function addSelectedProduct() {
    const product = productMap.get(selectedProductId)
    if (!product) return
    const existing = selectedItems.find((item) => item.productId === selectedProductId)
    const nextQuantity = (existing?.quantity ?? 0) + addQuantity
    const stock = evaluateProductOrderability(product, nextQuantity)
    if (!stock.ok) return

    setSelectedItems((current) => {
      const currentItem = current.find((item) => item.productId === selectedProductId)
      if (currentItem) {
        return current.map((item) => item.productId === selectedProductId ? { ...item, quantity: nextQuantity } : item)
      }
      return [...current, { productId: selectedProductId, quantity: addQuantity }]
    })
    setPreviewReady(false)
  }

  function updateQuantity(productId: string, quantity: number) {
    setSelectedItems((current) => current.map((item) => item.productId === productId ? { ...item, quantity } : item))
    setPreviewReady(false)
  }

  function removeItem(productId: string) {
    setSelectedItems((current) => current.filter((item) => item.productId !== productId))
    setPreviewReady(false)
  }

  function showPreview() {
    if (!invoiceItems.length) return
    setPreviewReady(true)
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!previewReady) {
          event.preventDefault()
          showPreview()
        }
      }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]"
    >
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="itemsJson" value={itemsJson} />
      <input type="hidden" name="country" value="Pakistan" />
      <input type="hidden" name="displayCurrency" value={currency} />

      <section className="min-w-0 space-y-5 rounded-lg border bg-card p-4 sm:p-6">
        {state.error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}

        <div className="space-y-3">
          <Label>Items</Label>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_130px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onFocus={() => setPickerOpen(true)}
                onChange={(event) => {
                  setSearchTerm(event.target.value)
                  setPickerOpen(true)
                }}
                placeholder="Search or select book"
                className="rounded-xl pl-9"
              />
              {pickerOpen ? (
                <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border bg-background shadow-xl">
                  {filteredProducts.map((product) => {
                    const pricing = getProductPricing(product)
                    const stock = evaluateProductOrderability(product, addQuantity)
                    return (
                      <button
                        key={product.id}
                        type="button"
                        className="flex w-full items-start justify-between gap-4 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                        onClick={() => selectProduct(product)}
                      >
                        <span className="min-w-0">
                          <span className="block break-words font-medium">{product.name}</span>
                          <span className="text-xs text-muted-foreground">{product.category.replace(/-/g, ' ')}</span>
                          {stock.message ? <span className="mt-1 block text-xs text-amber-700">{stock.message}</span> : null}
                        </span>
                        <span className="shrink-0 font-bold text-[#1D4ED8]">{format(pricing.displayPrice)}</span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
            <QuantityStepper
              value={addQuantity}
              min={1}
              max={selectedProductId ? getProductPurchaseLimit(productMap.get(selectedProductId) ?? {}) : 999}
              onChange={setAddQuantity}
              className="w-fit rounded-xl"
            />
            <Button type="button" className="rounded-xl bg-[#1D4ED8]" onClick={addSelectedProduct} disabled={!selectedProductId}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-muted/70 text-left">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoiceItems.map((item) => (
                <tr key={item.productId}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{item.product.name}</p>
                    {item.stock.message ? <p className="mt-1 text-xs font-medium text-amber-700">{item.stock.message}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <QuantityStepper
                      value={item.quantity}
                      min={1}
                      max={getProductPurchaseLimit(item.product)}
                      onChange={(quantity) => updateQuantity(item.productId, quantity)}
                      className="mx-auto w-fit rounded-lg"
                      buttonClassName="h-8 w-8"
                      inputClassName="h-8 w-10 text-xs"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">{format(item.price)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{format(item.lineTotal)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg text-destructive" onClick={() => removeItem(item.productId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!invoiceItems.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No items selected.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fast-name">Full Name *</Label>
            <Input id="fast-name" name="fullName" required minLength={2} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fast-email">Email *</Label>
            <Input id="fast-email" name="email" type="email" required defaultValue={recipientEmail ?? ''} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fast-phone">Phone *</Label>
            <Input id="fast-phone" name="phone" required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fast-city">City *</Label>
            <Input id="fast-city" name="city" required defaultValue="Lahore" className="rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fast-address">Address *</Label>
          <Input id="fast-address" name="address" required minLength={5} className="rounded-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="fast-zip">Postal Code</Label>
            <Input id="fast-zip" name="zip" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fast-coupon">Coupon Code</Label>
            <Input id="fast-coupon" name="couponCode" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fast-member">Member ID</Label>
            <Input
              id="fast-member"
              name="memberId"
              value={memberId}
              readOnly={Boolean(requiredMemberId)}
              onChange={(event) => setMemberId(event.target.value)}
              className="rounded-xl font-mono"
            />
          </div>
        </div>
        {(couponCode.trim() || memberId.trim()) && (
          <p className={`text-xs ${couponChecking ? 'text-muted-foreground' : couponPreview?.valid ? 'text-emerald-700' : 'text-destructive'}`}>
            {couponChecking
              ? 'Checking discount...'
              : couponPreview?.valid
                ? `Discount preview: ${format(totalDiscount + shippingDiscount)}`
                : couponPreview?.error ?? 'Discount could not be checked.'}
          </p>
        )}

        <div className="space-y-3 border-t pt-5">
          <Label>Payment Method *</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {paymentOptions.map((option) => (
              <label
                key={option.value}
                className={`cursor-pointer rounded-xl border p-4 ${paymentMethod === option.value ? 'border-[#1D4ED8] bg-[#EFF6FF]' : 'bg-background'}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  onChange={() => setPaymentMethod(option.value)}
                  className="sr-only"
                />
                <span className="block font-semibold">{option.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
              </label>
            ))}
          </div>
          {shopPaymentNeedsReceipt(paymentMethod) ? (
            <p className="rounded-xl bg-[#EFF6FF] px-3 py-2 text-sm text-[#1D4ED8]">
              Payment receipt can be uploaded from the order page after invoice creation.
            </p>
          ) : null}
        </div>
      </section>

      <aside className="h-fit rounded-lg border bg-card p-4 sm:p-6 lg:sticky lg:top-24">
        <div className="mb-5">
          <p className="text-sm font-semibold text-[#1D4ED8]">Invoice Preview</p>
          <h2 className="mt-1 text-2xl font-bold">Fast order</h2>
        </div>
        {previewReady ? (
          <FastPreview
            items={invoiceItems}
            subtotal={subtotal}
            shipping={SHIPPING_FEE_PKR}
            shippingDiscount={shippingDiscount}
            totalDiscount={totalDiscount}
            payableTotal={payableTotal}
            paymentMethod={paymentMethod}
            format={format}
            currency={currency}
          />
        ) : (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            Preview appears after items and required customer details are ready.
          </div>
        )}
        <div className="mt-6 space-y-3 border-t pt-5">
          {previewReady ? (
            <>
              <Button type="submit" disabled={pending || !invoiceItems.length} className="w-full rounded-xl bg-[#D30000] hover:bg-[#D30000]/90">
                {pending ? 'Creating invoice...' : 'Place Order'}
              </Button>
              <Button type="button" variant="outline" className="w-full rounded-xl" onClick={() => setPreviewReady(false)}>
                Back to Edit
              </Button>
            </>
          ) : (
            <Button type="button" disabled={!invoiceItems.length} onClick={showPreview} className="w-full rounded-xl bg-[#1D4ED8]">
              Preview Invoice Now
            </Button>
          )}
          {currency === 'USD' ? (
            <p className="text-center text-xs text-muted-foreground">
              Payment remains in PKR at 1 USD = {settings.usdToPkrRate.toLocaleString('en-PK')} PKR.
            </p>
          ) : null}
        </div>
      </aside>
    </form>
  )
}

function FastPreview({
  items,
  subtotal,
  shipping,
  shippingDiscount,
  totalDiscount,
  payableTotal,
  paymentMethod,
  format,
  currency,
}: {
  items: Array<SelectedItem & {
    product: FastInvoiceProduct
    price: number
    lineTotal: number
    stock: { status: ProductStockStatus; message?: string; ok: boolean }
  }>
  subtotal: number
  shipping: number
  shippingDiscount: number
  totalDiscount: number
  payableTotal: number
  paymentMethod: ShopPaymentMethod
  format: (amount: number) => string
  currency: string
}) {
  return (
    <div className="space-y-5 text-sm">
      <div className="rounded-lg bg-[#1D4ED8] p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Phonics Club</p>
        <p className="mt-2 text-xl font-bold">Draft invoice</p>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.productId} className="rounded-lg bg-muted/50 p-3">
            <div className="flex justify-between gap-3">
              <span className="min-w-0">
                <span className="block break-words font-semibold">{item.product.name}</span>
                <span className="text-xs text-muted-foreground">{item.quantity} x {format(item.price)}</span>
              </span>
              <span className="shrink-0 font-bold">{format(item.lineTotal)}</span>
            </div>
            {item.stock.message ? <p className="mt-2 text-xs font-medium text-amber-700">{item.stock.message}</p> : null}
          </li>
        ))}
      </ul>
      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between"><span>Subtotal</span><span>{format(subtotal)}</span></div>
        <div className="flex justify-between"><span>Shipping</span><span>{format(shipping)}</span></div>
        {totalDiscount > 0 ? <div className="flex justify-between text-[#D30000]"><span>Discount</span><span>-{format(totalDiscount)}</span></div> : null}
        {shippingDiscount > 0 ? <div className="flex justify-between text-[#D30000]"><span>Shipping waived</span><span>-{format(shippingDiscount)}</span></div> : null}
        <div className="flex justify-between text-lg font-bold text-[#1D4ED8]">
          <span>Total</span>
          <span className="text-right">
            <span className="block">{format(payableTotal)}</span>
            {currency === 'USD' ? (
              <span className="mt-1 block text-xs font-medium text-muted-foreground">
                {formatCurrency(payableTotal, 'PKR', { freeLabel: false, useCode: true })}
              </span>
            ) : null}
          </span>
        </div>
        <CurrencyDisplayNotice />
      </div>
      <div className="rounded-lg border p-3">
        <p className="font-semibold">Payment</p>
        <p className="mt-1 text-muted-foreground">{shopPaymentLabel(paymentMethod)}</p>
      </div>
    </div>
  )
}
