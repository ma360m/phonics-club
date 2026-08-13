import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { getProfile, isAdminRole, isLmsManagerRole, isSupabaseConfigured, requireAuth } from '@/lib/auth'
import { getUserEnrollments } from '@/actions/enrollments'
import { submitCoursePaymentReceiptAction, submitOfflineActivityAction } from '@/actions/lms'
import { getCourseAccessState, getCourseWishlist, getOfflineActivityEntries, getUserCoursePayments, isCertificatePayment, isCourseCertificateEnabled } from '@/lib/lms'
import { getCourses } from '@/lib/data/queries'
import { requestCourseCancellationAction } from '@/actions/enrollments'
import { COMPANY_BANK_DETAILS } from '@/lib/company'
import { COURSE_LICENSE_EMAIL_ADDRESS } from '@/lib/email/send-course-license-email'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CourseCard } from '@/components/courses/course-card'
import { CourseImage } from '@/components/courses/course-image'
import { LmsShell } from '@/components/lms/lms-shell'
import { LmsEmptyState, LmsPageHeader, LmsSectionCard, LmsStatCard, LmsStatusBadge } from '@/components/lms/lms-primitives'
import { Activity, Award, BookOpen, CheckCircle2, Clock, CreditCard, Heart, Play, Sparkles, UploadCloud, type LucideIcon } from 'lucide-react'
import type { Certificate, Course } from '@/types/database'

export const dynamic = 'force-dynamic'

async function getUserCertificates(userId: string): Promise<Certificate[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false })
  return (data as Certificate[]) ?? []
}

