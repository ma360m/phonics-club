export const SHOP_PAYMENT_METHODS = ['cod', 'bank_transfer', 'jazzcash', 'easypaisa'] as const
export const ACTIVE_SHOP_PAYMENT_METHODS = ['cod', 'bank_transfer'] as const

export type ShopPaymentMethod = (typeof SHOP_PAYMENT_METHODS)[number]
export type ActiveShopPaymentMethod = (typeof ACTIVE_SHOP_PAYMENT_METHODS)[number]

export function normalizeShopPaymentMethod(method?: unknown): ShopPaymentMethod {
  const value = String(method ?? '').trim().toLowerCase()
  if (value === 'credit' || value === 'bank' || value === 'manual_bank_transfer') return 'bank_transfer'
  if (SHOP_PAYMENT_METHODS.includes(value as ShopPaymentMethod)) return value as ShopPaymentMethod
  return 'cod'
}

export function shopPaymentNeedsReceipt(method?: unknown): boolean {
  return normalizeShopPaymentMethod(method) !== 'cod'
}

export function shopPaymentLabel(method?: unknown): string {
  switch (normalizeShopPaymentMethod(method)) {
    case 'bank_transfer':
    case 'jazzcash':
    case 'easypaisa':
      return 'Bank Transfer'
    default:
      return 'Cash on Delivery'
  }
}
