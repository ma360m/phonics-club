'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getSession, requireAdmin } from '@/lib/auth'
import { checkoutSchema, normalizePhone } from '@/lib/validations/checkout'
import { ORDER_STATUSES, SHIPPING_FEE_PKR } from '@/lib/commerce'
import { canCustomerEditOrder } from '@/lib/order-status'
import { normalizeShopPaymentMethod, shopPaymentNeedsReceipt } from '@/lib/payment-methods'
import { buildInvoiceHtml } from '@/lib/invoice'
import { getNextInvoiceNumber } from '@/lib/invoice-numbering'
import { buildInvoicePdf, generateOrderAccessToken } from '@/lib/invoice-pdf'
import { getInvoiceTemplate } from '@/lib/site-content'
import { sendLowStockAlertEmail, sendOrderConfirmationEmail } from '@/lib/email/send-order-email'
import { uploadOrderReceiptFile, type OrderReceiptUpload } from '@/lib/orders/receipt-upload'
import { applyStockChangesForOrder, applyStockDeltaForOrderEdit, validateAndAnnotateEditedOrderStock, validateAndAnnotateOrderStock } from '@/lib/orders/stock'
import { resolveCartForCheckout, cartItemsToOrderItems } from '@/lib/cart/resolve'
import { GUEST_CART_COOKIE } from '@/lib/cart/guest'
import { friendlyErrorMessage } from '@/lib/friendly-error'
import { convertCurrency, normalizeCurrency } from '@/lib/currency'
import { getCurrencySettings } from '@/lib/currency-settings'
import { isPaymentMethodEnabled } from '@/lib/payment-method-settings'
import { incrementMemberDiscountUsage, validateMemberDiscount } from '@/lib/discounts/member-discounts'
import { APP_URL } from '@/lib/constants'
import type { ActionResult, OrderItem } from '@/types'

const lockedCustomerStatuses = new Set(['payment_confirmed', 'processing', 'ready_to_dispatch', 'shipped', 'delivered', 'cancelled'])
const MAX_CUSTOMER_ITEM_QUANTITY = 999

const orderReceiptSchema = z.object({
  orderId: z.string().uuid('Order link is invalid. Open the order success link again and try uploading the receipt there.'),
  token: z.string().optional(),
  paymentMethod: z.enum(['bank_transfer', 'credit'], {
    errorMap: () => ({ message: 'Choose Bank Transfer before uploading the receipt.' }),
  }),
})

const customerOrderEditSchema = checkoutSchema
  .pick({
    fullName: true,
    email: true,
    phone: true,
    address: true,
    city: true,
    zip: true,
    country: true,
    paymentMethod: true,
  })
  .extend({
    orderId: z.string().uuid('Order link is invalid.'),
    token: z.string().optional(),
    editToken: z.string().optional(),
  })

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? APP_URL).replace(/\/$/, '')
}

async function getAuthorizedCustomerOrder(orderId: string, token?: string, editToken?: string) {
  const serviceSupabase = await createServiceClient()
  const { data: order, error } = await serviceSupabase
    .from('orders')
    .select('id, user_id, access_token, customer_edit_token, customer_edit_allowed_until, status, created_at, receipt_url, receipt_path, items, subtotal, shipping_fee, discount_amount, discount_percent, display_currency, exchange_rate, invoice_number, requires_admin_confirmation, admin_confirmation_reason')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return { error: friendlyErrorMessage(error ?? 'Order not found', 'Order could not be found.') }
  }

  const user = await getSession()
  const tokenMatches = token && order.access_token && token === order.access_token
  const userOwnsOrder = user?.id && order.user_id === user.id
  const editTokenMatches =
    editToken &&
    order.customer_edit_token &&
    editToken === order.customer_edit_token &&
    order.customer_edit_allowed_until &&
    new Date(order.customer_edit_allowed_until).getTime() > Date.now()

  if (!tokenMatches && !editTokenMatches && !userOwnsOrder) {
    return {
      error:
        'This order is not authorized. Use the original order link or sign in with the account that placed the order.',
    }
  }

  return { order, serviceSupabase }
}

