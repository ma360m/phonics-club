import { Suspense } from 'react'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { BackButton } from '@/components/layout/back-button'
import { ProductCard } from '@/components/shop/product-card'
import { CatalogManager } from '@/components/shop/catalog-manager'
import { CategoryFilter } from '@/components/shop/category-filter'
import { getProducts } from '@/lib/data/queries'
import { buildMetadata } from '@/utils/seo'

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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <BackButton fallbackHref="/" />
        <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Shop</h1>
        <p className="mb-2 text-sm text-muted-foreground sm:text-base">Official Jolly Learning products · Prices in PKR</p>
        <p className="mb-8 text-sm text-[#D30000]">Buy only from authorized Phonics Club dealers. PCTB approved materials.</p>

        <div className="mb-8">
          <CatalogManager />
        </div>

        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
          <CategoryFilter currentCategory={category} />
        </div>

        <Suspense fallback={<div className="grid grid-cols-3 gap-6">Loading...</div>}>
          {products.length === 0 ? (
            <p className="py-20 text-center text-muted-foreground">No products found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
