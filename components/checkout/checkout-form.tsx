'use client'

import { useActionState, useState, useEffect } from 'react'
import Link from 'next/link'
import { placeOrderAction } from '@/actions/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SHIPPING_FEE_PKR } from '@/lib/commerce'
import { formatPrice } from '@/utils/format'
import type { ActionResult } from '@/types'
import { getGuestCart } from '@/lib/guest-cart-client'

const initialState: ActionResult = { success: false }

interface BankDetails {
  bankName: string
  accountTitle: string
  accountNumber: string
  iban: string
  instructions: string
}

export function CheckoutForm({
  subtotal,
  email,
  bankDetails,
  isGuest = false,
}: {
  subtotal: number
  email?: string
  bankDetails: BankDetails
  isGuest?: boolean
}) {
  const [state, formAction, pending] = useActionState(placeOrderAction, initialState)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'credit'>('cod')
  const [showMemberHelp, setShowMemberHelp] = useState(false)
  const [guestCartJson, setGuestCartJson] = useState('')

  useEffect(() => {
    if (isGuest) setGuestCartJson(JSON.stringify(getGuestCart()))
  }, [isGuest])

  const shipping = SHIPPING_FEE_PKR
  const grandTotal = subtotal + shipping

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-4 bg-card rounded-2xl border p-6">
      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">{state.error}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input id="fullName" name="fullName" required className="rounded-xl" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" required defaultValue={email} placeholder="you@email.com" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (Pakistan) *</Label>
          <Input id="phone" name="phone" type="tel" required placeholder="0300 8079480 or +92 300 8079480" className="rounded-xl" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input id="address" name="address" required className="rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input id="city" name="city" required defaultValue="Lahore" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">Postal Code</Label>
          <Input id="zip" name="zip" className="rounded-xl" />
        </div>
      </div>
      <input type="hidden" name="country" value="Pakistan" />
      {isGuest && <input type="hidden" name="guestCart" value={guestCartJson} />}

      <div className="border-t pt-4 space-y-3">
        <Label>Coupon / Member ID</Label>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input name="couponCode" placeholder="Coupon code" className="rounded-xl" />
          <div>
            <Input name="memberId" placeholder="Member ID (optional)" className="rounded-xl" />
            <button
              type="button"
              className="text-xs text-[#1D4ED8] mt-1 hover:underline"
              onClick={() => setShowMemberHelp(!showMemberHelp)}
            >
              Don&apos;t know your Member ID?
            </button>
          </div>
        </div>
        {showMemberHelp && (
          <p className="text-sm bg-muted p-3 rounded-xl">
            Contact us to get your Member ID:{' '}
            <Link href="/contact" className="text-[#1D4ED8] font-medium hover:underline">Contact Us</Link>
          </p>
        )}
      </div>

      <div className="border-t pt-4 space-y-3">
        <Label>Payment Method *</Label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={`border rounded-xl p-4 cursor-pointer ${paymentMethod === 'cod' ? 'border-[#1D4ED8] bg-[#1D4ED8]/5' : ''}`}>
            <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="mr-2" />
            Cash on Delivery
          </label>
          <label className={`border rounded-xl p-4 cursor-pointer ${paymentMethod === 'credit' ? 'border-[#1D4ED8] bg-[#1D4ED8]/5' : ''}`}>
            <input type="radio" name="paymentMethod" value="credit" checked={paymentMethod === 'credit'} onChange={() => setPaymentMethod('credit')} className="mr-2" />
            Bank Transfer / Credit
          </label>
        </div>

        {paymentMethod === 'credit' && (
          <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-2">
            <p className="font-semibold">Bank Account Details</p>
            <p>Bank: {bankDetails.bankName}</p>
            <p>Account: {bankDetails.accountTitle}</p>
            <p>A/C No: {bankDetails.accountNumber}</p>
            <p>IBAN: {bankDetails.iban}</p>
            <p className="text-muted-foreground">{bankDetails.instructions}</p>
            <div className="space-y-2 pt-2">
              <Label htmlFor="receipt">Upload Payment Receipt *</Label>
              <Input id="receipt" name="receipt" type="file" accept="image/*,.pdf" className="rounded-xl" required={paymentMethod === 'credit'} />
            </div>
            <p className="text-xs text-amber-700">Order will be processed after admin confirms your payment.</p>
          </div>
        )}
      </div>

      <div className="border-t pt-4 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div className="flex justify-between"><span>Shipping (fixed)</span><span>{formatPrice(shipping)}</span></div>
        <p className="text-xs text-muted-foreground pt-1">
          Phonics Club reserves the right to adjust shipping fees based on quantity, distance, and product weight.
        </p>
        <div className="flex justify-between text-lg font-bold text-[#1D4ED8] pt-2">
          <span>Total</span><span>{formatPrice(grandTotal)}</span>
        </div>
        <p className="text-xs text-muted-foreground">Coupon discounts applied at order placement.</p>
      </div>

      <Button type="submit" disabled={pending} className="w-full rounded-xl bg-[#D30000] hover:bg-[#D30000]/90">
        {pending ? 'Placing order...' : 'Place Order'}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        A confirmation email with your invoice will be sent to your email address.
      </p>
    </form>
  )
}
