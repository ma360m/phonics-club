import { notFound } from 'next/navigation'
import { AnnouncementBar, Footer, Navbar } from '@/components/layout'
import { FastInvoiceForm } from '@/components/fast-invoice/fast-invoice-form'
import { getFastInvoiceLinkByToken, isFastInvoiceLinkUsable } from '@/lib/fast-invoice'
import { getProducts } from '@/lib/data/queries'
import { getEnabledPaymentMethodSettings } from '@/lib/payment-method-settings'
import { buildMetadata } from '@/utils/seo'

export const dynamic = 'force-dynamic'

export const metadata = buildMetadata({ title: 'Fast Invoice', path: '/fast-invoice' })

export default async function FastInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const link = await getFastInvoiceLinkByToken(token)
  if (!isFastInvoiceLinkUsable(link)) notFound()

  const [products, paymentMethods] = await Promise.all([
    getProducts(),
    getEnabledPaymentMethodSettings(0),
  ])

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-12">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Fast Invoice</p>
          <h1 className="mt-2 text-3xl font-bold">Create your order invoice</h1>
        </div>
        <FastInvoiceForm
          token={token}
          products={products}
          paymentOptions={paymentMethods.map((method) => ({
            value: method.method,
            title: method.displayName,
            description: method.customerInstructions,
          }))}
          recipientEmail={link?.recipient_email}
          requiredMemberId={link?.required_member_id}
        />
      </div>
      <Footer />
    </main>
  )
}
