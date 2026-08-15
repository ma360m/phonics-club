export interface ProductComingSoonLike {
  coming_soon?: boolean | null
  metadata?: unknown
}

export const PRODUCT_COMING_SOON_LABEL = 'Coming Soon'
export const PRODUCT_COMING_SOON_MESSAGE = 'This product is coming soon.'

export function isProductComingSoon(product: ProductComingSoonLike): boolean {
  if (product.coming_soon === true) return true

  const metadata = product.metadata && typeof product.metadata === 'object' && !Array.isArray(product.metadata)
    ? (product.metadata as Record<string, unknown>)
    : {}
  return metadata.comingSoon === true || metadata.coming_soon === true
}

export function updateProductComingSoonMetadata(
  metadata: Record<string, unknown> | null | undefined,
  comingSoon: boolean
): Record<string, unknown> {
  const next = { ...(metadata ?? {}) }

  if (comingSoon) {
    next.comingSoon = true
  } else {
    delete next.comingSoon
    delete next.coming_soon
  }

  return next
}
