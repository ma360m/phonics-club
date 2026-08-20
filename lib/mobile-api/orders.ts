import { buildInvoiceHtml } from '@/lib/invoice'
import { buildInvoicePdf } from '@/lib/invoice-pdf'
import { getNextInvoiceNumber } from '@/lib/invoice-numbering'
import { getInvoiceTemplate } from '@/lib/site-content'
import { SHIPPING_FEE_PKR } from '@/lib/commerce'
import { convertCurrency, normalizeCurrency } from '@/lib/currency'
import { getCurrencySettings } from '@/lib/currency-settings'
import { sendLowStockAlertEmail, sendOrderConfirmationEmail, type LowStockEmailAlert } from '@/lib/email/send-order-email'
import { normalizeShopPaymentMethod, shopPaymentNeedsReceipt } from '@/lib/payment-methods'
import { isPaymentMethodEnabled } from '@/lib/payment-method-settings'
import { isProductComingSoon, PRODUCT_COMING_SOON_MESSAGE } from '@/lib/products/coming-soon'
import { getProductPricing } from '@/lib/products/sale-pricing'
import { normalizePhone } from '@/lib/validations/checkout'
import type { MobileAuthContext } from './auth'
import type { z } from 'zod'
import type { mobileCheckoutSchema } from './schemas'
import { MobileApiError } from './response'
import type { OrderItem, Product } from '@/types/database'

type MobileCheckoutInput = z.infer<typeof mobileCheckoutSchema>

interface CouponValidation {
  discount: number
  discountPercent: number
  couponCode: string | null
}

function currentProductPrice(product: Product) {
  const pricing = getProductPricing(product)
  const now = Date.now()
  const startsAt = product.sale_start_at ? new Date(product.sale_start_at).getTime() : null
  const endsAt = product.sale_end_at ? new Date(product.sale_end_at).getTime() : null
  const saleActive =
    product.sale_enabled &&
    pricing.salePrice !== null &&
    (!startsAt || startsAt <= now) &&
    (!endsAt || endsAt >= now)

  return saleActive ? pricing.displayPrice : Number(product.price ?? 0)
}

function productImage(product: Product) {
  return Array.isArray(product.images) ? product.images[0] : undefined
}

function validateProductQuantity(product: Product, quantity: number) {
  if (!product.published) {
    throw new MobileApiError('PRODUCT_UNAVAILABLE', `${product.name} is not available.`, 409)
  }

  if (isProductComingSoon(product)) {
    throw new MobileApiError('PRODUCT_COMING_SOON', `${product.name}: ${PRODUCT_COMING_SOON_MESSAGE}`, 409)
  }

  if (product.max_purchase_quantity && quantity > product.max_purchase_quantity) {
    throw new MobileApiError('PRODUCT_LIMIT_EXCEEDED', `${product.name} has a purchase limit.`, 409)
  }

  if (product.stock_management_enabled === false) return

  const stock = Number(product.stock ?? 0)
  const reserved = Number(product.reserved_stock ?? 0)
  const available = Math.max(stock - reserved, 0)
  if (quantity <= available) return

  const backorderPolicy = product.backorder_policy ?? 'disabled'
  const backorderLimit = Number(product.max_backorder_quantity ?? 0)
  if (backorderPolicy === 'disabled' || quantity > available + backorderLimit) {
    throw new MobileApiError('INSUFFICIENT_STOCK', `${product.name} does not have enough stock.`, 409)
  }
}

