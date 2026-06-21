'use client'

import { useActionState } from 'react'
import { createCouponAction } from '@/actions/admin/coupons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionResult } from '@/types'

const initial: ActionResult = { success: false }

export function CouponForm() {
  const [state, formAction, pending] = useActionState(createCouponAction, initial)

  return (
    <form action={formAction} className="max-w-md space-y-4 bg-card rounded-2xl border p-6">
      {state.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state.success && <p className="text-emerald-600 text-sm">Coupon created!</p>}
      <div className="space-y-2">
        <Label>Code</Label>
        <Input name="code" required placeholder="PHONICS30" className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input name="description" className="rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Discount %</Label>
          <Input name="discount_percent" type="number" min={0} max={100} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Max Uses</Label>
          <Input name="max_uses" type="number" className="rounded-xl" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked /> Active
      </label>
      <Button type="submit" disabled={pending} className="rounded-xl bg-[#1D4ED8] w-full">
        {pending ? 'Creating...' : 'Create Coupon'}
      </Button>
    </form>
  )
}
