'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { placeOrderAction } from '@/actions/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SHIPPING_FEE_PKR } from '@/lib/commerce'
import { shopPaymentLabel, shopPaymentNeedsReceipt, type ShopPaymentMethod } from '@/lib/payment-methods'
import type { ActionResult } from '@/types'
import { getGuestCart } from '@/lib/guest-cart-client'
import { CurrencyDisplayNotice } from '@/components/currency/price-display'
import { useCurrency } from '@/components/currency/currency-provider'
import { formatCurrency } from '@/lib/currency'

const initialState: ActionResult = { success: false }

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
  name: string
  price: number
  quantity: number
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
  subtotalAfterDiscount?: number
  error?: string
}

export function CheckoutForm({
  subtotal,
  cartItems,
  email,
  bankDetails,
  isGuest = false,
  paymentOptions,
}: {
  subtotal: number
  cartItems: CheckoutItem[]
  email?: string
  bankDetails: BankDetails
  isGuest?: boolean
  paymentOptions: PaymentOption[]
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

  useEffect(() => {
    if (isGuest) setGuestCartJson(JSON.stringify(getGuestCart()))
  }, [isGuest])

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
          body: JSON.stringify({ code: code || undefined, memberId: member || undefined, subtotal }),
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
  }, [couponCode, memberId, subtotal])

  const shipping = SHIPPING_FEE_PKR
  const grandTotal = subtotal + shipping
  const couponDiscount = couponPreview?.valid ? couponPreview.couponDiscount ?? couponPreview.discount ?? 0 : 0
  const memberDiscount = couponPreview?.valid ? couponPreview.memberDiscount ?? 0 : 0
  const totalDiscount = couponPreview?.valid ? couponPreview.discount ?? couponDiscount + memberDiscount : 0
  const payableTotal = Math.max(0, grandTotal - totalDiscount)
  const previewCouponCode = couponPreview?.valid ? couponPreview.code ?? couponCode.trim().toUpperCase() : undefined
  const previewMemberId = couponPreview?.valid ? couponPreview.memberId ?? memberId.trim().toUpperCase() : undefined
  const receiptRequired = shopPaymentNeedsReceipt(paymentMethod)
  const receiptDueNow = receiptRequired && receiptTiming === 'now'

  function updateDetails(field: keyof CheckoutDetails, value: string) {
    setDetails((current) => ({ ...current, [field]: value }))
  }

  function showInvoicePreview() {
    const form = formRef.current
    if (!form) return
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }
    setReviewReady(true)
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      encType="multipart/form-data"
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,430px)]"
    >
      <section className="space-y-5 rounded-lg border bg-card p-6">
        {state.error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
        )}

        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            name="fullName"
            required
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
              placeholder="you@email.com"
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
            value={details.address}
            onChange={(event) => updateDetails('address', event.target.value)}
            className="rounded-lg"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              name="city"
              required
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
              onChange={(event) => setCouponCode(event.target.value)}
              className="rounded-lg"
            />
            <div>
              <Input
                name="memberId"
                placeholder="Member ID (optional)"
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
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
                  ? totalDiscount > 0
                    ? `Discount applied: ${[
                        couponDiscount > 0 && previewCouponCode ? `coupon ${previewCouponCode} ${format(couponDiscount)}` : null,
                        memberDiscount > 0 && previewMemberId ? `Member ID ${previewMemberId} ${format(memberDiscount)}` : null,
                      ].filter(Boolean).join(' + ')}. Estimated total: ${format(payableTotal)}.`
                    : 'Discount code is valid but does not reduce this order.'
                  : couponPreview?.error ?? 'Coupon could not be checked.'}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Enter a coupon code or Member ID to preview the discount before reviewing your invoice.</p>
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
                <span>
                  <span className="block font-semibold">{option.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{option.description}</span>
                </span>
              </label>
            )) : (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                No payment methods are currently available. Please contact Phonics Club.
              </p>
            )}
          </div>

          <p className="rounded-lg bg-[#EFF6FF] px-4 py-3 text-sm text-[#1D4ED8]">
            Having issue with payment? Contact us at{' '}
            <a href="tel:+923084432015" className="font-semibold underline underline-offset-4">0308 4432015</a>
            {' '}or{' '}
            <a href="tel:03008079480" className="font-semibold underline underline-offset-4">0300 8079480</a>.
          </p>

          {receiptRequired && (
            <div className="space-y-4 rounded-lg bg-muted/50 p-4 text-sm">
              <div className="space-y-2">
                <p className="font-semibold">
                  {paymentMethod === 'bank_transfer' ? 'Bank Account Details' : `${paymentOptions.find((option) => option.value === paymentMethod)?.title} Details`}
                </p>
                <p>Bank: {bankDetails.bankName}</p>
                <p>Account: {bankDetails.accountTitle}</p>
                <p>A/C No: {bankDetails.accountNumber}</p>
                {bankDetails.iban ? <p>IBAN: {bankDetails.iban}</p> : null}
                <p className="text-muted-foreground">{bankDetails.instructions}</p>
              </div>

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

      <aside className="h-fit rounded-lg border bg-card p-6 lg:sticky lg:top-24">
        <div className="mb-5">
          <p className="text-sm font-semibold text-[#1D4ED8]">Invoice Preview</p>
          <h2 className="mt-1 text-2xl font-bold">Order review</h2>
        </div>

        {reviewReady ? (
          <InvoicePreview
            details={details}
            cartItems={cartItems}
            subtotal={subtotal}
            shipping={shipping}
            couponDiscount={couponDiscount}
            couponCode={previewCouponCode}
            memberDiscount={memberDiscount}
            memberId={previewMemberId}
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
                disabled={pending}
                className="w-full rounded-lg bg-[#D30000] hover:bg-[#D30000]/90"
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
            <Button type="button" onClick={showInvoicePreview} className="w-full rounded-lg bg-[#1D4ED8]">
              Next: Review Invoice
            </Button>
          )}
          <p className="text-center text-xs text-muted-foreground">
            {currency === 'USD'
              ? `Your prices are displayed in USD. Payment will be processed in PKR using 1 USD = ${settings.usdToPkrRate.toLocaleString('en-PK')} PKR.`
              : 'Confirmation emails with the invoice are sent to the customer and admin.'}
          </p>
        </div>
      </aside>
    </form>
  )
}

