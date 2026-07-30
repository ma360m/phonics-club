import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import {
  expireSupabaseAuthCookies,
  getSupabaseAuthCookieNames,
  isSupabaseRefreshTokenError,
} from '@/lib/supabase/auth-cookies'
import type { Profile, UserRole } from '@/types/database'

async function clearStaleSupabaseAuthCookies() {
  try {
    const cookieStore = await cookies()
    const staleCookieNames = getSupabaseAuthCookieNames(cookieStore.getAll())
    expireSupabaseAuthCookies(cookieStore, staleCookieNames)
  } catch {
    // Server Components cannot mutate cookies; middleware clears them on the response.
  }
}

async function getCurrentUser() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      if (isSupabaseRefreshTokenError(error)) {
        await clearStaleSupabaseAuthCookies()
      }
      return null
    }

    return user
  } catch (error) {
    if (isSupabaseRefreshTokenError(error)) {
      await clearStaleSupabaseAuthCookies()
      return null
    }

    throw error
  }
}

export async function getSession() {
  return getCurrentUser()
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const user = await getCurrentUser()
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
  if (!profile || !isAdminRole(profile.role)) {
    redirect('/dashboard')
  }
  return profile
}

export function isAdminRole(role: UserRole | null | undefined) {
  return role === 'admin' || role === 'super_admin'
}

export function isLmsManagerRole(role: UserRole | null | undefined) {
  return isAdminRole(role) || role === 'instructor'
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
