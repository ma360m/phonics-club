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
import { validateAndAnnotateOrderStock, type StockChangeAlert } from '@/lib/orders/stock'
import { incrementMemberDiscountUsage, normalizeMemberId, validateMemberDiscount } from '@/lib/discounts/member-discounts'
import { generateOrderAccessToken, buildInvoicePdf } from '@/lib/invoice-pdf'
import { buildInvoiceHtml, generateInvoiceNumber } from '@/lib/invoice'
import { getNextInvoiceNumber } from '@/lib/invoice-numbering'
import { getInvoiceTemplate } from '@/lib/site-content'
import { getCurrencySettings } from '@/lib/currency-settings'
import { isPaymentMethodEnabled } from '@/lib/payment-method-settings'
import { convertCurrency, normalizeCurrency } from '@/lib/currency'
import { sendLowStockAlertEmail, sendOrderConfirmationEmail } from '@/lib/email/send-order-email'
import { friendlyErrorMessage } from '@/lib/friendly-error'
import { isDuplicateInvoiceNumberError } from '@/lib/invoice-numbering'
import { APP_URL } from '@/lib/constants'
import { generateFastInvoiceToken, getFastInvoiceLinkByToken, hashFastInvoiceToken, isFastInvoiceLinkUsable } from '@/lib/fast-invoice'
import { getAdminInvoiceCustomers, type AdminInvoiceCustomer } from '@/lib/admin/customers'
import type { ActionResult, OrderItem } from '@/types'

const fastInvoiceItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(999),
  name: z.string().trim().min(1).max(240).optional(),
  price: z.coerce.number().min(0).max(10_000_000).optional(),
  isbn: z.string().trim().max(80).optional(),
})

