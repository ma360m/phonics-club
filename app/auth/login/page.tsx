import Link from 'next/link'
import { AnnouncementBar, Footer } from '@/components/layout'
import { LoginForm } from '@/components/auth/login-form'
import { buildMetadata } from '@/utils/seo'
import { APP_NAME } from '@/lib/constants'
import type { LoginNotice } from '@/components/auth/login-form'

export const metadata = buildMetadata({
  title: 'Sign In',
  description: `Sign in to your ${APP_NAME} account`,
  path: '/auth/login',
})

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string; redirect?: string }>
}) {
  const { redirect, error, message } = await searchParams
  const redirectTo = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard'
  const notice = getLoginNotice({ error, message })

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
            <LoginForm redirectTo={redirectTo} notice={notice} />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

function getLoginNotice({
  error,
  message,
}: {
  error?: string
  message?: string
}): LoginNotice | undefined {
  if (error === 'account_recovery_required' || error === 'auth_callback_failed') {
    return {
      variant: 'recovery',
      title: 'Account recovery needs admin help',
      message:
        'To protect your account, online password reset is handled by Phonics Club support. Contact us with your registered email and phone number. After verification, admin will issue a new username and password.',
    }
  }

  if (error) {
    return {
      variant: 'error',
      title: 'Sign-in link could not be verified',
      message: 'Please sign in again, or contact Phonics Club support if you need account help.',
    }
  }

  if (message) {
    return {
      variant: 'success',
      message,
    }
  }
}
