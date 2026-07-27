import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  expireSupabaseAuthCookies,
  getSupabaseAuthCookieNames,
  isSupabaseRefreshTokenError,
} from '@/lib/supabase/auth-cookies'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null

  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      if (isSupabaseRefreshTokenError(error)) {
        const staleCookieNames = getSupabaseAuthCookieNames(request.cookies.getAll())
        staleCookieNames.forEach((name) => request.cookies.delete(name))
        supabaseResponse = NextResponse.next({ request })
        expireSupabaseAuthCookies(supabaseResponse.cookies, staleCookieNames)
      }
    } else {
      user = data.user
    }
  } catch (error) {
    if (isSupabaseRefreshTokenError(error)) {
      const staleCookieNames = getSupabaseAuthCookieNames(request.cookies.getAll())
      staleCookieNames.forEach((name) => request.cookies.delete(name))
      supabaseResponse = NextResponse.next({ request })
      expireSupabaseAuthCookies(supabaseResponse.cookies, staleCookieNames)
    } else {
      throw error
    }
  }

  return { supabaseResponse, user, supabase }
}
