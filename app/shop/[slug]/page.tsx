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

  return (
    <main>
      <JsonLd data={productJsonLd(product)} />
      <AnnouncementBar />
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <BackButton fallbackHref="/shop" />
        <div className="mb-16 grid gap-12 lg:grid-cols-2">
          <ProductGallery images={product.images} name={product.name} />
          <div>
            <Badge className="mb-4">{product.category.replace(/-/g, ' ')}</Badge>
            {isbn ? <p className="mb-4 font-mono text-sm text-muted-foreground">ISBN: {isbn}</p> : null}
            <h1 className="mb-4 text-4xl font-bold">{product.name}</h1>
            <div className="mb-6 flex items-center gap-3">
              <PriceDisplay amountPkr={product.price} className="text-3xl font-bold text-[#1D4ED8]" />
              {product.compare_at_price ? (
                <PriceDisplay
                  amountPkr={product.compare_at_price}
                  showApproxPkr={false}
                  className="text-xl text-muted-foreground line-through"
                />
              ) : null}
            </div>
            {product.description ? (
              <p className="mb-6 leading-relaxed text-muted-foreground">{product.description}</p>
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
