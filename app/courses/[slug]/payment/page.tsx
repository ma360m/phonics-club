import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react'
import { AnnouncementBar, Footer, Navbar } from '@/components/layout'
import { CourseImage } from '@/components/courses/course-image'
import { CourseLicenseUnlockForm, CoursePaymentReceiptForm } from '@/components/courses/course-payment-forms'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createCourseCheckoutAction } from '@/actions/lms'
import { getSession } from '@/lib/auth'
import { getCourseBySlug } from '@/lib/data/queries'
import { ensureChildrenPhonicsCourseInstalledBySlug } from '@/lib/data/children-phonics-install'
import { isChildrenPhonicsCourseSlug } from '@/lib/data/children-phonics-courses'
import { getCourseAccessState, getCourseEnrollmentAvailability, getCoursePrice, getUserEnrollment, isCertificatePayment, isCourseFree } from '@/lib/lms'
import { getEnabledPaymentMethodSettings, DEFAULT_PAYMENT_METHOD_SETTINGS } from '@/lib/payment-method-settings'
import { getContactSettings, getCourseBankDetails } from '@/lib/site-content'
import { getContactPhoneLinks } from '@/lib/contact-settings'
import { createClient } from '@/lib/supabase/server'
import { COURSE_LICENSE_EMAIL_ADDRESS } from '@/lib/email/send-course-license-email'
import { formatPrice } from '@/utils/format'
import type { Course, CoursePayment } from '@/types/database'

export const dynamic = 'force-dynamic'

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function statusClasses(status: string, active: boolean) {
  if (active) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'paid') return 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
  if (status === 'submitted' || status === 'processing') return 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
  if (status === 'rejected' || status === 'failed' || status === 'cancelled') return 'border-rose-200 bg-rose-50 text-rose-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

function stepState(index: number, payment: CoursePayment, active: boolean) {
  if (index === 1) return payment.receipt_path || payment.receipt_url ? 'done' : 'current'
  if (index === 2) {
    if (payment.status === 'paid') return 'done'
    if (payment.status === 'submitted' || payment.status === 'processing') return 'current'
    return 'locked'
  }
  if (index === 3) {
    if (active) return 'done'
    if (payment.status === 'paid') return 'current'
    return 'locked'
  }
  return active ? 'done' : 'locked'
}

async function loadPayment(userId: string, courseId: string, paymentId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('course_payments')
    .select('*, courses(*)')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .limit(paymentId ? 1 : 10)

  if (paymentId) query = query.eq('id', paymentId)
  const { data } = await query
  const payments = ((Array.isArray(data) ? data : data ? [data] : []) as CoursePayment[])
  return payments.find((payment) => !isCertificatePayment(payment)) ?? payments[0] ?? null
}

