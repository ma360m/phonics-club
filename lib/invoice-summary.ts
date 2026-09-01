import { SHIPPING_FEE_PKR } from '@/lib/commerce'
import type { Order, OrderItem } from '@/types/database'

export interface InvoiceLine {
  position: number
  item: OrderItem
  lineSubtotal: number
  lineDiscount: number
  lineTotal: number
  discountPercent: number
}

export interface InvoiceSummary {
  subtotal: number
  discount: number
  totalAfterDiscount: number
  shipping: number
  shippingDiscount: number
  balanceDue: number
  discountPercent: number
  totalQuantity: number
  lines: InvoiceLine[]
}

export type InvoiceOrder = Order & {
  invoice_number?: string | null
  subtotal?: number
  shipping_fee?: number
  discount_amount?: number
  discount_percent?: number
  coupon_discount_percent?: number
  member_discount_percent?: number
  shipping_discount_amount?: number
  shipping_discount_reason?: string | null
  coupon_code?: string | null
  member_id?: string | null
  payment_method?: string | null
  phone?: string | null
  display_currency?: string | null
  exchange_rate?: number | null
  exchange_rate_timestamp?: string | null
  display_subtotal?: number | null
  display_shipping_fee?: number | null
  display_discount_amount?: number | null
  display_total?: number | null
}

export function invoiceHasProvidedDiscount(
  order: Pick<InvoiceOrder, 'coupon_code' | 'member_id'>
): boolean {
  return Boolean(String(order.coupon_code ?? '').trim() || String(order.member_id ?? '').trim())
}

export function buildInvoiceSummary(order: InvoiceOrder): InvoiceSummary {
  const items = order.items as OrderItem[]
  const subtotal = Number(order.subtotal ?? items.reduce((sum, item) => sum + item.price * item.quantity, 0))
  const shipping = Number(order.shipping_fee ?? SHIPPING_FEE_PKR)
  const shippingDiscount = Number(order.shipping_discount_amount ?? 0)
  const discount = Math.min(Number(order.discount_amount ?? 0), subtotal)
  const discountPercent = Number(order.discount_percent ?? (subtotal > 0 ? (discount / subtotal) * 100 : 0))
  const totalQuantity = items.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0)
  let allocatedDiscount = 0

  const lines = items.map((item, index) => {
    const lineSubtotal = Number(item.price) * Number(item.quantity)
    const storedDiscount = Number(item.discount_amount ?? 0)
    const lineDiscount =
      discount <= 0
        ? 0
        : storedDiscount > 0
          ? storedDiscount
          : index === items.length - 1
            ? Math.max(0, discount - allocatedDiscount)
            : Math.round(lineSubtotal * (discount / Math.max(subtotal, 1)))

    allocatedDiscount += lineDiscount

    return {
      position: index + 1,
      item,
      lineSubtotal,
      lineDiscount,
      lineTotal: Math.max(0, lineSubtotal - lineDiscount),
      discountPercent: Number(item.discount_percent ?? discountPercent),
    }
  })

  const totalAfterDiscount = Math.max(0, subtotal - discount)
  return {
    subtotal,
    discount,
    totalAfterDiscount,
    shipping,
    shippingDiscount,
    balanceDue: totalAfterDiscount + shipping,
    discountPercent,
    totalQuantity,
    lines,
  }
}

export function formatDiscountPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0%'
  return `${Number.isInteger(value) ? value : value.toFixed(2).replace(/\.?0+$/, '')}%`
}
