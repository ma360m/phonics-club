'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false }

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">{state.error}</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="you@example.com" className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required className="rounded-xl" />
      </div>
      <Button type="submit" disabled={pending} className="w-full rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
        {pending ? 'Signing in...' : 'Sign In'}
      </Button>
      <p className="text-sm text-center text-muted-foreground">
        No account?{' '}
        <Link href="/auth/signup" className="text-[#1D4ED8] font-medium hover:underline">
          Create one
        </Link>
      </p>
    </form>
  )
}
