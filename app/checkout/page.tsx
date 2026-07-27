import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { BackButton } from '@/components/layout/back-button'
import { getSession, getProfile } from '@/lib/auth'
import { resolveCartForCheckout } from '@/lib/cart/resolve'
import { getBankDetails } from '@/lib/site-content'
import { getEnabledPaymentMethodSettings } from '@/lib/payment-method-settings'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { redirect } from 'next/navigation'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Checkout', path: '/checkout' })

export default async function CheckoutPage() {
  const user = await getSession()
  const profile = user ? await getProfile() : null
  const cartItems = await resolveCartForCheckout(user?.id ?? null, null)
  const bankDetails = await getBankDetails()

  if (!cartItems.length) redirect('/cart')

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const enabledPaymentMethods = await getEnabledPaymentMethodSettings(subtotal)

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <BackButton fallbackHref="/cart" />
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        {!user && (
          <p className="text-sm text-muted-foreground mb-6">
            Guest checkout — no account required.{' '}
            <a href="/auth/login?redirect=/checkout" className="text-[#1D4ED8] hover:underline">
              Sign in
            </a>{' '}
            for faster reordering.
          </p>
        )}
        <CheckoutForm
          subtotal={subtotal}
          cartItems={cartItems}
          email={profile?.email}
          bankDetails={bankDetails}
          isGuest={!user}
          paymentOptions={enabledPaymentMethods.map((method) => ({
            value: method.method,
            title: method.displayName,
            description: method.customerInstructions,
          }))}
        />
      </div>
      <Footer />
    </main>
  )
}
