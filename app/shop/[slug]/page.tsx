import { notFound } from 'next/navigation'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { BackButton } from '@/components/layout/back-button'
import { ProductShopActions } from '@/components/shop/product-shop-actions'
import { ProductCard } from '@/components/shop/product-card'
import { ProductGallery } from '@/components/shop/product-gallery'
import { getProductBySlug, getProducts } from '@/lib/data/queries'
import { buildMetadata, productJsonLd } from '@/utils/seo'
import { JsonLd } from '@/components/seo/json-ld'
import { Badge } from '@/components/ui/badge'
import { PriceDisplay } from '@/components/currency/price-display'
import { getProductPricing } from '@/lib/products/sale-pricing'
import { isProductComingSoon, PRODUCT_COMING_SOON_LABEL, PRODUCT_COMING_SOON_MESSAGE } from '@/lib/products/coming-soon'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return {}
  return buildMetadata({
    title: product.name,
    description: product.description ?? undefined,
    path: `/shop/${product.slug}`,
    image: product.images[0],
  })
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const allProducts = await getProducts()
  const related = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  const isbn = product.isbn ?? (product.metadata?.isbn as string | undefined)
  const pricing = getProductPricing(product)
  const compareAt = pricing.hasSaleDiscount ? pricing.basePrice : Number(product.compare_at_price ?? 0)
  const comingSoon = isProductComingSoon(product)

  return (
    <main>
      <JsonLd data={productJsonLd(product)} />
      <AnnouncementBar />
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <BackButton fallbackHref="/shop" />
        <div className="mb-16 grid gap-12 lg:grid-cols-2">
          <ProductGallery images={product.images} name={product.name} comingSoon={comingSoon} />
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge>{product.category.replace(/-/g, ' ')}</Badge>
              {comingSoon ? (
                <Badge className="bg-[#0F172A] text-white">{PRODUCT_COMING_SOON_LABEL}</Badge>
              ) : null}
              {pricing.hasSaleDiscount && !comingSoon ? (
                <Badge className="bg-gradient-to-r from-[#D30000] via-[#F59E0B] to-[#FBBF24] text-white">
                  {pricing.saleBadgeText}
                </Badge>
              ) : null}
            </div>
            {isbn ? <p className="mb-4 font-mono text-sm text-muted-foreground">ISBN: {isbn}</p> : null}
            <h1 className="mb-4 text-4xl font-bold">{product.name}</h1>
            <div className="mb-6 flex items-center gap-3">
              <PriceDisplay amountPkr={pricing.displayPrice} className="text-3xl font-bold text-[#1D4ED8]" />
              {compareAt > pricing.displayPrice ? (
                <PriceDisplay
                  amountPkr={compareAt}
                  showApproxPkr={false}
                  className="text-xl text-muted-foreground line-through"
                />
              ) : null}
            </div>
            {product.description ? (
              <p className="mb-6 leading-relaxed text-muted-foreground">{product.description}</p>
            ) : null}
            {comingSoon ? (
              <p className="mb-6 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm font-semibold text-[#1D4ED8]">
                {PRODUCT_COMING_SOON_MESSAGE}
              </p>
            ) : null}
            <ProductShopActions product={product} />
          </div>
        </div>

        {related.length > 0 ? (
          <section>
            <h2 className="mb-6 text-2xl font-bold">More in {product.category.replace(/-/g, ' ')}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <Footer />
    </main>
  )
}
