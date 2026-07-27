import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/auth'
import { ACTIVE_SHOP_PAYMENT_METHODS, normalizeShopPaymentMethod, type ShopPaymentMethod } from '@/lib/payment-methods'

export interface PaymentMethodSetting {
  method: ShopPaymentMethod
  enabled: boolean
  displayName: string
  customerInstructions: string
  adminInstructions: string
  sortOrder: number
  minOrderAmount: number | null
  maxOrderAmount: number | null
  supportedCurrency: string
  proofUploadRequired: boolean
}

export const DEFAULT_PAYMENT_METHOD_SETTINGS: PaymentMethodSetting[] = [
  {
    method: 'cod',
    enabled: true,
    displayName: 'Cash on Delivery',
    customerInstructions: 'Pay when your order is delivered.',
    adminInstructions: '',
    sortOrder: 10,
    minOrderAmount: null,
    maxOrderAmount: null,
    supportedCurrency: 'PKR',
    proofUploadRequired: false,
  },
  {
    method: 'bank_transfer',
    enabled: true,
    displayName: 'Bank Transfer',
    customerInstructions: 'Transfer to the Phonics Club Meezan Bank account and upload your receipt.',
    adminInstructions: 'Verify uploaded payment receipts before processing the order.',
    sortOrder: 20,
    minOrderAmount: null,
    maxOrderAmount: null,
    supportedCurrency: 'PKR',
    proofUploadRequired: true,
  },
]

function normalizePaymentSetting(row: Record<string, unknown>): PaymentMethodSetting {
  const method = normalizeShopPaymentMethod(row.method)
  const fallback = DEFAULT_PAYMENT_METHOD_SETTINGS.find((item) => item.method === method)!
  return {
    method,
    enabled: Boolean(row.enabled ?? fallback.enabled),
    displayName: String(row.display_name ?? fallback.displayName),
    customerInstructions: String(row.customer_instructions ?? fallback.customerInstructions),
    adminInstructions: String(row.admin_instructions ?? fallback.adminInstructions),
    sortOrder: Number(row.sort_order ?? fallback.sortOrder),
    minOrderAmount: row.min_order_amount === null || row.min_order_amount === undefined ? null : Number(row.min_order_amount),
    maxOrderAmount: row.max_order_amount === null || row.max_order_amount === undefined ? null : Number(row.max_order_amount),
    supportedCurrency: String(row.supported_currency ?? fallback.supportedCurrency),
    proofUploadRequired: Boolean(row.proof_upload_required ?? fallback.proofUploadRequired),
  }
}

export async function getPaymentMethodSettings(): Promise<PaymentMethodSetting[]> {
  if (!isSupabaseConfigured()) return DEFAULT_PAYMENT_METHOD_SETTINGS

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('payment_method_settings')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!data?.length) return DEFAULT_PAYMENT_METHOD_SETTINGS
    const byMethod = new Map(
      data
        .filter((row) => ACTIVE_SHOP_PAYMENT_METHODS.includes(normalizeShopPaymentMethod(row.method) as never))
        .map((row) => [normalizeShopPaymentMethod(row.method), normalizePaymentSetting(row as Record<string, unknown>)])
    )
    return DEFAULT_PAYMENT_METHOD_SETTINGS
      .map((fallback) => byMethod.get(fallback.method) ?? fallback)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  } catch {
    return DEFAULT_PAYMENT_METHOD_SETTINGS
  }
}

export async function getEnabledPaymentMethodSettings(orderTotal = 0): Promise<PaymentMethodSetting[]> {
  const settings = await getPaymentMethodSettings()
  return settings.filter((method) => {
    if (!ACTIVE_SHOP_PAYMENT_METHODS.includes(method.method as never)) return false
    if (!method.enabled) return false
    if (method.minOrderAmount !== null && orderTotal < method.minOrderAmount) return false
    if (method.maxOrderAmount !== null && orderTotal > method.maxOrderAmount) return false
    return true
  })
}

export async function isPaymentMethodEnabled(method: ShopPaymentMethod, orderTotal = 0) {
  const settings = await getEnabledPaymentMethodSettings(orderTotal)
  return settings.some((item) => item.method === method)
}
