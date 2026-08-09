export type ProductStockStatus = 'in_stock' | 'low_stock' | 'backorder' | 'out_of_stock'

export interface InventoryProduct {
  stock?: number | null
  reserved_stock?: number | null
  low_stock_threshold?: number | null
  stock_management_enabled?: boolean | null
  backorder_policy?: string | null
  max_backorder_quantity?: number | null
  max_purchase_quantity?: number | null
  estimated_availability_date?: string | null
  backorder_message?: string | null
}

export interface ProductOrderability {
  ok: boolean
  status: ProductStockStatus
  available: number | null
  maxQuantity: number
  requiresAdminConfirmation: boolean
  message?: string
}

function numberOrNull(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function formatAvailabilityDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return ` Expected availability: ${date.toLocaleDateString('en-PK')}.`
}

export function isBackorderEnabled(product: InventoryProduct) {
  return product.backorder_policy === 'enabled' || product.backorder_policy === 'enabled_with_warning'
}

export function getAvailableStock(product: InventoryProduct): number | null {
  if (product.stock_management_enabled === false) return null
  const stock = numberOrNull(product.stock) ?? 0
  const reservedStock = numberOrNull(product.reserved_stock) ?? 0
  return Math.max(0, stock - reservedStock)
}

export function getProductPurchaseLimit(product: InventoryProduct) {
  const maxPurchase = numberOrNull(product.max_purchase_quantity)
  if (maxPurchase && maxPurchase > 0) return maxPurchase

  const available = getAvailableStock(product)
  if (available === null) return 999

  const maxBackorder = numberOrNull(product.max_backorder_quantity)
  if (isBackorderEnabled(product)) {
    return maxBackorder == null ? Math.max(available, 99) : Math.max(1, available + maxBackorder)
  }

  return Math.max(available, 1)
}

export function evaluateProductOrderability(product: InventoryProduct, quantity = 1): ProductOrderability {
  const requested = Math.max(1, Math.round(numberOrNull(quantity) ?? 1))
  const maxQuantity = getProductPurchaseLimit(product)

  if (requested > maxQuantity) {
    return {
      ok: false,
      status: isBackorderEnabled(product) ? 'backorder' : 'out_of_stock',
      available: getAvailableStock(product),
      maxQuantity,
      requiresAdminConfirmation: isBackorderEnabled(product),
      message: `Maximum order quantity for this item is ${maxQuantity}.`,
    }
  }

  const available = getAvailableStock(product)
  if (available === null) {
    return { ok: true, status: 'in_stock', available, maxQuantity, requiresAdminConfirmation: false }
  }

  const threshold = Math.max(0, numberOrNull(product.low_stock_threshold) ?? 20)
  const backorderMessage = product.backorder_message?.trim()
  const availability = formatAvailabilityDate(product.estimated_availability_date)

  if (requested > available) {
    if (!isBackorderEnabled(product)) {
      return {
        ok: false,
        status: 'out_of_stock',
        available,
        maxQuantity,
        requiresAdminConfirmation: false,
        message: available > 0
          ? `Only ${available} unit(s) are available right now.`
          : 'This item is currently out of stock.',
      }
    }

    return {
      ok: true,
      status: 'backorder',
      available,
      maxQuantity,
      requiresAdminConfirmation: true,
      message: backorderMessage || `This item will be confirmed by admin before processing because stock is low or on backorder.${availability}`,
    }
  }

  if (available <= threshold) {
    return {
      ok: true,
      status: 'low_stock',
      available,
      maxQuantity,
      requiresAdminConfirmation: true,
      message: `Low stock: ${available} unit(s) available. Admin will confirm the order before processing.`,
    }
  }

  return { ok: true, status: 'in_stock', available, maxQuantity, requiresAdminConfirmation: false }
}

export function getProductStockNotice(product: InventoryProduct, quantity = 1) {
  const result = evaluateProductOrderability(product, quantity)
  return result.status === 'in_stock' ? null : result
}
