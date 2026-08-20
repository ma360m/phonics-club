'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { checkoutSchema, normalizePhone } from '@/lib/validations/checkout'
import { SHIPPING_FEE_PKR } from '@/lib/commerce'
import { normalizeShopPaymentMethod, shopPaymentNeedsReceipt } from '@/lib/payment-methods'
import { getProductPricing } from '@/lib/products/sale-pricing'
import { validateAndAnnotateOrderStock, applyStockChangesForOrder } from '@/lib/orders/stock'
import { incrementMemberDiscountUsage, normalizeMemberId, validateMemberDiscount } from '@/lib/discounts/member-discounts'
import { generateOrderAccessToken, buildInvoicePdf } from '@/lib/invoice-pdf'
import { buildInvoiceHtml } from '@/lib/invoice'
import { getNextInvoiceNumber } from '@/lib/invoice-numbering'
import { getInvoiceTemplate } from '@/lib/site-content'
import { getCurrencySettings } from '@/lib/currency-settings'
import { isPaymentMethodEnabled } from '@/lib/payment-method-settings'
import { convertCurrency, normalizeCurrency } from '@/lib/currency'
import { sendLowStockAlertEmail, sendOrderConfirmationEmail } from '@/lib/email/send-order-email'
import { friendlyErrorMessage } from '@/lib/friendly-error'
import { APP_URL } from '@/lib/constants'
import { generateFastInvoiceToken, getFastInvoiceLinkByToken, hashFastInvoiceToken, isFastInvoiceLinkUsable } from '@/lib/fast-invoice'
import type { ActionResult, OrderItem } from '@/types'

const fastInvoiceItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(999),
})

