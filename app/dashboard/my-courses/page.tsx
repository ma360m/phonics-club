import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { requireAuth, isSupabaseConfigured } from '@/lib/auth'
import { getUserEnrollments } from '@/actions/enrollments'
import { submitCoursePaymentReceiptAction, submitOfflineActivityAction } from '@/actions/lms'
import { getCourseAccessState, getCourseWishlist, getOfflineActivityEntries, getUserCoursePayments } from '@/lib/lms'
import { getCourses } from '@/lib/data/queries'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CourseCard } from '@/components/courses/course-card'
import { CourseImage } from '@/components/courses/course-image'
import { Award, BookOpen, CheckCircle2, Heart, Play, Sparkles } from 'lucide-react'
import type { Certificate, Course } from '@/types/database'

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
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#1D4ED8]">Student Dashboard</p>
            <h1 className="text-4xl font-bold">My Courses</h1>
            <p className="mt-2 text-muted-foreground">
              Continue lessons, track expiry, payment status, offline hours, certificates and saved courses.
            </p>
          </div>
          <Button asChild className="rounded-xl bg-[#D30000] hover:bg-[#D30000]/90">
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>

        {enrollments.length === 0 ? (
          <div className="rounded-3xl border bg-card p-12 text-center shadow-sm">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-[#1D4ED8]" />
            <h2 className="text-2xl font-bold">No enrolled courses yet</h2>
            <p className="mt-2 text-muted-foreground">Choose a course to begin your Phonics Club learning path.</p>
            <Button asChild className="mt-6 rounded-xl bg-[#1D4ED8]">
              <Link href="/courses">Explore Courses</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            {continueLearning && (
              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Play className="h-5 w-5 text-[#D30000]" />
                  <h2 className="text-2xl font-bold">Continue Learning</h2>
                </div>
                <EnrollmentRow enrollment={continueLearning} featured />
              </section>
            )}

            <section>
              <h2 className="mb-4 text-2xl font-bold">Enrolled Courses</h2>
              <div className="space-y-4">
                {activeEnrollments.map((enrollment) => (
                  <EnrollmentRow key={enrollment.id} enrollment={enrollment} />
                ))}
                {activeEnrollments.length === 0 && (
                  <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
                    No active courses. Completed courses are listed below.
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <StatusPanel title="Pending Payments" count={pendingEnrollments.length} body="Courses activate only after payment approval." />
              <StatusPanel title="Expired Courses" count={expiredEnrollments.length} body="Progress is preserved. Contact admin to renew access." />
              <StatusPanel title="Offline Hours" count={`${Math.round(offlineApproved / 60)}h`} body={`${offlinePending} claimed minutes pending review.`} />
            </section>

            {activeEnrollments.length > 0 && (
              <section className="rounded-3xl border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-2xl font-bold">Submit Offline Activity</h2>
                <form action={submitOfflineActivityFormAction} className="grid gap-3 lg:grid-cols-6">
                  <select name="course_id" className="rounded-xl border px-3 py-2 text-sm lg:col-span-2">
                    {activeEnrollments.map((enrollment) => {
                      const course = enrollment.courses as Course | undefined
                      return course ? <option key={enrollment.id} value={course.id}>{course.title}</option> : null
                    })}
                  </select>
                  <input name="activity_date" type="date" required className="rounded-xl border px-3 py-2 text-sm" />
                  <input name="start_time" type="time" required className="rounded-xl border px-3 py-2 text-sm" />
                  <input name="end_time" type="time" required className="rounded-xl border px-3 py-2 text-sm" />
                  <input name="activity_type" placeholder="Activity type" required className="rounded-xl border px-3 py-2 text-sm" />
                  <textarea name="description" placeholder="Description and evidence notes" className="min-h-20 rounded-xl border px-3 py-2 text-sm lg:col-span-6" />
                  <label className="flex items-center gap-2 text-sm lg:col-span-4">
                    <input type="checkbox" name="student_declaration" required />
                    I confirm this offline activity entry is accurate.
                  </label>
                  <button type="submit" className="rounded-xl bg-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white lg:col-span-2">
                    Submit for Review
                  </button>
                </form>
              </section>
            )}

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                Completed Courses
              </h2>
              <div className="space-y-4">
                {completed.map((enrollment) => (
                  <EnrollmentRow key={enrollment.id} enrollment={enrollment} />
                ))}
                {completed.length === 0 && (
                  <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
                    Completed courses will appear here.
                  </div>
                )}
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-3xl border bg-card p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                  <Award className="h-6 w-6 text-[#FBBF24]" />
                  Certificates
                </h2>
                {certificates.length ? (
                  <ul className="space-y-3">
                    {certificates.map((certificate) => (
                      <li key={certificate.id} className="rounded-2xl bg-muted/50 p-4">
                        <p className="font-semibold">{certificate.course_title}</p>
                        <p className="text-xs text-muted-foreground">{certificate.certificate_number}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Certificates appear after eligible course completion.</p>
                )}
              </section>

              <section className="rounded-3xl border bg-card p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                  <Heart className="h-6 w-6 text-[#D30000]" />
                  Wishlist
                </h2>
                {wishlist.length ? (
                  <ul className="space-y-3">
                    {wishlist.map((item) => (
                      <li key={item.id} className="rounded-2xl bg-muted/50 p-4">
                        <Link href={`/courses/${item.courses?.slug}`} className="font-semibold hover:text-[#1D4ED8]">
                          {item.courses?.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Save courses from the catalog to compare them later.</p>
                )}
              </section>

              <section className="rounded-3xl border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-2xl font-bold">Payment History</h2>
                {payments.length ? (
                  <ul className="space-y-3">
                    {payments.slice(0, 5).map((payment) => (
                      <li key={payment.id} className="rounded-2xl bg-muted/50 p-4">
                        <p className="font-semibold">{payment.courses?.title ?? 'Course payment'}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.status} · {payment.currency} {Number(payment.amount ?? 0).toLocaleString('en-PK')}
                        </p>
                        {['pending', 'processing', 'rejected'].includes(payment.status) && (
                          <form action={submitPaymentReceiptFormAction} encType="multipart/form-data" className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                            <input type="hidden" name="payment_id" value={payment.id} />
                            <input name="transaction_reference" placeholder="Transaction reference" className="rounded-xl border px-3 py-2 text-xs" />
                            <input name="receipt" type="file" accept="image/*,.pdf" required className="rounded-xl border px-3 py-2 text-xs" />
                            <button type="submit" className="rounded-xl bg-[#1D4ED8] px-3 py-2 text-xs font-semibold text-white">Upload</button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Course payment records will appear here.</p>
                )}
              </section>
            </div>

            {recommended.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                  <Sparkles className="h-6 w-6 text-[#FBBF24]" />
                  Recommended Courses
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {recommended.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </section>
      <Footer />
    </main>
  )
}

function StatusPanel({ title, count, body }: { title: string; count: number | string; body: string }) {
  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-[#1D4ED8]">{title}</p>
      <p className="mt-2 text-3xl font-bold">{count}</p>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
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

  return (
    <article className={`grid gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-[180px_1fr_auto] ${featured ? 'border-[#1D4ED8]/30' : ''}`}>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted sm:aspect-auto">
        <CourseImage src={course.image_url} alt={course.title} />
      </div>
      <div>
        <h3 className="text-lg font-bold">{course.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{course.duration ?? 'Self-paced'}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Status: {access.status.replace(/_/g, ' ')}
          {access.expiresAt ? ` · Expires ${new Date(access.expiresAt).toLocaleDateString('en-PK')}` : ''}
          {access.daysRemaining !== null && access.active ? ` · ${access.daysRemaining} days left` : ''}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-sm font-semibold">{progress}%</span>
        </div>
        {progress >= 100 && (
          <p className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
            <Award className="h-4 w-4" />
            Certificate eligible
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
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/course/${course.id}/certificate`}>Certificate</Link>
        </Button>
      </div>
    </article>
  )
}
