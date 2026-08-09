'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  submitCoursePaymentReceiptFormAction,
  unlockCourseWithLicenseKeyFormAction,
} from '@/actions/lms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionResult } from '@/types'

const initialState: ActionResult<{ redirectTo?: string }> = { success: false }

export function CoursePaymentReceiptForm({
  paymentId,
  redirectTo,
}: {
  paymentId: string
  redirectTo?: string
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(submitCoursePaymentReceiptFormAction, initialState)

  useEffect(() => {
    if (!state.success) return
    toast.success('Payment screenshot submitted. Admin will review it before issuing the licence key.')
    router.refresh()
  }, [router, state.success])

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-4">
      <input type="hidden" name="payment_id" value={paymentId} />
      {redirectTo && <input type="hidden" name="redirect_to" value={redirectTo} />}

      {state.error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          Screenshot received. Your course remains locked until admin confirms the payment and sends your licence key.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="course-transaction-reference">Transaction reference</Label>
          <Input
            id="course-transaction-reference"
            name="transaction_reference"
            placeholder="Bank slip / transfer reference"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-payment-receipt">Payment screenshot *</Label>
          <Input
            id="course-payment-receipt"
            name="receipt"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            className="rounded-xl"
          />
        </div>
      </div>

      <p className="text-xs leading-5 text-slate-500">
        Upload a clear JPG, PNG, WebP, or PDF screenshot/receipt up to 10 MB.
      </p>

      <Button type="submit" disabled={pending || state.success} className="w-full rounded-xl bg-[#1D4ED8]">
        {pending ? 'Submitting...' : state.success ? 'Screenshot Submitted' : 'Submit Payment Screenshot'}
      </Button>
    </form>
  )
}

export function CourseLicenseUnlockForm({
  paymentId,
}: {
  paymentId: string
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(unlockCourseWithLicenseKeyFormAction, initialState)

  useEffect(() => {
    if (!state.success) return
    toast.success('Licence key accepted. Course unlocked.')
    router.push(state.data?.redirectTo ?? '/dashboard/my-courses')
  }, [router, state.data?.redirectTo, state.success])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="payment_id" value={paymentId} />

      {state.error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="course-license-key">Licence key *</Label>
        <Input
          id="course-license-key"
          name="license_key"
          placeholder="PC-2026-XXXX-XXXX-XXXX"
          required
          className="rounded-xl font-mono uppercase tracking-wide"
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700">
        {pending ? 'Checking Key...' : 'Unlock Course'}
      </Button>
    </form>
  )
}