async function validateCoupon(code: string, subtotal: number) {
  const supabase = await createServiceClient()
  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .single()

  if (!coupon) return { discount: 0, discountPercent: 0, error: 'Invalid coupon code' }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { discount: 0, discountPercent: 0, error: 'Coupon has expired' }
  }
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return { discount: 0, discountPercent: 0, error: 'Coupon usage limit reached' }
  }

  let discount = 0
  if (coupon.discount_percent) discount = Math.round(subtotal * (coupon.discount_percent / 100))
  else if (coupon.discount_amount) discount = Number(coupon.discount_amount)

  const cappedDiscount = Math.min(discount, subtotal)
  return {
    discount: cappedDiscount,
    discountPercent: subtotal > 0 ? (cappedDiscount / subtotal) * 100 : 0,
    coupon,
  }
}

function applyItemDiscounts(items: OrderItem[], discountAmount: number, discountPercent: number): OrderItem[] {
  if (discountAmount <= 0) return items

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  if (subtotal <= 0) return items

  let allocated = 0
  return items.map((item, index) => {
    const lineSubtotal = item.price * item.quantity
    const lineDiscount =
      index === items.length - 1
        ? Math.max(0, discountAmount - allocated)
        : Math.round(lineSubtotal * (discountAmount / subtotal))
    allocated += lineDiscount

    return {
      ...item,
      discount_amount: lineDiscount,
      discount_percent: Number(discountPercent.toFixed(2)),
    }
  })
}

function toFiniteNumber(value: unknown, fallback = 0) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : fallback
}

function normalizeStoredOrderItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((rawItem) => {
    if (!rawItem || typeof rawItem !== 'object') return []

    const item = rawItem as Record<string, unknown>
    const productId = typeof item.product_id === 'string' ? item.product_id : ''
    const name = typeof item.name === 'string' ? item.name : ''
    const price = Math.max(0, toFiniteNumber(item.price))
    const quantity = Math.max(0, Math.round(toFiniteNumber(item.quantity)))

    if (!productId || !name || quantity <= 0) return []

    const normalized: OrderItem = {
      product_id: productId,
      name,
      price,
      quantity,
    }

    if (typeof item.image === 'string' && item.image) normalized.image = item.image

    return [normalized]
  })
}

function parseCustomerEditedOrderItems(formData: FormData, existingItems: OrderItem[]) {
  if (!existingItems.length) return { items: existingItems }

  const submittedProductIds = formData.getAll('itemProductId').map((value) => String(value ?? ''))
  const submittedQuantities = formData.getAll('itemQuantity')

  if (submittedProductIds.length !== existingItems.length || submittedQuantities.length !== existingItems.length) {
    return { error: 'Order items are incomplete. Refresh the page and try again.' }
  }

  const editedItems: OrderItem[] = []
  for (let index = 0; index < existingItems.length; index += 1) {
    const existingItem = existingItems[index]
    if (submittedProductIds[index] !== existingItem.product_id) {
      return { error: 'Order items changed. Refresh the page and try again.' }
    }

    const quantity = Number(submittedQuantities[index])
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_CUSTOMER_ITEM_QUANTITY) {
      return { error: 'Choose a valid quantity for each order item.' }
    }

    if (quantity > 0) {
      editedItems.push({
        product_id: existingItem.product_id,
        name: existingItem.name,
        price: Math.max(0, Number(existingItem.price) || 0),
        quantity,
        ...(existingItem.image ? { image: existingItem.image } : {}),
      })
    }
  }

  if (!editedItems.length) {
    return { error: 'Keep at least one item in the order.' }
  }

  return { items: editedItems }
}

function haveOrderItemsChanged(existingItems: OrderItem[], editedItems: OrderItem[]) {
  if (existingItems.length !== editedItems.length) return true

  return existingItems.some((item, index) => {
    const editedItem = editedItems[index]
    return !editedItem || item.product_id !== editedItem.product_id || Number(item.quantity) !== Number(editedItem.quantity)
  })
}

