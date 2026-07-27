'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  convertCurrency,
  DEFAULT_CURRENCY_SETTINGS,
  formatDisplayCurrency,
  normalizeCurrency,
  type CurrencyCode,
  type CurrencySettings,
} from '@/lib/currency'

const STORAGE_KEY = 'phonics-club-currency'

interface CurrencyContextValue {
  currency: CurrencyCode
  settings: CurrencySettings
  setCurrency: (currency: CurrencyCode) => void
  convert: (amountPkr: number) => number
  format: (amountPkr: number, options?: { freeLabel?: boolean; useCode?: boolean }) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({
  children,
  settings = DEFAULT_CURRENCY_SETTINGS,
}: {
  children: React.ReactNode
  settings?: CurrencySettings
}) {
  const normalizedDefault = normalizeCurrency(settings.defaultCurrency, settings.usdEnabled)
  const [currency, setCurrencyState] = useState<CurrencyCode>(normalizedDefault)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) setCurrencyState(normalizeCurrency(stored, settings.usdEnabled))
  }, [settings.usdEnabled])

  function setCurrency(nextCurrency: CurrencyCode) {
    const normalized = normalizeCurrency(nextCurrency, settings.usdEnabled)
    setCurrencyState(normalized)
    window.localStorage.setItem(STORAGE_KEY, normalized)
  }

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      settings,
      setCurrency,
      convert: (amountPkr) => convertCurrency(amountPkr, currency, settings.usdToPkrRate),
      format: (amountPkr, options) => formatDisplayCurrency(amountPkr, currency, settings.usdToPkrRate, options),
    }),
    [currency, settings],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const value = useContext(CurrencyContext)
  if (!value) throw new Error('useCurrency must be used inside CurrencyProvider')
  return value
}
