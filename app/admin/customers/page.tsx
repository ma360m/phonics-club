import { getAdminCustomerRows } from '@/lib/admin/customers'
import { sendCustomerPasswordResetAction } from '@/actions/admin/customers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, KeyRound } from 'lucide-react'
import Link from 'next/link'

function listText(items: string[]) {
  return items.length ? items.join(', ') : '-'
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ message?: string; error?: string }>
}) {
  const notice = await searchParams
  const customers = await getAdminCustomerRows()

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Consolidated customers from product orders, course enrollments, course payments, trainings, and webinars.
          </p>
        </div>
        <Button asChild className="rounded-xl bg-[#1D4ED8]">
          <Link href="/api/admin/customers/export">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Link>
        </Button>
      </header>

      {notice?.message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {notice.message}
        </p>
      ) : null}
      {notice?.error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {notice.error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1380px] w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Password</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Discounts</th>
                <th className="px-4 py-3">Courses</th>
                <th className="px-4 py-3">Trainings / Webinars</th>
                <th className="px-4 py-3">Invoices / Products</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((customer) => (
                <tr key={customer.key} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[#0F172A]">{customer.name || 'Unnamed customer'}</p>
                    <p className="mt-1 text-xs text-slate-500">{customer.email || '-'}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{customer.username || '-'}</td>
                  <td className="max-w-[240px] px-4 py-4 text-xs text-slate-500">
                    <p>{customer.passwordStatus}</p>
                    {customer.email ? (
                      <form action={sendCustomerPasswordResetAction.bind(null, customer.email)} className="mt-3">
                        <Button type="submit" size="sm" variant="outline" className="h-8 rounded-lg border-slate-200 bg-white text-xs">
                          <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                          Send reset email
                        </Button>
                      </form>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{customer.phone || '-'}</td>
                  <td className="max-w-[240px] px-4 py-4 text-slate-600">{customer.address || '-'}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p><span className="font-medium">Member:</span> {listText(customer.memberIds)}</p>
                      <p><span className="font-medium">Coupons:</span> {listText(customer.couponCodes)}</p>
                    </div>
                  </td>
                  <td className="max-w-[260px] px-4 py-4 text-slate-600">
                    <p>{listText(customer.enrolledCourses)}</p>
                    {customer.coursePaymentCourses.length ? (
                      <p className="mt-2 text-xs text-slate-500">Payments: {listText(customer.coursePaymentCourses)}</p>
                    ) : null}
                  </td>
                  <td className="max-w-[260px] px-4 py-4 text-slate-600">
                    <p>{listText(customer.trainingRegistrations)}</p>
                    {customer.webinarRegistrations.length ? (
                      <p className="mt-2 text-xs text-slate-500">Webinars: {listText(customer.webinarRegistrations)}</p>
                    ) : null}
                  </td>
                  <td className="max-w-[260px] px-4 py-4 text-slate-600">
                    <div className="mb-2 flex flex-wrap gap-1">
                      {customer.productInvoices.length ? customer.productInvoices.map((invoice) => (
                        <Badge key={invoice} variant="outline" className="font-mono">{invoice}</Badge>
                      )) : '-'}
                    </div>
                    <p className="text-xs text-slate-500">{listText(customer.products)}</p>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    No customer activity found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
