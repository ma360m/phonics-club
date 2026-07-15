import Link from 'next/link'
import { approveCoursePaymentFormAction, getAdminCoursePayments, rejectCoursePaymentFormAction } from '@/actions/admin/lms'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/utils/format'

export default async function AdminCoursePaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status = 'all' } = await searchParams
  const payments = await getAdminCoursePayments(status)
  const statuses = ['all', 'pending', 'processing', 'submitted', 'paid', 'rejected', 'refunded']

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Course Payments</h1>
          <p className="text-sm text-muted-foreground">Approve manual transfers only after verifying the receipt and transaction reference.</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {statuses.map((item) => (
          <Button key={item} asChild size="sm" variant={item === status ? 'default' : 'outline'} className="rounded-xl">
            <Link href={item === 'all' ? '/admin/course-payments' : `/admin/course-payments?status=${item}`}>
              {item.replace(/_/g, ' ')}
            </Link>
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {payments.map((payment: any) => (
          <article key={payment.id} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="font-semibold">{payment.courses?.title ?? 'Course'}</p>
                <p className="text-sm text-muted-foreground">{payment.profiles?.full_name ?? payment.profiles?.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">Reference: {payment.transaction_reference ?? 'Not submitted'}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[#1D4ED8]">{formatPrice(Number(payment.amount ?? 0))}</p>
                <Badge>{payment.status}</Badge>
              </div>
            </div>

            {payment.receipt_path && (
              <p className="mt-3 text-sm text-muted-foreground">
                Receipt uploaded: <span className="font-mono">{payment.receipt_filename ?? payment.receipt_path}</span>
                {payment.signed_receipt_url && (
                  <>
                    {' '}
                    <a href={payment.signed_receipt_url} target="_blank" rel="noreferrer" className="text-[#1D4ED8] hover:underline">
                      Preview
                    </a>
                  </>
                )}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {['submitted', 'processing', 'pending'].includes(payment.status) && (
                <form action={approveCoursePaymentFormAction}>
                  <input type="hidden" name="payment_id" value={payment.id} />
                  <Button type="submit" size="sm" className="rounded-xl bg-emerald-600">Approve & Activate</Button>
                </form>
              )}
              {!['paid', 'refunded', 'rejected'].includes(payment.status) && (
                <form action={rejectCoursePaymentFormAction} className="flex flex-wrap gap-2">
                  <input type="hidden" name="payment_id" value={payment.id} />
                  <input name="reason" placeholder="Reason" className="rounded-xl border px-3 py-1.5 text-sm" />
                  <Button type="submit" size="sm" variant="destructive" className="rounded-xl">Reject</Button>
                </form>
              )}
            </div>
          </article>
        ))}
        {payments.length === 0 && (
          <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">No course payments found.</div>
        )}
      </div>
    </div>
  )
}
