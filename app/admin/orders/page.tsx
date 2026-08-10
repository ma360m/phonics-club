import Link from 'next/link'
import { Search } from 'lucide-react'
import { getAllOrders } from '@/lib/data/queries'
import {
  confirmPaymentFormAction,
  updateOrderInvoiceNumberFormAction,
  updateOrderShippingFormAction,
  updateOrderStatusFormAction,
} from '@/actions/orders'
import { AdminOrderDeleteButton, AdminOrderEditLinkButton, AdminOrderInvoiceLinks } from '@/components/admin/order-actions'
import {
  AdminOrderBulkInvoiceToolbar,
  AdminOrderSelectCheckbox,
  BulkInvoiceSelectionProvider,
} from '@/components/admin/order-bulk-invoice-selector'
import { formatPrice, formatDate } from '@/utils/format'
import { formatCurrency } from '@/lib/currency'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ORDER_STATUSES, SHIPPING_FEE_PKR } from '@/lib/commerce'
import { shopPaymentLabel } from '@/lib/payment-methods'
import { getCustomerOrderStatusLabel } from '@/lib/order-status'
import type { Order } from '@/types/database'

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const searchQuery = q.trim()
  const orders = await getAllOrders()
  const visibleOrders = searchQuery
    ? orders.filter((order) => orderMatchesAdminSearch(order, searchQuery))
    : orders

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Orders</h1>

      <form action="/admin/orders" className="mb-5 rounded-2xl border bg-card p-4">
        <label htmlFor="admin-order-search" className="mb-2 block text-sm font-semibold">
          Search orders
        </label>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="admin-order-search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search invoice # or customer name"
              className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20"
            />
          </div>
          <Button type="submit" className="rounded-xl bg-[#1D4ED8]">
            Search
          </Button>
          {searchQuery ? (
            <Button asChild type="button" variant="outline" className="rounded-xl">
              <Link href="/admin/orders">Clear</Link>
            </Button>
          ) : null}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {searchQuery
            ? `${visibleOrders.length} of ${orders.length} orders match "${searchQuery}".`
            : `${orders.length} orders total.`}
        </p>
      </form>

      <BulkInvoiceSelectionProvider>
        <AdminOrderBulkInvoiceToolbar />
        <div className="space-y-4">
          {visibleOrders.map((order) => {
            const items = order.items as { name: string; quantity: number; price: number }[]
            const addr = order.shipping_address as Record<string, string> | null
            const needsPaymentReview = ['awaiting_payment', 'payment_submitted', 'payment_review'].includes(order.status)
            const discountPercent = Number(order.discount_percent ?? 0)
            const couponPercent = Number(order.coupon_discount_percent ?? 0)
            const memberPercent = Number(order.member_discount_percent ?? 0)
            const shippingDiscount = Number(order.shipping_discount_amount ?? 0)
            const invoiceLabel = order.invoice_number ?? `#${order.id.slice(0, 8)}`

            return (
              <div key={order.id} id={`order-${order.id}`} className="scroll-mt-24 rounded-2xl border bg-card p-6">
                <div className="mb-4 flex flex-wrap justify-between gap-4">
                  <div className="flex min-w-0 flex-wrap items-start gap-3">
                    <AdminOrderSelectCheckbox orderId={order.id} label={invoiceLabel} />
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold">{invoiceLabel}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                      <p className="text-sm">{addr?.fullName} - {order.phone ?? addr?.phone}</p>
                      <p className="text-sm text-muted-foreground">{addr?.email}</p>
                      {!order.user_id && <Badge variant="outline" className="mt-1">Guest order</Badge>}
                      {order.source === 'fast_invoice' && <Badge variant="outline" className="ml-1 mt-1">Fast invoice</Badge>}
                      {order.requires_admin_confirmation && (
                        <div className="mt-2 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          <p className="font-semibold">Admin stock confirmation required</p>
                          {order.admin_confirmation_reason ? <p className="mt-1">{order.admin_confirmation_reason}</p> : null}
                        </div>
                      )}
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
                    <p className="mt-1 text-xs text-muted-foreground">{shopPaymentLabel(order.payment_method)}</p>
                  </div>
                </div>

                <ul className="mb-4 space-y-1 text-sm text-muted-foreground">
                  {items.map((item, i) => (
                    <li key={i}>{item.name} x {item.quantity} - {formatPrice(item.price * item.quantity)}</li>
                  ))}
                </ul>

                <div className="mb-4 grid gap-2 text-sm sm:grid-cols-3">
                  <span>Subtotal: {formatPrice(order.subtotal ?? order.total)}</span>
                  <span>Shipping: {formatPrice(order.shipping_fee ?? SHIPPING_FEE_PKR)}</span>
                  {(order.discount_amount ?? 0) > 0 && (
                    <span>
                      Discount: -{formatPrice(order.discount_amount!)}
                      {discountPercent > 0 ? ` (${discountPercent}%)` : ''}
                    </span>
                  )}
                  {order.coupon_code && (
                    <span>Coupon: <span className="font-mono">{order.coupon_code}</span>{couponPercent > 0 ? ` (${couponPercent}%)` : ''}</span>
                  )}
                  {order.member_id && (
                    <span>Member ID: <span className="font-mono">{order.member_id}</span>{memberPercent > 0 ? ` (${memberPercent}%)` : ''}</span>
                  )}
                  {shippingDiscount > 0 && (
                    <span>Shipping waived: -{formatPrice(shippingDiscount)}{order.shipping_discount_reason ? ` (${order.shipping_discount_reason})` : ''}</span>
                  )}
                </div>

                {(order.receipt_url || order.receipt_path) && (
                  <p className="mb-4">
                    <a href={`/api/orders/${order.id}/receipt`} target="_blank" rel="noreferrer" className="text-sm text-[#1D4ED8] hover:underline">
                      View payment receipt
                    </a>
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {needsPaymentReview && (
                    <form action={confirmPaymentFormAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <Button type="submit" size="sm" className="rounded-xl bg-emerald-600">
                        Mark Payment Confirmed
                      </Button>
                    </form>
                  )}
                  <form action={updateOrderStatusFormAction} className="flex items-center gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <select name="status" defaultValue={order.status} className="rounded-xl border px-3 py-1.5 text-sm">
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{getCustomerOrderStatusLabel(s, order.payment_method)}</option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="outline" className="rounded-xl">Update</Button>
                  </form>
                  <form action={updateOrderShippingFormAction} className="flex items-center gap-2">
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
                  <AdminOrderEditLinkButton orderId={order.id} />
                  <AdminOrderDeleteButton orderId={order.id} />
                </div>
              </div>
            )
          })}
          {visibleOrders.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              {orders.length === 0 ? 'No orders yet.' : 'No orders match that search.'}
            </p>
          )}
        </div>
      </BulkInvoiceSelectionProvider>
    </div>
  )
}

function orderMatchesAdminSearch(order: Order, query: string) {
  const normalizedQuery = query.toLowerCase()
  const address = order.shipping_address as Record<string, string> | null
  return [order.invoice_number, order.id, address?.fullName]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery))
}
