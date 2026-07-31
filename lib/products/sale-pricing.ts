type SalePricedProduct = {
  price: number
  sale_enabled?: boolean | null
  sale_price?: number | null
  sale_percentage?: number | null
  sale_badge_text?: string | null
}

export function getProductPricing(product: SalePricedProduct) {
  const basePrice = Number(product.price ?? 0)
  const saleEnabled = Boolean(product.sale_enabled)
  const explicitSalePrice = Number(product.sale_price ?? 0)
  const salePercentage = Number(product.sale_percentage ?? 0)

  let salePrice: number | null = null
  if (saleEnabled && explicitSalePrice > 0 && explicitSalePrice < basePrice) {
    salePrice = explicitSalePrice
  } else if (saleEnabled && salePercentage > 0 && salePercentage <= 100) {
    salePrice = Math.max(0, Math.round(basePrice * (1 - salePercentage / 100)))
  }

  const hasSaleDiscount = salePrice !== null && salePrice < basePrice
  const discountPercent = salePrice !== null && hasSaleDiscount && basePrice > 0
    ? Math.max(1, Math.round(((basePrice - salePrice) / basePrice) * 100))
    : 0
  const configuredBadge = product.sale_badge_text?.trim()

  return {
    basePrice,
    displayPrice: salePrice ?? basePrice,
    salePrice,
    saleEnabled,
    hasSaleDiscount,
    discountPercent,
    saleBadgeText: discountPercent > 0 ? `${discountPercent}% off` : configuredBadge || 'Sale',
  }
}
