import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { CartPageClient } from '@/components/cart/cart-page-client'
import { BackButton } from '@/components/layout/back-button'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Cart', path: '/cart' })

export default function CartPage() {
  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <BackButton fallbackHref="/shop" />
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <CartPageClient />
      </div>
      <Footer />
    </main>
  )
}
