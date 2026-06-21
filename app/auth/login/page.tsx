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

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
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
            <LoginForm />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
