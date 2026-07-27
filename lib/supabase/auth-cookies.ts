type CookieLike = {
  name: string
}

type CookieSetter = {
  set: (name: string, value: string, options?: Record<string, unknown>) => unknown
}

export function isSupabaseRefreshTokenError(error: unknown) {
  const candidate = error as { code?: string; message?: string; name?: string } | null
  const message = candidate?.message?.toLowerCase() ?? ''
  const code = candidate?.code?.toLowerCase() ?? ''

  return (
    code === 'refresh_token_not_found' ||
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found')
  )
}

export function isSupabaseAuthCookieName(name: string) {
  return (
    name === 'supabase-auth-token' ||
    (name.startsWith('sb-') &&
      (name.includes('auth-token') ||
        name.includes('refresh-token') ||
        name.includes('code-verifier')))
  )
}

export function getSupabaseAuthCookieNames(cookies: CookieLike[]) {
  const names = cookies
    .map((cookie) => cookie.name)
    .filter(isSupabaseAuthCookieName)

  if (names.length > 0) return Array.from(new Set(names))

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
    /^https?:\/\/([^.]+)\.supabase\.co/i
  )?.[1]

  return projectRef ? [`sb-${projectRef}-auth-token`] : []
}

export function expireSupabaseAuthCookies(
  target: CookieSetter,
  names: string[]
) {
  names.forEach((name) => {
    target.set(name, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      sameSite: 'lax',
    })
  })
}