const createFastInvoiceLinkSchema = z.object({
  label: z.string().trim().max(120).optional(),
  recipientEmail: z.string().trim().email().optional().or(z.literal('')),
  requiredMemberId: z.string().trim().max(40).optional(),
  expiresInDays: z.coerce.number().int().min(1).max(365).default(30),
  maxUses: z.coerce.number().int().min(1).max(500).default(1),
})

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? APP_URL).replace(/\/$/, '')
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

  const rawDiscount = coupon.discount_percent
    ? Math.round(subtotal * (Number(coupon.discount_percent) / 100))
    : Number(coupon.discount_amount ?? 0)
  const discount = Math.min(Math.max(0, rawDiscount), subtotal)
  return {
    discount,
    discountPercent: subtotal > 0 ? (discount / subtotal) * 100 : 0,
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

async function loadFastInvoiceItems(itemsJson: string): Promise<{ items?: OrderItem[]; error?: string }> {
  let rawItems: unknown
  try {
    rawItems = JSON.parse(itemsJson)
  } catch {
    return { error: 'Choose at least one item for the invoice.' }
  }

  const parsed = z.array(fastInvoiceItemSchema).min(1, 'Choose at least one item for the invoice.').safeParse(rawItems)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Choose valid invoice items.' }

  const productIds = Array.from(new Set(parsed.data.map((item) => item.productId)))
  const supabase = await createServiceClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('published', true)

  if (error) return { error: 'Products could not be loaded right now.' }

  const productMap = new Map((products ?? []).map((product) => [product.id, product]))
  const items: OrderItem[] = []
  for (const selected of parsed.data) {
    const product = productMap.get(selected.productId)
    if (!product) return { error: 'One selected product is unavailable.' }
    const pricing = getProductPricing(product)
    items.push({
      product_id: product.id,
      name: product.name,
      price: pricing.displayPrice,
      quantity: selected.quantity,
      image: product.images?.[0],
    })
  }

  return { items }
}

export async function createFastInvoiceLinkAction(
  _prev: ActionResult<{ url: string }>,
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  const admin = await requireAdmin()
  const parsed = createFastInvoiceLinkSchema.safeParse({
    label: formData.get('label') || undefined,
    recipientEmail: formData.get('recipientEmail') || '',
    requiredMemberId: formData.get('requiredMemberId') || undefined,
    expiresInDays: formData.get('expiresInDays') || 30,
    maxUses: formData.get('maxUses') || 1,
  })

  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const token = generateFastInvoiceToken()
  const expiresAt = new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
  const supabase = await createClient()
  const { error } = await supabase.from('fast_invoice_links').insert({
    token_hash: hashFastInvoiceToken(token),
    label: parsed.data.label?.trim() || 'Fast invoice link',
    recipient_email: parsed.data.recipientEmail?.trim() || null,
    required_member_id: normalizeMemberId(parsed.data.requiredMemberId) || null,
    expires_at: expiresAt,
    max_uses: parsed.data.maxUses,
    created_by: admin.id,
  } as never)

  if (error) return { success: false, error: friendlyErrorMessage(error, 'Fast invoice link could not be created.') }

  revalidatePath('/admin/fast-invoices')
  return { success: true, data: { url: `${appBaseUrl()}/fast-invoice/${token}` } }
}

export async function placeFastInvoiceOrderAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const token = String(formData.get('token') ?? '')
  const link = await getFastInvoiceLinkByToken(token)
  if (!isFastInvoiceLinkUsable(link)) {
    return { success: false, error: 'This fast invoice link is invalid, expired, or already used.' }
  }

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
    return { success: false, error: friendlyErrorMessage(parsed.error.errors[0]?.message, 'Fast invoice details are incomplete.') }
  }

  if (link?.required_member_id) {
    const enteredMemberId = normalizeMemberId(parsed.data.memberId)
    if (enteredMemberId !== link.required_member_id) {
      return { success: false, error: 'This fast invoice link is restricted to the assigned Member ID.' }
    }
  }

  const loaded = await loadFastInvoiceItems(String(formData.get('itemsJson') ?? ''))
  if (loaded.error || !loaded.items) return { success: false, error: loaded.error ?? 'Choose valid invoice items.' }

  let items = loaded.items
  const stockCheck = await validateAndAnnotateOrderStock(items)
  if (stockCheck.error) return { success: false, error: stockCheck.error }
  items = stockCheck.items

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
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
  const status = shopPaymentNeedsReceipt(paymentMethod) ? 'awaiting_payment' : 'pending'
  const currencySettings = await getCurrencySettings()
  const displayCurrency = normalizeCurrency(formData.get('displayCurrency'), currencySettings.usdEnabled)
  const exchangeRate = currencySettings.usdToPkrRate
  const exchangeRateTimestamp = currencySettings.lastUpdatedAt
  const accessToken = generateOrderAccessToken()
  const invoiceNumber = await getNextInvoiceNumber()
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
    user_id: null,
    guest_email: parsed.data.email,
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
    phone: shippingAddress.phone,
    receipt_url: null,
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
    source: 'api',
    requires_admin_confirmation: stockCheck.requiresAdminConfirmation,
    admin_confirmation_reason: stockCheck.adminConfirmationReason,
  }

  const supabase = await createServiceClient()
  const { data: order, error } = await supabase
    .from('orders')
    .insert(orderPayload as never)
    .select()
    .single()

  if (error || !order) return { success: false, error: friendlyErrorMessage(error, 'Fast invoice order could not be placed.') }

  const lowStockAlerts = await applyStockChangesForOrder(order.id, items)

  if (couponCode) {
    const { data: coupon } = await supabase.from('coupons').select('id, used_count').eq('code', couponCode).single()
    if (coupon) {
      await supabase.from('coupons').update({ used_count: (coupon.used_count ?? 0) + 1 } as never).eq('id', coupon.id)
    }
  }
  if (memberId) await incrementMemberDiscountUsage(memberId)
  if (link) {
    await supabase
      .from('fast_invoice_links')
      .update({ used_count: Number(link.used_count ?? 0) + 1, last_used_at: new Date().toISOString() } as never)
      .eq('id', link.id)
  }

  const template = await getInvoiceTemplate()
  const invoiceHtml = buildInvoiceHtml({ ...order, invoice_number: invoiceNumber } as never, template)
  const pdfBytes = await buildInvoicePdf({ ...order, invoice_number: invoiceNumber } as never, template)
  const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

  await sendOrderConfirmationEmail(parsed.data.email, order.id, invoiceNumber, invoiceHtml, {
    accessToken,
    pdfBase64,
    customerName: parsed.data.fullName,
    customerEmail: parsed.data.email,
    customerPhone: shippingAddress.phone,
    orderDate: order.created_at ?? new Date().toISOString(),
    paymentStatus: order.status,
    paymentMethod,
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

  revalidatePath('/admin/orders')
  redirect(`/checkout/success?order=${order.id}&token=${accessToken}`)
}
