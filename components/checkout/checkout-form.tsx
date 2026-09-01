'use client'

import { useActionState, useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { placeOrderAction } from '@/actions/orders'
import { setProductCartQuantityAction } from '@/actions/cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SHIPPING_FEE_PKR } from '@/lib/commerce'
import { shopPaymentLabel, shopPaymentNeedsReceipt, type ShopPaymentMethod } from '@/lib/payment-methods'
import type { ActionResult } from '@/types'
import { CART_UPDATED_EVENT, getGuestCart, updateGuestCartQuantity } from '@/lib/guest-cart-client'
import { CurrencyDisplayNotice } from '@/components/currency/price-display'
import { useCurrency } from '@/components/currency/currency-provider'
import { formatCurrency } from '@/lib/currency'
import { getProductPricing } from '@/lib/products/sale-pricing'
import { evaluateProductOrderability, type ProductStockStatus } from '@/lib/products/inventory'
import { Minus, Plus, Trash2 } from 'lucide-react'
import type { ContactPhoneLink } from '@/lib/contact-settings'

const initialState: ActionResult = { success: false }

const evasiveButtonTransforms = [
  'translate(18px, -8px)',
  'translate(-18px, -10px)',
  'translate(16px, 10px)',
  'translate(-14px, 8px)',
]

type PaymentOption = {
  value: ShopPaymentMethod
  title: string
  description: string
}

interface BankDetails {
  bankName: string
  accountTitle: string
  accountNumber: string
  iban?: string
  instructions: string
}

interface CheckoutItem {
  id?: string
  product_id?: string
  name: string
  price: number
  quantity: number
  image?: string
  stock_status?: ProductStockStatus
  stock_note?: string
  stock_available?: number
}

interface CheckoutDetails {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  zip: string
}

interface CouponPreview {
  valid: boolean
  code?: string
  memberId?: string | null
  discount?: number
  couponDiscount?: number
  memberDiscount?: number
  discountPercent?: number
  couponDiscountPercent?: number
  memberDiscountPercent?: number
  totalDiscount?: number
  freeShipping?: boolean
  shippingDiscount?: number
  subtotalAfterDiscount?: number
  error?: string
}

type ApiCartItem = {
  id: string
  product_id?: string
  quantity: number
  products?: {
    id: string
    name: string
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
  } | null
}

export function CheckoutForm({
  cartItems,
  email,
  bankDetails,
  isGuest = false,
  paymentOptions,
  supportPhoneLinks = [],
}: {
  subtotal: number
  cartItems: CheckoutItem[]
  email?: string
  bankDetails: BankDetails
  isGuest?: boolean
  paymentOptions: PaymentOption[]
  supportPhoneLinks?: ContactPhoneLink[]
}) {
  const { currency, settings, format } = useCurrency()
  const [state, formAction, pending] = useActionState(placeOrderAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [paymentMethod, setPaymentMethod] = useState<ShopPaymentMethod>(paymentOptions[0]?.value ?? 'cod')
  const [receiptTiming, setReceiptTiming] = useState<'now' | 'later'>('later')
  const [showMemberHelp, setShowMemberHelp] = useState(false)
  const [reviewReady, setReviewReady] = useState(false)
  const [guestCartJson, setGuestCartJson] = useState('')
  const [details, setDetails] = useState<CheckoutDetails>({
    fullName: '',
    email: email ?? '',
    phone: '',
    address: '',
    city: 'Lahore',
    zip: '',
  })
  const [couponCode, setCouponCode] = useState('')
  const [memberId, setMemberId] = useState('')
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null)
  const [couponChecking, setCouponChecking] = useState(false)
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>(cartItems)
  const [cartUpdatingId, setCartUpdatingId] = useState<string | null>(null)
  const [cartError, setCartError] = useState<string | null>(null)
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [validationIssue, setValidationIssue] = useState<string | null>(null)
  const [evadeStep, setEvadeStep] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const checkoutSubtotal = checkoutItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)
  const checkoutQuantityTotal = checkoutItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0)
  const hasUnavailableCheckoutItems = checkoutItems.some((item) => item.stock_status === 'out_of_stock')

  useEffect(() => {
    if (isGuest) setGuestCartJson(JSON.stringify(getGuestCart()))
  }, [isGuest])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncPreference = () => setPrefersReducedMotion(media.matches)
    syncPreference()
    media.addEventListener('change', syncPreference)
    return () => media.removeEventListener('change', syncPreference)
  }, [])

  useEffect(() => {
    if (paymentMethod === 'cod') setReceiptTiming('later')
  }, [paymentMethod])

  useEffect(() => {
    if (!paymentOptions.some((option) => option.value === paymentMethod)) {
      setPaymentMethod(paymentOptions[0]?.value ?? 'cod')
    }
  }, [paymentMethod, paymentOptions])

  useEffect(() => {
    const code = couponCode.trim()
    const member = memberId.trim()
    if (!code && !member) {
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
            subtotal: checkoutSubtotal,
            shipping: SHIPPING_FEE_PKR,
          }),
          signal: controller.signal,
        })
        const result = (await response.json()) as CouponPreview
        if (!controller.signal.aborted) setCouponPreview(result)
      } catch {
        if (!controller.signal.aborted) {
          setCouponPreview({ valid: false, error: 'Coupon could not be checked right now.' })
        }
      } finally {
        if (!controller.signal.aborted) setCouponChecking(false)
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [checkoutSubtotal, couponCode, memberId])

  const shipping = SHIPPING_FEE_PKR
  const shippingDiscount = couponPreview?.valid ? couponPreview.shippingDiscount ?? 0 : 0
  const chargedShipping = Math.max(0, shipping - shippingDiscount)
  const couponDiscount = couponPreview?.valid ? couponPreview.couponDiscount ?? couponPreview.discount ?? 0 : 0
  const memberDiscount = couponPreview?.valid ? couponPreview.memberDiscount ?? 0 : 0
  const totalDiscount = couponPreview?.valid ? couponPreview.discount ?? couponDiscount + memberDiscount : 0
  const payableTotal = Math.max(0, checkoutSubtotal + chargedShipping - totalDiscount)
  const previewCouponCode = couponPreview?.valid ? couponPreview.code ?? couponCode.trim().toUpperCase() : undefined
  const previewMemberId = couponPreview?.valid ? couponPreview.memberId ?? memberId.trim().toUpperCase() : undefined
  const receiptRequired = shopPaymentNeedsReceipt(paymentMethod)
  const receiptDueNow = receiptRequired && receiptTiming === 'now'

  function updateDetails(field: keyof CheckoutDetails, value: string) {
    setDetails((current) => ({ ...current, [field]: value }))
    setReviewReady(false)
  }

  function updateCouponCode(value: string) {
    setCouponCode(value)
    if (value.trim()) setMemberId('')
  }

  function updateMemberId(value: string) {
    setMemberId(value)
    if (value.trim()) setCouponCode('')
  }

  function firstInvalidControl() {
    return formRef.current?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input:not([type="hidden"]):invalid, select:invalid, textarea:invalid',
    ) ?? null
  }

  function invalidFieldLabel(control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) {
    if (!control) return 'the highlighted field'
    if (control.id) {
      const label = formRef.current?.querySelector<HTMLLabelElement>(`label[for="${control.id}"]`)?.textContent?.trim()
      if (label) return label.replace(/\s*\*+$/, '')
    }
    return control.getAttribute('aria-label') ?? control.name ?? 'the highlighted field'
  }

  function validateCheckoutFields({ focus = false, report = false } = {}) {
    const form = formRef.current
    if (!form) return true

    if (!checkoutItems.length) {
      setCartError('Your cart is empty. Add an item before placing an order.')
      return false
    }

    if (hasUnavailableCheckoutItems) {
      setValidationIssue('Remove unavailable items before confirming your order.')
      return false
    }

    if (form.checkValidity()) {
      setShowValidationErrors(false)
      setValidationIssue(null)
      setEvadeStep(0)
      return true
    }

    const invalid = firstInvalidControl()
    setShowValidationErrors(true)
    setValidationIssue(`Please fix ${invalidFieldLabel(invalid)} before confirming your order.`)

    if (focus && invalid) {
      invalid.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' })
      window.setTimeout(() => invalid.focus({ preventScroll: true }), 120)
    }

    if (report) form.reportValidity()
    return false
  }

  function handleCheckoutFormChange() {
    if (!showValidationErrors || !formRef.current?.checkValidity()) return
    setShowValidationErrors(false)
    setValidationIssue(null)
    setEvadeStep(0)
  }

  function handleEvasiveConfirmHover() {
    if (pending || validateCheckoutFields({ focus: true, report: false })) return
    if (!prefersReducedMotion) setEvadeStep((current) => current + 1)
  }

  async function refreshCheckoutCart() {
    const response = await fetch('/api/cart/items', { cache: 'no-store' })
    if (!response.ok) return
    const result = (await response.json()) as { items?: ApiCartItem[] }
    const nextItems: CheckoutItem[] = []
    for (const item of result.items ?? []) {
      const product = item.products
      const quantity = Number(item.quantity ?? 0)
      if (!product || quantity <= 0) continue
      const pricing = getProductPricing(product)
      const stock = evaluateProductOrderability(product, quantity)
      nextItems.push({
        id: item.id,
        product_id: item.product_id ?? product.id,
        name: product.name,
        price: pricing.displayPrice,
        quantity,
        image: product.images?.[0],
        ...(stock.status !== 'in_stock' ? {
          stock_status: stock.status,
          stock_note: stock.message,
          ...(typeof stock.available === 'number' ? { stock_available: stock.available } : {}),
        } : {}),
      })
    }

    setCheckoutItems(nextItems)
    if (isGuest) setGuestCartJson(JSON.stringify(getGuestCart()))
  }

  async function changeCartQuantity(item: CheckoutItem, nextQuantity: number) {
    const productId = item.product_id
    if (!productId) {
      setCartError('This cart item cannot be changed from checkout. Open the cart page and try again.')
      return
    }

    if (nextQuantity <= 0) {
      const confirmed = window.confirm(`Remove "${item.name}" from your cart?`)
      if (!confirmed) return
    }

    setCartError(null)
    setCartUpdatingId(productId)
    setReviewReady(false)

    try {
      if (isGuest) {
        updateGuestCartQuantity(productId, nextQuantity)
      } else {
        const result = await setProductCartQuantityAction(productId, nextQuantity)
        if (!result.success) {
          setCartError(result.error ?? 'Cart could not be updated.')
          return
        }
        window.dispatchEvent(new Event(CART_UPDATED_EVENT))
      }
      await refreshCheckoutCart()
    } finally {
      setCartUpdatingId(null)
    }
  }

  function showInvoicePreview() {
    if (!validateCheckoutFields({ focus: true, report: true })) return
    setReviewReady(true)
  }

  const confirmButtonStyle: CSSProperties | undefined =
    showValidationErrors && validationIssue && evadeStep > 0 && !prefersReducedMotion
      ? { transform: evasiveButtonTransforms[(evadeStep - 1) % evasiveButtonTransforms.length] }
      : undefined

  return (
    <form
      ref={formRef}
      action={formAction}
      data-validation-errors={showValidationErrors ? 'true' : 'false'}
      onChange={handleCheckoutFormChange}
      onSubmit={(event) => {
        if (!reviewReady) {
          event.preventDefault()
          showInvoicePreview()
          return
        }
        if (!validateCheckoutFields({ focus: true, report: true })) event.preventDefault()
      }}
      className="grid min-w-0 gap-6 overflow-hidden data-[validation-errors=true]:[&_input:invalid]:border-rose-500 data-[validation-errors=true]:[&_input:invalid]:bg-rose-50 data-[validation-errors=true]:[&_input:invalid]:ring-2 data-[validation-errors=true]:[&_input:invalid]:ring-rose-100 lg:grid-cols-[minmax(0,1fr)_minmax(320px,430px)]"
    >
      <section className="min-w-0 space-y-5 rounded-lg border bg-card p-4 sm:p-6">
        {state.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
        )}
        {cartError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{cartError}</p>
        )}
        {validationIssue && (
          <p id="checkout-validation-guidance" role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {validationIssue}
          </p>
        )}

        <div className="min-w-0 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 sm:p-4">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#0F172A]">Checkout Cart</p>
              <p className="text-xs text-slate-500">Add, reduce, or remove items before reviewing the invoice.</p>
            </div>
            <Button asChild variant="outline" size="sm" className="w-fit rounded-lg bg-white">
              <Link href="/cart">Open Cart</Link>
            </Button>
          </div>
          {checkoutItems.length ? (
            <ul className="space-y-2">
              {checkoutItems.map((item, index) => {
                const productId = item.product_id ?? item.id ?? item.name
                const updating = cartUpdatingId === item.product_id
                return (
                  <li key={productId} className="min-w-0 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex min-w-0 gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] font-mono text-xs font-bold text-[#1D4ED8]">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold leading-snug text-[#0F172A] sm:text-base">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{format(item.price)} each</p>
                        {item.stock_note ? (
                          <p className="mt-1 text-xs font-medium text-amber-700">{item.stock_note}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 sm:justify-end">
                      <div className="flex shrink-0 items-center rounded-full border border-slate-200 bg-[#F8FAFC] p-1">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-white disabled:opacity-50"
                          onClick={() => changeCartQuantity(item, item.quantity - 1)}
                          disabled={updating}
                          aria-label={`Reduce ${item.name} quantity`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-white disabled:opacity-50"
                          onClick={() => changeCartQuantity(item, item.quantity + 1)}
                          disabled={updating}
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="min-w-[92px] flex-1 text-right text-sm font-semibold sm:flex-none">{format(item.price * item.quantity)}</p>
                      <button
                        type="button"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        onClick={() => changeCartQuantity(item, 0)}
                        disabled={updating}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              Your cart is empty. Add an item before placing an order.
            </div>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
            <span className="text-slate-500">Total quantity</span>
            <span className="font-semibold text-[#0F172A]">{checkoutQuantityTotal}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Cart subtotal</span>
            <span className="font-bold text-[#1D4ED8]">{format(checkoutSubtotal)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            name="fullName"
            required
            minLength={2}
            maxLength={120}
            value={details.fullName}
            onChange={(event) => updateDetails('fullName', event.target.value)}
            className="rounded-lg"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={details.email}
              onChange={(event) => updateDetails('email', event.target.value)}
              placeholder="For invoice email"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Pakistan) *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              pattern="(?:\+?92[\s-]?3\d{2}[\s-]?\d{7}|03\d{2}[\s-]?\d{7}|3\d{2}[\s-]?\d{7})"
              title="Enter a valid Pakistan mobile number, for example 0300 8079480 or +92 300 8079480."
              value={details.phone}
              onChange={(event) => updateDetails('phone', event.target.value)}
              placeholder="0300 8079480 or +92 300 8079480"
              className="rounded-lg"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            name="address"
            required
            minLength={5}
            value={details.address}
            onChange={(event) => updateDetails('address', event.target.value)}
            className="rounded-lg"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              name="city"
              required
              minLength={2}
              value={details.city}
              onChange={(event) => updateDetails('city', event.target.value)}
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">Postal Code</Label>
            <Input
              id="zip"
              name="zip"
              value={details.zip}
              onChange={(event) => updateDetails('zip', event.target.value)}
              className="rounded-lg"
            />
          </div>
        </div>
        <input type="hidden" name="country" value="Pakistan" />
        {isGuest && <input type="hidden" name="guestCart" value={guestCartJson} />}
        <input type="hidden" name="receiptTiming" value={receiptTiming} />
        <input type="hidden" name="displayCurrency" value={currency} />

        <div className="border-t pt-5 space-y-3">
          <Label>Coupon / Member ID</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              id="couponCode"
              name="couponCode"
              placeholder="Coupon code"
              value={couponCode}
              onChange={(event) => updateCouponCode(event.target.value)}
              className="rounded-lg"
            />
            <div>
              <Input
                name="memberId"
                placeholder="Member ID (optional)"
                value={memberId}
                onChange={(event) => updateMemberId(event.target.value)}
                className="rounded-lg"
              />
              <button
                type="button"
                className="mt-1 text-xs text-[#1D4ED8] hover:underline"
                onClick={() => setShowMemberHelp(!showMemberHelp)}
              >
                Don&apos;t know your Member ID?
              </button>
            </div>
          </div>
          {couponCode.trim() || memberId.trim() ? (
            <p
              className={`text-xs ${
                couponChecking
                  ? 'text-muted-foreground'
                  : couponPreview?.valid
                    ? 'text-emerald-600'
                    : 'text-destructive'
              }`}
            >
              {couponChecking
                ? 'Checking discount...'
                : couponPreview?.valid
                  ? totalDiscount + shippingDiscount > 0
                    ? `Discount applied: ${[
                        couponDiscount > 0 && previewCouponCode ? `coupon ${previewCouponCode}${couponPreview.couponDiscountPercent ? ` (${couponPreview.couponDiscountPercent}%)` : ''} ${format(couponDiscount)}` : null,
                        memberDiscount > 0 && previewMemberId ? `Member ID ${previewMemberId}${couponPreview.memberDiscountPercent ? ` (${couponPreview.memberDiscountPercent}%)` : ''} ${format(memberDiscount)}` : null,
                        shippingDiscount > 0 ? `shipping waived ${format(shippingDiscount)}` : null,
                      ].filter(Boolean).join(' + ')}. Estimated total: ${format(payableTotal)}.`
                    : 'Discount code is valid but does not reduce this order.'
                  : couponPreview?.error ?? 'Coupon could not be checked.'}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Enter one coupon code or one Member ID to preview the discount before reviewing your invoice.</p>
          )}
          {showMemberHelp && (
            <p className="rounded-lg bg-muted p-3 text-sm">
              Contact us to get your Member ID:{' '}
              <Link href="/contact" className="font-medium text-[#1D4ED8] hover:underline">Contact Us</Link>
            </p>
          )}
        </div>

        <div className="border-t pt-5 space-y-3">
          <Label>Payment Method *</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {paymentOptions.length ? paymentOptions.map((option) => (
              <label
                key={option.value}
                className={`flex min-h-28 cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${
                  paymentMethod === option.value ? 'border-[#1D4ED8] bg-[#1D4ED8]/5' : 'hover:border-[#1D4ED8]/50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  onChange={() => setPaymentMethod(option.value)}
                  className="mt-1"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{option.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{option.description}</span>
                  {option.value === 'bank_transfer' && paymentMethod === option.value && (
                    <span className="mt-4 grid gap-x-5 gap-y-2 text-sm text-slate-700 sm:grid-cols-2">
                      <span className="min-w-0">
                        <span className="font-medium text-[#0F172A]">Bank: </span>
                        <span className="break-words">{bankDetails.bankName}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="font-medium text-[#0F172A]">Account: </span>
                        <span className="break-words">{bankDetails.accountTitle}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="font-medium text-[#0F172A]">A/C No: </span>
                        <span className="break-words">{bankDetails.accountNumber}</span>
                      </span>
                      {bankDetails.iban ? (
                        <span className="min-w-0">
                          <span className="font-medium text-[#0F172A]">IBAN: </span>
                          <span className="break-all">{bankDetails.iban}</span>
                        </span>
                      ) : null}
                      {bankDetails.instructions ? (
                        <span className="whitespace-pre-line rounded-lg border border-[#BFDBFE] bg-white px-3 py-2 text-xs leading-5 text-slate-600 sm:col-span-2">
                          {bankDetails.instructions}
                        </span>
                      ) : null}
                    </span>
                  )}
                </span>
              </label>
            )) : (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                No payment methods are currently available. Please contact Phonics Club.
              </p>
            )}
          </div>

          <p className="rounded-lg bg-[#EFF6FF] px-4 py-3 text-sm text-slate-600">
            Having issue with payment? Contact us at{' '}
            {supportPhoneLinks.map((phone, index) => (
              <span key={phone.href}>
                {index ? ' or ' : null}
                <a href={phone.href} className="font-semibold text-[#1D4ED8] underline underline-offset-4">{phone.display}</a>
              </span>
            ))}
            .
          </p>

          {receiptRequired && (
            <div className="space-y-4 rounded-lg bg-muted/50 p-4 text-sm">
              <p className="font-semibold">Payment receipt</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-lg border bg-background p-3 ${
                    receiptTiming === 'later' ? 'border-[#1D4ED8] text-[#1D4ED8]' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="receiptChoice"
                    value="later"
                    checked={receiptTiming === 'later'}
                    onChange={() => setReceiptTiming('later')}
                    className="sr-only"
                  />
                  <span className="block font-semibold">Upload later</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Order stays pending payment until receipt is submitted.</span>
                </label>
                <label
                  className={`cursor-pointer rounded-lg border bg-background p-3 ${
                    receiptTiming === 'now' ? 'border-[#1D4ED8] text-[#1D4ED8]' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="receiptChoice"
                    value="now"
                    checked={receiptTiming === 'now'}
                    onChange={() => setReceiptTiming('now')}
                    className="sr-only"
                  />
                  <span className="block font-semibold">Upload now</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Attach JPG, PNG, or PDF proof before placing the order.</span>
                </label>
              </div>

              {receiptTiming === 'now' && (
                <div className="space-y-2">
                  <Label htmlFor="receipt">Payment Receipt *</Label>
                  <Input
                    id="receipt"
                    name="receipt"
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="rounded-lg"
                    required={receiptDueNow}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <aside className="min-w-0 h-fit rounded-lg border bg-card p-4 sm:p-6 lg:sticky lg:top-24">
        <div className="mb-5">
          <p className="text-sm font-semibold text-[#1D4ED8]">Invoice Preview</p>
          <h2 className="mt-1 text-2xl font-bold">Order review</h2>
        </div>

        {reviewReady ? (
          <InvoicePreview
            details={details}
            cartItems={checkoutItems}
            totalQuantity={checkoutQuantityTotal}
            subtotal={checkoutSubtotal}
            shipping={shipping}
            shippingDiscount={shippingDiscount}
            couponDiscount={couponDiscount}
            couponCode={previewCouponCode}
            couponDiscountPercent={couponPreview?.valid ? couponPreview.couponDiscountPercent : undefined}
            memberDiscount={memberDiscount}
            memberId={previewMemberId}
            memberDiscountPercent={couponPreview?.valid ? couponPreview.memberDiscountPercent : undefined}
            totalDiscount={totalDiscount}
            payableTotal={payableTotal}
            paymentMethod={paymentMethod}
            receiptTiming={receiptTiming}
          />
        ) : (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            Your invoice preview will appear here after checkout details pass validation.
          </div>
        )}

        <div className="mt-6 space-y-3 border-t pt-5">
          {reviewReady ? (
            <>
              <Button
                type="submit"
                disabled={pending || hasUnavailableCheckoutItems}
                onMouseEnter={handleEvasiveConfirmHover}
                aria-describedby={validationIssue ? 'checkout-validation-guidance' : undefined}
                style={confirmButtonStyle}
                className="w-full rounded-lg bg-[#D30000] transition-transform duration-200 hover:bg-[#D30000]/90 motion-reduce:transform-none"
              >
                {pending ? 'Placing order...' : 'Place Order'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-lg"
                onClick={() => setReviewReady(false)}
              >
                Back to Edit
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onMouseEnter={handleEvasiveConfirmHover}
              onClick={showInvoicePreview}
              disabled={!checkoutItems.length || hasUnavailableCheckoutItems}
              aria-describedby={validationIssue ? 'checkout-validation-guidance' : undefined}
              style={confirmButtonStyle}
              className="w-full rounded-lg bg-[#1D4ED8] transition-transform duration-200 motion-reduce:transform-none"
            >
              Next: Review Invoice
            </Button>
          )}
          <p className="text-center text-xs text-muted-foreground">
            {currency === 'USD'
              ? `Your prices are displayed in USD. Payment will be processed in PKR using 1 USD = ${settings.usdToPkrRate.toLocaleString('en-PK')} PKR.`
              : 'If an email is provided, the invoice is also sent to the inbox.'}
          </p>
        </div>
      </aside>
    </form>
  )
}

function InvoicePreview({
  details,
  cartItems,
  totalQuantity,
  subtotal,
  shipping,
  shippingDiscount,
  couponDiscount,
  couponCode,
  couponDiscountPercent,
  memberDiscount,
  memberId,
  memberDiscountPercent,
  totalDiscount,
  payableTotal,
  paymentMethod,
  receiptTiming,
}: {
  details: CheckoutDetails
  cartItems: CheckoutItem[]
  totalQuantity: number
  subtotal: number
  shipping: number
  shippingDiscount: number
  couponDiscount: number
  couponCode?: string
  couponDiscountPercent?: number
  memberDiscount: number
  memberId?: string | null
  memberDiscountPercent?: number
  totalDiscount: number
  payableTotal: number
  paymentMethod: ShopPaymentMethod
  receiptTiming: 'now' | 'later'
}) {
  const { currency, format } = useCurrency()
  return (
    <div className="space-y-5 text-sm">
      <div className="rounded-lg bg-[#1D4ED8] p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">Phonics Club</p>
        <p className="mt-2 text-xl font-bold">Draft invoice</p>
        <p className="mt-1 text-blue-100">Final invoice number is assigned after order placement.</p>
      </div>

      <div className="space-y-1">
        <p className="font-semibold">{details.fullName}</p>
        {details.email ? <p className="text-muted-foreground">{details.email}</p> : null}
        <p className="text-muted-foreground">{details.phone}</p>
        <p className="text-muted-foreground">
          {[details.address, details.city, details.zip, 'Pakistan'].filter(Boolean).join(', ')}
        </p>
      </div>

      <div>
        <p className="mb-2 font-semibold">Ordered items</p>
        <ul className="space-y-2">
          {cartItems.map((item, index) => (
            <li key={`${item.name}-${item.quantity}-${index}`} className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 sm:flex-row sm:justify-between">
              <span className="flex min-w-0 gap-2">
                <span className="font-mono text-xs font-semibold text-slate-500">{index + 1}.</span>
                <span className="min-w-0">
                <span className="block break-words font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.quantity} x {format(item.price)}
                </span>
                {item.stock_note ? (
                  <span className="mt-1 block text-xs font-medium text-amber-700">{item.stock_note}</span>
                ) : null}
                </span>
              </span>
              <span className="shrink-0 text-right font-semibold">{format(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between"><span>Total quantity</span><span>{totalQuantity}</span></div>
        <div className="flex justify-between"><span>Subtotal</span><span>{format(subtotal)}</span></div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="text-right">
            {shippingDiscount > 0 ? (
              <>
                <span className="block font-semibold">Free</span>
                <span className="block text-xs text-muted-foreground">was {format(shipping)}</span>
              </>
            ) : (
              format(shipping)
            )}
          </span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-[#D30000]">
            <span>
              Coupon{couponCode ? ` (${couponCode})` : ''}
              {couponDiscountPercent ? ` ${couponDiscountPercent}%` : ''}
            </span>
            <span>-{format(couponDiscount)}</span>
          </div>
        )}
        {memberDiscount > 0 && (
          <div className="flex justify-between text-[#D30000]">
            <span>
              Member ID{memberId ? ` (${memberId})` : ''}
              {memberDiscountPercent ? ` ${memberDiscountPercent}%` : ''}
            </span>
            <span>-{format(memberDiscount)}</span>
          </div>
        )}
        {couponDiscount > 0 && memberDiscount > 0 && (
          <div className="flex justify-between text-sm font-semibold text-muted-foreground">
            <span>Total discount</span>
            <span>-{format(totalDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold text-[#1D4ED8]">
          <span>Total</span>
          <span className="text-right">
            <span className="block">{format(payableTotal)}</span>
            {currency === 'USD' ? (
              <span className="mt-1 block text-xs font-medium text-muted-foreground">
                ≈ {formatCurrency(payableTotal, 'PKR', { freeLabel: false, useCode: true })}
              </span>
            ) : null}
          </span>
        </div>
        <CurrencyDisplayNotice />
        <p className="text-xs text-muted-foreground">Final discount validation happens when the order is placed.</p>
      </div>

      <div className="rounded-lg border p-3">
        <p className="font-semibold">Payment</p>
        <p className="mt-1 text-muted-foreground">{shopPaymentLabel(paymentMethod)}</p>
        {paymentMethod !== 'cod' && (
          <p className="mt-1 text-xs text-muted-foreground">
            Receipt: {receiptTiming === 'now' ? 'attached before order placement' : 'will be uploaded later'}
          </p>
        )}
      </div>
    </div>
  )
}
