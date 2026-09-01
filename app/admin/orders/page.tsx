import Link from 'next/link'
import { ChevronDown, Download, Search } from 'lucide-react'
import { getAllOrders, getProducts } from '@/lib/data/queries'
import {
  adminUpdateOrderDetailsFormAction,
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
import { OrderItemsEditor, type EditableOrderProduct } from '@/components/orders/order-items-editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ORDER_STATUSES, SHIPPING_FEE_PKR } from '@/lib/commerce'
import { shopPaymentLabel } from '@/lib/payment-methods'
import { getCustomerOrderStatusLabel } from '@/lib/order-status'
import { getProductPricing } from '@/lib/products/sale-pricing'
import {
  getAdminOrderAddress,
  getAdminOrderAddressText,
  getAdminOrderCustomerEmail,
  getAdminOrderCustomerName,
  getAdminOrderCustomerPhone,
  getAdminOrderInvoiceLabel,
  getAdminOrderItems,
  orderMatchesAdminSearch,
} from '@/lib/admin/orders'
import type { Order } from '@/types/database'

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

function dateTimeLocalValue(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function AdminOrderCard({ order, products }: { order: Order; products: EditableOrderProduct[] }) {
  const items = getAdminOrderItems(order)
  const quantityTotal = items.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0)
  const addr = getAdminOrderAddress(order)
  const customerName = getAdminOrderCustomerName(order)
  const editableCustomerName = String(addr.fullName ?? addr.name ?? '').trim()
  const customerEmail = getAdminOrderCustomerEmail(order)
  const customerPhone = getAdminOrderCustomerPhone(order)
  const addressText = getAdminOrderAddressText(order)
  const needsPaymentReview = ['awaiting_payment', 'payment_submitted', 'payment_review'].includes(order.status)
  const discountPercent = Number(order.discount_percent ?? 0)
  const couponPercent = Number(order.coupon_discount_percent ?? 0)
  const memberPercent = Number(order.member_discount_percent ?? 0)
  const shippingDiscount = Number(order.shipping_discount_amount ?? 0)
  const invoiceLabel = getAdminOrderInvoiceLabel(order)
  const statusLabel = getCustomerOrderStatusLabel(order.status, order.payment_method)
  const paymentLabel = shopPaymentLabel(order.payment_method)
  const firstItem = items[0]?.name

  return (
    <div id={`order-${order.id}`} className="scroll-mt-24 rounded-2xl border bg-card shadow-sm">
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="lg:pt-1">
          <AdminOrderSelectCheckbox orderId={order.id} label={invoiceLabel} />
        </div>

        <details className="group min-w-0">
          <summary className="grid cursor-pointer list-none gap-4 transition-colors md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] md:items-center [&::-webkit-details-marker]:hidden">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-sm font-semibold text-[#0F172A]">{invoiceLabel}</p>
                {!order.user_id ? <Badge variant="outline">Guest order</Badge> : null}
                {order.source === 'fast_invoice' ? <Badge variant="outline">Fast invoice</Badge> : null}
                {order.requires_admin_confirmation ? <Badge variant="secondary">Needs stock review</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
              <p className="mt-2 truncate text-sm font-medium text-[#0F172A]">
                {customerName}{customerPhone ? ` - ${customerPhone}` : ''}
              </p>
              {customerEmail ? <p className="truncate text-sm text-muted-foreground">{customerEmail}</p> : null}
            </div>

            <div className="min-w-0 text-sm text-slate-600">
              <p className="font-medium text-slate-900">{countLabel(items.length, 'item line')}</p>
              <p className="mt-1 truncate text-muted-foreground">
                {firstItem ?? 'No items recorded'}{quantityTotal ? ` - ${quantityTotal} total items` : ''}
              </p>
            </div>

            <div className="flex flex-col gap-2 md:items-end">
              <p className="text-xl font-bold text-[#1D4ED8]">{formatPrice(order.total)}</p>
              {order.display_currency === 'USD' && order.display_total ? (
                <p className="max-w-64 text-xs text-muted-foreground md:text-right">
                  Displayed as {formatCurrency(Number(order.display_total), 'USD', { freeLabel: false })}
                  {order.exchange_rate ? ` at 1 USD = ${Number(order.exchange_rate).toLocaleString('en-PK')} PKR` : ''}
                </p>
              ) : null}
              <Badge>{statusLabel}</Badge>
              <p className="text-xs text-muted-foreground">{paymentLabel}</p>
              <span className="mt-1 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#1D4ED8] shadow-sm transition-colors group-open:border-[#BFDBFE] group-open:bg-[#EFF6FF]">
                Order details
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </span>
            </div>
          </summary>

          <div className="mt-5 space-y-5 border-t pt-5">
            {order.requires_admin_confirmation ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <p className="font-semibold">Admin stock confirmation required</p>
                {order.admin_confirmation_reason ? <p className="mt-1">{order.admin_confirmation_reason}</p> : null}
              </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <section className="rounded-xl border bg-[#F8FAFC] p-4">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Products</h2>
                {items.length ? (
                  <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-2 text-sm text-slate-700">
                    {items.map((item, i) => (
                      <li key={`${item.product_id ?? item.name}-${i}`} className="rounded-lg bg-white px-3 py-2">
                        <span className="mr-2 font-mono text-xs text-slate-400">{i + 1}.</span>
                        {item.name} x {item.quantity} - {formatPrice(item.price * item.quantity)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No items recorded.</p>
                )}
              </section>

              <section className="rounded-xl border bg-[#F8FAFC] p-4">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Customer and shipping</h2>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p><span className="font-medium text-slate-900">Name:</span> {customerName}</p>
                  <p><span className="font-medium text-slate-900">Email:</span> {customerEmail || '-'}</p>
                  <p><span className="font-medium text-slate-900">Phone:</span> {customerPhone || '-'}</p>
                  <p><span className="font-medium text-slate-900">Address:</span> {addressText || addr.address || '-'}</p>
                  {order.notes ? <p><span className="font-medium text-slate-900">Notes:</span> {order.notes}</p> : null}
                </div>
              </section>
            </div>

            <section className="grid gap-2 rounded-xl border bg-[#F8FAFC] p-4 text-sm text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
              <span>Total quantity: {quantityTotal}</span>
              <span>Subtotal: {formatPrice(order.subtotal ?? order.total)}</span>
              <span>Shipping: {formatPrice(order.shipping_fee ?? SHIPPING_FEE_PKR)}</span>
              {(order.discount_amount ?? 0) > 0 ? (
                <span>
                  Discount: -{formatPrice(order.discount_amount!)}
                  {discountPercent > 0 ? ` (${discountPercent}%)` : ''}
                </span>
              ) : null}
              {order.coupon_code ? (
                <span>Coupon: <span className="font-mono">{order.coupon_code}</span>{couponPercent > 0 ? ` (${couponPercent}%)` : ''}</span>
              ) : null}
              {order.member_id ? (
                <span>Member ID: <span className="font-mono">{order.member_id}</span>{memberPercent > 0 ? ` (${memberPercent}%)` : ''}</span>
              ) : null}
              {shippingDiscount > 0 ? (
                <span>Shipping waived: -{formatPrice(shippingDiscount)}{order.shipping_discount_reason ? ` (${order.shipping_discount_reason})` : ''}</span>
              ) : null}
            </section>

            <section className="rounded-xl border bg-[#F8FAFC] p-4">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Admin controls</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <form action={updateOrderInvoiceNumberFormAction} className="flex max-w-sm flex-wrap items-center gap-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input
                    name="invoiceNumber"
                    defaultValue={order.invoice_number ?? ''}
                    placeholder="INV_001"
                    className="w-36 rounded-xl border bg-white px-3 py-1.5 font-mono text-sm"
                  />
                  <Button type="submit" size="sm" variant="outline" className="rounded-xl bg-white">
                    Save invoice #
                  </Button>
                </form>

                {needsPaymentReview ? (
                  <form action={confirmPaymentFormAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <Button type="submit" size="sm" className="rounded-xl bg-emerald-600">
                      Mark Payment Confirmed
                    </Button>
                  </form>
                ) : null}

                <form action={updateOrderStatusFormAction} className="flex items-center gap-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <select name="status" defaultValue={order.status} className="rounded-xl border bg-white px-3 py-1.5 text-sm">
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{getCustomerOrderStatusLabel(s, order.payment_method)}</option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" variant="outline" className="rounded-xl bg-white">Update</Button>
                </form>

                <form action={updateOrderShippingFormAction} className="flex items-center gap-2">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input
                    type="number"
                    name="shippingFee"
                    min="0"
                    step="1"
                    defaultValue={Number(order.shipping_fee ?? SHIPPING_FEE_PKR)}
                    className="w-24 rounded-xl border bg-white px-3 py-1.5 text-sm"
                  />
                  <Button type="submit" size="sm" variant="outline" className="rounded-xl bg-white">Set Shipping</Button>
                </form>

                {order.receipt_url || order.receipt_path ? (
                  <Button asChild size="sm" variant="ghost" className="rounded-xl">
                    <a href={`/api/orders/${order.id}/receipt`} target="_blank" rel="noreferrer">
                      View payment receipt
                    </a>
                  </Button>
                ) : null}

                <AdminOrderInvoiceLinks orderId={order.id} />
                <AdminOrderEditLinkButton orderId={order.id} />
                <AdminOrderDeleteButton orderId={order.id} />
              </div>

              <details className="mt-4 rounded-xl border bg-white p-3">
                <summary className="cursor-pointer text-sm font-semibold text-[#1D4ED8]">
                  Edit order for customer
                </summary>
                <form action={adminUpdateOrderDetailsFormAction} className="mt-4 space-y-4 border-t pt-4">
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="country" value={addr.country ?? 'Pakistan'} />

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">Full name</span>
                      <input name="fullName" required minLength={2} maxLength={120} defaultValue={editableCustomerName} className="w-full rounded-lg border bg-white px-3 py-2" />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">Email (optional)</span>
                      <input name="email" type="email" defaultValue={customerEmail} className="w-full rounded-lg border bg-white px-3 py-2" />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">Phone</span>
                      <input name="phone" required defaultValue={customerPhone} className="w-full rounded-lg border bg-white px-3 py-2" />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">City</span>
                      <input name="city" required minLength={2} defaultValue={addr.city ?? ''} className="w-full rounded-lg border bg-white px-3 py-2" />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">Address</span>
                      <input name="address" required minLength={5} defaultValue={addr.address ?? addressText} className="w-full rounded-lg border bg-white px-3 py-2" />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">Postal code</span>
                      <input name="zip" defaultValue={addr.zip ?? ''} className="w-full rounded-lg border bg-white px-3 py-2" />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">Payment method</span>
                      <select name="paymentMethod" defaultValue={order.payment_method ?? 'cod'} className="w-full rounded-lg border bg-white px-3 py-2">
                        <option value="cod">Cash on Delivery</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="credit">Bank Transfer / Card</option>
                      </select>
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">Status</span>
                      <select name="status" defaultValue={order.status} className="w-full rounded-lg border bg-white px-3 py-2">
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{getCustomerOrderStatusLabel(s, order.payment_method)}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">Shipping fee</span>
                      <input type="number" name="shippingFee" min="0" step="1" defaultValue={Number(order.shipping_fee ?? SHIPPING_FEE_PKR)} className="w-full rounded-lg border bg-white px-3 py-2" />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium text-slate-700">Order date</span>
                      <input type="datetime-local" name="createdAt" defaultValue={dateTimeLocalValue(order.created_at)} className="w-full rounded-lg border bg-white px-3 py-2" />
                    </label>
                  </div>

                  <OrderItemsEditor
                    items={items}
                    products={products}
                    allowProductAdd
                    allowCustomLines
                    nameEditable
                    priceEditable
                  />

                  <label className="flex items-start gap-2 rounded-lg bg-[#EFF6FF] p-3 text-sm text-slate-700">
                    <input type="checkbox" name="resendCustomerEmail" defaultChecked className="mt-1" />
                    <span>Resend the updated invoice email to the customer when an email is provided.</span>
                  </label>

                  <Button type="submit" size="sm" className="rounded-xl bg-[#1D4ED8]">
                    Save order edit
                  </Button>
                </form>
              </details>
            </section>
          </div>
        </details>
      </div>
    </div>
  )
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const searchQuery = q.trim()
  const [orders, products] = await Promise.all([getAllOrders(), getProducts()])
  const editableProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    price: getProductPricing(product).displayPrice,
    image: product.images?.[0],
  }))
  const visibleOrders = searchQuery
    ? orders.filter((order) => orderMatchesAdminSearch(order, searchQuery))
    : orders
  const exportHref = searchQuery
    ? `/api/admin/orders/export?q=${encodeURIComponent(searchQuery)}`
    : '/api/admin/orders/export'

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Orders</h1>

      <form action="/admin/orders" className="mb-5 rounded-2xl border bg-card p-4">
        <label htmlFor="admin-order-search" className="mb-2 block text-sm font-semibold">
          Search orders
        </label>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="admin-order-search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search invoice #, customer, phone, email, or product"
              className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-[#1D4ED8]/20"
            />
          </div>
          <Button type="submit" className="rounded-xl bg-[#1D4ED8]">
            Search
          </Button>
          <Button asChild type="button" variant="outline" className="rounded-xl">
            <Link href={exportHref}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Link>
          </Button>
          {searchQuery ? (
            <Button asChild type="button" variant="outline" className="rounded-xl">
              <Link href="/admin/orders">Clear</Link>
            </Button>
          ) : null}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {searchQuery
            ? `${visibleOrders.length} of ${orders.length} orders match "${searchQuery}". Export downloads the matching orders.`
            : `${orders.length} orders total.`}
        </p>
      </form>

      <BulkInvoiceSelectionProvider>
        <AdminOrderBulkInvoiceToolbar />
        <div className="space-y-4">
          {visibleOrders.map((order) => (
            <AdminOrderCard key={order.id} order={order} products={editableProducts} />
          ))}
          {visibleOrders.length === 0 ? (
            <p className="rounded-2xl border bg-card py-12 text-center text-muted-foreground">
              {orders.length === 0 ? 'No orders yet.' : 'No orders match that search.'}
            </p>
          ) : null}
        </div>
      </BulkInvoiceSelectionProvider>
    </div>
  )
}
