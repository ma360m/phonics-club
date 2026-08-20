import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import { PhonicsAssistant } from '@/components/assistant/phonics-assistant'
import { WhatsAppFloating } from '@/components/layout/whatsapp-button'
import { ShopNowPopup } from '@/components/layout/shop-now-popup'
import { FloatingCartButton } from '@/components/layout/floating-cart-button'
import { buildMetadata, organizationJsonLd, websiteJsonLd } from '@/utils/seo'
import { JsonLd } from '@/components/seo/json-ld'
import { getCurrencySettings } from '@/lib/currency-settings'
import { getContactSettings } from '@/lib/site-content'
import { getDisplayPreferencesInitScript } from '@/lib/display-preferences/init-script'
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
  const [currencySettings, contactSettings] = await Promise.all([
    getCurrencySettings(),
    getContactSettings(),
  ])
  const initialCurrency = currencySettings.defaultCurrency

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: getDisplayPreferencesInitScript() }} />
        <JsonLd data={organizationJsonLd(contactSettings)} />
        <JsonLd data={websiteJsonLd()} />
        <Providers currencySettings={currencySettings} initialCurrency={initialCurrency}>
          {children}
          <ShopNowPopup />
          <FloatingCartButton />
          <PhonicsAssistant contactSettings={contactSettings} />
          <WhatsAppFloating contactSettings={contactSettings} />
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
