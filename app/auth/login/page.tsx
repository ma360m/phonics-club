import Link from 'next/link'
import { AnnouncementBar, Footer } from '@/components/layout'
import { LoginForm } from '@/components/auth/login-form'
import { buildMetadata } from '@/utils/seo'
import { APP_NAME } from '@/lib/constants'

export const metadata = buildMetadata({
  title: 'Sign In',
  description: `Sign in to your ${APP_NAME} account`,
  path: '/auth/login',
})

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string; redirect?: string }>
}) {
  const { redirect, message, error } = await searchParams
  const redirectTo = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard'

  return (
    <main className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-[#1D4ED8] rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground mt-1">Sign in to {APP_NAME}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-8 shadow-xl glass">
            {message && <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
            {error && <p className="mb-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <LoginForm redirectTo={redirectTo} />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
