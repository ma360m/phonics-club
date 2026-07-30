'use client'

import { useActionState } from 'react'
import { upsertMemberDiscountAction } from '@/actions/admin/member-discounts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false }

export function MemberDiscountForm() {
  const [state, formAction, pending] = useActionState(upsertMemberDiscountAction, initialState)

  return (
    <form action={formAction} className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold">Create or Update Member ID</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Member IDs apply a percentage discount at checkout and can be limited by number of uses.
        </p>
      </div>

      {state.error && <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Member ID saved.</p>}

      <div className="grid gap-4 md:grid-cols-5">
        <label className="space-y-2 md:col-span-2">
          <Label>Member ID</Label>
          <Input name="member_id" placeholder="LHR-SS-0001-OP" className="rounded-xl font-mono uppercase" required />
        </label>
        <label className="space-y-2">
          <Label>Discount Percent</Label>
          <Input name="discount_percent" type="number" min={1} max={100} step={1} placeholder="10" className="rounded-xl" required />
        </label>
        <label className="space-y-2">
          <Label>Max Uses</Label>
          <Input name="max_uses" type="number" min={1} step={1} placeholder="Unlimited" className="rounded-xl" />
        </label>
        <label className="space-y-2">
          <Label>Expires</Label>
          <Input name="expires_at" type="date" className="rounded-xl" />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked />
          Active
        </label>
        <Button type="submit" disabled={pending} className="rounded-xl bg-[#1D4ED8]">
          {pending ? 'Saving...' : 'Save Member ID'}
        </Button>
      </div>
    </form>
  )
}
