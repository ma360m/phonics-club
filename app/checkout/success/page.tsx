import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { CheckCircle, Download } from 'lucide-react'
import { ClearGuestCartOnSuccess } from '@/components/checkout/clear-guest-cart-on-success'

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string }>
}) {
  const { order, token } = await searchParams
  const tokenQuery = token ? `&token=${token}` : ''

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ClearGuestCartOnSuccess />
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Order Placed!</h1>
        <p className="text-muted-foreground mb-4">
          Thank you for your order. A confirmation email with your invoice has been sent.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          For bank transfer orders, we will process your order after payment confirmation.
        </p>
        <div className="flex flex-col gap-3">
          {order && (
            <>
              <Button asChild className="rounded-xl bg-[#1D4ED8]">
                <a
                  href={`/api/orders/${order}/invoice?format=pdf${tokenQuery}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="w-4 h-4 mr-2" /> Download Invoice (PDF)
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <a href={`/api/orders/${order}/invoice${token ? `?token=${token}` : ''}`} target="_blank" rel="noreferrer">
                  View Invoice (HTML)
                </a>
              </Button>
            </>
          )}
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </main>
  )
}
