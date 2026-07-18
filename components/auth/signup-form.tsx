'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signupAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/auth/password-input'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false }

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">{state.error}</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" name="fullName" required className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={8}
          pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
          title="Use at least 8 characters with uppercase, lowercase, and a number."
          autoComplete="new-password"
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground">Use at least 8 characters with uppercase, lowercase, and a number.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <PasswordInput id="confirmPassword" name="confirmPassword" required autoComplete="new-password" className="rounded-xl" />
      </div>
      <Button type="submit" disabled={pending} className="w-full rounded-xl bg-[#D30000] hover:bg-[#D30000]/90">
        {pending ? 'Creating account...' : 'Create Account'}
      </Button>
      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-[#1D4ED8] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
