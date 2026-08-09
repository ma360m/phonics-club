'use client'

import { useActionState } from 'react'
import { Copy, Link2 } from 'lucide-react'
import { createFastInvoiceLinkAction } from '@/actions/fast-invoice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionResult } from '@/types'

const initialState: ActionResult<{ url: string }> = { success: false }

export function FastInvoiceLinkForm() {
  const [state, formAction, pending] = useActionState(createFastInvoiceLinkAction, initialState)
  const url = state.data?.url ?? ''

  async function copyUrl() {
    if (!url) return
    await navigator.clipboard.writeText(url)
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold text-[#1D4ED8]">Private Link</p>
        <h2 className="mt-1 text-xl font-bold">Create fast invoice link</h2>
      </div>

      <form action={formAction} className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="fast-label">Label</Label>
          <Input id="fast-label" name="label" placeholder="School order / Member invoice" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fast-email">Recipient Email</Label>
          <Input id="fast-email" name="recipientEmail" type="email" placeholder="Optional" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fast-member">Required Member ID</Label>
          <Input id="fast-member" name="requiredMemberId" placeholder="Optional" className="rounded-xl font-mono" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="fast-days">Days</Label>
            <Input id="fast-days" name="expiresInDays" type="number" min={1} max={365} defaultValue={30} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fast-uses">Uses</Label>
            <Input id="fast-uses" name="maxUses" type="number" min={1} max={500} defaultValue={1} className="rounded-xl" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <Button type="submit" disabled={pending} className="rounded-xl bg-[#1D4ED8]">
            <Link2 className="h-4 w-4" />
            {pending ? 'Creating...' : 'Create Link'}
          </Button>
        </div>
      </form>

      {state.error ? <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}
      {url ? (
        <div className="mt-4 rounded-xl border bg-muted/40 p-3">
          <p className="mb-2 text-sm font-semibold text-emerald-700">Fast invoice link ready</p>
          <div className="flex min-w-0 gap-2">
            <input readOnly value={url} className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm" />
            <Button type="button" variant="outline" className="rounded-lg" onClick={copyUrl}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
