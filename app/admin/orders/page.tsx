import { getAllOrders } from '@/lib/data/queries'
import {
  confirmPaymentFormAction,
  updateOrderInvoiceNumberFormAction,
  updateOrderShippingFormAction,
  updateOrderStatusFormAction,
} from '@/actions/orders'
import { AdminOrderDeleteButton, AdminOrderInvoiceLinks } from '@/components/admin/order-actions'
import { formatPrice, formatDate } from '@/utils/format'
import { formatCurrency } from '@/lib/currency'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ORDER_STATUSES, SHIPPING_FEE_PKR } from '@/lib/commerce'
import { shopPaymentLabel } from '@/lib/payment-methods'
import { getCustomerOrderStatusLabel } from '@/lib/order-status'

export default async function AdminOrdersPage() {
  const orders = await getAllOrders()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => {
          const items = order.items as { name: string; quantity: number; price: number }[]
          const addr = order.shipping_address as Record<string, string> | null
          const needsPaymentReview = ['awaiting_payment', 'payment_submitted', 'payment_review'].includes(order.status)

          return (
            <div key={order.id} id={`order-${order.id}`} className="scroll-mt-24 bg-card rounded-2xl border p-6">
              <div className="flex flex-wrap justify-between gap-4 mb-4">
                <div>
                  <p className="font-mono text-sm font-semibold">{order.invoice_number ?? `#${order.id.slice(0, 8)}`}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                  <p className="text-sm">{addr?.fullName} · {order.phone ?? addr?.phone}</p>
                  <p className="text-sm text-muted-foreground">{addr?.email}</p>
                  {!order.user_id && <Badge variant="outline" className="mt-1">Guest order</Badge>}
                  <form action={updateOrderInvoiceNumberFormAction} className="mt-3 flex max-w-sm flex-wrap items-center gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input
                      name="invoiceNumber"
                      defaultValue={order.invoice_number ?? ''}
                      placeholder="INV_001"
                      className="w-36 rounded-xl border px-3 py-1.5 font-mono text-sm"
                    />
                    <Button type="submit" size="sm" variant="outline" className="rounded-xl">
                      Save invoice #
                    </Button>
                  </form>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#1D4ED8]">{formatPrice(order.total)}</p>
                  {order.display_currency === 'USD' && order.display_total ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Displayed as {formatCurrency(Number(order.display_total), 'USD', { freeLabel: false })}
                      {order.exchange_rate ? ` at 1 USD = ${Number(order.exchange_rate).toLocaleString('en-PK')} PKR` : ''}
                    </p>
                  ) : null}
                  <Badge className="mt-1">{getCustomerOrderStatusLabel(order.status, order.payment_method)}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{shopPaymentLabel(order.payment_method)}</p>
                </div>
              </div>

              <ul className="text-sm text-muted-foreground mb-4 space-y-1">
                {items.map((item, i) => (
                  <li key={i}>{item.name} × {item.quantity} — {formatPrice(item.price * item.quantity)}</li>
                ))}
              </ul>

              <div className="text-sm mb-4 grid sm:grid-cols-3 gap-2">
                <span>Subtotal: {formatPrice(order.subtotal ?? order.total)}</span>
                <span>Shipping: {formatPrice(order.shipping_fee ?? SHIPPING_FEE_PKR)}</span>
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
                      Mark Payment Confirmed
                    </Button>
                  </form>
                )}
                <form action={updateOrderStatusFormAction} className="flex gap-2 items-center">
                  <input type="hidden" name="orderId" value={order.id} />
                  <select name="status" defaultValue={order.status} className="rounded-xl border px-3 py-1.5 text-sm">
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{getCustomerOrderStatusLabel(s, order.payment_method)}</option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" variant="outline" className="rounded-xl">Update</Button>
                </form>
                <form action={updateOrderShippingFormAction} className="flex gap-2 items-center">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input
                    type="number"
                    name="shippingFee"
                    min="0"
                    step="1"
                    defaultValue={Number(order.shipping_fee ?? SHIPPING_FEE_PKR)}
                    className="w-24 rounded-xl border px-3 py-1.5 text-sm"
                  />
                  <Button type="submit" size="sm" variant="outline" className="rounded-xl">Set Shipping</Button>
                </form>
                <AdminOrderInvoiceLinks orderId={order.id} />
                <AdminOrderDeleteButton orderId={order.id} />
              </div>
            </div>
          )
        })}
        {orders.length === 0 && <p className="text-muted-foreground text-center py-12">No orders yet.</p>}
      </div>
    </div>
  )
}
