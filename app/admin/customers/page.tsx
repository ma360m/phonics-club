import { getAdminCustomerRows, type CustomerReportRow } from '@/lib/admin/customers'
import { sendCustomerPasswordResetAction } from '@/actions/admin/customers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Download, KeyRound, UsersRound } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

function listText(items: string[]) {
  return items.length ? items.join(', ') : '-'
}

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

function formatLastActivity(value: string) {
  if (!value) return 'No activity date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No activity date'

  return new Intl.DateTimeFormat('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="text-sm leading-6 text-slate-700">{children}</div>
    </div>
  )
}

function DetailList({ items, mono = false }: { items: string[]; mono?: boolean }) {
  if (!items.length) return <span className="text-slate-400">-</span>

  return (
    <ul className="max-h-44 space-y-1 overflow-y-auto rounded-lg bg-white/80 p-3">
      {items.map((item) => (
        <li key={item} className={mono ? 'font-mono text-xs' : ''}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function CustomerRow({ customer }: { customer: CustomerReportRow }) {
  const coursesCount = customer.enrolledCourses.length + customer.coursePaymentCourses.length
  const registrationsCount = customer.trainingRegistrations.length + customer.webinarRegistrations.length
  const discountsCount = customer.memberIds.length + customer.couponCodes.length

  return (
    <details className="group rounded-2xl border bg-card shadow-sm">
      <summary className="grid cursor-pointer list-none gap-4 px-4 py-4 transition-colors hover:bg-[#F8FAFC] md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto] md:items-center [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#0F172A]">{customer.name || 'Unnamed customer'}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{customer.email || '-'}</p>
        </div>

        <div className="min-w-0 text-sm text-slate-600">
          <p className="truncate"><span className="font-medium text-slate-900">Username:</span> {customer.username || '-'}</p>
          <p className="mt-1 truncate"><span className="font-medium text-slate-900">Phone:</span> {customer.phone || '-'}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{countLabel(customer.productInvoices.length, 'invoice')}</Badge>
          <Badge variant="outline">{countLabel(coursesCount, 'course')}</Badge>
          <Badge variant="outline">{countLabel(registrationsCount, 'registration')}</Badge>
          {discountsCount ? <Badge variant="secondary">{countLabel(discountsCount, 'discount')}</Badge> : null}
        </div>

        <span className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#1D4ED8] shadow-sm transition-colors group-open:border-[#BFDBFE] group-open:bg-[#EFF6FF]">
          Customer details
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </span>
      </summary>

      <div className="border-t bg-[#F8FAFC]/70 px-4 py-5">
        <div className="grid gap-6 lg:grid-cols-3">
          <DetailBlock title="Account">
            <p><span className="font-medium text-slate-900">Username:</span> {customer.username || '-'}</p>
            <p className="mt-2 text-xs text-slate-500">{customer.passwordStatus}</p>
            {customer.email ? (
              <form action={sendCustomerPasswordResetAction.bind(null, customer.email)} className="mt-3">
                <Button type="submit" size="sm" variant="outline" className="h-8 rounded-lg border-slate-200 bg-white text-xs">
                  <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                  Send reset email
                </Button>
              </form>
            ) : null}
          </DetailBlock>

          <DetailBlock title="Contact">
            <p><span className="font-medium text-slate-900">Email:</span> {customer.email || '-'}</p>
            <p><span className="font-medium text-slate-900">Phone:</span> {customer.phone || '-'}</p>
            <p><span className="font-medium text-slate-900">Address:</span> {customer.address || '-'}</p>
          </DetailBlock>

          <DetailBlock title="Activity">
            <p><span className="font-medium text-slate-900">Last activity:</span> {formatLastActivity(customer.lastActivityAt)}</p>
            <p><span className="font-medium text-slate-900">Member IDs:</span> {listText(customer.memberIds)}</p>
            <p><span className="font-medium text-slate-900">Coupons:</span> {listText(customer.couponCodes)}</p>
          </DetailBlock>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <DetailBlock title="Courses">
            <p className="font-medium text-slate-900">Enrolled</p>
            <DetailList items={customer.enrolledCourses} />
            <p className="mt-3 font-medium text-slate-900">Course payments</p>
            <DetailList items={customer.coursePaymentCourses} />
          </DetailBlock>

          <DetailBlock title="Trainings / Webinars">
            <p className="font-medium text-slate-900">Trainings</p>
            <DetailList items={customer.trainingRegistrations} />
            <p className="mt-3 font-medium text-slate-900">Webinars</p>
            <DetailList items={customer.webinarRegistrations} />
          </DetailBlock>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <DetailBlock title="Invoices">
            {customer.productInvoices.length ? (
              <div className="flex flex-wrap gap-1.5">
                {customer.productInvoices.map((invoice) => (
                  <Badge key={invoice} variant="outline" className="font-mono">{invoice}</Badge>
                ))}
              </div>
            ) : (
              <span className="text-slate-400">-</span>
            )}
          </DetailBlock>

          <DetailBlock title="Products">
            <DetailList items={customer.products} />
          </DetailBlock>
        </div>
      </div>
    </details>
  )
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
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
            <Link href="/api/admin/students/export">
              <UsersRound className="mr-2 h-4 w-4" />
              Export Students CSV
            </Link>
          </Button>
          <Button asChild className="rounded-xl bg-[#1D4ED8]">
            <Link href="/api/admin/customers/export">
              <Download className="mr-2 h-4 w-4" />
              Export Customers CSV
            </Link>
          </Button>
        </div>
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

      <section className="space-y-3">
        {customers.map((customer) => (
          <CustomerRow key={customer.key} customer={customer} />
        ))}

        {customers.length === 0 && (
          <div className="rounded-2xl border bg-card px-4 py-12 text-center text-muted-foreground shadow-sm">
            No customer activity found yet.
          </div>
        )}
      </section>
    </div>
  )
}
