import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Inter, Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import { PhonicsAssistant } from '@/components/assistant/phonics-assistant'
import { WhatsAppFloating } from '@/components/layout/whatsapp-button'
import { ShopNowPopup } from '@/components/layout/shop-now-popup'
import { buildMetadata, organizationJsonLd, websiteJsonLd } from '@/utils/seo'
import { JsonLd } from '@/components/seo/json-ld'
import { getCurrencySettings } from '@/lib/currency-settings'
import { CURRENCY_PREFERENCE_KEY, normalizeCurrency } from '@/lib/currency'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = buildMetadata({})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const currencySettings = await getCurrencySettings()
  const cookieStore = await cookies()
  const initialCurrency = normalizeCurrency(cookieStore.get(CURRENCY_PREFERENCE_KEY)?.value, currencySettings.usdEnabled)

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <Providers currencySettings={currencySettings} initialCurrency={initialCurrency}>
          {children}
          <ShopNowPopup />
          <PhonicsAssistant />
          <WhatsAppFloating />
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
