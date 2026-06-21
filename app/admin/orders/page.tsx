import { getAllOrders } from '@/lib/data/queries'
import { updateOrderStatusFormAction, confirmPaymentFormAction } from '@/actions/orders'
import { formatPrice, formatDate } from '@/utils/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ORDER_STATUSES } from '@/lib/commerce'
import Link from 'next/link'

export default async function AdminOrdersPage() {
  const orders = await getAllOrders()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => {
          const items = order.items as { name: string; quantity: number; price: number }[]
          const addr = order.shipping_address as Record<string, string> | null
          const needsPaymentReview = order.status === 'payment_review' || order.status === 'awaiting_payment'

          return (
            <div key={order.id} className="bg-card rounded-2xl border p-6">
              <div className="flex flex-wrap justify-between gap-4 mb-4">
                <div>
                  <p className="font-mono text-sm font-semibold">{order.invoice_number ?? `#${order.id.slice(0, 8)}`}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                  <p className="text-sm">{addr?.fullName} · {order.phone ?? addr?.phone}</p>
                  <p className="text-sm text-muted-foreground">{addr?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#1D4ED8]">{formatPrice(order.total)}</p>
                  <Badge className="mt-1">{order.status}</Badge>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{order.payment_method ?? 'cod'}</p>
                </div>
              </div>

              <ul className="text-sm text-muted-foreground mb-4 space-y-1">
                {items.map((item, i) => (
                  <li key={i}>{item.name} × {item.quantity} — {formatPrice(item.price * item.quantity)}</li>
                ))}
              </ul>

              <div className="text-sm mb-4 grid sm:grid-cols-3 gap-2">
                <span>Subtotal: {formatPrice(order.subtotal ?? order.total)}</span>
                <span>Shipping: {formatPrice(order.shipping_fee ?? 5500)}</span>
                {(order.discount_amount ?? 0) > 0 && <span>Discount: -{formatPrice(order.discount_amount!)}</span>}
              </div>

              {order.receipt_url && (
                <p className="mb-4">
                  <a href={order.receipt_url} target="_blank" rel="noreferrer" className="text-[#1D4ED8] text-sm hover:underline">
                    View payment receipt
                  </a>
                </p>
              )}

              <div className="flex flex-wrap gap-2 items-center">
                {needsPaymentReview && (
                  <form action={confirmPaymentFormAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <Button type="submit" size="sm" className="rounded-xl bg-emerald-600">
                      Confirm Payment & Process
                    </Button>
                  </form>
                )}
                <form action={updateOrderStatusFormAction} className="flex gap-2 items-center">
                  <input type="hidden" name="orderId" value={order.id} />
                  <select name="status" defaultValue={order.status} className="rounded-xl border px-3 py-1.5 text-sm">
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                  <Button type="submit" size="sm" variant="outline" className="rounded-xl">Update</Button>
                </form>
                <Button asChild size="sm" variant="ghost" className="rounded-xl">
                  <Link href={`/api/orders/${order.id}/invoice`} target="_blank">Invoice</Link>
                </Button>
              </div>
            </div>
          )
        })}
        {orders.length === 0 && <p className="text-muted-foreground text-center py-12">No orders yet.</p>}
      </div>
    </div>
  )
}