export default async function MyCoursesPage() {
  const user = await requireAuth()
  const profile = await getProfile()
  const [enrollments, wishlist, certificates, allCourses, payments, offlineEntries] = await Promise.all([
    getUserEnrollments(),
    getCourseWishlist(user.id),
    getUserCertificates(user.id),
    getCourses(),
    getUserCoursePayments(user.id),
    getOfflineActivityEntries(user.id),
  ])

  const enrolledCourseIds = new Set(enrollments.map((item) => item.course_id))
  const activeEnrollments = enrollments.filter((item) => getCourseAccessState(item as never).active && (item.status ?? 'active') !== 'completed')
  const pendingEnrollments = enrollments.filter((item) => getCourseAccessState(item as never).pendingPayment)
  const expiredEnrollments = enrollments.filter((item) => getCourseAccessState(item as never).expired)
  const completed = enrollments.filter((item) => (item.status ?? '') === 'completed' || Number(item.progress ?? 0) >= 100)
  const continueLearning = activeEnrollments[0] ?? enrollments[0]
  const recommended = allCourses.filter((course) => !enrolledCourseIds.has(course.id)).slice(0, 3)
  const offlineApproved = offlineEntries.reduce((sum, entry) => sum + Number(entry.approved_minutes ?? 0), 0)
  const offlinePending = offlineEntries
    .filter((entry) => entry.status === 'submitted' || entry.status === 'draft')
    .reduce((sum, entry) => sum + Number(entry.claimed_minutes ?? 0), 0)
  const hasOpenPayments = payments.some((payment) => ['pending', 'processing', 'submitted', 'rejected'].includes(payment.status))
  const isAdmin = isAdminRole(profile?.role)
  const isLmsManager = isLmsManagerRole(profile?.role)

  async function submitOfflineActivityFormAction(formData: FormData) {
    'use server'
    const result = await submitOfflineActivityAction(formData)
    if (!result.success) throw new Error(result.error ?? 'Unable to submit offline activity')
  }

  async function submitPaymentReceiptFormAction(formData: FormData) {
    'use server'
    const paymentId = String(formData.get('payment_id') ?? '')
    const result = await submitCoursePaymentReceiptAction(paymentId, formData)
    if (!result.success) throw new Error(result.error ?? 'Unable to upload receipt')
  }

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <LmsShell userName={profile?.full_name} userEmail={profile?.email} isAdmin={isAdmin} isLmsManager={isLmsManager}>
        <LmsPageHeader
          eyebrow="My Courses"
          title="Your learning path"
          description="Continue lessons, track access, upload course payment receipts, submit offline hours and open certificates from one calm workspace."
          action={(
            <Button asChild className="rounded-xl bg-[#D30000] hover:bg-[#D30000]/90">
              <Link href="/courses">Browse Courses</Link>
            </Button>
          )}
        />

        {enrollments.length === 0 ? (
          <LmsEmptyState
            icon={BookOpen}
            title="No enrolled courses yet"
            description="Choose a course to begin your Phonics Club learning path."
            action={<Button asChild className="rounded-xl bg-[#1D4ED8]"><Link href="/courses">Explore Courses</Link></Button>}
          />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <LmsStatCard title="Active Courses" value={activeEnrollments.length} detail={`${pendingEnrollments.length} pending payment`} icon={BookOpen} />
              <LmsStatCard title="Completed" value={completed.length} detail="Courses at 100% or marked complete" icon={CheckCircle2} tone="green" />
              <LmsStatCard title="Offline Hours" value={`${Math.round(offlineApproved / 60)}h`} detail={`${offlinePending} claimed minutes pending review`} icon={Activity} tone="gold" />
              <LmsStatCard title="Certificates" value={certificates.length} detail="Issued certificate records" icon={Award} tone="red" />
            </div>

            {continueLearning && (
              <LmsSectionCard title="Continue Learning" icon={Play} description="Your next course is ready when you are.">
                <EnrollmentRow enrollment={continueLearning} featured />
              </LmsSectionCard>
            )}

            <LmsSectionCard title="Enrolled Courses" icon={BookOpen}>
              <div className="space-y-4">
                {activeEnrollments.map((enrollment) => (
                  <EnrollmentRow key={enrollment.id} enrollment={enrollment} />
                ))}
                {activeEnrollments.length === 0 && (
                  <LmsEmptyState icon={Clock} title="No active courses" description="Completed, expired or pending courses are listed in the sections below." />
                )}
              </div>
            </LmsSectionCard>

            <div className="grid gap-4 lg:grid-cols-3">
              <StatusPanel title="Pending Payments" count={pendingEnrollments.length} body="Courses activate after payment approval." icon={CreditCard} />
              <StatusPanel title="Expired Courses" count={expiredEnrollments.length} body="Progress is preserved. Contact admin to renew access." icon={Clock} />
              <StatusPanel title="Offline Review" count={`${offlinePending}m`} body={`${Math.round(offlineApproved / 60)} approved hour(s) recorded.`} icon={Activity} />
            </div>

            {activeEnrollments.length > 0 && (
              <LmsSectionCard
                title="Submit Offline Activity"
                description="Use this for approved classroom practice or learning tasks completed away from the online player."
                icon={UploadCloud}
              >
                <form action={submitOfflineActivityFormAction} className="grid gap-3 lg:grid-cols-6">
                  <label className="space-y-1.5 text-sm font-medium text-[#0F172A] lg:col-span-2">
                    Course
                    <select name="course_id" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]">
                      {activeEnrollments.map((enrollment) => {
                        const course = enrollment.courses as Course | undefined
                        return course ? <option key={enrollment.id} value={course.id}>{course.title}</option> : null
                      })}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-[#0F172A]">
                    Date
                    <input name="activity_date" type="date" required className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-[#0F172A]">
                    Start
                    <input name="start_time" type="time" required className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-[#0F172A]">
                    End
                    <input name="end_time" type="time" required className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-[#0F172A]">
                    Activity
                    <input name="activity_type" placeholder="Activity type" required className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]" />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-[#0F172A] lg:col-span-6">
                    Description
                    <textarea name="description" placeholder="Description and evidence notes" className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]" />
                  </label>
                  <label className="flex items-center gap-2 rounded-xl bg-[#F8FAFC] px-3 py-2 text-sm text-slate-600 lg:col-span-4">
                    <input type="checkbox" name="student_declaration" required />
                    I confirm this offline activity entry is accurate.
                  </label>
                  <Button type="submit" className="rounded-xl bg-[#1D4ED8] lg:col-span-2">
                    Submit for Review
                  </Button>
                </form>
              </LmsSectionCard>
            )}

            <LmsSectionCard title="Completed Courses" icon={CheckCircle2}>
              <div className="space-y-4">
                {completed.map((enrollment) => (
                  <EnrollmentRow key={enrollment.id} enrollment={enrollment} />
                ))}
                {completed.length === 0 && (
                  <LmsEmptyState icon={CheckCircle2} title="No completed courses yet" description="Completed courses will appear here once progress reaches 100%." />
                )}
              </div>
            </LmsSectionCard>

            <div className="grid gap-6 xl:grid-cols-2">
              <LmsSectionCard id="certificates" title="Certificates" icon={Award}>
                {certificates.length ? (
                  <ul className="space-y-3">
                    {certificates.map((certificate) => (
                      <li key={certificate.id} className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
                        <p className="font-semibold text-[#0F172A]">{certificate.course_title}</p>
                        <p className="mt-1 text-xs text-slate-500">{certificate.certificate_number}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <LmsEmptyState icon={Award} title="No certificates yet" description="Certificates appear after eligible course completion." />
                )}
              </LmsSectionCard>

              <LmsSectionCard title="Wishlist" icon={Heart}>
                {wishlist.length ? (
                  <ul className="space-y-3">
                    {wishlist.map((item) => (
                      <li key={item.id} className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
                        <Link href={`/courses/${item.courses?.slug}`} className="font-semibold text-[#0F172A] hover:text-[#1D4ED8]">
                          {item.courses?.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <LmsEmptyState icon={Heart} title="No saved courses" description="Save courses from the catalog to compare them later." />
                )}
              </LmsSectionCard>

              <LmsSectionCard title="Payment History" icon={CreditCard}>
                {payments.length ? (
                  <div className="space-y-3">
                    {hasOpenPayments && (
                      <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-sm leading-6 text-slate-700">
                        <p className="font-semibold text-[#0F172A]">Payment options</p>
                        <p className="mt-1">
                          {COMPANY_BANK_DETAILS.bankName}: {COMPANY_BANK_DETAILS.accountTitle}, Account {COMPANY_BANK_DETAILS.accountNumber}
                        </p>
                        <p className="mt-1">{COMPANY_BANK_DETAILS.instructions}</p>
                        <p className="mt-2 font-medium text-[#1D4ED8]">
                          You can pay now and upload the receipt later from this dashboard. Admin approval unlocks the matching course access or certificate request.
                        </p>
                      </div>
                    )}
                  <ul className="space-y-3">
                    {payments.slice(0, 5).map((payment) => {
                      const paidCourse = payment.courses as Course | undefined
                      const certificatePayment = isCertificatePayment(payment)
                      const paymentPageHref = certificatePayment && paidCourse?.id
                        ? `/course/${paidCourse.id}/certificate?paymentId=${payment.id}`
                        : paidCourse?.slug
                          ? `/courses/${paidCourse.slug}/payment?paymentId=${payment.id}`
                          : '/courses'

                      return (
                        <li key={payment.id} className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-[#0F172A]">
                                {paidCourse?.title ?? 'Course payment'}{certificatePayment ? ' certificate' : ''}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {payment.currency} {Number(payment.amount ?? 0).toLocaleString('en-PK')}
                              </p>
                            </div>
                            <LmsStatusBadge tone={payment.status === 'paid' ? 'green' : payment.status === 'rejected' ? 'red' : 'gold'}>
                              {payment.status}
                            </LmsStatusBadge>
                          </div>
                          {['pending', 'processing', 'rejected'].includes(payment.status) && (
                            <form action={submitPaymentReceiptFormAction} encType="multipart/form-data" className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                              <input type="hidden" name="payment_id" value={payment.id} />
                              <input name="transaction_reference" placeholder="Transaction reference" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]" />
                              <input name="receipt" type="file" accept="image/*,.pdf" required className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]" />
                              <Button type="submit" size="sm" className="rounded-xl bg-[#1D4ED8]">Upload</Button>
                            </form>
                          )}
                          {payment.status === 'submitted' && (
                            <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                              {certificatePayment
                                ? 'Receipt received. The certificate request unlocks after admin approves the payment.'
                                : 'Receipt received. Admin review starts after the screenshot is visible. Course access remains locked until admin approval and licence-key unlock.'}
                            </p>
                          )}
                          {payment.status === 'paid' && certificatePayment && (
                            <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3 text-xs leading-5 text-emerald-700">
                              <p>Certificate payment approved. Open the certificate page to request your certificate.</p>
                              <Button asChild size="sm" className="mt-3 rounded-xl bg-[#1D4ED8]">
                                <Link href={paymentPageHref}>Open Certificate</Link>
                              </Button>
                            </div>
                          )}
                          {payment.status === 'paid' && !certificatePayment && !payment.license_unlocked_at && (
                            <div className="mt-3 rounded-xl border border-[#BFDBFE] bg-white p-3 text-xs leading-5 text-slate-600">
                              <p>
                                Payment approved. Check your email from {COURSE_LICENSE_EMAIL_ADDRESS}. If access is not active yet, enter the licence key.
                              </p>
                              <Button asChild size="sm" className="mt-3 rounded-xl bg-[#1D4ED8]">
                                <Link href={paymentPageHref}>Enter Licence Key</Link>
                              </Button>
                            </div>
                          )}
                          {payment.status === 'paid' && !certificatePayment && payment.license_unlocked_at && (
                            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-700">
                              Licence key accepted. Course access is unlocked.
                            </p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  </div>
                ) : (
                  <LmsEmptyState icon={CreditCard} title="No course payments" description="Course payment records will appear here after checkout." />
                )}
              </LmsSectionCard>
            </div>

            {recommended.length > 0 && (
              <LmsSectionCard title="Recommended Courses" icon={Sparkles}>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {recommended.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </LmsSectionCard>
            )}
          </div>
        )}
      </LmsShell>
      <Footer />
    </main>
  )
}

function StatusPanel({
  title,
  count,
  body,
  icon: Icon,
}: {
  title: string
  count: number | string
  body: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#1D4ED8]">{title}</p>
          <p className="mt-2 text-3xl font-bold text-[#0F172A]">{count}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1D4ED8]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

function EnrollmentRow({
  enrollment,
  featured = false,
}: {
  enrollment: Awaited<ReturnType<typeof getUserEnrollments>>[number]
  featured?: boolean
}) {
  const course = enrollment.courses as Course | undefined
  if (!course) return null
  const progress = Number(enrollment.progress ?? 0)
  const access = getCourseAccessState(enrollment as never)
  const certificateEnabled = isCourseCertificateEnabled(course)

  return (
    <article className={`grid gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:grid-cols-[180px_1fr_auto] ${featured ? 'border-[#BFDBFE]' : 'border-slate-200'}`}>
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#EFF6FF] sm:aspect-auto">
        <CourseImage src={course.image_url} alt={course.title} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">{course.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{course.duration ?? 'Self-paced'}</p>
          </div>
          <LmsStatusBadge tone={access.active ? 'blue' : access.pendingPayment ? 'gold' : access.expired ? 'red' : 'navy'}>
            {access.status.replace(/_/g, ' ')}
          </LmsStatusBadge>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {access.expiresAt ? `Expires ${new Date(access.expiresAt).toLocaleDateString('en-PK')}` : 'No expiry date set'}
          {access.daysRemaining !== null && access.active ? ` - ${access.daysRemaining} days left` : ''}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-sm font-semibold text-[#0F172A]">{progress}%</span>
        </div>
        {progress >= 100 && certificateEnabled && (
          <p className="mt-2 flex items-center gap-1 text-sm text-emerald-700">
            <Award className="h-4 w-4" />
            Lesson progress complete. Certificate checks all course requirements.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:items-end sm:justify-center">
        <Button asChild className="rounded-xl bg-[#1D4ED8]">
          <Link href={access.active ? `/course/${course.id}/learn` : `/courses/${course.slug}`}>
            <Play className="mr-2 h-4 w-4" />
            {access.active ? (progress > 0 ? 'Continue' : 'Start') : 'View Course'}
          </Link>
        </Button>
        {certificateEnabled && (
          <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
            <Link href={`/course/${course.id}/certificate`}>Certificate</Link>
          </Button>
        )}
        <details className="group w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-2 text-left text-xs text-slate-600 sm:w-48">
          <summary className="cursor-pointer list-none font-semibold text-[#8B1E2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]">
            Request cancellation
          </summary>
          <form action={requestCourseCancellationAction} className="mt-2 space-y-2">
            <input type="hidden" name="courseId" value={course.id} />
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <textarea
              name="reason"
              rows={3}
              placeholder="Reason, refund notes, or access issue"
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
            />
            <Button type="submit" size="sm" variant="outline" className="h-8 w-full rounded-lg border-rose-200 bg-white text-rose-700 hover:bg-rose-50">
              Submit request
            </Button>
          </form>
        </details>
      </div>
    </article>
  )
}