function calculateEditedOrderTotals(
  order: {
    shipping_fee?: number | null
    discount_amount?: number | null
    discount_percent?: number | null
    display_currency?: string | null
    exchange_rate?: number | null
  },
  items: OrderItem[],
) {
  const subtotal = items.reduce((sum, item) => sum + Math.max(0, Number(item.price) || 0) * Math.max(0, Number(item.quantity) || 0), 0)
  const shippingFee = Math.max(0, toFiniteNumber(order.shipping_fee, SHIPPING_FEE_PKR))
  const storedDiscountPercent = Math.max(0, toFiniteNumber(order.discount_percent))
  const storedDiscountAmount = Math.max(0, toFiniteNumber(order.discount_amount))
  const discountAmount = Math.min(
    subtotal,
    storedDiscountPercent > 0 ? Math.round(subtotal * (storedDiscountPercent / 100)) : storedDiscountAmount,
  )
  const discountPercent = subtotal > 0 ? Number(((discountAmount / subtotal) * 100).toFixed(2)) : 0
  const discountedItems = applyItemDiscounts(items, discountAmount, discountPercent)
  const total = Math.max(0, subtotal + shippingFee - discountAmount)
  const displayCurrency = normalizeCurrency(order.display_currency)
  const exchangeRate = toFiniteNumber(order.exchange_rate)
  const displayExchangeRate = exchangeRate > 0 ? exchangeRate : undefined

  return {
    items: discountedItems,
    subtotal,
    shippingFee,
    discountAmount,
    discountPercent,
    total,
    displayCurrency,
    displayExchangeRate,
  }
}

