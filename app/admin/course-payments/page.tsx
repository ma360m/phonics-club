import Link from 'next/link'
import {
  approveCoursePaymentFormAction,
  extendEnrollmentAccessFormAction,
  getAdminCoursePayments,
  rejectCoursePaymentFormAction,
} from '@/actions/admin/lms'
import { Button } from '@/components/ui/button'
import { LmsEmptyState, LmsPageHeader, LmsStatusBadge } from '@/components/lms/lms-primitives'
import {
  coursePaymentHasSlip,
  getCoursePaymentRegistrationExpiry,
  getCoursePaymentWorkflowStatus,
  type CoursePaymentWorkflowStatus,
} from '@/lib/course-payment-workflow'
import { isCertificatePayment } from '@/lib/lms'
import { formatPrice } from '@/utils/format'
import { ExternalLink, FileSearch, KeyRound, Mail, ShieldCheck, XCircle } from 'lucide-react'

function paymentTone(status: string): 'blue' | 'red' | 'gold' | 'green' {
  if (status === 'paid') return 'green'
  if (status === 'rejected' || status === 'refunded') return 'red'
  if (status === 'submitted' || status === 'processing') return 'blue'
  return 'gold'
}

function paymentStudentName(payment: any) {
  return payment.customer_name ?? payment.profiles?.full_name ?? payment.customer_email ?? payment.profiles?.email ?? 'Student record'
}

function paymentStudentEmail(payment: any) {
  return payment.customer_email ?? payment.profiles?.email ?? ''
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return 'Not recorded'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not recorded'
  return date.toLocaleString('en-PK')
}

function workflowLabel(status: CoursePaymentWorkflowStatus) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#0F172A]">{value}</p>
    </div>
  )
}

