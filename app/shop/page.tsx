import { Suspense } from 'react'
import Image from 'next/image'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { BackButton } from '@/components/layout/back-button'
import { ProductCard } from '@/components/shop/product-card'
import { CatalogManager } from '@/components/shop/catalog-manager'
import { CategoryFilter } from '@/components/shop/category-filter'
import { getProducts } from '@/lib/data/queries'
import { PRODUCT_COLLECTIONS, isProductCollection } from '@/lib/product-collections'
import { PRODUCT_CATEGORY_LABELS } from '@/lib/constants'
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
  const collectionProducts = activeCollection || searchQuery
    ? await getProducts(activeCollection ? { collection: activeCollection } : undefined)
    : []
  const categorizedProducts = category
    ? collectionProducts.filter((product) => product.category === category)
    : collectionProducts
  const products = searchQuery ? categorizedProducts.filter((product) => productMatchesSearch(product, searchQuery)) : categorizedProducts
  const availableCategories = Array.from(new Set(collectionProducts.map((product) => product.category)))

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
              {activeCollection ? <input type="hidden" name="collection" value={activeCollection} /> : null}
              {category ? <input type="hidden" name="category" value={category} /> : null}
              <label htmlFor="shop-search" className="sr-only">Search products</label>
              <div className="relative max-w-3xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="shop-search"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search books, readers, workbooks, kits, ISBN or product name"
                  className="h-13 w-full rounded-2xl border border-white/60 bg-white/95 pl-12 pr-4 text-sm text-[#111827] shadow-xl outline-none backdrop-blur transition-colors placeholder:text-slate-500 focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/40"
                />
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

        {activeCollection && (
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
            <CategoryFilter
              currentCategory={category}
              currentCollection={activeCollection}
              availableCategories={availableCategories}
            />
          </div>
        )}

        <Suspense fallback={<div className="grid grid-cols-3 gap-6">Loading...</div>}>
          {!activeCollection ? (
            searchQuery ? (
              products.length === 0 ? (
                <p className="py-20 text-center text-muted-foreground">No products found for &ldquo;{searchQuery}&rdquo;.</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )
            ) : (
              <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
                <h2 className="text-2xl font-bold">Choose a product range</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                  Select Jolly Learning Products or Phonics Club Products above to view the catalog.
                </p>
              </div>
            )
          ) : products.length === 0 ? (
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

function productMatchesSearch(product: Awaited<ReturnType<typeof getProducts>>[number], query: string) {
  const normalizedQuery = normalizeSearch(query)
  const words = normalizedQuery.split(' ').filter(Boolean)
  const categoryLabel = PRODUCT_CATEGORY_LABELS[product.category] ?? product.category
  const isbn = product.isbn ?? (product.metadata?.isbn as string | undefined) ?? ''
  const text = normalizeSearch([
    product.name,
    product.description,
    product.category,
    categoryLabel,
    product.product_number,
    product.sku,
    product.barcode,
    product.alternate_barcode,
    isbn,
    product.metadata?.collection,
  ].filter(Boolean).join(' '))

  if (words.every((word) => text.includes(word))) return true

  const categoryAliases: Record<string, string[]> = {
    'activity-books': ['activity', 'activities'],
    'pupil-books': ['pupil', 'student', 'students'],
    workbooks: ['workbook', 'workbooks', 'practice'],
    'grammar-workbooks': ['grammar workbook', 'grammar practice'],
    'grammar-pupil-books': ['grammar pupil', 'spelling', 'grammar spelling'],
    'teachers-books': ['teacher', 'teachers', 'teacher book', "teacher's book"],
    comprehension: ['comprehension', 'creative writing', 'writing'],
    readers: ['reader', 'readers', 'reading books'],
    'teacher-resources': ['resource', 'resources', 'flashcard', 'flashcards', 'teaching resource'],
    kits: ['kit', 'kits', 'classroom set', 'class set'],
  }

  return (categoryAliases[product.category] ?? []).some((alias) => normalizedQuery.includes(normalizeSearch(alias)))
}

function normalizeSearch(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