export async function placeOrderAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await getSession()
  const guestCartJson = formData.get('guestCart') as string | null
  const resolvedCart = await resolveCartForCheckout(user?.id ?? null, guestCartJson)

  if (!resolvedCart.length) return { success: false, error: 'Your cart is empty' }

  const parsed = checkoutSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    city: formData.get('city'),
    zip: formData.get('zip') || '',
    country: formData.get('country') || 'Pakistan',
    paymentMethod: formData.get('paymentMethod'),
    couponCode: formData.get('couponCode') || undefined,
    memberId: formData.get('memberId') || undefined,
  })

  if (!parsed.success) {
    return {
      success: false,
      error: friendlyErrorMessage(parsed.error.errors[0]?.message ?? 'Invalid form data', 'Checkout details are incomplete.'),
    }
  }

  let items: OrderItem[] = cartItemsToOrderItems(resolvedCart)
  const stockCheck = await validateAndAnnotateOrderStock(items)
  if (stockCheck.error) return { success: false, error: stockCheck.error }
  items = stockCheck.items

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const shippingFee = SHIPPING_FEE_PKR
  let discountAmount = 0
  let couponDiscountAmount = 0
  let memberDiscountAmount = 0
  let couponDiscountPercent = 0
  let memberDiscountPercent = 0
  let shippingDiscountAmount = 0
  let shippingDiscountReason: string | null = null
  let couponCode: string | null = null
  let memberId: string | null = null

  if (parsed.data.couponCode?.trim()) {
    const couponResult = await validateCoupon(parsed.data.couponCode.trim(), subtotal)
    if (couponResult.error) return { success: false, error: couponResult.error }
    couponDiscountAmount = couponResult.discount
    couponDiscountPercent = Number(couponResult.discountPercent.toFixed(2))
    discountAmount += couponDiscountAmount
    couponCode = parsed.data.couponCode.trim().toUpperCase()
  }

  if (parsed.data.memberId?.trim()) {
    const memberResult = await validateMemberDiscount(parsed.data.memberId, Math.max(0, subtotal - discountAmount))
    if (memberResult.error) return { success: false, error: memberResult.error }
    memberDiscountAmount = memberResult.discount
    memberDiscountPercent = Number(memberResult.discountPercent ?? 0)
    discountAmount += memberDiscountAmount
    memberId = memberResult.memberId
    if (memberResult.freeShippingEnabled) {
      shippingDiscountAmount = shippingFee
      shippingDiscountReason = `Member ID ${memberResult.memberId}`
    }
  }

  discountAmount = Math.min(discountAmount, subtotal)
  const discountPercent = subtotal > 0 ? Number(((discountAmount / subtotal) * 100).toFixed(2)) : 0
  const chargedShippingFee = Math.max(0, shippingFee - shippingDiscountAmount)
  items = applyItemDiscounts(items, discountAmount, discountPercent)

  const total = Math.max(0, subtotal + chargedShippingFee - discountAmount)
  const paymentMethod = normalizeShopPaymentMethod(parsed.data.paymentMethod)
  if (!(await isPaymentMethodEnabled(paymentMethod, total))) {
    return { success: false, error: 'This payment method is currently unavailable. Please choose another payment method.' }
  }
  const receiptRequired = shopPaymentNeedsReceipt(paymentMethod)
  const receiptTiming = String(formData.get('receiptTiming') ?? 'later') === 'now' ? 'now' : 'later'
  const currencySettings = await getCurrencySettings()
  const displayCurrency = normalizeCurrency(formData.get('displayCurrency'), currencySettings.usdEnabled)
  const exchangeRate = currencySettings.usdToPkrRate
  const exchangeRateTimestamp = currencySettings.lastUpdatedAt

  const accessToken = user ? null : generateOrderAccessToken()
  const invoiceNumber = await getNextInvoiceNumber()
  let receiptUrl: string | null = null
  let receiptUpload: OrderReceiptUpload | null = null
  const receiptFile = formData.get('receipt') as File | null
  if (receiptRequired && receiptTiming === 'now' && (!receiptFile || receiptFile.size <= 0)) {
    return {
      success: false,
      error: 'Please upload a JPG, PNG, or PDF payment receipt for bank transfer orders.',
    }
  }
  if (receiptRequired && receiptFile && receiptFile.size > 0) {
    try {
      receiptUpload = await uploadOrderReceiptFile(receiptFile, `orders/pending/${user?.id ?? `guest-${Date.now()}`}`)
    } catch (err) {
      return { success: false, error: friendlyErrorMessage(err, 'Receipt upload failed.') }
    }
  }
  const status = receiptRequired ? (receiptUpload ? 'payment_submitted' : 'awaiting_payment') : 'pending'

  const shippingAddress = {
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phone: normalizePhone(parsed.data.phone),
    address: parsed.data.address,
    city: parsed.data.city,
    zip: parsed.data.zip ?? '',
    country: parsed.data.country,
  }

  const orderPayload: Record<string, unknown> = {
    user_id: user?.id ?? null,
    guest_email: user ? null : parsed.data.email,
    access_token: accessToken,
    status,
    total,
    subtotal,
    shipping_fee: chargedShippingFee,
    discount_amount: discountAmount,
    discount_percent: discountPercent,
    coupon_discount_percent: couponDiscountPercent,
    member_discount_percent: memberDiscountPercent,
    shipping_discount_amount: shippingDiscountAmount,
    shipping_discount_reason: shippingDiscountReason,
    coupon_code: couponCode,
    member_id: memberId,
    payment_method: paymentMethod,
    phone: normalizePhone(parsed.data.phone),
    receipt_url: receiptUrl,
    receipt_bucket: receiptUpload?.bucket ?? null,
    receipt_path: receiptUpload?.path ?? null,
    receipt_filename: receiptUpload?.filename ?? null,
    receipt_mime_type: receiptUpload?.mimeType ?? null,
    receipt_size_bytes: receiptUpload?.sizeBytes ?? null,
    receipt_uploaded_at: receiptUpload ? new Date().toISOString() : null,
    invoice_number: invoiceNumber,
    items,
    shipping_address: shippingAddress,
    display_currency: displayCurrency,
    exchange_rate: exchangeRate,
    exchange_rate_timestamp: exchangeRateTimestamp,
    display_subtotal: convertCurrency(subtotal, displayCurrency, exchangeRate),
    display_shipping_fee: convertCurrency(chargedShippingFee, displayCurrency, exchangeRate),
    display_discount_amount: convertCurrency(discountAmount, displayCurrency, exchangeRate),
    display_total: convertCurrency(total, displayCurrency, exchangeRate),
    requires_admin_confirmation: stockCheck.requiresAdminConfirmation,
    admin_confirmation_reason: stockCheck.adminConfirmationReason,
    source: 'web',
  }

  const supabase = user ? await createClient() : await createServiceClient()
  let { data: order, error } = await supabase
    .from('orders')
    .insert(orderPayload as never)
    .select()
    .single()

  if (error && /display_currency|exchange_rate|display_subtotal|display_total|discount_percent|coupon_discount_percent|member_discount_percent|shipping_discount_amount|shipping_discount_reason|requires_admin_confirmation|admin_confirmation_reason|source/i.test(error.message)) {
    const legacyPayload = { ...orderPayload }
    delete legacyPayload.display_currency
    delete legacyPayload.exchange_rate
    delete legacyPayload.exchange_rate_timestamp
    delete legacyPayload.display_subtotal
    delete legacyPayload.display_shipping_fee
    delete legacyPayload.display_discount_amount
    delete legacyPayload.display_total
    delete legacyPayload.discount_percent
    delete legacyPayload.coupon_discount_percent
    delete legacyPayload.member_discount_percent
    delete legacyPayload.shipping_discount_amount
    delete legacyPayload.shipping_discount_reason
    delete legacyPayload.requires_admin_confirmation
    delete legacyPayload.admin_confirmation_reason
    delete legacyPayload.source
    const retry = await supabase
      .from('orders')
      .insert(legacyPayload as never)
      .select()
      .single()
    order = retry.data
    error = retry.error
  }

  if (error) return { success: false, error: friendlyErrorMessage(error, 'Order could not be placed.') }

  if (receiptUpload) {
    receiptUrl = `/api/orders/${order.id}/receipt`
    const serviceSupabase = await createServiceClient()
    await serviceSupabase
      .from('orders')
      .update({ receipt_url: receiptUrl } as never)
      .eq('id', order.id)
    order = { ...order, receipt_url: receiptUrl }
  }

  const lowStockAlerts = await applyStockChangesForOrder(order.id, items)

  if (couponCode) {
    const couponClient = await createServiceClient()
    const { data: coupon } = await couponClient
      .from('coupons')
      .select('id, used_count')
      .eq('code', couponCode)
      .single()
    if (coupon) {
      await couponClient
        .from('coupons')
        .update({ used_count: (coupon.used_count ?? 0) + 1 } as never)
        .eq('id', coupon.id)
    }
  }

  if (memberId) {
    await incrementMemberDiscountUsage(memberId)
  }

  if (user) {
    const cartClient = await createClient()
    await cartClient.from('cart_items').delete().eq('user_id', user.id)
  } else {
    const cookieStore = await cookies()
    cookieStore.delete(GUEST_CART_COOKIE)
  }

  const template = await getInvoiceTemplate()
  const invoiceHtml = buildInvoiceHtml({ ...order, invoice_number: invoiceNumber } as never, template)
  const pdfBytes = await buildInvoicePdf({ ...order, invoice_number: invoiceNumber } as never, template)
  const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

  await sendOrderConfirmationEmail(parsed.data.email, order.id, invoiceNumber, invoiceHtml, {
    accessToken: accessToken ?? undefined,
    pdfBase64,
    customerName: parsed.data.fullName,
    customerEmail: parsed.data.email,
    customerPhone: shippingAddress.phone,
    orderDate: order.created_at ?? new Date().toISOString(),
    paymentStatus: order.status,
    total: Number(order.total ?? total),
    displayCurrency,
    displayTotal: convertCurrency(total, displayCurrency, exchangeRate),
    exchangeRate,
    items,
    shippingAddress,
    requiresAdminConfirmation: stockCheck.requiresAdminConfirmation,
    adminConfirmationReason: stockCheck.adminConfirmationReason,
  })

  await sendLowStockAlertEmail(lowStockAlerts, order.id, invoiceNumber)

  revalidatePath('/dashboard')
  revalidatePath('/cart')

  const tokenQuery = accessToken ? `&token=${accessToken}` : ''
  redirect(`/checkout/success?order=${order.id}${tokenQuery}`)
}

