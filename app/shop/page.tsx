import { Suspense } from 'react'
import Image from 'next/image'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { BackButton } from '@/components/layout/back-button'
import { ProductCard } from '@/components/shop/product-card'
import { CatalogManager } from '@/components/shop/catalog-manager'
import { CategoryFilter } from '@/components/shop/category-filter'
import { getProducts } from '@/lib/data/queries'
import { PRODUCT_COLLECTIONS, isProductCollection } from '@/lib/product-collections'
import { searchProducts } from '@/lib/products/search'
import { buildMetadata } from '@/utils/seo'
import { Search } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Shop',
  description: 'Browse phonics workbooks, flashcards, and educational products',
  path: '/shop',
})

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; collection?: string; q?: string }>
}) {
  const { category, collection, q } = await searchParams
  const activeCollection = isProductCollection(collection) ? collection : undefined
  const searchQuery = (q ?? '').trim()
  const collectionProducts = await getProducts(activeCollection ? { collection: activeCollection } : undefined)
  const categorizedProducts = category
    ? collectionProducts.filter((product) => product.category === category)
    : collectionProducts
  const products = searchQuery ? searchProducts(categorizedProducts, searchQuery) : categorizedProducts
  const availableCategories = Array.from(new Set(collectionProducts.map((product) => product.category)))
  const activeCollectionLabel = PRODUCT_COLLECTIONS.find((item) => item.slug === activeCollection)?.shortLabel
  const hasActiveFilters = Boolean(activeCollection || category || searchQuery)

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <section className="relative isolate overflow-hidden bg-[#0F172A] text-white">
        <Image
          src="/images/gallery/pic.jpg"
          alt="Phonics Club classroom literacy resources"
          fill
          priority
          className="absolute inset-0 -z-20 object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0F172A]/95 via-[#0F172A]/76 to-[#1D4ED8]/28" />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <BackButton fallbackHref="/" />
          <div className="mt-8 max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#FBBF24]">Authorized Phonics Club Shop</p>
            <h1 className="text-4xl font-bold tracking-normal text-white sm:text-5xl">Shop</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/86 sm:text-lg">
              Official Jolly Learning and Phonics Club products. Prices in PKR.
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              Buy only from authorized Phonics Club dealers. PCTB approved materials.
            </p>

            <form action="/shop" className="mt-7">
              <label htmlFor="shop-search" className="sr-only">Search products</label>
              <div className="grid max-w-3xl gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="shop-search"
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="Search books, readers, workbooks, kits, ISBN or product name"
                    className="h-13 w-full rounded-2xl border border-white/60 bg-white/95 pl-12 pr-4 text-sm text-[#111827] shadow-xl outline-none backdrop-blur transition-colors placeholder:text-slate-500 focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/40"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-[#FBBF24] px-6 text-sm font-bold text-[#0F172A] shadow-xl transition-colors hover:bg-[#F59E0B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
                >
                  <Search className="h-4 w-4" />
                  Go
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">

        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {PRODUCT_COLLECTIONS.map((item) => (
              <a
                key={item.slug}
                href={`/shop?collection=${item.slug}`}
                className={`rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${
                  activeCollection === item.slug
                    ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
                    : 'border-border bg-background text-foreground hover:border-[#1D4ED8] hover:text-[#1D4ED8]'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <CatalogManager activeCollection={activeCollection} />
        </div>

        {availableCategories.length > 0 && (
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
            <CategoryFilter
              currentCategory={category}
              currentCollection={activeCollection}
              availableCategories={availableCategories}
            />
          </div>
        )}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Showing {products.length} {products.length === 1 ? 'product' : 'products'}
            {searchQuery ? ` for "${searchQuery}"` : ''}
            {activeCollectionLabel ? ` in ${activeCollectionLabel}` : ''}
          </p>
          {hasActiveFilters ? (
            <a
              href="/shop"
              className="w-fit rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
            >
              Clear filters
            </a>
          ) : null}
        </div>

        <Suspense fallback={<div className="grid grid-cols-3 gap-6">Loading...</div>}>
          {products.length === 0 ? (
            <p className="py-20 text-center text-muted-foreground">
              {searchQuery ? `No products found for "${searchQuery}".` : 'No products found.'}
            </p>
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
