import Link from 'next/link'
import { AnnouncementBar, Footer } from '@/components/layout'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { buildMetadata } from '@/utils/seo'
import { APP_NAME } from '@/lib/constants'

export const metadata = buildMetadata({
  title: 'Set New Password',
  description: `Set a new ${APP_NAME} password`,
  path: '/auth/reset-password',
})

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
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
            <h1 className="text-2xl font-bold">Create a new password</h1>
            <p className="mt-1 text-muted-foreground">Use the reset link from your email before it expires.</p>
          </div>
          <div className="glass rounded-2xl border border-border bg-card p-8 shadow-xl">
            <ResetPasswordForm />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
