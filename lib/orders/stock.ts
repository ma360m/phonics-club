import { createServiceClient } from '@/lib/supabase/server'
import { evaluateProductOrderability, type ProductStockStatus } from '@/lib/products/inventory'
import type { OrderItem } from '@/types'

export interface StockAwareOrderItem extends OrderItem {
  stock_status?: ProductStockStatus
  stock_note?: string
  stock_available?: number
}

export interface StockCheckResult {
  items: StockAwareOrderItem[]
  requiresAdminConfirmation: boolean
  adminConfirmationReason: string | null
  customerWarnings: string[]
  error?: string
}

export interface StockChangeAlert {
  product_id: string
  product_name: string
  previous_stock: number
  new_stock: number
  quantity_sold: number
}

interface StockProduct {
  id: string
  name: string
  published?: boolean | null
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

function aggregateItemQuantities(items: OrderItem[]) {
  const quantities = new Map<string, number>()
  for (const item of items) {
    if (!item.product_id) continue
    quantities.set(item.product_id, (quantities.get(item.product_id) ?? 0) + Math.max(0, Number(item.quantity) || 0))
  }
  return quantities
}

async function validateAndAnnotateStock(items: OrderItem[], previousItems: OrderItem[] = []): Promise<StockCheckResult> {
  if (!items.length) {
    return {
      items,
      requiresAdminConfirmation: false,
      adminConfirmationReason: null,
      customerWarnings: [],
      error: 'Add at least one item before placing the order.',
    }
  }

  const productIds = Array.from(new Set(items.map((item) => item.product_id).filter(Boolean)))
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, name, published, stock, reserved_stock, low_stock_threshold, stock_management_enabled, backorder_policy, max_backorder_quantity, max_purchase_quantity, estimated_availability_date, backorder_message')
    .in('id', productIds)

  if (error) {
    return {
      items,
      requiresAdminConfirmation: false,
      adminConfirmationReason: null,
      customerWarnings: [],
      error: 'Stock availability could not be checked right now. Please try again.',
    }
  }

  const products = new Map((data ?? []).map((product) => [product.id, product as StockProduct]))
  const previousQuantities = aggregateItemQuantities(previousItems)
  const customerWarnings: string[] = []
  let requiresAdminConfirmation = false

  const annotatedItems: StockAwareOrderItem[] = []
  for (const item of items) {
    const product = products.get(item.product_id)
    if (!product || product.published === false) {
      return {
        items,
        requiresAdminConfirmation: false,
        adminConfirmationReason: null,
        customerWarnings,
        error: `${item.name} is no longer available.`,
      }
    }

    const restoredProduct = {
      ...product,
      stock: typeof product.stock === 'number' ? product.stock + (previousQuantities.get(item.product_id) ?? 0) : product.stock,
    }
    const stock = evaluateProductOrderability(restoredProduct, item.quantity)
    if (!stock.ok) {
      return {
        items,
        requiresAdminConfirmation: false,
        adminConfirmationReason: null,
        customerWarnings,
        error: `${product.name}: ${stock.message ?? 'This quantity is not available.'}`,
      }
    }

    const nextItem: StockAwareOrderItem = { ...item }
    if (stock.status !== 'in_stock') {
      nextItem.stock_status = stock.status
      nextItem.stock_note = stock.message
      if (typeof stock.available === 'number') nextItem.stock_available = stock.available
      requiresAdminConfirmation = requiresAdminConfirmation || stock.requiresAdminConfirmation
      if (stock.message) customerWarnings.push(`${product.name}: ${stock.message}`)
    }
    annotatedItems.push(nextItem)
  }

  return {
    items: annotatedItems,
    requiresAdminConfirmation,
    adminConfirmationReason: customerWarnings.length ? customerWarnings.join(' | ') : null,
    customerWarnings,
  }
}

export async function validateAndAnnotateOrderStock(items: OrderItem[]): Promise<StockCheckResult> {
  return validateAndAnnotateStock(items)
}

export async function validateAndAnnotateEditedOrderStock(previousItems: OrderItem[], editedItems: OrderItem[]): Promise<StockCheckResult> {
  return validateAndAnnotateStock(editedItems, previousItems)
}

export async function applyStockChangesForOrder(orderId: string, items: OrderItem[]): Promise<StockChangeAlert[]> {
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase.rpc('apply_order_stock_changes' as never, {
      p_order_id: orderId,
      p_items: items,
      p_threshold: 20,
    } as never)

    if (error) {
      console.error('[Stock alerts] Could not apply stock changes:', error.message)
      return []
    }

    return (data ?? []) as StockChangeAlert[]
  } catch (error) {
    console.error('[Stock alerts] Could not apply stock changes:', error)
    return []
  }
}

export async function applyStockDeltaForOrderEdit(orderId: string, previousItems: OrderItem[], nextItems: OrderItem[]): Promise<StockChangeAlert[]> {
  try {
    const previousQuantities = aggregateItemQuantities(previousItems)
    const nextQuantities = aggregateItemQuantities(nextItems)
    const productIds = Array.from(new Set([...previousQuantities.keys(), ...nextQuantities.keys()]))
    if (!productIds.length) return []

    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock, low_stock_threshold, stock_management_enabled, backorder_policy')
      .in('id', productIds)

    if (error) {
      console.error('[Stock edit] Could not load products for stock delta:', error.message)
      return []
    }

    const products = new Map((data ?? []).map((product) => [product.id, product as StockProduct]))
    const alerts: StockChangeAlert[] = []

    for (const productId of productIds) {
      const product = products.get(productId)
      if (!product || product.stock_management_enabled === false) continue

      const previousQuantity = previousQuantities.get(productId) ?? 0
      const nextQuantity = nextQuantities.get(productId) ?? 0
      const delta = nextQuantity - previousQuantity
      if (delta === 0) continue

      const previousStock = Number(product.stock ?? 0)
      const allowsBackorder = product.backorder_policy === 'enabled' || product.backorder_policy === 'enabled_with_warning'
      const newStock = allowsBackorder ? previousStock - delta : Math.max(previousStock - delta, 0)

      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock, updated_at: new Date().toISOString() } as never)
        .eq('id', productId)

      if (updateError) {
        console.error('[Stock edit] Could not update product stock:', updateError.message)
        continue
      }

      const threshold = Math.max(0, Number(product.low_stock_threshold ?? 20))
      if (delta > 0 && newStock < threshold) {
        const alert: StockChangeAlert = {
          product_id: productId,
          product_name: product.name,
          previous_stock: previousStock,
          new_stock: newStock,
          quantity_sold: delta,
        }
        alerts.push(alert)
        await supabase.from('product_stock_alerts').insert({
          product_id: productId,
          order_id: orderId,
          product_name: product.name,
          previous_stock: previousStock,
          new_stock: newStock,
          quantity_sold: delta,
          threshold,
        } as never)
      }
    }

    return alerts
  } catch (error) {
    console.error('[Stock edit] Could not apply stock delta:', error)
    return []
  }
}