export async function submitOrderReceiptAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = orderReceiptSchema.safeParse({
    orderId: formData.get('orderId'),
    token: formData.get('token') || undefined,
    paymentMethod: formData.get('paymentMethod'),
  })

  if (!parsed.success) {
    return { success: false, error: friendlyErrorMessage(parsed.error.errors[0]?.message, 'Receipt details are incomplete.') }
  }

  const paymentMethod = normalizeShopPaymentMethod(parsed.data.paymentMethod)
  const receiptFile = formData.get('receipt') as File | null
  if (!receiptFile || receiptFile.size <= 0) {
    return { success: false, error: 'Please choose a JPG, PNG, or PDF receipt before submitting.' }
  }

  const user = await getSession()

  try {
    const serviceSupabase = await createServiceClient()
    const { data: order, error: fetchError } = await serviceSupabase
      .from('orders')
      .select('id, user_id, access_token, status')
      .eq('id', parsed.data.orderId)
      .single()

    if (fetchError || !order) {
      return { success: false, error: friendlyErrorMessage(fetchError ?? 'Order not found', 'Order could not be found.') }
    }

    const tokenMatches = parsed.data.token && order.access_token && parsed.data.token === order.access_token
    const userOwnsOrder = user?.id && order.user_id === user.id
    if (!tokenMatches && !userOwnsOrder) {
      return {
        success: false,
        error: 'Receipt upload is not authorized for this order. Use the original order success link or sign in with the account that placed the order.',
      }
    }
    if (lockedCustomerStatuses.has(order.status)) {
      return { success: false, error: 'This order can no longer accept a payment receipt.' }
    }

    const receiptUpload = await uploadOrderReceiptFile(receiptFile, `orders/${order.id}`)
    const receiptUrl = `/api/orders/${order.id}/receipt`
    const { error: updateError } = await serviceSupabase
      .from('orders')
      .update({
        receipt_url: receiptUrl,
        receipt_bucket: receiptUpload.bucket,
        receipt_path: receiptUpload.path,
        receipt_filename: receiptUpload.filename,
        receipt_mime_type: receiptUpload.mimeType,
        receipt_size_bytes: receiptUpload.sizeBytes,
        receipt_uploaded_at: new Date().toISOString(),
        payment_method: paymentMethod,
        status: 'payment_submitted',
      } as never)
      .eq('id', order.id)

    if (updateError) {
      return { success: false, error: friendlyErrorMessage(updateError, 'Receipt was uploaded, but the order could not be updated.') }
    }

    revalidatePath('/checkout/success')
    revalidatePath('/dashboard')
    revalidatePath('/admin/orders')
    return { success: true }
  } catch (err) {
    return { success: false, error: friendlyErrorMessage(err, 'Receipt upload failed.') }
  }
}

export async function updateCustomerOrderDetailsAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = customerOrderEditSchema.safeParse({
    orderId: formData.get('orderId'),
    token: formData.get('token') || undefined,
    editToken: formData.get('editToken') || undefined,
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    city: formData.get('city'),
    zip: formData.get('zip') || '',
    country: formData.get('country') || 'Pakistan',
    paymentMethod: formData.get('paymentMethod'),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: friendlyErrorMessage(parsed.error.errors[0]?.message, 'Order details are incomplete.'),
    }
  }

  try {
    const result = await getAuthorizedCustomerOrder(parsed.data.orderId, parsed.data.token, parsed.data.editToken)
    if (result.error || !result.order || !result.serviceSupabase) {
      return { success: false, error: result.error ?? 'Order could not be found.' }
    }
    if (!canCustomerEditOrder(result.order.status, result.order.created_at, Date.now(), result.order.customer_edit_allowed_until)) {
      return { success: false, error: 'Orders can only be edited within 10 minutes of placement, unless admin shares a temporary edit link.' }
    }

    const existingItems = normalizeStoredOrderItems(result.order.items)
    const editedItemsResult = parseCustomerEditedOrderItems(formData, existingItems)
    if (editedItemsResult.error || !editedItemsResult.items) {
      return { success: false, error: editedItemsResult.error ?? 'Order items are incomplete.' }
    }
    const itemsChanged = existingItems.length > 0 && haveOrderItemsChanged(existingItems, editedItemsResult.items)
    const stockCheck = itemsChanged ? await validateAndAnnotateEditedOrderStock(existingItems, editedItemsResult.items) : null
    if (stockCheck?.error) {
      return { success: false, error: stockCheck.error }
    }
    const editedTotals = itemsChanged
      ? calculateEditedOrderTotals(result.order, stockCheck?.items ?? editedItemsResult.items)
      : null

    const paymentMethod = normalizeShopPaymentMethod(parsed.data.paymentMethod)
    const receiptFile = formData.get('receipt') as File | null
    let receiptUrl = result.order.receipt_url as string | null
    let receiptUpload: OrderReceiptUpload | null = null
    if (shopPaymentNeedsReceipt(paymentMethod) && receiptFile && receiptFile.size > 0) {
      receiptUpload = await uploadOrderReceiptFile(receiptFile, `orders/${result.order.id}`)
      receiptUrl = `/api/orders/${result.order.id}/receipt`
    }

    const shippingAddress = {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: normalizePhone(parsed.data.phone),
      address: parsed.data.address,
      city: parsed.data.city,
      zip: parsed.data.zip ?? '',
      country: parsed.data.country,
    }
    const hasReceipt = Boolean(receiptUrl || result.order.receipt_path || receiptUpload)
    const status = shopPaymentNeedsReceipt(paymentMethod)
      ? hasReceipt
        ? 'payment_submitted'
        : 'awaiting_payment'
      : 'pending'
    const updatePayload: Record<string, unknown> = {
      payment_method: paymentMethod,
      phone: shippingAddress.phone,
      receipt_url: receiptUrl,
      shipping_address: shippingAddress,
      status,
    }
    if (editedTotals) {
      updatePayload.items = editedTotals.items
      updatePayload.subtotal = editedTotals.subtotal
      updatePayload.shipping_fee = editedTotals.shippingFee
      updatePayload.discount_amount = editedTotals.discountAmount
      updatePayload.discount_percent = editedTotals.discountPercent
      updatePayload.total = editedTotals.total
      updatePayload.display_currency = editedTotals.displayCurrency
      updatePayload.display_subtotal = convertCurrency(editedTotals.subtotal, editedTotals.displayCurrency, editedTotals.displayExchangeRate)
      updatePayload.display_shipping_fee = convertCurrency(editedTotals.shippingFee, editedTotals.displayCurrency, editedTotals.displayExchangeRate)
      updatePayload.display_discount_amount = convertCurrency(editedTotals.discountAmount, editedTotals.displayCurrency, editedTotals.displayExchangeRate)
      updatePayload.display_total = convertCurrency(editedTotals.total, editedTotals.displayCurrency, editedTotals.displayExchangeRate)
      if (stockCheck) {
        updatePayload.requires_admin_confirmation = stockCheck.requiresAdminConfirmation
        updatePayload.admin_confirmation_reason = stockCheck.adminConfirmationReason
      }
    }
    if (receiptUpload) {
      updatePayload.receipt_bucket = receiptUpload.bucket
      updatePayload.receipt_path = receiptUpload.path
      updatePayload.receipt_filename = receiptUpload.filename
      updatePayload.receipt_mime_type = receiptUpload.mimeType
      updatePayload.receipt_size_bytes = receiptUpload.sizeBytes
      updatePayload.receipt_uploaded_at = new Date().toISOString()
    }
    if (!result.order.user_id) updatePayload.guest_email = parsed.data.email

    const { error } = await result.serviceSupabase
      .from('orders')
      .update(updatePayload as never)
      .eq('id', result.order.id)

    if (error) return { success: false, error: friendlyErrorMessage(error, 'Order could not be updated.') }

    if (editedTotals) {
      const lowStockAlerts = await applyStockDeltaForOrderEdit(result.order.id, existingItems, editedTotals.items)
      await sendLowStockAlertEmail(
        lowStockAlerts,
        result.order.id,
        String(result.order.invoice_number ?? result.order.id.slice(0, 8)),
      )
    }

    revalidatePath('/checkout/success')
    revalidatePath('/dashboard')
    revalidatePath('/admin/orders')
    return { success: true }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Order could not be updated.') }
  }
}

