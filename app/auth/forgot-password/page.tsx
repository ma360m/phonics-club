import Link from 'next/link'
import { AnnouncementBar, Footer } from '@/components/layout'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { buildMetadata } from '@/utils/seo'
import { APP_NAME } from '@/lib/constants'

export const metadata = buildMetadata({
  title: 'Forgot Password',
  description: `Reset your ${APP_NAME} password`,
  path: '/auth/forgot-password',
})

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="mb-4 inline-flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1D4ED8]">
                <span className="text-xl font-bold text-white">P</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold">Reset your password</h1>
            <p className="mt-1 text-muted-foreground">We will email a secure reset link.</p>
          </div>
          <div className="glass rounded-2xl border border-border bg-card p-8 shadow-xl">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
