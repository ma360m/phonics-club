import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { BackButton } from '@/components/layout/back-button'
import { ProductShopActions } from '@/components/shop/product-shop-actions'
import { ProductCard } from '@/components/shop/product-card'
import { getProductBySlug, getProducts } from '@/lib/data/queries'
import { buildMetadata, productJsonLd } from '@/utils/seo'
import { JsonLd } from '@/components/seo/json-ld'
import { formatPrice } from '@/utils/format'
import { Badge } from '@/components/ui/badge'

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
      <div className="max-w-7xl mx-auto px-4 py-12">
        <BackButton fallbackHref="/shop" />
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#1D4ED8]/10 to-[#60A5FA]/20">
            {product.images[0] ? (
              <Image src={product.images[0]} alt={product.name} fill className="object-cover" priority sizes="50vw" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-8xl">📚</div>
            )}
          </div>
          <div>
            <Badge className="mb-4">{product.category.replace(/-/g, ' ')}</Badge>
            {isbn ? <p className="text-sm font-mono text-muted-foreground mb-4">ISBN: {isbn}</p> : null}
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-[#1D4ED8]">{formatPrice(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
            </div>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>
            )}
            <p className="text-sm text-muted-foreground mb-6">
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </p>
            <ProductShopActions product={product} />
          </div>
        </div>

        {related.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">More in {product.category.replace(/-/g, ' ')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </main>
  )
}
