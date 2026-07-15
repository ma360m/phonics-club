import { getAdminLmsReport } from '@/actions/admin/lms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function countBy<T extends Record<string, any>>(rows: T[], key: keyof T) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = String(row[key] ?? 'unknown')
    acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {})
}

function minutes(seconds: number) {
  return Math.round(seconds / 60)
}

export default async function AdminLmsReportsPage() {
  const report = await getAdminLmsReport()
  const paymentTotal = report.payments.reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0)
  const onlineMinutes = minutes(report.sessions.reduce((sum: number, row: any) => sum + Number(row.credited_seconds ?? 0), 0))
  const offlineApproved = report.offline.reduce((sum: number, row: any) => sum + Number(row.approved_minutes ?? 0), 0)
  const completionRows = report.completion.filter((row: any) => row.completed)
  const flaggedSessions = report.sessions.filter((row: any) => row.suspicious)

  const cards = [
    ['Enrollments', report.enrollments.length],
    ['Course payments', report.payments.length],
    ['Payment amount', `PKR ${paymentTotal.toLocaleString('en-PK')}`],
    ['Completed courses', completionRows.length],
    ['Online minutes', onlineMinutes],
    ['Approved offline minutes', offlineApproved],
    ['Quiz attempts', report.quizAttempts.length],
    ['Assignment submissions', report.assignments.length],
    ['Certificates', report.certificates.length],
    ['Resource downloads', report.downloads.length],
    ['Flagged sessions', flaggedSessions.length],
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">LMS Reports</h1>
        <p className="text-sm text-muted-foreground">Operational reporting for payments, progress, time tracking, offline hours, assignments and certificates.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={String(label)} className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {[
          ['Enrollment statuses', countBy(report.enrollments as any[], 'status')],
          ['Payment statuses', countBy(report.payments as any[], 'status')],
          ['Offline statuses', countBy(report.offline as any[], 'status')],
          ['Assignment statuses', countBy(report.assignments as any[], 'status')],
        ].map(([title, rows]) => (
          <section key={String(title)} className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">{String(title)}</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(rows as Record<string, number>).map(([key, value]) => (
                <Badge key={key} variant="outline" className="rounded-full px-3 py-1">
                  {key.replace(/_/g, ' ')}: {value}
                </Badge>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
