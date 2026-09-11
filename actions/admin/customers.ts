'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { APP_URL } from '@/lib/constants'
import { normalizePhone } from '@/lib/validations/checkout'

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

export async function updateAdminCustomerAction(formData: FormData) {
  const admin = await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  const emailValue = String(formData.get('email') ?? '').trim().toLowerCase()
  const phoneValue = String(formData.get('phone') ?? '').trim()
  const memberId = String(formData.get('memberId') ?? '').trim()
  const address = String(formData.get('address') ?? '').trim()
  const city = String(formData.get('city') ?? '').trim()
  const zip = String(formData.get('zip') ?? '').trim()
  const country = String(formData.get('country') ?? 'Pakistan').trim() || 'Pakistan'
  const notes = String(formData.get('notes') ?? '').trim()
  const customerId = String(formData.get('customerId') ?? '').trim()
  const userId = String(formData.get('userId') ?? '').trim() || null

  if (name.length < 2 || name.length > 120) redirect(customersNotice('error', 'Customer name must be between 2 and 120 characters.'))
  if (emailValue && !emailSchema.safeParse(emailValue).success) redirect(customersNotice('error', 'Customer email is not valid.'))
  if (phoneValue.length < 3 || phoneValue.length > 40) redirect(customersNotice('error', 'Customer phone number is not valid.'))

  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? await createServiceClient() : await createClient()
  const payload = {
    name,
    email: emailValue || null,
    phone: normalizePhone(phoneValue),
    member_id: memberId || null,
    address: address || null,
    city: city || null,
    zip: zip || null,
    country,
    notes: notes || null,
    updated_by: admin.id,
  }

  let updateError: unknown = null
  if (/^[0-9a-f-]{36}$/i.test(customerId)) {
    const result = await supabase.from('admin_customers').update(payload as never).eq('id', customerId)
    updateError = result.error
  } else if (userId && /^[0-9a-f-]{36}$/i.test(userId)) {
    const existing = await supabase.from('admin_customers').select('id').eq('user_id', userId).maybeSingle()
    if (existing.data?.id) {
      const result = await supabase.from('admin_customers').update(payload as never).eq('id', existing.data.id)
      updateError = result.error
    } else {
      const result = await supabase.from('admin_customers').insert({ ...payload, user_id: userId, created_by: admin.id } as never)
      updateError = result.error
    }
  } else {
    const result = await supabase.from('admin_customers').insert({ ...payload, created_by: admin.id } as never)
    updateError = result.error
  }

  if (updateError) redirect(customersNotice('error', 'Customer details could not be updated.'))

  if (userId && /^[0-9a-f-]{36}$/i.test(userId)) {
    await supabase.from('profiles').update({ full_name: name, email: emailValue || undefined } as never).eq('id', userId)
    if (emailValue && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await supabase.auth.admin.updateUserById(userId, { email: emailValue, email_confirm: true })
    }
  }

  redirect(customersNotice('message', `${name}'s details were updated.`))
}
