'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { CurrencyProvider } from '@/components/currency/currency-provider'
import type { CurrencySettings } from '@/lib/currency'

export function Providers({
  children,
  currencySettings,
}: {
  children: React.ReactNode
  currencySettings: CurrencySettings
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <CurrencyProvider settings={currencySettings}>
        {children}
        <Toaster richColors position="top-right" />
      </CurrencyProvider>
    </ThemeProvider>
  )
}
