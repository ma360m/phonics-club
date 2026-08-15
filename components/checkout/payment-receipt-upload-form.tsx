'use client'

import { useActionState } from 'react'
import { submitOrderReceiptAction } from '@/actions/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionResult } from '@/types'
import type { ContactPhoneLink } from '@/lib/contact-settings'

const initialState: ActionResult = { success: false }

export function PaymentReceiptUploadForm({
  orderId,
  token,
  supportPhoneLinks = [],
}: {
  orderId: string
  token?: string
  supportPhoneLinks?: ContactPhoneLink[]
}) {
  const [state, formAction, pending] = useActionState(submitOrderReceiptAction, initialState)

  return (
    <form action={formAction} className="mt-8 rounded-2xl border bg-card p-5 text-left shadow-sm">
      <input type="hidden" name="orderId" value={orderId} />
      {token && <input type="hidden" name="token" value={token} />}
      <input type="hidden" name="paymentMethod" value="bank_transfer" />

      <h2 className="text-lg font-bold">Upload Payment Receipt</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload your bank transfer receipt here.
      </p>
      <p className="mt-3 rounded-xl bg-[#EFF6FF] px-3 py-2 text-sm text-slate-600">
        Having issue with payment? Contact us at{' '}
        {supportPhoneLinks.map((phone, index) => (
          <span key={phone.href}>
            {index ? ' or ' : null}
            <a href={phone.href} className="font-semibold text-[#1D4ED8] underline underline-offset-4">{phone.display}</a>
          </span>
        ))}
        .
      </p>

      {state.error && (
        <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state.success && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          Receipt uploaded. Your order is now marked as payment submitted.
        </p>
      )}

      <div className="mt-4 rounded-xl border border-[#1D4ED8] bg-[#1D4ED8]/5 px-4 py-3 text-center text-sm font-semibold text-[#1D4ED8]">
        Bank Transfer
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="late-receipt">Receipt file *</Label>
        <Input
          id="late-receipt"
          name="receipt"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          required
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground">Accepted: JPG, PNG, or PDF up to 10 MB.</p>
      </div>

      <Button type="submit" disabled={pending || state.success} className="mt-4 w-full rounded-xl bg-[#1D4ED8]">
        {pending ? 'Uploading...' : state.success ? 'Receipt Uploaded' : 'Submit Receipt'}
      </Button>
    </form>
  )
}
