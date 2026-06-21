import { Suspense } from 'react'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { BackButton } from '@/components/layout/back-button'
import { ProductCard } from '@/components/shop/product-card'
import { getProducts } from '@/lib/data/queries'
import { buildMetadata } from '@/utils/seo'
import { PRODUCT_CATEGORY_LABELS } from '@/lib/constants'
import { PRODUCT_CATEGORIES } from '@/lib/constants'

export const metadata = buildMetadata({
  title: 'Shop',
  description: 'Browse phonics workbooks, flashcards, and educational products',
  path: '/shop',
})

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const products = await getProducts({ category: category || undefined })

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <BackButton fallbackHref="/" />
        <h1 className="text-4xl font-bold mb-2">Shop — Jolly Phonics Price List 2025</h1>
        <p className="text-muted-foreground mb-2">Official Jolly Learning products · Prices in PKR</p>
        <p className="text-sm text-[#D30000] mb-8">Buy only from authorized Phonics Club dealers. PCTB approved materials.</p>

        <div className="flex flex-wrap gap-2 mb-10">
          <a
            href="/shop"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              !category ? 'bg-[#1D4ED8] text-white' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            All
          </a>
          {PRODUCT_CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={`/shop?category=${cat}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                category === cat ? 'bg-[#1D4ED8] text-white' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {PRODUCT_CATEGORY_LABELS[cat] ?? cat}
            </a>
          ))}
        </div>

        <Suspense fallback={<div className="grid grid-cols-3 gap-6">Loading...</div>}>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-center py-20">No products found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Suspense>
      </div>
      <Footer />
    </main>
  )
}
