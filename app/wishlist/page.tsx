import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { requireAuth } from '@/lib/auth'
import { getWishlistItems } from '@/actions/wishlist'
import { ProductCard } from '@/components/shop/product-card'
import { Button } from '@/components/ui/button'
import type { Product } from '@/types/database'

export default async function WishlistPage() {
  await requireAuth()
  const items = await getWishlistItems()

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Wishlist</h1>
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-6">Your wishlist is empty</p>
            <Button asChild className="rounded-xl bg-[#1D4ED8]">
              <Link href="/shop">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ProductCard key={item.id} product={item.products as Product} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
