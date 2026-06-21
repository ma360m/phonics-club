import Link from 'next/link'
import type { Product } from '@/types/database'
import { ProductImage } from './product-image'
import { ProductCardActions } from './product-shop-actions'
import { formatPrice } from '@/utils/format'
import { Badge } from '@/components/ui/badge'

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0]
  const isbn = product.isbn ?? (product.metadata?.isbn as string | undefined)
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      <Link href={`/shop/${product.slug}`} className="group block flex-1">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-[#1D4ED8]/10 to-[#60A5FA]/20 overflow-hidden">
          <ProductImage
            src={image}
            alt={product.name}
            className="group-hover:scale-105 transition-transform duration-500"
          />
          {product.featured && (
            <Badge className="absolute top-3 left-3 bg-[#FBBF24] text-foreground">Featured</Badge>
          )}
        </div>
        <div className="p-5 pb-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {product.category.replace(/-/g, ' ')}
            {isbn ? <span className="block font-mono normal-case">ISBN: {isbn}</span> : null}
          </p>
          <h3 className="font-semibold text-foreground group-hover:text-[#1D4ED8] transition-colors line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-lg font-bold text-[#1D4ED8]">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-5 pb-5">
        <ProductCardActions product={product} />
      </div>
    </div>
  )
}
