'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { normalizeCurrency, validateUsdToPkrRate } from '@/lib/currency'
import { DEFAULT_PAYMENT_METHOD_SETTINGS } from '@/lib/payment-method-settings'

type RateApiPayload = {
  rate?: unknown
  rates?: Record<string, unknown>
  conversion_rate?: unknown
  result?: unknown
}

const DEFAULT_USD_PKR_RATE_API_URL = 'https://api.frankfurter.dev/v2/rate/USD/PKR'

function extractUsdToPkrRate(payload: RateApiPayload) {
  return validateUsdToPkrRate(
    payload.rate ??
    payload.rates?.PKR ??
    payload.conversion_rate ??
    payload.result,
  )
}

async function fetchAutomaticUsdToPkrRate() {
  const endpoint = process.env.CURRENCY_RATE_API_URL?.trim() || DEFAULT_USD_PKR_RATE_API_URL
  const response = await fetch(endpoint, {
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) throw new Error('Currency rate API returned an error.')

  const payload = await response.json().catch(() => null) as RateApiPayload | null
  const rate = payload ? extractUsdToPkrRate(payload) : null
  if (!rate) throw new Error('Currency rate API returned an unusable USD-to-PKR rate.')

  return {
    rate,
    sourceLabel: endpoint === DEFAULT_USD_PKR_RATE_API_URL ? 'Frankfurter API' : 'Configured server rate API',
  }
}

export async function updateCurrencySettingsAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const usdEnabled = formData.get('usd_enabled') === 'on'
  const defaultCurrency = normalizeCurrency(formData.get('default_currency'), usdEnabled)
  const rateMode = formData.get('rate_mode') === 'automatic' ? 'automatic' : 'manual'
  const manualRate = validateUsdToPkrRate(formData.get('usd_to_pkr_rate'))
  let rate = manualRate
  let sourceLabel = 'Manual admin entry'

  if (rateMode === 'automatic') {
    try {
      const automaticRate = await fetchAutomaticUsdToPkrRate()
      rate = automaticRate.rate
      sourceLabel = automaticRate.sourceLabel
    } catch {
      throw new Error('Automatic exchange-rate update failed. Check server internet access or CURRENCY_RATE_API_URL, or switch to Manual mode.')
    }
  }

  if (!rate) throw new Error('Enter a realistic USD-to-PKR rate between 100 and 600.')

  const supabase = await createClient()
  const { error } = await supabase.from('currency_settings').upsert({
    id: 1,
    default_currency: defaultCurrency,
    usd_enabled: usdEnabled,
    usd_to_pkr_rate: rate,
    rate_mode: rateMode,
    last_updated_at: new Date().toISOString(),
    updated_by: admin.id,
  } as never)
  if (error) throw new Error(error.message)

  await supabase.from('currency_rate_history').insert({
    from_currency: 'USD',
    to_currency: 'PKR',
    rate,
    source_label: sourceLabel,
    updated_by: admin.id,
  } as never)

  revalidateTag('currency-settings')
  revalidatePath('/')
  revalidatePath('/admin/settings/currency')
}

export async function updatePaymentMethodsAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const supabase = await createClient()

  for (const fallback of DEFAULT_PAYMENT_METHOD_SETTINGS) {
    const prefix = fallback.method
    const minRaw = String(formData.get(`${prefix}_min`) ?? '').trim()
    const maxRaw = String(formData.get(`${prefix}_max`) ?? '').trim()
    const { error } = await supabase.from('payment_method_settings').upsert({
      method: fallback.method,
      enabled: formData.get(`${prefix}_enabled`) === 'on',
      display_name: String(formData.get(`${prefix}_display`) ?? fallback.displayName).trim() || fallback.displayName,
      customer_instructions: String(formData.get(`${prefix}_customer`) ?? fallback.customerInstructions).trim(),
      admin_instructions: String(formData.get(`${prefix}_admin`) ?? fallback.adminInstructions).trim(),
      sort_order: Number(formData.get(`${prefix}_sort`) ?? fallback.sortOrder) || fallback.sortOrder,
      min_order_amount: minRaw ? Math.max(0, Number(minRaw) || 0) : null,
      max_order_amount: maxRaw ? Math.max(0, Number(maxRaw) || 0) : null,
      supported_currency: 'PKR',
      proof_upload_required: formData.get(`${prefix}_proof`) === 'on',
      updated_by: admin.id,
    } as never)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/checkout')
  revalidatePath('/admin/settings/payment-methods')
}