export default async function CoursePaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ paymentId?: string }>
}) {
  const { slug } = await params
  const { paymentId } = await searchParams
  const user = await getSession()
  const returnPath = `/courses/${slug}/payment${paymentId ? `?paymentId=${paymentId}` : ''}`
  if (!user) redirect(`/auth/login?redirect=${encodeURIComponent(returnPath)}`)

  let course = await getCourseBySlug(slug)
  if (!course) notFound()

  if (isChildrenPhonicsCourseSlug(slug)) {
    const installedCourse = await ensureChildrenPhonicsCourseInstalledBySlug(slug, { requireService: true })
    if (installedCourse) course = installedCourse
    if (!installedCourse && course.id.startsWith('course-jp-')) {
      redirect(`/courses/${slug}?enrollError=${encodeURIComponent('Ask an admin to install this children course from Admin Courses first.')}`)
    }
  }

  if (getCoursePrice(course) <= 0 || isCourseFree(course)) {
    redirect(`/courses/${slug}/enroll`)
  }

  const availability = getCourseEnrollmentAvailability(course)
  if (!availability.canEnroll) {
    redirect(`/courses/${slug}?enrollError=${encodeURIComponent(availability.message)}`)
  }

  let payment = await loadPayment(user.id, course.id, paymentId)
  if (payment && isCertificatePayment(payment)) redirect(`/course/${course.id}/certificate?paymentId=${payment.id}`)
  if (!payment) {
    const checkout = await createCourseCheckoutAction(course.id)
    if (checkout.success && checkout.data?.redirectTo) redirect(checkout.data.redirectTo)
    redirect(`/courses/${slug}?enrollError=${encodeURIComponent(checkout.error ?? 'Payment could not be started')}`)
  }

  const [enrollment, bankDetails, enabledPaymentMethods, contactSettings] = await Promise.all([
    getUserEnrollment(user.id, course.id),
    getCourseBankDetails(),
    getEnabledPaymentMethodSettings(Number(payment.amount ?? 0)),
    getContactSettings(),
  ])
  const access = getCourseAccessState(enrollment as never)
  const active = access.active
  const contactPhoneLinks = getContactPhoneLinks(contactSettings)
  const enabledCoursePaymentMethods = enabledPaymentMethods.filter((method) => method.method === 'bank_transfer')
  const coursePaymentOptions = enabledCoursePaymentMethods.length
    ? enabledCoursePaymentMethods
    : DEFAULT_PAYMENT_METHOD_SETTINGS.filter((method) => method.method === 'bank_transfer')
  const canUploadReceipt = ['pending', 'processing', 'rejected'].includes(payment.status)
  const waitingForReview = payment.status === 'submitted' || payment.status === 'processing'
  const readyForLicense = payment.status === 'paid' && !active
  const lockedByRejection = payment.status === 'rejected'
  const courseRecord = (payment.courses as Course | null) ?? course

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
            <Link href={`/courses/${slug}`}>Back to Course</Link>
          </Button>
          <Badge variant="outline" className={`rounded-full px-3 py-1 ${statusClasses(payment.status, active)}`}>
            {active ? 'Course Unlocked' : formatStatus(payment.status)}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="min-w-0 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                <div className="relative min-h-48 bg-[#EFF6FF]">
                  <CourseImage src={courseRecord.image_url} alt={courseRecord.title} priority />
                </div>
                <div className="p-6">
                  <p className="text-sm font-semibold text-[#1D4ED8]">Course payment</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-normal text-[#0F172A]">{courseRecord.title}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    Submit your payment screenshot here. Admin reviews the proof, then a licence key is emailed from{' '}
                    <span className="font-semibold text-[#0F172A]">{COURSE_LICENSE_EMAIL_ADDRESS}</span> and the course is unlocked after verification.
                  </p>
                </div>
              </div>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-normal text-[#0F172A]">Payment Options</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Online courses use bank transfer with screenshot/receipt upload before admin review.
                  </p>
                </div>
                <p className="shrink-0 rounded-xl bg-[#EFF6FF] px-4 py-2 text-lg font-bold text-[#1D4ED8]">
                  {formatPrice(Number(payment.amount ?? 0), payment.currency ?? 'PKR')}
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                {coursePaymentOptions.map((method) => {
                  const isBank = method.method === 'bank_transfer'
                  return (
                    <article
                      key={method.method}
                      className={`rounded-xl border p-4 ${
                        isBank ? 'border-[#1D4ED8] bg-[#EFF6FF]' : 'border-slate-200 bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isBank ? 'bg-white text-[#1D4ED8]' : 'bg-white text-slate-500'}`}>
                          <CreditCard className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-[#0F172A]">{method.displayName}</h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{method.customerInstructions}</p>
                          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm text-slate-700 sm:grid-cols-2">
                            <div className="min-w-0">
                              <dt className="inline font-medium text-[#0F172A]">Bank: </dt>
                              <dd className="inline break-words">{bankDetails.bankName}</dd>
                            </div>
                            <div className="min-w-0">
                              <dt className="inline font-medium text-[#0F172A]">Account: </dt>
                              <dd className="inline break-words">{bankDetails.accountTitle}</dd>
                            </div>
                            <div className="min-w-0">
                              <dt className="inline font-medium text-[#0F172A]">A/C No: </dt>
                              <dd className="inline break-words">{bankDetails.accountNumber}</dd>
                            </div>
                            {bankDetails.iban ? (
                              <div className="min-w-0">
                                <dt className="inline font-medium text-[#0F172A]">IBAN: </dt>
                                <dd className="inline break-all">{bankDetails.iban}</dd>
                              </div>
                            ) : null}
                          </dl>
                          {bankDetails.instructions ? (
                            <p className="mt-4 text-sm leading-6 text-slate-600">{bankDetails.instructions}</p>
                          ) : null}
                          {contactPhoneLinks.length ? (
                            <p className="mt-4 text-sm leading-6 text-slate-600">
                              Need help? Contact{' '}
                              {contactPhoneLinks.map((phone, index) => (
                                <span key={phone.href}>
                                  {index ? ' or ' : null}
                                  <a href={phone.href} className="font-semibold text-[#1D4ED8] hover:underline">{phone.display}</a>
                                </span>
                              ))}
                              .
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1D4ED8]">
                  {readyForLicense ? <KeyRound className="h-5 w-5" /> : canUploadReceipt ? <UploadCloud className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                </span>
                <div>
                  <h2 className="text-2xl font-bold tracking-normal text-[#0F172A]">
                    {active ? 'Course Unlocked' : readyForLicense ? 'Enter Licence Key' : 'Submit Payment Screenshot'}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {active
                      ? 'Your licence key has unlocked this course. You can continue learning now.'
                      : readyForLicense
                        ? `Admin approved the payment. Check the email sent from ${COURSE_LICENSE_EMAIL_ADDRESS}; if access is not active yet, enter the licence key below.`
                        : waitingForReview
                          ? 'Your screenshot has been submitted. Admin will confirm the payment before issuing a licence key.'
                          : lockedByRejection
                            ? 'Payment could not be verified. Upload a corrected screenshot to request review again.'
                            : 'Upload a clear screenshot or PDF receipt so admin can confirm your payment.'}
                  </p>
                </div>
              </div>

              {active ? (
                <Button asChild className="rounded-xl bg-[#1D4ED8]">
                  <Link href={`/course/${course.id}/learn`}>Continue Learning</Link>
                </Button>
              ) : readyForLicense ? (
                <CourseLicenseUnlockForm paymentId={payment.id} />
              ) : canUploadReceipt ? (
                <CoursePaymentReceiptForm paymentId={payment.id} redirectTo={`/courses/${slug}/payment?paymentId=${payment.id}`} />
              ) : waitingForReview ? (
                <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-sm leading-6 text-[#1D4ED8]">
                  Receipt received. Course access remains locked while admin verifies the screenshot.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 text-sm leading-6 text-slate-600">
                  This payment can no longer accept screenshots. Contact Phonics Club support if you need help.
                </div>
              )}

              {payment.rejection_reason && (
                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                  <AlertTriangle className="mr-2 inline h-4 w-4" aria-hidden="true" />
                  {payment.rejection_reason}
                </p>
              )}
            </section>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#1D4ED8]">Access Status</p>
              <h2 className="mt-2 text-2xl font-bold tracking-normal text-[#0F172A]">
                {active ? 'Unlocked' : readyForLicense ? 'Licence key required' : waitingForReview ? 'Admin review' : 'Payment proof required'}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {active
                  ? 'Your enrollment is active.'
                  : 'The learning page will not open until payment is approved by admin.'}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold tracking-normal text-[#0F172A]">Unlock Steps</h2>
              <ol className="mt-5 space-y-4">
                {[
                  { title: 'Upload screenshot', body: 'Submit payment proof on this page.', icon: UploadCloud },
                  { title: 'Admin confirms', body: 'Admin reviews the receipt and approves or rejects it.', icon: ShieldCheck },
                  { title: 'Licence key email', body: `The key is emailed from ${COURSE_LICENSE_EMAIL_ADDRESS}.`, icon: Mail },
                  { title: 'Course unlocks', body: 'Approved payments unlock the course workspace.', icon: LockKeyhole },
                ].map((step, index) => {
                  const state = stepState(index + 1, payment, active)
                  const Icon = step.icon
                  return (
                    <li key={step.title} className="flex gap-3">
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          state === 'done'
                            ? 'bg-emerald-50 text-emerald-700'
                            : state === 'current'
                              ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                              : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {state === 'done' ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </span>
                      <span>
                        <span className="block font-semibold text-[#0F172A]">{step.title}</span>
                        <span className="mt-1 block text-sm leading-6 text-slate-600">{step.body}</span>
                      </span>
                    </li>
                  )
                })}
              </ol>
            </section>
          </aside>
        </div>
      </div>
      <Footer />
    </main>
  )
}
