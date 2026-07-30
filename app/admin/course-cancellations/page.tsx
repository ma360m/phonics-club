import { getAdminCourseCancellationRequests, updateCourseCancellationRequestAction } from '@/actions/admin/course-cancellations'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utils/format'

export default async function AdminCourseCancellationsPage() {
  const requests = await getAdminCourseCancellationRequests()

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border bg-card p-5 shadow-sm">
        <h1 className="text-3xl font-bold">Course Cancellations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review learner cancellation requests. Approval marks the enrollment as cancelled; refunds and payment adjustments still need the normal admin procedure.
        </p>
      </header>

      <div className="space-y-4">
        {requests.map((request) => (
          <article key={request.id} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{request.courses?.title ?? request.course_id}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {request.profiles?.full_name ?? 'Learner'} - {request.profiles?.email ?? request.user_id}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Requested {formatDate(request.created_at)}</p>
              </div>
              <Badge variant={request.status === 'pending' ? 'default' : 'outline'}>{request.status.replace(/_/g, ' ')}</Badge>
            </div>
            {request.reason && (
              <p className="mt-4 whitespace-pre-line rounded-xl bg-[#F8FAFC] p-3 text-sm text-slate-600">{request.reason}</p>
            )}
            {request.status === 'pending' ? (
              <form action={updateCourseCancellationRequestAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                <input type="hidden" name="id" value={request.id} />
                <label className="space-y-1 text-sm font-medium">
                  Admin notes
                  <input name="admin_notes" className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Refund notes, access decision, or contact history" />
                </label>
                <Button type="submit" name="status" value="rejected" variant="outline" className="rounded-xl">
                  Reject
                </Button>
                <Button type="submit" name="status" value="approved" className="rounded-xl bg-[#1D4ED8]">
                  Approve
                </Button>
              </form>
            ) : request.admin_notes ? (
              <p className="mt-4 rounded-xl bg-[#F8FAFC] p-3 text-sm text-slate-600">
                <span className="font-semibold">Admin notes:</span> {request.admin_notes}
              </p>
            ) : null}
          </article>
        ))}
        {requests.length === 0 && (
          <p className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground">
            No course cancellation requests yet.
          </p>
        )}
      </div>
    </div>
  )
}