async function validateCoupon(
  context: MobileAuthContext,
  code: string | undefined,
  subtotal: number,
): Promise<CouponValidation> {
  const couponCode = code?.trim().toUpperCase()
  if (!couponCode) return { discount: 0, discountPercent: 0, couponCode: null }

  const { data: coupon } = await context.supabase
    .from('coupons')
    .select('*')
    .eq('code', couponCode)
    .eq('active', true)
    .maybeSingle()

  if (!coupon) {
    throw new MobileApiError('VOUCHER_INVALID', 'Voucher code is invalid.', 400)
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    throw new MobileApiError('VOUCHER_EXPIRED', 'Voucher code has expired.', 400)
  }

  if (coupon.max_uses && Number(coupon.used_count ?? 0) >= Number(coupon.max_uses)) {
    throw new MobileApiError('VOUCHER_LIMIT_REACHED', 'Voucher usage limit has been reached.', 400)
  }

  const discountPercent = Number(coupon.discount_percent ?? 0)
  const fixedDiscount = Number(coupon.discount_amount ?? 0)
  const discount = Math.min(
    discountPercent > 0 ? Math.round(subtotal * (discountPercent / 100)) : fixedDiscount,
    subtotal,
  )

  return {
    discount: Math.max(0, discount),
    discountPercent: subtotal > 0 ? (Math.max(0, discount) / subtotal) * 100 : 0,
    couponCode,
  }
}

function applyItemDiscounts(items: OrderItem[], discountAmount: number, discountPercent: number) {
  if (discountAmount <= 0) return items

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  let allocated = 0

  return items.map((item, index) => {
    const lineSubtotal = item.price * item.quantity
    const lineDiscount =
      index === items.length - 1
        ? Math.max(0, discountAmount - allocated)
        : Math.round(lineSubtotal * (discountAmount / Math.max(subtotal, 1)))
    allocated += lineDiscount
    return {
      ...item,
      discount_amount: lineDiscount,
      discount_percent: Number(discountPercent.toFixed(2)),
    }
  })
}

function safeOrder(order: Record<string, unknown>) {
  return {
    id: order.id,
    status: order.status,
    invoiceNumber: order.invoice_number,
    total: Number(order.total ?? 0),
    subtotal: Number(order.subtotal ?? 0),
    shippingFee: Number(order.shipping_fee ?? 0),
    discountAmount: Number(order.discount_amount ?? 0),
    paymentMethod: order.payment_method,
    displayCurrency: order.display_currency,
    displayTotal: order.display_total,
    createdAt: order.created_at,
    receiptRequired: shopPaymentNeedsReceipt(order.payment_method),
  }
}

