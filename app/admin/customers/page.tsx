import { getAdminCustomerRows } from '@/lib/admin/customers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download } from 'lucide-react'
import Link from 'next/link'

function listText(items: string[]) {
  return items.length ? items.join(', ') : '-'
}

export default async function AdminCustomersPage() {
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

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
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
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
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
