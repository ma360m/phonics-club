import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { AnnouncementBar, Footer, Navbar } from '@/components/layout'
import { requestCertificateAction } from '@/actions/lms'
import { CopyVerificationLinkButton } from '@/components/courses/certificate-actions'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { LmsShell } from '@/components/lms/lms-shell'
import { LmsStatusBadge } from '@/components/lms/lms-primitives'
import { getProfile, isAdminRole, isLmsManagerRole, requireAuth } from '@/lib/auth'
import { canManageCourseId } from '@/lib/admin/course-scope'
import { getCertificateStatus, getCourseAccessState, getCourseById, getUserEnrollment, isCourseCertificateEnabled } from '@/lib/lms'
import { createServiceClient } from '@/lib/supabase/server'
import { APP_URL } from '@/lib/constants'
import { Award, CheckCircle2, ChevronLeft, Clock, Download, ExternalLink, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Certificate Status',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

function formatDate(value?: string | null) {
  if (!value) return 'Not completed yet'
  return new Date(value).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : APP_URL)
  ).replace(/\/$/, '')
}

export default async function CertificateStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ preview?: string }>
}) {
  const user = await requireAuth()
  const profile = await getProfile()
  const { id } = await params
  const previewRequested = (await searchParams)?.preview === 'admin'
  const managerPreview = previewRequested && isLmsManagerRole(profile?.role)
  const course = await getCourseById(id, { includeUnpublished: managerPreview })
  if (!course) notFound()
  if (managerPreview && !(await canManageCourseId(profile, id))) notFound()

  const enrollment = managerPreview ? null : await getUserEnrollment(user.id, id)
  if (!managerPreview && !enrollment) redirect(`/courses/${course.slug}`)

  const status = managerPreview
    ? { enrollment: null, certificate: null, eligible: false, progress: 0, checklist: null }
    : await getCertificateStatus(course, user.id)
  const access = getCourseAccessState(enrollment)
  const certificate = status.certificate
  let certificateDownloadUrl = certificate?.pdf_url ?? null
  if (!certificateDownloadUrl && certificate?.pdf_bucket && certificate?.pdf_path && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const service = await createServiceClient()
    const { data } = await service.storage
      .from(certificate.pdf_bucket)
      .createSignedUrl(certificate.pdf_path, 60 * 5)
    certificateDownloadUrl = data?.signedUrl ?? null
  }
  const verificationUrl = certificate?.verification_url ||
    (certificate?.verification_code ? `${appBaseUrl()}/certificates/verify/${certificate.verification_code}` : null)
  const completionDate = certificate?.issued_at ?? enrollment?.completed_at
  const currentCourseId = course.id
  const learningHref = managerPreview ? `/course/${course.id}/learn?preview=admin` : `/course/${course.id}/learn`

  async function requestCertificateFormAction() {
    'use server'
    const result = await requestCertificateAction(currentCourseId)
    if (!result.success) throw new Error(result.error ?? 'Unable to request certificate')
  }

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <LmsShell userName={profile?.full_name} userEmail={profile?.email} isAdmin={isAdminRole(profile?.role)} isLmsManager={isLmsManagerRole(profile?.role)}>
        <div className="mx-auto max-w-6xl space-y-6">
          <Button asChild variant="ghost" className="rounded-xl text-slate-600 hover:text-[#1D4ED8]">
            <Link href={managerPreview ? '/admin/courses' : '/dashboard/my-courses'}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              {managerPreview ? 'Admin Courses' : 'My Courses'}
            </Link>
          </Button>

          {managerPreview && (
            <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-sm leading-6 text-[#1D4ED8]">
              Admin preview mode is showing the certificate page without creating eligibility records or changing student progress.
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Certificate</p>
                <h1 className="mt-2 text-3xl font-bold tracking-normal text-[#0F172A]">{course.title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Certificate eligibility is checked on the server using your enrollment, lesson progress and enabled course requirements.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <LmsStatusBadge tone={certificate || status.eligible ? 'green' : 'gold'}>
                  {certificate ? 'issued' : status.eligible ? 'eligible' : 'in progress'}
                </LmsStatusBadge>
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBBF24]/20 text-[#8B1E2D]">
                  <Award className="h-7 w-7" />
                </span>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-600">Completion state</span>
                <span className="font-semibold text-[#0F172A]">{status.progress}%</span>
              </div>
              <Progress value={status.progress} className="h-2" />
            </div>
          </section>

          {access.expired && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              Course access expired on {access.expiresAt ? formatDate(access.expiresAt) : 'the configured expiry date'}.
              Your progress is preserved; contact admin to renew access.
            </div>
          )}

          {!isCourseCertificateEnabled(course) ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-2 font-semibold text-[#0F172A]">
                <Clock className="h-5 w-5 text-[#1D4ED8]" />
                Certificates are disabled for this course
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                This course does not unlock a certificate. Students can still use the learning workspace and progress tracking when enrolled.
              </p>
              <Button asChild className="mt-5 rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
                <Link href={learningHref}>Open Learning Preview</Link>
              </Button>
            </section>
          ) : certificate ? (
            <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                    Certificate issued
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-[#0F172A]">{certificate.student_name}</h2>
                  <p className="mt-2 text-sm text-slate-600">{certificate.course_title}</p>
                </div>
                {certificateDownloadUrl && (
                  <Button asChild className="rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
                    <a href={certificateDownloadUrl} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Preview / Download Certificate
                    </a>
                  </Button>
                )}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <CertificateField label="Student Name" value={certificate.student_name} />
                <CertificateField label="Course Name" value={certificate.course_title} />
                <CertificateField label="Completion Date" value={formatDate(completionDate)} />
                <CertificateField label="Certificate Code" value={certificate.verification_code ?? certificate.certificate_number} />
              </div>

              {verificationUrl && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
                  <p className="text-sm font-semibold text-[#0F172A]">Verification link</p>
                  <p className="mt-2 break-all text-sm text-slate-600">{verificationUrl}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <CopyVerificationLinkButton url={verificationUrl} />
                    <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
                      <a href={verificationUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Verification
                      </a>
                    </Button>
                  </div>
                </div>
              )}
              <p className="mt-5 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm leading-6 text-[#1D4ED8]">
                If your name or any certificate detail needs correction, email support@phonicsclub.com.
              </p>
            </section>
          ) : status.eligible ? (
            <form action={requestCertificateFormAction} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-2 font-semibold text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                You are eligible for a certificate
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-700">
                Request your certificate now. The existing certificate workflow will generate and store the PDF when configured.
              </p>
              <p className="mt-3 text-sm leading-6 text-emerald-700">
                The certificate will use your profile name. For name corrections, email support@phonicsclub.com.
              </p>
              <Button type="submit" className="mt-5 rounded-xl bg-[#8B1E2D] hover:bg-[#8B1E2D]/90">
                Request Certificate
              </Button>
            </form>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-2 font-semibold text-[#0F172A]">
                <Clock className="h-5 w-5 text-[#1D4ED8]" />
                Keep learning
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Complete the enabled course requirements before requesting a certificate.
              </p>
              {status.checklist && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <CertificateField label="Lessons" value={`${status.checklist.lessons.completed}/${status.checklist.lessons.required}`} />
                  <CertificateField label="Online Minutes" value={`${status.checklist.online.minutes}/${status.checklist.online.required}`} />
                  <CertificateField label="Offline Minutes" value={`${status.checklist.offline.minutes}/${status.checklist.offline.required}`} />
                  <CertificateField label="Quiz Score" value={status.checklist.quiz.score === null ? 'Pending' : `${status.checklist.quiz.score}%`} />
                  <CertificateField label="Assignments" value={`${status.checklist.assignments.passed}/${status.checklist.assignments.required}`} />
                  <CertificateField label="Active Access" value={status.checklist.activeAccess.satisfied ? 'Satisfied' : 'Required'} />
                </div>
              )}
              <Button asChild className="mt-5 rounded-xl bg-[#1D4ED8] hover:bg-[#1D4ED8]/90">
                <Link href={learningHref}>{managerPreview ? 'Open Learning Preview' : 'Continue Learning'}</Link>
              </Button>
            </section>
          )}
        </div>
      </LmsShell>
      <Footer />
    </main>
  )
}

function CertificateField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 break-words font-semibold text-[#0F172A]">{value ?? 'Not available'}</p>
    </div>
  )
}
