import Link from 'next/link'
import {
  approveCoursePaymentFormAction,
  extendEnrollmentAccessFormAction,
  getAdminCoursePayments,
  rejectCoursePaymentFormAction,
} from '@/actions/admin/lms'
import { Button } from '@/components/ui/button'
import { LmsEmptyState, LmsPageHeader, LmsStatusBadge } from '@/components/lms/lms-primitives'
import { formatPrice } from '@/utils/format'
import { ExternalLink, FileSearch, KeyRound, Mail, ShieldCheck, XCircle } from 'lucide-react'

function paymentTone(status: string): 'blue' | 'red' | 'gold' | 'green' {
  if (status === 'paid') return 'green'
  if (status === 'rejected' || status === 'refunded') return 'red'
  if (status === 'submitted' || status === 'processing') return 'blue'
  return 'gold'
}

export default async function AdminCoursePaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status = 'all' } = await searchParams
  const payments = await getAdminCoursePayments(status)
  const statuses = ['all', 'pending', 'processing', 'submitted', 'paid', 'rejected', 'refunded']

  return (
    <div className="mx-auto max-w-7xl">
      <LmsPageHeader
        eyebrow="Course Payments"
        title="Payment review"
        description="Verify manual transfers, preview uploaded receipts, issue licence keys and let customers unlock course access after confirmation."
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

      <div className="space-y-4">
        {payments.map((payment: any) => (
          <article key={payment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <LmsStatusBadge tone={paymentTone(payment.status)}>{payment.status}</LmsStatusBadge>
                  <span className="text-xs text-slate-500">Reference: {payment.transaction_reference ?? 'Not submitted'}</span>
                </div>
                <h2 className="text-lg font-bold text-[#0F172A]">{payment.courses?.title ?? 'Course payment'}</h2>
                <p className="mt-1 text-sm text-slate-500">{payment.profiles?.full_name ?? payment.profiles?.email ?? 'Student record'}</p>
                <p className="mt-1 text-xs text-slate-500">{payment.profiles?.email ?? 'No email on profile'}</p>

                {payment.receipt_path ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 text-sm text-slate-600">
                    <p className="font-medium text-[#0F172A]">Receipt uploaded</p>
                    <p className="mt-1 break-all font-mono text-xs">{payment.receipt_filename ?? payment.receipt_path}</p>
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

                {payment.license_key && (
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
                        ? `Customer unlocked access ${new Date(payment.license_unlocked_at).toLocaleString('en-PK')}.`
                        : 'Waiting for the customer to enter the licence key.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Amount</p>
                <p className="mt-2 text-2xl font-bold text-[#1D4ED8]">{formatPrice(Number(payment.amount ?? 0))}</p>
                <div className="mt-4 space-y-2">
                  {(['submitted', 'processing', 'pending'].includes(payment.status) || (payment.status === 'paid' && !payment.license_key)) && (
                    <form action={approveCoursePaymentFormAction} className="space-y-2">
                      <input type="hidden" name="payment_id" value={payment.id} />
                      <input
                        name="license_key"
                        placeholder="Licence key, or leave blank"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
                      />
                      <p className="text-xs leading-5 text-slate-600">
                        Blank keys are generated automatically and emailed to the student from noreply@phonicsclub.com.
                      </p>
                      <Button type="submit" size="sm" className="w-full rounded-xl bg-emerald-600">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {payment.status === 'paid' ? 'Issue Key' : 'Approve & Issue Key'}
                      </Button>
                    </form>
                  )}
                  {!['paid', 'refunded', 'rejected'].includes(payment.status) && (
                    <form action={rejectCoursePaymentFormAction} className="space-y-2">
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
                {payment.enrollment && (
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
        ))}

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