export async function cancelCustomerOrderAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const orderId = String(formData.get('orderId') ?? '')
  const token = String(formData.get('token') ?? '') || undefined
  const editToken = String(formData.get('editToken') ?? '') || undefined

  if (!z.string().uuid().safeParse(orderId).success) {
    return { success: false, error: 'Order link is invalid.' }
  }

  try {
    const result = await getAuthorizedCustomerOrder(orderId, token, editToken)
    if (result.error || !result.order || !result.serviceSupabase) {
      return { success: false, error: result.error ?? 'Order could not be found.' }
    }
    if (!canCustomerEditOrder(result.order.status, result.order.created_at, Date.now(), result.order.customer_edit_allowed_until)) {
      return { success: false, error: 'Orders can only be cancelled within 10 minutes of placement, unless admin shares a temporary edit link.' }
    }

    const { error } = await result.serviceSupabase
      .from('orders')
      .update({ status: 'cancelled' } as never)
      .eq('id', result.order.id)

    if (error) return { success: false, error: friendlyErrorMessage(error, 'Order could not be cancelled.') }

    await applyStockDeltaForOrderEdit(result.order.id, normalizeStoredOrderItems(result.order.items), [])

    revalidatePath('/checkout/success')
    revalidatePath('/dashboard')
    revalidatePath('/admin/orders')
    return { success: true }
  } catch (error) {
    return { success: false, error: friendlyErrorMessage(error, 'Order could not be cancelled.') }
  }
}

