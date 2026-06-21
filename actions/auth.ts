'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema } from '@/lib/validations/auth'
import { rateLimit } from '@/lib/rate-limit'
import type { ActionResult } from '@/types'

export async function loginAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message }
  }

  const rl = rateLimit(`login:${parsed.data.email}`, 5, 60_000)
  if (!rl.success) return { success: false, error: 'Too many attempts. Try again later.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) return { success: false, error: error.message }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signupAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message }
  }

  const rl = rateLimit(`signup:${parsed.data.email}`, 3, 60_000)
  if (!rl.success) return { success: false, error: 'Too many attempts. Try again later.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { success: false, error: error.message }

  redirect('/auth/login?message=Check your email to confirm your account')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOutAction() {
  await logoutAction()
}
