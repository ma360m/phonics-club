'use client'

import { useActionState, useState } from 'react'
import { submitOrderReceiptAction } from '@/actions/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionResult } from '@/types'
import type { ShopPaymentMethod } from '@/lib/payment-methods'

const initialState: ActionResult = { success: false }

const receiptPaymentOptions: Array<{ value: Exclude<ShopPaymentMethod, 'cod'>; label: string }> = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'EasyPaisa' },
]

export function PaymentReceiptUploadForm({
  orderId,
  token,
}: {
  orderId: string
  token?: string
}) {
  const [state, formAction, pending] = useActionState(submitOrderReceiptAction, initialState)
  const [paymentMethod, setPaymentMethod] = useState<Exclude<ShopPaymentMethod, 'cod'>>('bank_transfer')

  return (
    <form action={formAction} encType="multipart/form-data" className="mt-8 rounded-2xl border bg-card p-5 text-left shadow-sm">
      <input type="hidden" name="orderId" value={orderId} />
      {token && <input type="hidden" name="token" value={token} />}

      <h2 className="text-lg font-bold">Upload Payment Receipt</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        If you selected Cash on Delivery but paid by transfer, JazzCash, or EasyPaisa, upload the receipt here.
      </p>

      {state.error && (
        <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state.success && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          Receipt uploaded. Your order is now marked as payment submitted.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {receiptPaymentOptions.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium ${
              paymentMethod === option.value ? 'border-[#1D4ED8] bg-[#1D4ED8]/5 text-[#1D4ED8]' : 'hover:border-[#1D4ED8]/50'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={option.value}
              checked={paymentMethod === option.value}
              onChange={() => setPaymentMethod(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
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
