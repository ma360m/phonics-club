'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { requestPasswordResetAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false }

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      {state.success && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          If this email exists, a password reset link has been sent.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="you@example.com" className="rounded-xl" />
      </div>
      <div className="rounded-2xl border bg-muted/30 p-4">
        <p className="text-sm font-semibold">Verification details</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Enter at least one detail you remember. If we have matching order records, these details help protect your reset request.
        </p>
        <div className="mt-4 grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" name="phone" placeholder="Phone used on your account or order" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City or location</Label>
            <Input id="city" name="city" placeholder="City from your last order" className="rounded-xl" />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <div className="space-y-2">
              <Label htmlFor="lastOrderItem">Last order item</Label>
              <Input id="lastOrderItem" name="lastOrderItem" placeholder="Example: Pupil Book 1" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastOrderQuantity">Qty</Label>
              <Input id="lastOrderQuantity" name="lastOrderQuantity" type="number" min={1} placeholder="1" className="rounded-xl" />
            </div>
          </div>
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-full rounded-xl bg-[#1D4ED8]">
        {pending ? 'Sending...' : 'Send Reset Link'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Remembered your password?{' '}
        <Link href="/auth/login" className="font-medium text-[#1D4ED8] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
