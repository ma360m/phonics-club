import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { requestCertificateAction } from '@/actions/lms'
import { requireAuth } from '@/lib/auth'
import { getCertificateStatus, getCourseAccessState, getCourseById, getUserEnrollment } from '@/lib/lms'
import { createServiceClient } from '@/lib/supabase/server'
import { Award, CheckCircle2, ChevronLeft, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Certificate Status',
  robots: { index: false, follow: false },
}

export default async function CertificateStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth()
  const { id } = await params
  const course = await getCourseById(id)
  if (!course) notFound()
  const currentCourse = course

  const enrollment = await getUserEnrollment(user.id, id)
  if (!enrollment) redirect(`/courses/${currentCourse.slug}`)

  const status = await getCertificateStatus(currentCourse, user.id)
  const access = getCourseAccessState(enrollment)
  let certificateDownloadUrl = status.certificate?.pdf_url ?? null
  if (!certificateDownloadUrl && status.certificate?.pdf_bucket && status.certificate?.pdf_path && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const service = await createServiceClient()
    const { data } = await service.storage
      .from(status.certificate.pdf_bucket)
      .createSignedUrl(status.certificate.pdf_path, 60 * 5)
    certificateDownloadUrl = data?.signedUrl ?? null
  }
  const currentCourseId = currentCourse.id
  async function requestCertificateFormAction() {
    'use server'
    const result = await requestCertificateAction(currentCourseId)
    if (!result.success) throw new Error(result.error ?? 'Unable to request certificate')
  }

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" className="mb-6 rounded-xl">
          <Link href="/dashboard/my-courses">
            <ChevronLeft className="mr-1 h-4 w-4" />
            My Courses
          </Link>
        </Button>

        <div className="rounded-3xl border bg-card p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1D4ED8]">Certificate status</p>
              <h1 className="mt-1 text-3xl font-bold">{currentCourse.title}</h1>
              <p className="mt-2 text-muted-foreground">
                Certificates are checked on the server using your enrolment and course progress.
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FBBF24]/20">
              <Award className="h-8 w-8 text-[#D30000]" />
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Course progress</span>
              <span>{status.progress}%</span>
            </div>
            <Progress value={status.progress} className="h-2" />
          </div>

          {access.expired && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Course access expired on {access.expiresAt ? new Date(access.expiresAt).toLocaleDateString('en-PK') : 'the configured expiry date'}.
              Your progress is preserved; contact admin to renew access.
            </div>
          )}

          {status.certificate ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 font-semibold text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                Certificate issued
              </div>
              <p className="mt-2 text-sm text-emerald-700">{status.certificate.certificate_number}</p>
              {certificateDownloadUrl && (
                <Button asChild className="mt-4 rounded-xl bg-[#1D4ED8]">
                  <a href={certificateDownloadUrl} target="_blank" rel="noreferrer">Open certificate</a>
                </Button>
              )}
            </div>
          ) : status.eligible ? (
            <form action={requestCertificateFormAction} className="rounded-2xl border bg-[#F8FAFC] p-5">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                You are eligible
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Request your certificate now. A PDF can be attached later from the certificate workflow.
              </p>
              <Button type="submit" className="mt-4 rounded-xl bg-[#D30000] hover:bg-[#D30000]/90">
                Request Certificate
              </Button>
            </form>
          ) : (
            <div className="rounded-2xl border bg-[#F8FAFC] p-5">
              <div className="flex items-center gap-2 font-semibold">
                <Clock className="h-5 w-5 text-[#1D4ED8]" />
                Keep learning
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Complete all lessons before requesting a certificate.
              </p>
              <Button asChild className="mt-4 rounded-xl bg-[#1D4ED8]">
                <Link href={`/course/${currentCourse.id}/learn`}>Continue Learning</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  )
}
