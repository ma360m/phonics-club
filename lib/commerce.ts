export const SHIPPING_FEE_PKR = 550

export const ORDER_STATUSES = [
  'pending',
  'awaiting_payment',
  'payment_submitted',
  'payment_review',
  'payment_confirmed',
  'processing',
  'ready_to_dispatch',
  'shipped',
  'delivered',
  'cancelled',
] as const

export const PAYMENT_METHODS = {
  cod: 'Cash on Delivery',
  bank_transfer: 'Bank Transfer',
  jazzcash: 'JazzCash',
  easypaisa: 'EasyPaisa',
  credit: 'Bank Transfer',
} as const
