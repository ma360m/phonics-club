import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AnnouncementBar, Footer, Navbar } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createServiceClient } from '@/lib/supabase/server'
import { Award, CheckCircle2 } from 'lucide-react'

export default async function CertificateVerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) notFound()
  const supabase = await createServiceClient()
  const { data: certificate } = await supabase
    .from('certificates')
    .select('certificate_number, student_name, course_title, instructor_name, issued_at, status, online_minutes, offline_minutes, final_score')
    .eq('verification_code', code)
    .maybeSingle()

  if (!certificate) notFound()

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FBBF24]/20">
            <Award className="h-8 w-8 text-[#D30000]" />
          </div>
          <Badge className="mb-4 rounded-full bg-emerald-600 text-white">
            <CheckCircle2 className="mr-1 h-4 w-4" />
            {certificate.status === 'revoked' ? 'Revoked' : 'Verified'}
          </Badge>
          <h1 className="text-3xl font-bold">Certificate Verification</h1>
          <div className="mt-6 space-y-2 text-left">
            <p><strong>Certificate:</strong> {certificate.certificate_number}</p>
            <p><strong>Student:</strong> {certificate.student_name}</p>
            <p><strong>Course:</strong> {certificate.course_title}</p>
            <p><strong>Instructor:</strong> {certificate.instructor_name ?? 'Phonics Club'}</p>
            <p><strong>Issued:</strong> {new Date(certificate.issued_at).toLocaleDateString('en-PK')}</p>
            <p><strong>Online minutes:</strong> {certificate.online_minutes ?? 0}</p>
            <p><strong>Approved offline minutes:</strong> {certificate.offline_minutes ?? 0}</p>
            <p><strong>Final score:</strong> {certificate.final_score ?? 0}%</p>
          </div>
          <Button asChild className="mt-8 rounded-xl bg-[#1D4ED8]">
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
      </section>
      <Footer />
    </main>
  )
}
