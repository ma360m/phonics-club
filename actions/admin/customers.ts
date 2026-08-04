'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { APP_URL } from '@/lib/constants'

const emailSchema = z.string().trim().email()

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? APP_URL).replace(/\/$/, '')
}

function customersNotice(type: 'message' | 'error', value: string) {
  return `/admin/customers?${type}=${encodeURIComponent(value)}`
}

export async function sendCustomerPasswordResetAction(email: string) {
  await requireAdmin()
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) redirect(customersNotice('error', 'Customer email is not valid.'))

  const normalizedEmail = parsed.data.toLowerCase()
  const rl = rateLimit(`admin-customer-password-reset:${normalizedEmail}`, 5, 60_000)
  if (!rl.success) redirect(customersNotice('error', 'Too many reset emails. Try again later.'))

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${appBaseUrl()}/auth/callback?next=/auth/reset-password`,
  })

  if (error) redirect(customersNotice('error', 'Password reset email could not be sent.'))
  redirect(customersNotice('message', `Password reset email sent to ${normalizedEmail}.`))
}
