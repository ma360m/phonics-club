import Link from 'next/link'
import { Archive, Download, FileText } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { getAllOrders } from '@/lib/data/queries'
import { getAdminOrderCustomerName, getAdminOrderInvoiceLabel, getAdminOrderItems } from '@/lib/admin/orders'
import { getCustomerOrderStatusLabel } from '@/lib/order-status'
import { formatDate, formatPrice } from '@/utils/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { updateOrderInvoiceNumberFormAction } from '@/actions/orders'
import type { Order } from '@/types/database'

const FINAL_STATUSES = new Set(['payment_confirmed', 'processing', 'ready_to_dispatch', 'shipped', 'delivered'])

function isFinalized(order: Order) {
  return Boolean(order.finalized_at) || (order.document_type !== 'estimate' && FINAL_STATUSES.has(order.status))
}

function monthKey(order: Order) {
  const value = order.finalized_at ?? order.created_at
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'unknown' : value.slice(0, 7)
}

function monthLabel(key: string) {
  if (key === 'unknown') return 'Undated invoices'
  const date = new Date(`${key}-01T00:00:00Z`)
  return new Intl.DateTimeFormat('en-PK', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
}

function InvoiceArchiveMonth({ month, orders }: { month: string; orders: Order[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-xl font-bold">{monthLabel(month)}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{orders.length} finalized {orders.length === 1 ? 'invoice' : 'invoices'}</p>
        </div>
        {month !== 'unknown' ? (
          <Button asChild size="sm" className="rounded-xl bg-[#1D4ED8]">
            <Link href={`/api/admin/invoices/zip?month=${encodeURIComponent(month)}`}>
              <Download className="mr-2 h-4 w-4" /> Download ZIP
            </Link>
          </Button>
        ) : null}
      </div>
      <div className="divide-y">
        {orders.map((order) => {
          const items = getAdminOrderItems(order)
          return (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-[#EFF6FF] p-2 text-[#1D4ED8]"><FileText className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-semibold">{getAdminOrderInvoiceLabel(order)}</p>
                  <p className="mt-1 truncate text-sm font-medium">{getAdminOrderCustomerName(order)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(order.finalized_at ?? order.created_at)} · {items.length} item lines</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-[#1D4ED8]">{formatPrice(order.total)}</p>
                  <Badge variant="outline" className="mt-1">{getCustomerOrderStatusLabel(order.status, order.payment_method)}</Badge>
                </div>
                <form action={updateOrderInvoiceNumberFormAction} className="flex items-center gap-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input name="invoiceNumber" defaultValue={order.invoice_number ?? ''} aria-label={`Invoice number for ${getAdminOrderCustomerName(order)}`} className="w-32 rounded-xl border bg-white px-3 py-1.5 font-mono text-xs" />
                  <Button type="submit" size="sm" variant="outline" className="rounded-xl">Rename</Button>
                </form>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link href={`/api/orders/${order.id}/invoice?format=pdf`} target="_blank">PDF</Link>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default async function AdminInvoicesPage() {
  await requireAdmin()
  const orders = (await getAllOrders()).filter(isFinalized)
  const grouped = new Map<string, Order[]>()
  for (const order of orders) grouped.set(monthKey(order), [...(grouped.get(monthKey(order)) ?? []), order])
  const months = [...grouped.keys()].sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border bg-card p-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Finalized folder</p>
          <h1 className="mt-2 text-3xl font-bold">INVOICES</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Only payment-confirmed bank transfers and delivery-confirmed COD orders appear here. Each month is kept in its own archive area.</p>
        </div>
        <div className="rounded-2xl bg-[#EFF6FF] p-4 text-center text-[#1D4ED8]"><Archive className="mx-auto h-6 w-6" /><p className="mt-2 text-2xl font-bold">{orders.length}</p><p className="text-xs font-semibold uppercase tracking-wide">Finalized</p></div>
      </header>

      {months.map((month) => <InvoiceArchiveMonth key={month} month={month} orders={grouped.get(month) ?? []} />)}
      {!months.length ? <div className="rounded-2xl border bg-card px-5 py-14 text-center text-muted-foreground">No finalized invoices yet. Confirm a bank payment or finalize a delivered COD order from Orders.</div> : null}
    </div>
  )
}