function InvoicePreview({
  details,
  cartItems,
  subtotal,
  shipping,
  couponDiscount,
  couponCode,
  memberDiscount,
  memberId,
  totalDiscount,
  payableTotal,
  paymentMethod,
  receiptTiming,
}: {
  details: CheckoutDetails
  cartItems: CheckoutItem[]
  subtotal: number
  shipping: number
  couponDiscount: number
  couponCode?: string
  memberDiscount: number
  memberId?: string | null
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
        <p className="text-muted-foreground">{details.email}</p>
        <p className="text-muted-foreground">{details.phone}</p>
        <p className="text-muted-foreground">
          {[details.address, details.city, details.zip, 'Pakistan'].filter(Boolean).join(', ')}
        </p>
      </div>

      <div>
        <p className="mb-2 font-semibold">Ordered items</p>
        <ul className="space-y-2">
          {cartItems.map((item) => (
            <li key={`${item.name}-${item.quantity}`} className="flex justify-between gap-3 rounded-lg bg-muted/50 p-3">
              <span>
                <span className="block font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.quantity} x {format(item.price)}
                </span>
              </span>
              <span className="font-semibold">{format(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between"><span>Subtotal</span><span>{format(subtotal)}</span></div>
        <div className="flex justify-between"><span>Shipping</span><span>{format(shipping)}</span></div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-[#D30000]">
            <span>Coupon{couponCode ? ` (${couponCode})` : ''}</span>
            <span>-{format(couponDiscount)}</span>
          </div>
        )}
        {memberDiscount > 0 && (
          <div className="flex justify-between text-[#D30000]">
            <span>Member ID{memberId ? ` (${memberId})` : ''}</span>
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
