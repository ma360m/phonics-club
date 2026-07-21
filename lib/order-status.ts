import { normalizeShopPaymentMethod } from '@/lib/payment-methods'
import type { OrderStatus } from '@/types/database'

export interface CustomerOrderStep {
  status: OrderStatus
  label: string
  description: string
}

export const MANUAL_PAYMENT_ORDER_STEPS: CustomerOrderStep[] = [
  {
    status: 'awaiting_payment',
    label: 'Pending Payment',
    description: 'Waiting for customer payment.',
  },
  {
    status: 'payment_submitted',
    label: 'Payment Submitted',
    description: 'Customer has uploaded proof of payment.',
  },
  {
    status: 'payment_review',
    label: 'Payment Under Review',
    description: 'Admin is verifying the payment.',
  },
  {
    status: 'payment_confirmed',
    label: 'Payment Confirmed',
    description: 'Payment has been verified and accepted.',
  },
  {
    status: 'processing',
    label: 'Processing',
    description: 'Order is being prepared.',
  },
  {
    status: 'shipped',
    label: 'Shipped',
    description: 'Order has been dispatched.',
  },
  {
    status: 'delivered',
    label: 'Delivered',
    description: 'Customer has received the order.',
  },
]

export const COD_ORDER_STEPS: CustomerOrderStep[] = [
  {
    status: 'pending',
    label: 'Order Placed',
    description: 'Cash on Delivery order is waiting for confirmation.',
  },
  {
    status: 'processing',
    label: 'Processing',
    description: 'Order is being prepared.',
  },
  {
    status: 'shipped',
    label: 'Out for Delivery',
    description: 'Order has been dispatched for Cash on Delivery.',
  },
  {
    status: 'delivered',
    label: 'Delivered / Paid',
    description: 'Customer has received the order and paid on delivery.',
  },
]

export const CANCELLED_ORDER_STEP: CustomerOrderStep = {
  status: 'cancelled',
  label: 'Cancelled',
  description: 'Order was cancelled.',
}

export function getCustomerOrderSteps(paymentMethod?: unknown): CustomerOrderStep[] {
  return normalizeShopPaymentMethod(paymentMethod) === 'cod' ? COD_ORDER_STEPS : MANUAL_PAYMENT_ORDER_STEPS
}

export function getCustomerOrderStatusLabel(status: string, paymentMethod?: unknown): string {
  if (status === 'cancelled') return CANCELLED_ORDER_STEP.label
  const steps = getCustomerOrderSteps(paymentMethod)
  return steps.find((step) => step.status === status)?.label ?? status.replace(/_/g, ' ')
}

export function canCustomerEditOrder(status: string, createdAt: string, now = Date.now()): boolean {
  const editableStatuses = new Set(['pending', 'awaiting_payment', 'payment_submitted'])
  const created = new Date(createdAt).getTime()
  if (!Number.isFinite(created) || !editableStatuses.has(status)) return false
  return now - created <= 5 * 60 * 1000
}