export async function confirmOrderPaymentAction(orderId: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'payment_confirmed',
      payment_confirmed_at: new Date().toISOString(),
      payment_confirmed_by: admin.id,
    } as never)
    .eq('id', orderId)

  if (error) return { success: false, error: friendlyErrorMessage(error, 'Payment could not be confirmed.') }
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function updateOrderStatusAction(orderId: string, status: string): Promise<ActionResult> {
  await requireAdmin()
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
    return { success: false, error: 'Choose a valid order status.' }
  }
  const supabase = await createClient()
  const { error } = await supabase.from('orders').update({ status } as never).eq('id', orderId)
  if (error) return { success: false, error: friendlyErrorMessage(error, 'Order status could not be updated.') }
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function updateOrderShippingAction(orderId: string, shippingFee: number): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  const normalizedShipping = Math.max(0, Number(shippingFee) || 0)
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('subtotal, discount_amount')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) return { success: false, error: friendlyErrorMessage(fetchError ?? 'Order not found', 'Order totals could not be loaded.') }

  const subtotal = Number(order.subtotal ?? 0)
  const discountAmount = Number(order.discount_amount ?? 0)
  const total = Math.max(0, subtotal + normalizedShipping - discountAmount)

  const { error } = await supabase
    .from('orders')
    .update({ shipping_fee: normalizedShipping, total } as never)
    .eq('id', orderId)

  if (error) return { success: false, error: friendlyErrorMessage(error, 'Shipping fee could not be updated.') }
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function updateOrderInvoiceNumberAction(orderId: string, invoiceNumber: string): Promise<ActionResult> {
  await requireAdmin()
  const cleanInvoiceNumber = invoiceNumber.trim()
  if (!cleanInvoiceNumber) return { success: false, error: 'Invoice number is required' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ invoice_number: cleanInvoiceNumber } as never)
    .eq('id', orderId)

  if (error) return { success: false, error: friendlyErrorMessage(error, 'Invoice number could not be updated.') }
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function allowCustomerInvoiceEditAction(orderId: string): Promise<ActionResult<{ editUrl: string; allowedUntil: string }>> {
  await requireAdmin()

  if (!z.string().uuid().safeParse(orderId).success) {
    return { success: false, error: 'Order link is invalid.' }
  }

  const editToken = generateOrderAccessToken()
  const allowedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  const supabase = await createClient()
  const { data: order, error } = await supabase
    .from('orders')
    .update({
      customer_edit_token: editToken,
      customer_edit_allowed_until: allowedUntil,
      customer_edit_enabled_at: new Date().toISOString(),
    } as never)
    .eq('id', orderId)
    .select('id')
    .single()

  if (error || !order) {
    return { success: false, error: friendlyErrorMessage(error ?? 'Order not found', 'Edit link could not be created.') }
  }

  revalidatePath('/admin/orders')
  return {
    success: true,
    data: {
      allowedUntil,
      editUrl: `${appBaseUrl()}/checkout/success?order=${orderId}&editToken=${editToken}`,
    },
  }
}

export async function updateOrderStatusFormAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get('orderId'))
  const status = String(formData.get('status'))
  const result = await updateOrderStatusAction(orderId, status)
  if (!result.success) throw new Error(result.error)
}

export async function confirmPaymentFormAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get('orderId'))
  const result = await confirmOrderPaymentAction(orderId)
  if (!result.success) throw new Error(result.error)
}

export async function updateOrderShippingFormAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get('orderId'))
  const shippingFee = Number(formData.get('shippingFee'))
  const result = await updateOrderShippingAction(orderId, shippingFee)
  if (!result.success) throw new Error(result.error)
}

export async function updateOrderInvoiceNumberFormAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get('orderId'))
  const invoiceNumber = String(formData.get('invoiceNumber'))
  const result = await updateOrderInvoiceNumberAction(orderId, invoiceNumber)
  if (!result.success) throw new Error(result.error)
}

export async function deleteOrderAction(orderId: string): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('orders').delete().eq('id', orderId)
  if (error) return { success: false, error: friendlyErrorMessage(error, 'Order could not be deleted.') }
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function deleteOrderFormAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get('orderId'))
  const confirm = String(formData.get('confirm'))
  if (confirm !== 'DELETE') throw new Error('Confirmation required')
  const result = await deleteOrderAction(orderId)
  if (!result.success) throw new Error(result.error)
}
