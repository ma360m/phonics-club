export const SHIPPING_FEE_PKR = 5500

export const ORDER_STATUSES = [
  'pending',
  'awaiting_payment',
  'payment_review',
  'processing',
  'ready_to_dispatch',
  'shipped',
  'delivered',
  'cancelled',
] as const

export const PAYMENT_METHODS = {
  cod: 'Cash on Delivery',
  credit: 'Bank Transfer / Credit',
} as const
