export type CurrencyCode = 'PKR' | 'USD'

export const CURRENCY_PREFERENCE_KEY = 'phonics-club-currency'

export interface CurrencySettings {
  defaultCurrency: CurrencyCode
  usdEnabled: boolean
  usdToPkrRate: number
  rateMode: 'manual' | 'automatic'
  lastUpdatedAt: string
}

export const DEFAULT_USD_TO_PKR_RATE = 280.5

export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  defaultCurrency: 'PKR',
  usdEnabled: true,
  usdToPkrRate: DEFAULT_USD_TO_PKR_RATE,
  rateMode: 'manual',
  lastUpdatedAt: '2026-07-27T00:00:00.000Z',
}

export function normalizeCurrency(value: unknown, usdEnabled = true): CurrencyCode {
  const currency = String(value ?? '').toUpperCase()
  if (currency === 'USD' && usdEnabled) return 'USD'
  return 'PKR'
}

export function validateUsdToPkrRate(value: unknown): number | null {
  const rate = Number(value)
  if (!Number.isFinite(rate)) return null
  if (rate <= 0) return null
  if (rate < 100 || rate > 600) return null
  return rate
}

export function convertCurrency(
  amountPkr: number,
  currency: CurrencyCode,
  usdToPkrRate = DEFAULT_USD_TO_PKR_RATE,
) {
  const amount = Number(amountPkr) || 0
  if (currency === 'USD') return amount / usdToPkrRate
  return amount
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'PKR',
  options: { freeLabel?: boolean; useCode?: boolean } = {},
) {
  const normalizedAmount = Number(amount) || 0
  if (options.freeLabel !== false && normalizedAmount <= 0) return 'Free'

  if (currency === 'USD') {
    return `$${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(normalizedAmount)}`
  }

  const formatted = new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
  }).format(Math.round(normalizedAmount))

  return options.useCode ? `PKR ${formatted}` : `₨ ${formatted}`
}

export function formatDisplayCurrency(
  amountPkr: number,
  currency: CurrencyCode,
  usdToPkrRate = DEFAULT_USD_TO_PKR_RATE,
  options: { freeLabel?: boolean; useCode?: boolean } = {},
) {
  return formatCurrency(convertCurrency(amountPkr, currency, usdToPkrRate), currency, options)
}
