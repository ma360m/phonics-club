'use client'

import { useActionState } from 'react'
import { updatePasswordAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/auth/password-input'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false }

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <PasswordInput id="password" name="password" required autoComplete="new-password" className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <PasswordInput id="confirmPassword" name="confirmPassword" required autoComplete="new-password" className="rounded-xl" />
      </div>
      <Button type="submit" disabled={pending} className="w-full rounded-xl bg-[#1D4ED8]">
        {pending ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  )
}