const createFastInvoiceLinkSchema = z.object({
  label: z.string().trim().max(120).optional(),
  recipientEmail: z.string().trim().email().optional().or(z.literal('')),
  requiredMemberId: z.string().trim().max(40).optional(),
  expiresInDays: z.coerce.number().int().min(1).max(365).default(30),
  maxUses: z.coerce.number().int().min(1).max(500).default(1),
  adminOnly: z.boolean().default(false),
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

async function loadFastInvoiceItems(itemsJson: string, allowCustomValues = false): Promise<{ items?: OrderItem[]; error?: string }> {
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
      name: allowCustomValues && selected.name ? selected.name : product.name,
      isbn: allowCustomValues && selected.isbn !== undefined
        ? selected.isbn || undefined
        : product.isbn ?? (product.metadata?.isbn as string | undefined) ?? undefined,
      price: allowCustomValues && selected.price !== undefined ? selected.price : pricing.displayPrice,
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
    adminOnly: formData.get('adminOnly') === 'on',
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
    admin_only: parsed.data.adminOnly,
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

  if (link?.admin_only) {
    await requireAdmin()
  }

  const selectedCustomerId = String(formData.get('customerId') ?? '').trim()
  let assignedUserId: string | null = null
  let selectedCustomerMemberId = ''
  if (link?.admin_only && !selectedCustomerId) {
    return { success: false, error: 'Select a customer before creating the invoice.' }
  }

  if (link?.admin_only) {
    const customers = await getAdminInvoiceCustomers()
    const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId)
    if (!selectedCustomer) {
      return { success: false, error: 'Choose a valid customer from the customer directory.' }
    }
    assignedUserId = selectedCustomer.user_id
    selectedCustomerMemberId = selectedCustomer.member_id ?? ''
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

  const customerEmail = parsed.data.email.trim() || null

  if (link?.required_member_id) {
    const enteredMemberId = normalizeMemberId(parsed.data.memberId)
    if (enteredMemberId !== link.required_member_id) {
      return { success: false, error: 'This fast invoice link is restricted to the assigned Member ID.' }
    }
  }

  const loaded = await loadFastInvoiceItems(String(formData.get('itemsJson') ?? ''), Boolean(link?.admin_only))
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
  const storedMemberId = String(formData.get('customerMemberId') ?? '').trim() || selectedCustomerMemberId || memberId
  const poNumber = String(formData.get('poNumber') ?? '').trim().slice(0, 120) || null
  const ntnNumber = String(formData.get('ntnNumber') ?? '').trim().slice(0, 120) || null
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
  const requestedDocumentType = String(formData.get('documentType') ?? '').trim().toLowerCase()
  if (link?.admin_only && paymentMethod !== 'cod' && requestedDocumentType === 'invoice') {
    return { success: false, error: 'Bank-transfer fast invoices remain estimates until payment is confirmed.' }
  }
  const documentType = link?.admin_only
    ? requestedDocumentType === 'estimate' ? 'estimate' : 'invoice'
    : paymentMethod === 'cod' ? 'invoice' : 'estimate'
  let invoiceNumber = documentType === 'invoice' ? await getNextInvoiceNumber() : null
  const invoiceDateValue = String(formData.get('invoiceDate') ?? '').trim()
  let invoiceDate: string | null = null
  if (link?.admin_only && invoiceDateValue) {
    const parsedInvoiceDate = new Date(invoiceDateValue)
    if (Number.isNaN(parsedInvoiceDate.getTime())) {
      return { success: false, error: 'Enter a valid invoice date.' }
    }
    invoiceDate = parsedInvoiceDate.toISOString()
  }
  const shippingAddress = {
    fullName: parsed.data.fullName,
    email: customerEmail ?? '',
    phone: normalizePhone(parsed.data.phone),
    address: parsed.data.address,
    city: parsed.data.city,
    zip: parsed.data.zip ?? '',
    country: parsed.data.country,
  }

  const orderPayload: Record<string, unknown> = {
    user_id: assignedUserId,
    guest_email: assignedUserId ? null : customerEmail,
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
    member_id: storedMemberId || null,
    payment_method: paymentMethod,
    phone: shippingAddress.phone,
    receipt_url: null,
    notes: String(formData.get('notes') ?? '').trim() || null,
    invoice_number: invoiceNumber,
    document_type: documentType,
    po_number: poNumber,
    ntn_number: ntnNumber,
    finalized_at: null,
    finalized_by: null,
    stock_deducted_at: null,
    stock_deducted_by: null,
    items,
    shipping_address: shippingAddress,
    display_currency: displayCurrency,
    exchange_rate: exchangeRate,
    exchange_rate_timestamp: exchangeRateTimestamp,
    display_subtotal: convertCurrency(subtotal, displayCurrency, exchangeRate),
    display_shipping_fee: convertCurrency(chargedShippingFee, displayCurrency, exchangeRate),
    display_discount_amount: convertCurrency(discountAmount, displayCurrency, exchangeRate),
    display_total: convertCurrency(total, displayCurrency, exchangeRate),
    // The existing orders_source_check allows the canonical admin source.
    // Fast Invoice is an admin-created order, so use that value instead of
    // introducing a new source enum value just for this workflow.
    source: 'admin',
    requires_admin_confirmation: stockCheck.requiresAdminConfirmation,
    admin_confirmation_reason: stockCheck.adminConfirmationReason,
  }
  if (invoiceDate) orderPayload.created_at = invoiceDate

  const supabase = await createServiceClient()
  let { data: order, error } = await supabase
    .from('orders')
    .insert(orderPayload as never)
    .select()
    .single()

  for (let attempt = 1; error && isDuplicateInvoiceNumberError(error) && attempt <= 5; attempt += 1) {
    invoiceNumber = attempt >= 3 ? generateInvoiceNumber() : await getNextInvoiceNumber()
    orderPayload.invoice_number = invoiceNumber
    const retry = await supabase
      .from('orders')
      .insert(orderPayload as never)
      .select()
      .single()
    order = retry.data
    error = retry.error
  }

  if (error || !order) return { success: false, error: friendlyErrorMessage(error, 'Fast invoice order could not be placed.') }

  const lowStockAlerts: StockChangeAlert[] = []

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
  const invoiceHtml = buildInvoiceHtml({ ...order, invoice_number: invoiceNumber, document_type: documentType } as never, template)
  const pdfBytes = await buildInvoicePdf({ ...order, invoice_number: invoiceNumber, document_type: documentType } as never, template)
  const pdfBase64 = Buffer.from(pdfBytes).toString('base64')

  await sendOrderConfirmationEmail(customerEmail, order.id, invoiceNumber ?? 'EST', invoiceHtml, {
    accessToken,
    pdfBase64,
    customerName: parsed.data.fullName,
    customerEmail,
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
  await sendLowStockAlertEmail(lowStockAlerts, order.id, invoiceNumber ?? 'EST')

  revalidatePath('/admin/orders')
  redirect(`/checkout/success?order=${order.id}&token=${accessToken}`)
}

const fastInvoiceCustomerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().min(3).max(40),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  zip: z.string().trim().max(30).optional(),
  memberId: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
})

const fastInvoiceCustomerFields = 'id, user_id, name, email, phone, member_id, address, city, zip, country, notes'

function customerActionError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return 'Customer could not be saved.'
  if (error.code === '42P01' || /admin_customers|schema cache/i.test(error.message ?? '')) {
    return 'Customer directory is not ready. Apply migration 044_admin_invoice_workflow.sql in Supabase first.'
  }
  return friendlyErrorMessage(error, 'Customer could not be saved.')
}

function asFastInvoiceCustomer(row: Record<string, unknown>): AdminInvoiceCustomer {
  return {
    id: String(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
    name: String(row.name ?? ''),
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    member_id: row.member_id ? String(row.member_id) : null,
    address: row.address ? String(row.address) : null,
    city: row.city ? String(row.city) : null,
    zip: row.zip ? String(row.zip) : null,
    country: String(row.country ?? 'Pakistan'),
    notes: row.notes ? String(row.notes) : null,
    source: 'directory',
  }
}

export async function createFastInvoiceCustomerAction(
  _prev: ActionResult<AdminInvoiceCustomer>,
  formData: FormData,
): Promise<ActionResult<AdminInvoiceCustomer>> {
  const admin = await requireAdmin()
  const parsed = fastInvoiceCustomerSchema.safeParse({
    name: formData.get('name'),
    email: String(formData.get('email') ?? '').trim().toLowerCase(),
    phone: formData.get('phone'),
    address: formData.get('address') || undefined,
    city: formData.get('city') || undefined,
    zip: formData.get('zip') || undefined,
    memberId: formData.get('memberId') || undefined,
    notes: formData.get('notes') || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'Enter valid customer details.' }

  const email = parsed.data.email ? parsed.data.email.toLowerCase() : null
  const phone = normalizePhone(parsed.data.phone)
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? await createServiceClient() : await createClient()

  let existing = null
  if (email) {
    const result = await supabase.from('admin_customers').select(fastInvoiceCustomerFields).eq('email', email).maybeSingle()
    if (result.error) return { success: false, error: customerActionError(result.error) }
    existing = result.data
  }
  if (!existing && phone) {
    const result = await supabase.from('admin_customers').select(fastInvoiceCustomerFields).eq('phone', phone).maybeSingle()
    if (result.error) return { success: false, error: customerActionError(result.error) }
    existing = result.data
  }
  if (existing) return { success: true, data: asFastInvoiceCustomer(existing as Record<string, unknown>) }

  const { data, error } = await supabase
    .from('admin_customers')
    .insert({
      name: parsed.data.name,
      email,
      phone,
      member_id: parsed.data.memberId || null,
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      zip: parsed.data.zip || null,
      country: 'Pakistan',
      notes: parsed.data.notes || null,
      created_by: admin.id,
      updated_by: admin.id,
    } as never)
    .select(fastInvoiceCustomerFields)
    .single()

  if (error || !data) return { success: false, error: customerActionError(error) }
  revalidatePath('/admin/customers')
  return { success: true, data: asFastInvoiceCustomer(data as Record<string, unknown>) }
}

const fastInvoiceCouponSchema = z.object({
  code: z.string().trim().min(3).max(40).transform((value) => value.toUpperCase()),
  discountPercent: z.coerce.number().int().min(1).max(100),
  maxUses: z.coerce.number().int().min(1).optional(),
})

export async function createFastInvoiceCouponAction(
  _prev: ActionResult<{ code: string }>,
  formData: FormData,
): Promise<ActionResult<{ code: string }>> {
  await requireAdmin()
  const parsed = fastInvoiceCouponSchema.safeParse({
    code: formData.get('code'),
    discountPercent: formData.get('discountPercent'),
    maxUses: formData.get('maxUses') || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'Enter valid coupon details.' }

  const supabase = await createClient()
  const { error } = await supabase.from('coupons').insert({
    code: parsed.data.code,
    discount_percent: parsed.data.discountPercent,
    discount_amount: null,
    max_uses: parsed.data.maxUses ?? null,
    used_count: 0,
    active: true,
  } as never)
  if (error) return { success: false, error: friendlyErrorMessage(error, 'Coupon could not be created.') }
  revalidatePath('/admin/coupons')
  return { success: true, data: { code: parsed.data.code } }
}

const fastInvoiceMemberSchema = z.object({
  memberId: z.string().trim().min(3).max(40).transform(normalizeMemberId).refine((value) => /^[A-Z0-9_-]{3,40}$/.test(value), 'Member ID may only contain letters, numbers, underscores, and hyphens.'),
  discountPercent: z.coerce.number().int().min(1).max(100),
  freeShipping: z.boolean().default(false),
})

export async function createFastInvoiceMemberDiscountAction(
  _prev: ActionResult<{ memberId: string }>,
  formData: FormData,
): Promise<ActionResult<{ memberId: string }>> {
  const admin = await requireAdmin()
  const parsed = fastInvoiceMemberSchema.safeParse({
    memberId: formData.get('memberId'),
    discountPercent: formData.get('discountPercent'),
    freeShipping: formData.get('freeShipping') === 'on',
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'Enter valid member discount details.' }

  const supabase = await createClient()
  const { error } = await supabase.from('member_discounts').upsert({
    member_id: parsed.data.memberId,
    discount_amount: 0,
    discount_percent: parsed.data.discountPercent,
    free_shipping_enabled: parsed.data.freeShipping,
    max_uses: null,
    used_count: 0,
    active: true,
    created_by: admin.id,
  } as never, { onConflict: 'member_id' })
  if (error) return { success: false, error: friendlyErrorMessage(error, 'Member ID discount could not be created.') }
  revalidatePath('/admin/coupons')
  return { success: true, data: { memberId: parsed.data.memberId } }
}
