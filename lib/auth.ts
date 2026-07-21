import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/types/database'

export async function getSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return data
}

export async function requireAuth(redirectTo = '/auth/login') {
  const user = await getSession()
  if (!user) redirect(redirectTo)
  return user
}

export async function requireAdmin() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }
  return profile
}

export function isLmsManagerRole(role: UserRole | null | undefined) {
  return role === 'admin' || role === 'instructor'
}

export async function requireLmsManager() {
  const profile = await getProfile()
  if (!profile || !isLmsManagerRole(profile.role)) {
    redirect('/dashboard')
  }
  return profile
}

export const requireAdminOrInstructor = requireLmsManager

export async function requireRole(role: UserRole) {
  const profile = await getProfile()
  if (!profile || profile.role !== role) {
    redirect('/dashboard')
  }
  return profile
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
