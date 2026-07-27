import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/auth'
import {
  DEFAULT_CURRENCY_SETTINGS,
  normalizeCurrency,
  validateUsdToPkrRate,
  type CurrencySettings,
} from '@/lib/currency'

interface CurrencySettingsRow {
  default_currency?: string | null
  usd_enabled?: boolean | null
  usd_to_pkr_rate?: number | string | null
  rate_mode?: string | null
  last_updated_at?: string | null
  updated_at?: string | null
}

export async function getCurrencySettings(): Promise<CurrencySettings> {
  if (!isSupabaseConfigured()) return DEFAULT_CURRENCY_SETTINGS

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('currency_settings')
      .select('default_currency, usd_enabled, usd_to_pkr_rate, rate_mode, last_updated_at, updated_at')
      .eq('id', 1)
      .maybeSingle()

    return normalizeCurrencySettings(data as CurrencySettingsRow | null)
  } catch {
    return DEFAULT_CURRENCY_SETTINGS
  }
}

export function normalizeCurrencySettings(row?: CurrencySettingsRow | null): CurrencySettings {
  const usdEnabled = row?.usd_enabled ?? DEFAULT_CURRENCY_SETTINGS.usdEnabled
  const rate = validateUsdToPkrRate(row?.usd_to_pkr_rate) ?? DEFAULT_CURRENCY_SETTINGS.usdToPkrRate
  const rateMode = row?.rate_mode === 'automatic' ? 'automatic' : 'manual'

  return {
    defaultCurrency: normalizeCurrency(row?.default_currency, usdEnabled),
    usdEnabled,
    usdToPkrRate: rate,
    rateMode,
    lastUpdatedAt: row?.last_updated_at ?? row?.updated_at ?? DEFAULT_CURRENCY_SETTINGS.lastUpdatedAt,
  }
}
