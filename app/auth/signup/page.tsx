import Link from 'next/link'
import { AnnouncementBar, Footer } from '@/components/layout'
import { SignupForm } from '@/components/auth/signup-form'
import { buildMetadata } from '@/utils/seo'
import { APP_NAME } from '@/lib/constants'

export const metadata = buildMetadata({
  title: 'Create Account',
  description: `Join ${APP_NAME} and start your phonics journey`,
  path: '/auth/signup',
})

export default function SignupPage() {
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
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground mt-1">Join {APP_NAME} today</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-8 shadow-xl glass">
            <SignupForm />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