export default async function AdminCoursePaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; approveError?: string }>
}) {
  const { status = 'all', approveError = '' } = await searchParams
  const payments = await getAdminCoursePayments(status)
  const statuses = ['all', 'pending', 'processing', 'submitted', 'paid', 'rejected', 'refunded']

  return (
    <div className="w-full max-w-none">
      <LmsPageHeader
        eyebrow="Course Payments"
        title="Payment review"
        description="Verify manual transfers, preview uploaded receipts, issue course licence keys and approve certificate payments after confirmation."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {statuses.map((item) => (
          <Button
            key={item}
            asChild
            size="sm"
            variant={item === status ? 'default' : 'outline'}
            className={`rounded-xl ${item === status ? 'bg-[#1D4ED8]' : 'border-slate-200 bg-white'}`}
          >
            <Link href={item === 'all' ? '/admin/course-payments' : `/admin/course-payments?status=${item}`}>
              {item.replace(/_/g, ' ')}
            </Link>
          </Button>
        ))}
      </div>

      {approveError ? (
        <p role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {approveError}
        </p>
      ) : null}

      <div className="space-y-4">
        {payments.map((payment: any) => {
          const studentName = paymentStudentName(payment)
          const studentEmail = paymentStudentEmail(payment)
          const canGenerateLicense = payment.status !== 'refunded'
          const canReject = !['paid', 'refunded', 'rejected'].includes(payment.status)
          const workflowStatus = (payment.payment_workflow_status ?? getCoursePaymentWorkflowStatus(payment)) as CoursePaymentWorkflowStatus
          const registrationExpiry = getCoursePaymentRegistrationExpiry(payment)
          const slipUploaded = coursePaymentHasSlip(payment)
          const reminderSent = Boolean(payment.payment_pending_reminder_sent_at)
          const verified = payment.status === 'paid' || Boolean(payment.verified_at)
          const licenceIssued = Boolean(payment.license_key || payment.license_emailed_at)
          const certificatePayment = isCertificatePayment(payment)
          const canApproveCertificatePayment = certificatePayment && !['paid', 'refunded'].includes(payment.status)

          return (
            <article key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <LmsStatusBadge tone={paymentTone(payment.status)}>{payment.status}</LmsStatusBadge>
                    <span className="text-xs text-slate-500">Reference: {payment.transaction_reference ?? 'Not submitted'}</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#0F172A]">{payment.courses?.title ?? 'Course payment'}</h2>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">
                    {certificatePayment ? 'Certificate payment' : 'Course access payment'}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0F172A]">Student: {studentName}</p>
                  <p className="mt-1 text-xs text-slate-500">Email: {studentEmail || 'No email on profile'}</p>

                  <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    <Detail label="Registration date" value={formatDateTime(payment.created_at)} />
                    <Detail label="Payment status" value={`${payment.status} / ${workflowLabel(workflowStatus)}`} />
                    <Detail label="Payment type" value={certificatePayment ? 'Certificate' : 'Course access'} />
                    <Detail label="Slip upload status" value={slipUploaded ? `Uploaded ${formatDateTime(payment.submitted_at)}` : 'Not uploaded'} />
                    <Detail label="Reminder sent" value={reminderSent ? 'Yes' : 'No'} />
                    <Detail label="Reminder date/time" value={formatDateTime(payment.payment_pending_reminder_sent_at)} />
                    <Detail label="Request expiry" value={formatDateTime(payment.registration_expires_at ?? registrationExpiry)} />
                    <Detail label="Verification status" value={verified ? `Verified ${formatDateTime(payment.verified_at)}` : 'Not verified'} />
                    <Detail label="Licence issued" value={certificatePayment ? 'Not needed' : licenceIssued ? 'Issued' : 'Not issued'} />
                    <Detail label="Licence email" value={certificatePayment ? 'Not needed' : formatDateTime(payment.license_emailed_at)} />
                  </div>

                {slipUploaded ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 text-sm text-slate-600">
                    <p className="font-medium text-[#0F172A]">Receipt uploaded</p>
                    <p className="mt-1 break-all font-mono text-xs">{payment.receipt_filename ?? payment.receipt_path ?? payment.receipt_url ?? 'Receipt submitted'}</p>
                    {payment.signed_receipt_url && (
                      <a
                        href={payment.signed_receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#1D4ED8] hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Preview receipt
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-[#F8FAFC] p-4 text-sm text-slate-500">
                    No receipt has been uploaded yet.
                  </div>
                )}

                {certificatePayment && payment.status === 'paid' && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p className="flex items-center gap-2 font-semibold text-emerald-900">
                      <ShieldCheck className="h-4 w-4" />
                      Certificate payment approved
                    </p>
                    <p className="mt-2 text-xs leading-5">
                      The learner can request the certificate from their certificate page.
                    </p>
                  </div>
                )}

                {!certificatePayment && payment.license_key && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p className="flex items-center gap-2 font-semibold text-emerald-900">
                      <KeyRound className="h-4 w-4" />
                      Licence key issued
                    </p>
                    <p className="mt-2 break-all font-mono text-xs font-bold tracking-wide">{payment.license_key}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs">
                      <Mail className="h-3.5 w-3.5" />
                      {payment.license_emailed_at
                        ? `Emailed ${new Date(payment.license_emailed_at).toLocaleString('en-PK')}`
                        : 'Email not recorded. Send manually if SMTP is not configured.'}
                    </p>
                    <p className="mt-1 text-xs">
                      {payment.license_unlocked_at
                        ? `Course access unlocked ${new Date(payment.license_unlocked_at).toLocaleString('en-PK')}.`
                        : 'Course access will unlock when payment is approved.'}
                    </p>
                  </div>
                )}
              </div>

                <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Amount</p>
                  <p className="mt-2 text-2xl font-bold text-[#1D4ED8]">{formatPrice(Number(payment.amount ?? 0), payment.currency ?? 'PKR')}</p>
                  <div className="mt-4 space-y-3">
                    {canApproveCertificatePayment ? (
                      <form action={approveCoursePaymentFormAction} className="space-y-2">
                        <input type="hidden" name="payment_id" value={payment.id} />
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Certificate approval</p>
                        <p className="text-xs leading-5 text-slate-600">
                          Approving this payment unlocks the learner certificate request. It does not change course access or issue a licence key.
                        </p>
                        <Button type="submit" size="sm" className="w-full rounded-xl bg-emerald-600">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Approve Certificate Payment
                        </Button>
                      </form>
                    ) : certificatePayment ? (
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                        Certificate payment review is complete for this status.
                      </div>
                    ) : canGenerateLicense ? (
                      <form action={approveCoursePaymentFormAction} className="space-y-2">
                        <input type="hidden" name="payment_id" value={payment.id} />
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Licence generator</p>
                        <p className="text-xs leading-5 text-slate-600">
                          For {studentName}. Blank keys auto-generate; existing keys are kept unless you enter a replacement or tick new key.
                        </p>
                        <input
                          name="license_key"
                          placeholder={payment.license_key ? 'Replacement key, or leave blank' : 'Blank auto-generates'}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
                        />
                        {payment.license_key ? (
                          <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                            <input name="force_new_license_key" type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" />
                            <span>Generate a new key instead of keeping the current one.</span>
                          </label>
                        ) : null}
                        <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                          <input
                            name="resend_license_email"
                            type="checkbox"
                            defaultChecked={!payment.license_emailed_at}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300"
                          />
                          <span>Email payment confirmation and the licence key to the student.</span>
                        </label>
                        <Button type="submit" size="sm" className="w-full rounded-xl bg-emerald-600">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          {payment.status === 'paid'
                            ? payment.license_key ? 'Save / Resend Key' : 'Generate Key'
                            : 'Approve, Issue Key & Unlock'}
                        </Button>
                      </form>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                        Licence generator is paused for refunded payments.
                      </div>
                    )}
                    {canReject && (
                      <form action={rejectCoursePaymentFormAction} className="space-y-2 border-t border-slate-200 pt-3">
                        <input type="hidden" name="payment_id" value={payment.id} />
                        <input
                          name="reason"
                          placeholder="Reason"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
                        />
                        <Button type="submit" size="sm" variant="destructive" className="w-full rounded-xl">
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </form>
                    )}
                  </div>
                  {!certificatePayment && payment.enrollment && (
                    <form action={extendEnrollmentAccessFormAction} className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                      <input type="hidden" name="enrollment_id" value={payment.enrollment.id} />
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Access</p>
                      <p className="text-xs leading-5 text-slate-600">
                        {payment.enrollment.expires_at
                          ? `Expires ${new Date(payment.enrollment.expires_at).toLocaleDateString('en-PK')}`
                          : 'No expiry set'}
                      </p>
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <input
                          name="days"
                          type="number"
                          min="1"
                          max="365"
                          placeholder="Days"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
                        />
                        <Button type="submit" size="sm" variant="outline" className="rounded-xl border-slate-200 bg-white">
                          Extend
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </article>
          )
        })}

        {payments.length === 0 && (
          <LmsEmptyState
            icon={FileSearch}
            title="No course payments found"
            description="Adjust the status filter or wait for students to submit course payment receipts."
            action={<Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white"><Link href="/admin/course-payments">Clear Filter</Link></Button>}
          />
        )}
      </div>
    </div>
  )
}
