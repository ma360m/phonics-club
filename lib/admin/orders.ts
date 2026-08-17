import { SHIPPING_FEE_PKR } from '@/lib/commerce'
import { getCustomerOrderStatusLabel } from '@/lib/order-status'
import { shopPaymentLabel } from '@/lib/payment-methods'
import type { Order, OrderItem } from '@/types/database'

function clean(value: unknown) {
  return String(value ?? '').trim()
}

function escapeCsv(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export function getAdminOrderAddress(order: Order): Record<string, string> {
  return (order.shipping_address ?? {}) as Record<string, string>
}

export function getAdminOrderItems(order: Order): OrderItem[] {
  return Array.isArray(order.items) ? order.items : []
}

export function getAdminOrderInvoiceLabel(order: Order) {
  return order.invoice_number ?? `#${order.id.slice(0, 8)}`
}

export function getAdminOrderCustomerName(order: Order) {
  const address = getAdminOrderAddress(order)
  return clean(address.fullName ?? address.name ?? order.guest_email) || 'Guest customer'
}

export function getAdminOrderCustomerEmail(order: Order) {
  const address = getAdminOrderAddress(order)
  return clean(address.email ?? order.guest_email)
}

export function getAdminOrderCustomerPhone(order: Order) {
  const address = getAdminOrderAddress(order)
  return clean(order.phone ?? address.phone ?? address.mobile ?? address.customer_phone ?? address.customerPhone)
}

export function getAdminOrderAddressText(order: Order) {
  const address = getAdminOrderAddress(order)
  return [address.address, address.city, address.zip, address.country].map(clean).filter(Boolean).join(', ')
}

export function orderMatchesAdminSearch(order: Order, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  const items = getAdminOrderItems(order)
  return [
    order.invoice_number,
    order.id,
    getAdminOrderCustomerName(order),
    getAdminOrderCustomerEmail(order),
    getAdminOrderCustomerPhone(order),
    ...items.map((item) => item.name),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery))
}

export function adminOrdersToCsv(orders: Order[]) {
  const headers = [
    'Invoice Number',
    'Order ID',
    'Created At',
    'Customer Name',
    'Email',
    'Phone',
    'Shipping Address',
    'Status',
    'Payment Method',
    'Subtotal',
    'Shipping Fee',
    'Discount Amount',
    'Discount Percent',
    'Coupon Code',
    'Coupon Discount Percent',
    'Member ID',
    'Member Discount Percent',
    'Shipping Discount Amount',
    'Total',
    'Display Currency',
    'Display Total',
    'Items',
    'Receipt Uploaded',
    'Guest Order',
    'Source',
    'Admin Confirmation Required',
    'Admin Confirmation Reason',
    'Notes',
    'Updated At',
  ]

  const lines = orders.map((order) => {
    const items = getAdminOrderItems(order)
    const itemsText = items
      .map((item) => `${item.name} x ${item.quantity} - ${Number(item.price ?? 0) * Number(item.quantity ?? 0)}`)
      .join('; ')

    return [
      order.invoice_number ?? '',
      order.id,
      order.created_at,
      getAdminOrderCustomerName(order),
      getAdminOrderCustomerEmail(order),
      getAdminOrderCustomerPhone(order),
      getAdminOrderAddressText(order),
      getCustomerOrderStatusLabel(order.status, order.payment_method),
      shopPaymentLabel(order.payment_method),
      order.subtotal ?? order.total,
      order.shipping_fee ?? SHIPPING_FEE_PKR,
      order.discount_amount ?? 0,
      order.discount_percent ?? '',
      order.coupon_code ?? '',
      order.coupon_discount_percent ?? '',
      order.member_id ?? '',
      order.member_discount_percent ?? '',
      order.shipping_discount_amount ?? 0,
      order.total,
      order.display_currency ?? '',
      order.display_total ?? '',
      itemsText,
      order.receipt_url || order.receipt_path ? 'Yes' : 'No',
      order.user_id ? 'No' : 'Yes',
      order.source ?? '',
      order.requires_admin_confirmation ? 'Yes' : 'No',
      order.admin_confirmation_reason ?? '',
      order.notes ?? '',
      order.updated_at,
    ].map(escapeCsv).join(',')
  })

  return [headers.map(escapeCsv).join(','), ...lines].join('\n')
}
