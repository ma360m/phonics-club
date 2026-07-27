'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  CURRENCY_PREFERENCE_KEY,
  convertCurrency,
  DEFAULT_CURRENCY_SETTINGS,
  formatDisplayCurrency,
  normalizeCurrency,
  type CurrencyCode,
  type CurrencySettings,
} from '@/lib/currency'

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
  initialCurrency,
}: {
  children: React.ReactNode
  settings?: CurrencySettings
  initialCurrency?: CurrencyCode
}) {
  const normalizedDefault = normalizeCurrency(initialCurrency ?? settings.defaultCurrency, settings.usdEnabled)
  const [currency, setCurrencyState] = useState<CurrencyCode>(normalizedDefault)

  useEffect(() => {
    const restoreStoredCurrency = () => {
      const stored = window.localStorage.getItem(CURRENCY_PREFERENCE_KEY)
      if (stored) setCurrencyState(normalizeCurrency(stored, settings.usdEnabled))
    }

    let secondFrame: number | null = null
    const frame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(restoreStoredCurrency)
    })

    return () => {
      window.cancelAnimationFrame(frame)
      if (secondFrame !== null) window.cancelAnimationFrame(secondFrame)
    }
  }, [settings.usdEnabled])

  function setCurrency(nextCurrency: CurrencyCode) {
    const normalized = normalizeCurrency(nextCurrency, settings.usdEnabled)
    setCurrencyState(normalized)
    window.localStorage.setItem(CURRENCY_PREFERENCE_KEY, normalized)
    document.cookie = `${CURRENCY_PREFERENCE_KEY}=${normalized}; path=/; max-age=31536000; samesite=lax`
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
