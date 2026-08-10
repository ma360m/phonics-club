import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { bulkUpdateOrderInvoiceNumbersFormAction } from '@/actions/orders'
import { getAllOrders } from '@/lib/data/queries'
import { formatDate, formatPrice } from '@/utils/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function AdminInvoiceNumberingPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; updated?: string }>
}) {
  const { ids = '', updated } = await searchParams
  const selectedIds = parseSelectedIds(ids)
  const orders = selectedIds.length ? await getAllOrders() : []
  const ordersById = new Map(orders.map((order) => [order.id, order]))
  const selectedOrders = selectedIds.flatMap((id) => {
    const order = ordersById.get(id)
    return order ? [order] : []
  })
  const returnTo = `/admin/orders/invoice-numbering?ids=${encodeURIComponent(selectedIds.join(','))}`

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Invoice Numbering</h1>
          <p className="mt-2 text-sm text-muted-foreground">{selectedOrders.length} invoices selected</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4" />
            Orders
          </Link>
        </Button>
      </div>

      {updated ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          Updated {updated} invoices.
        </div>
      ) : null}

      {selectedOrders.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
          No invoices selected.
        </div>
      ) : (
        <form action={bulkUpdateOrderInvoiceNumbersFormAction} className="space-y-5">
          <input type="hidden" name="returnTo" value={returnTo} />

          <div className="rounded-2xl border bg-card p-5">
            <label htmlFor="startingInvoiceNumber" className="mb-2 block text-sm font-semibold">
              Starting invoice number
            </label>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,20rem)_auto]">
              <input
                id="startingInvoiceNumber"
                name="startingInvoiceNumber"
                required
                pattern=".*\d$"
                placeholder="INV_689"
                className="h-10 rounded-xl border bg-background px-3 font-mono text-sm outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20"
              />
              <Button type="submit" className="rounded-xl bg-[#1D4ED8]">
                OK
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {selectedOrders.map((order, index) => {
              const address = order.shipping_address as Record<string, string> | null
              return (
                <div key={order.id} className="rounded-2xl border bg-card p-4">
                  <input type="hidden" name="orderId" value={order.id} />
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <Badge className="mt-0.5 bg-[#1D4ED8] font-mono">#{index + 1}</Badge>
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold">{order.invoice_number ?? `#${order.id.slice(0, 8)}`}</p>
                        <p className="text-sm">{address?.fullName ?? 'Customer name missing'}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <p className="text-right text-sm font-bold text-[#1D4ED8]">{formatPrice(order.total)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </form>
      )}
    </div>
  )
}

function parseSelectedIds(ids: string) {
  return Array.from(new Set(ids.split(',').map((id) => id.trim()).filter(Boolean)))
}
