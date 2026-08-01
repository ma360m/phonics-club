import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isSupabaseConfigured } from '@/lib/auth'

const PROTECTED_PREFIXES = ['/dashboard', '/wishlist', '/admin', '/course']
const AUTH_ROUTES = ['/auth/login', '/auth/signup']

function matchesRoutePrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next()
  }

  const { supabaseResponse, user, supabase } = await updateSession(request)
  const pathname = request.nextUrl.pathname
  const authError = request.nextUrl.searchParams.get('error')

  const isProtected = PROTECTED_PREFIXES.some((p) => matchesRoutePrefix(pathname, p))
  const isAuthRoute = AUTH_ROUTES.some((p) => matchesRoutePrefix(pathname, p))
  const isAdmin = pathname.startsWith('/admin')
  const isAccountRecoveryError =
    authError === 'auth_callback_failed' || authError === 'account_recovery_required'

  if (isAccountRecoveryError && !matchesRoutePrefix(pathname, '/auth/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('error', 'account_recovery_required')
    url.searchParams.delete('redirect')
    return NextResponse.redirect(url)
  }

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAdmin && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  if (isAuthRoute && user && !isAccountRecoveryError) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
