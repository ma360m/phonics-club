'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { CurrencyProvider } from '@/components/currency/currency-provider'
import type { CurrencyCode, CurrencySettings } from '@/lib/currency'

export function Providers({
  children,
  currencySettings,
  initialCurrency,
}: {
  children: React.ReactNode
  currencySettings: CurrencySettings
  initialCurrency: CurrencyCode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <CurrencyProvider settings={currencySettings} initialCurrency={initialCurrency}>
        {children}
        <Toaster richColors position="top-right" />
      </CurrencyProvider>
    </ThemeProvider>
  )
}
