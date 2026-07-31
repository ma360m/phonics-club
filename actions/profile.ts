'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getProfile, requireAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import type { ActionResult } from '@/types'

const passwordPattern = {
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  number: /[0-9]/,
}

const profileSettingsSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(120, 'Full name is too long.'),
  username: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .refine((value) => value === '' || /^[a-z0-9_]{3,30}$/.test(value), {
      message: 'Username must be 3-30 characters using lowercase letters, numbers, or underscores.',
    }),
})

const signedInPasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Enter your current password.'),
  password: z
    .string()
    .min(8, 'New password must be at least 8 characters.')
    .regex(passwordPattern.lowercase, 'New password must include a lowercase letter.')
    .regex(passwordPattern.uppercase, 'New password must include an uppercase letter.')
    .regex(passwordPattern.number, 'New password must include a number.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})

export async function updateProfileSettingsAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth('/auth/login?redirect=/dashboard/profile')
  const parsed = profileSettingsSchema.safeParse({
    fullName: formData.get('fullName'),
    username: formData.get('username') ?? '',
  })

  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const supabase = await createClient()
  const username = parsed.data.username || null

  if (username) {
    const { data: existing, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .neq('id', user.id)
      .maybeSingle()

    if (lookupError) return { success: false, error: 'Username could not be checked right now.' }
    if (existing?.id) return { success: false, error: 'That username is already taken.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      username,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { success: false, error: 'Profile could not be updated.' }

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateSignedInPasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAuth('/auth/login?redirect=/dashboard/profile')
  const profile = await getProfile()
  const parsed = signedInPasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }
  if (!profile?.email) return { success: false, error: 'Your account email could not be verified.' }

  const rl = rateLimit(`profile-password:${user.id}`, 5, 60_000)
  if (!rl.success) return { success: false, error: 'Too many password attempts. Try again later.' }

  const supabase = await createClient()
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: parsed.data.currentPassword,
  })

  if (verifyError) return { success: false, error: 'Current password is incorrect.' }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { success: false, error: 'Password could not be changed right now.' }

  revalidatePath('/dashboard/profile')
  return { success: true }
}