export async function createMobileCheckoutOrder(context: MobileAuthContext, input: MobileCheckoutInput) {
  const productIds = Array.from(new Set(input.items.map((item) => item.productId)))
  const { data: products, error: productError } = await context.supabase
    .from('products')
    .select('*')
    .in('id', productIds)

  if (productError) {
    throw new MobileApiError('PRODUCTS_UNAVAILABLE', 'Products could not be loaded.', 500)
  }

  const byId = new Map(((products ?? []) as Product[]).map((product) => [product.id, product]))
  const orderItems: OrderItem[] = input.items.map((item) => {
    const product = byId.get(item.productId)
    if (!product) {
      throw new MobileApiError('PRODUCT_NOT_FOUND', 'One or more products could not be found.', 404)
    }

    validateProductQuantity(product, item.quantity)
    return {
      product_id: product.id,
      name: product.name,
      price: currentProductPrice(product),
      quantity: item.quantity,
      image: productImage(product),
    }
  })

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const coupon = await validateCoupon(context, input.voucherCode, subtotal)
  const discountedItems = applyItemDiscounts(orderItems, coupon.discount, coupon.discountPercent)
  const shippingFee = SHIPPING_FEE_PKR
  const total = Math.max(0, subtotal + shippingFee - coupon.discount)
  const paymentMethod = normalizeShopPaymentMethod(input.paymentMethodId)

  if (!(await isPaymentMethodEnabled(paymentMethod, total))) {
    throw new MobileApiError('PAYMENT_METHOD_UNAVAILABLE', 'This payment method is currently unavailable.', 400)
  }

  const currencySettings = await getCurrencySettings()
  const displayCurrency = normalizeCurrency(input.selectedDisplayCurrency, currencySettings.usdEnabled)
  const exchangeRate = currencySettings.usdToPkrRate
  const invoiceNumber = await getNextInvoiceNumber()
  const shippingAddress = {
    fullName: input.deliveryAddress.fullName,
    email: input.deliveryAddress.email,
    phone: normalizePhone(input.deliveryAddress.phone),
    address: input.deliveryAddress.address,
    city: input.deliveryAddress.city,
    zip: input.deliveryAddress.zip ?? '',
    country: input.deliveryAddress.country,
  }

  const receiptRequired = shopPaymentNeedsReceipt(paymentMethod)
  const status = receiptRequired ? 'awaiting_payment' : 'pending'
  const orderPayload = {
    status,
    total,
    subtotal,
    shipping_fee: shippingFee,
    discount_amount: coupon.discount,
    coupon_code: coupon.couponCode,
    member_id: null,
    payment_method: paymentMethod,
    phone: shippingAddress.phone,
    invoice_number: invoiceNumber,
    shipping_address: shippingAddress,
    notes: input.customerNotes ?? null,
    display_currency: displayCurrency,
    exchange_rate: exchangeRate,
    exchange_rate_timestamp: currencySettings.lastUpdatedAt,
    display_subtotal: convertCurrency(subtotal, displayCurrency, exchangeRate),
    display_shipping_fee: convertCurrency(shippingFee, displayCurrency, exchangeRate),
    display_discount_amount: convertCurrency(coupon.discount, displayCurrency, exchangeRate),
    display_total: convertCurrency(total, displayCurrency, exchangeRate),
  }

  const { data: order, error } = await context.supabase.rpc('create_mobile_order' as never, {
    p_user_id: context.user.id,
    p_idempotency_key: input.idempotencyKey,
    p_order_payload: orderPayload,
    p_items: discountedItems,
    p_coupon_code: coupon.couponCode,
    p_stock_threshold: 20,
  } as never)

  if (error || !order) {
    const code = error?.message?.toLowerCase().includes('stock') ? 'INSUFFICIENT_STOCK' : 'CHECKOUT_FAILED'
    throw new MobileApiError(code, code === 'INSUFFICIENT_STOCK' ? 'One or more products do not have enough stock.' : 'Order could not be created.', 409)
  }

  const createdOrder = order as Record<string, unknown>

  await context.supabase.from('cart_items').delete().eq('user_id', context.user.id)

  const { data: lowStockRows } = await context.supabase
    .from('product_stock_alerts')
    .select('product_id, product_name, previous_stock, new_stock, quantity_sold')
    .eq('order_id', createdOrder.id as string)

  const lowStockAlerts = (lowStockRows ?? []) as LowStockEmailAlert[]

  try {
    const template = await getInvoiceTemplate()
    const invoiceHtml = buildInvoiceHtml(createdOrder as never, template)
    const pdfBytes = await buildInvoicePdf(createdOrder as never, template)
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

    await sendOrderConfirmationEmail(
      shippingAddress.email,
      String(createdOrder.id),
      String(createdOrder.invoice_number ?? invoiceNumber),
      invoiceHtml,
      {
        pdfBase64,
        customerName: shippingAddress.fullName,
        customerEmail: shippingAddress.email,
        customerPhone: shippingAddress.phone,
        orderDate: String(createdOrder.created_at ?? new Date().toISOString()),
        paymentStatus: String(createdOrder.status ?? status),
        paymentMethod,
        total,
        displayCurrency,
        displayTotal: convertCurrency(total, displayCurrency, exchangeRate),
        exchangeRate,
        items: discountedItems,
        shippingAddress,
      },
    )
    await sendLowStockAlertEmail(lowStockAlerts, String(createdOrder.id), String(createdOrder.invoice_number ?? invoiceNumber))
  } catch (emailError) {
    console.error('[Mobile checkout] Order email failed:', emailError)
  }

  return safeOrder(createdOrder)
}

export function toMobileOrderSummary(order: Record<string, unknown>) {
  return safeOrder(order)
}
