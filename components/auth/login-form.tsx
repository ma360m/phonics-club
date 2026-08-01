'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction } from '@/actions/auth'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/auth/password-input'
import { COMPANY } from '@/lib/company'
import { Mail, MessageCircle, ShieldCheck } from 'lucide-react'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false }
const accountRecoveryHref = '/contact?topic=account-recovery'
const accountRecoveryWhatsappHref = `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(
  'Hello Phonics Club, I need help securing and resetting my account. My registered email is: ',
)}`

export type LoginNotice = {
  variant: 'success' | 'error' | 'recovery'
  title?: string
  message: string
}

export function LoginForm({
  redirectTo = '/dashboard',
  notice,
}: {
  redirectTo?: string
  notice?: LoginNotice
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectTo} />
      {notice && <LoginNoticeBanner notice={notice} />}
      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">{state.error}</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="you@example.com" className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">Password</Label>
          <Link href={accountRecoveryHref} className="text-sm font-medium text-[#1D4ED8] hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput id="password" name="password" required className="rounded-xl" />
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

function LoginNoticeBanner({ notice }: { notice: LoginNotice }) {
  if (notice.variant === 'recovery') {
    return (
      <Alert className="rounded-2xl border-amber-200 bg-amber-50 text-amber-950">
        <ShieldCheck className="h-4 w-4 text-amber-600" />
        <AlertTitle>{notice.title ?? 'Admin-assisted recovery'}</AlertTitle>
        <AlertDescription className="text-amber-900">
          <p>{notice.message}</p>
          <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row">
            <Button asChild size="sm" className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
              <Link href={accountRecoveryHref}>
                <Mail className="h-4 w-4" />
                Contact support
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-xl border-amber-300 bg-white">
              <a href={accountRecoveryWhatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  const isSuccess = notice.variant === 'success'

  return (
    <Alert
      className={
        isSuccess
          ? 'rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-950'
          : 'rounded-2xl border-destructive/30 bg-destructive/10 text-destructive'
      }
    >
      <AlertTitle>{notice.title ?? (isSuccess ? 'Success' : 'Sign-in help')}</AlertTitle>
      <AlertDescription className={isSuccess ? 'text-emerald-900' : 'text-destructive'}>
        <p>{notice.message}</p>
      </AlertDescription>
    </Alert>
  )
}
