import Link from 'next/link'
import Image from 'next/image'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { requireAuth } from '@/lib/auth'
import { getCartItems } from '@/actions/cart'
import { formatPrice } from '@/utils/format'
import { CartItemControls } from '@/components/shop/cart-item-controls'
import { Button } from '@/components/ui/button'
import { buildMetadata } from '@/utils/seo'

export const metadata = buildMetadata({ title: 'Cart', path: '/cart' })

export default async function CartPage() {
  await requireAuth()
  const cartItems = await getCartItems()

  const total = cartItems.reduce((sum, item) => {
    const product = item.products as { price: number }
    return sum + Number(product?.price ?? 0) * item.quantity
  }, 0)

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-6">Your cart is empty</p>
            <Button asChild className="rounded-xl bg-[#1D4ED8]">
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {cartItems.map((item) => {
              const product = item.products as {
                id: string
                name: string
                slug: string
                price: number
                images?: string[]
              }
              return (
                <div key={item.id} className="flex gap-4 bg-card rounded-2xl border p-4">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                    {product?.images?.[0] ? (
                      <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-2xl">📚</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link href={`/shop/${product.slug}`} className="font-semibold hover:text-[#1D4ED8]">
                      {product.name}
                    </Link>
                    <p className="text-[#1D4ED8] font-bold mt-1">{formatPrice(product.price)}</p>
                    <CartItemControls cartItemId={item.id} quantity={item.quantity} />
                  </div>
                  <p className="font-bold">{formatPrice(product.price * item.quantity)}</p>
                </div>
              )
            })}
            <div className="flex justify-between items-center pt-6 border-t">
              <span className="text-xl font-bold">Total</span>
              <span className="text-2xl font-bold text-[#1D4ED8]">{formatPrice(total)}</span>
            </div>
            <Button asChild className="w-full rounded-xl bg-[#D30000] hover:bg-[#D30000]/90 h-12">
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
