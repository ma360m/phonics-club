'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from '@/lib/validations/auth'
import { rateLimit } from '@/lib/rate-limit'
import { APP_URL } from '@/lib/constants'
import type { ActionResult } from '@/types'

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? APP_URL).replace(/\/$/, '')
}

type PasswordResetVerification = {
  email: string
  phone?: string
  city?: string
  lastOrderItem?: string
  lastOrderQuantity?: number | null
}

type VerificationOrder = {
  phone?: string | null
  shipping_address?: Record<string, string> | null
  items?: { name?: string; quantity?: number }[] | null
  created_at?: string | null
}

function normalizeDigits(value?: string | null) {
  return String(value ?? '').replace(/\D/g, '')
}

function normalizeText(value?: string | null) {
  return String(value ?? '').trim().toLowerCase()
}

function hasMatchingPhone(order: VerificationOrder, phone: string) {
  const expected = normalizeDigits(phone)
  if (expected.length < 4) return false
  const address = order.shipping_address ?? {}
  return [order.phone, address.phone, address.mobile, address.customer_phone, address.customerPhone]
    .map((value) => normalizeDigits(value))
    .some((value) => value.endsWith(expected) || expected.endsWith(value))
}

function hasMatchingCity(order: VerificationOrder, city: string) {
  const expected = normalizeText(city)
  const address = order.shipping_address ?? {}
  return [address.city, address.town, address.location]
    .map(normalizeText)
    .some((value) => value === expected || value.includes(expected) || expected.includes(value))
}

function hasMatchingLastOrderItem(order: VerificationOrder, itemName: string, quantity?: number | null) {
  const expected = normalizeText(itemName)
  const items = Array.isArray(order.items) ? order.items : []
  return items.some((item) => {
    const itemMatches = normalizeText(item.name).includes(expected)
    const quantityMatches = !quantity || Number(item.quantity ?? 0) === quantity
    return itemMatches && quantityMatches
  })
}

async function verifyPasswordResetDetails(input: PasswordResetVerification) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return true

  const supabase = await createServiceClient()
  const email = input.email.trim().toLowerCase()
  const orders: VerificationOrder[] = []

  const { data: guestOrders, error: guestError } = await supabase
    .from('orders')
    .select('phone, shipping_address, items, created_at')
    .eq('guest_email', email)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!guestError) orders.push(...((guestOrders ?? []) as VerificationOrder[]))

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .limit(1)

  for (const profile of profiles ?? []) {
    const { data: userOrders, error } = await supabase
      .from('orders')
      .select('phone, shipping_address, items, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!error) orders.push(...((userOrders ?? []) as VerificationOrder[]))
  }

  if (!orders.length) return true

  const sortedOrders = [...orders].sort((a, b) => {
    const left = a.created_at ? new Date(a.created_at).getTime() : 0
    const right = b.created_at ? new Date(b.created_at).getTime() : 0
    return right - left
  })
  const latestOrder = sortedOrders[0]

  if (input.phone && !orders.some((order) => hasMatchingPhone(order, input.phone!))) return false
  if (input.city && !orders.some((order) => hasMatchingCity(order, input.city!))) return false
  if (input.lastOrderItem && !hasMatchingLastOrderItem(latestOrder, input.lastOrderItem, input.lastOrderQuantity)) return false
  if (!input.lastOrderItem && input.lastOrderQuantity) {
    const items = Array.isArray(latestOrder.items) ? latestOrder.items : []
    if (!items.some((item) => Number(item.quantity ?? 0) === input.lastOrderQuantity)) return false
  }

  return true
}

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
  const redirectTo = String(formData.get('redirect') ?? '/dashboard')
  redirect(redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/dashboard')
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
      emailRedirectTo: `${appBaseUrl()}/auth/callback`,
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

export async function requestPasswordResetAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
    phone: formData.get('phone'),
    city: formData.get('city'),
    lastOrderItem: formData.get('lastOrderItem'),
    lastOrderQuantity: formData.get('lastOrderQuantity') || null,
  })

  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const rl = rateLimit(`password-reset:${parsed.data.email}`, 3, 60_000)
  if (!rl.success) return { success: false, error: 'Too many reset requests. Try again later.' }

  const verified = await verifyPasswordResetDetails(parsed.data)
  if (!verified) return { success: false, error: 'We could not verify those details. Check the information and try again.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appBaseUrl()}/auth/callback?next=/auth/reset-password`,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updatePasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { success: false, error: error.message }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login?message=Password updated. Please sign in with your new password.')
}
