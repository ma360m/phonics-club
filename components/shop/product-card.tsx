'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ZoomIn } from 'lucide-react'
import type { Product } from '@/types/database'
import { ProductImage } from './product-image'
import { ProductCardActions } from './product-shop-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { PriceDisplay } from '@/components/currency/price-display'

export function ProductCard({
  product,
  wishlistMode = false,
}: {
  product: Product
  wishlistMode?: boolean
}) {
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const image = product.images[0]
  const isbn = product.isbn ?? (product.metadata?.isbn as string | undefined)
  const compareAtPrice = Number(product.compare_at_price ?? 0)
  const hasDiscount = compareAtPrice > Number(product.price)

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl">
      <div className="group relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#1D4ED8]/10 to-[#60A5FA]/20">
        <Link href={`/shop/${product.slug}`} className="absolute inset-0 block">
          <ProductImage
            src={image}
            alt={product.name}
            className="transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        {image && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-3 top-3 z-10 h-9 w-9 rounded-full bg-background/90 shadow-md backdrop-blur"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setIsZoomOpen(true)
            }}
            aria-label={`View full image for ${product.name}`}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        )}
        {product.featured && (
          <Badge className="absolute left-3 top-3 bg-[#FBBF24] text-foreground">Featured</Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 pb-2">
        <Link href={`/shop/${product.slug}`} className="group block flex-1">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
            {product.category.replace(/-/g, ' ')}
            {isbn ? <span className="mt-1 block font-mono normal-case">ISBN: {isbn}</span> : null}
          </p>
          <h3 className="line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-[#1D4ED8]">
            {product.name}
          </h3>
          <div className="mt-3 flex items-center gap-2">
            <PriceDisplay amountPkr={product.price} className="text-lg font-bold text-[#1D4ED8]" />
            {hasDiscount && (
              <PriceDisplay
                amountPkr={compareAtPrice}
                showApproxPkr={false}
                className="text-sm text-muted-foreground line-through"
              />
            )}
          </div>
        </Link>
      </div>
      <div className="px-5 pb-5">
        <ProductCardActions product={product} wishlistMode={wishlistMode} />
      </div>

      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-5xl border-0 bg-background/95 p-0 shadow-2xl">
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-background sm:aspect-[3/2]">
            {image ? (
              <ProductImage src={image} alt={product.name} className="p-4 sm:p-6" />
            ) : (
              <div className="flex h-full items-center justify-center text-4xl">📚</div>
            )}
          </div>
          <div className="px-6 pb-6 pt-4">
            <DialogTitle className="text-lg font-semibold">{product.name}</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              Tap outside the image or press escape to close the preview.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
