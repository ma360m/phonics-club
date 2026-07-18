'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getSession, requireAdmin } from '@/lib/auth'
import { checkoutSchema, normalizePhone } from '@/lib/validations/checkout'
import { SHIPPING_FEE_PKR } from '@/lib/commerce'
import { normalizeShopPaymentMethod, shopPaymentNeedsReceipt } from '@/lib/payment-methods'
import { buildInvoiceHtml } from '@/lib/invoice'
import { getNextInvoiceNumber } from '@/lib/invoice-numbering'
import { buildInvoicePdf, generateOrderAccessToken } from '@/lib/invoice-pdf'
import { getInvoiceTemplate } from '@/lib/site-content'
import { sendLowStockAlertEmail, sendOrderConfirmationEmail, type LowStockEmailAlert } from '@/lib/email/send-order-email'
import { uploadOrderReceipt } from '@/lib/orders/receipt-upload'
import { resolveCartForCheckout, cartItemsToOrderItems } from '@/lib/cart/resolve'
import { GUEST_CART_COOKIE } from '@/lib/cart/guest'
import { friendlyErrorMessage } from '@/lib/friendly-error'
import type { ActionResult, OrderItem } from '@/types'

const orderReceiptSchema = z.object({
  orderId: z.string().uuid('Order link is invalid. Open the order success link again and try uploading the receipt there.'),
  token: z.string().optional(),
  paymentMethod: z.enum(['bank_transfer', 'jazzcash', 'easypaisa', 'credit'], {
    errorMap: () => ({ message: 'Choose Bank Transfer, JazzCash, or EasyPaisa before uploading the receipt.' }),
  }),
})

async function applyStockChangesForOrder(orderId: string, items: OrderItem[]): Promise<LowStockEmailAlert[]> {
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

    return (data ?? []) as LowStockEmailAlert[]
  } catch (error) {
    console.error('[Stock alerts] Could not apply stock changes:', error)
    return []
  }
}

async function validateCoupon(code: string, subtotal: number) {
  const supabase = await createClient()
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

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const shippingFee = SHIPPING_FEE_PKR
  let discountAmount = 0
  let couponCode: string | null = null

  if (parsed.data.couponCode?.trim()) {
    const couponResult = await validateCoupon(parsed.data.couponCode.trim(), subtotal)
    if (couponResult.error) return { success: false, error: couponResult.error }
    discountAmount = couponResult.discount
    items = applyItemDiscounts(items, discountAmount, couponResult.discountPercent)
    couponCode = parsed.data.couponCode.trim().toUpperCase()
  }

  const total = subtotal + shippingFee - discountAmount
  const paymentMethod = normalizeShopPaymentMethod(parsed.data.paymentMethod)
  const receiptRequired = shopPaymentNeedsReceipt(paymentMethod)
  const status = receiptRequired ? 'awaiting_payment' : 'pending'

  const accessToken = user ? null : generateOrderAccessToken()
  const invoiceNumber = await getNextInvoiceNumber()
  const orderIdForReceipt = user?.id ?? `guest-${Date.now()}`

  let receiptUrl: string | null = null
  const receiptFile = formData.get('receipt') as File | null
  if (receiptRequired && (!receiptFile || receiptFile.size <= 0)) {
    return {
      success: false,
      error: 'Please upload a JPG, PNG, or PDF payment receipt for bank transfer, JazzCash, or EasyPaisa orders.',
    }
  }
  if (receiptRequired && receiptFile && receiptFile.size > 0) {
    try {
      receiptUrl = await uploadOrderReceipt(receiptFile, orderIdForReceipt)
    } catch (err) {
      return { success: false, error: friendlyErrorMessage(err, 'Receipt upload failed.') }
    }
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

  const orderPayload = {
    user_id: user?.id ?? null,
    guest_email: user ? null : parsed.data.email,
    access_token: accessToken,
    status: receiptUrl && receiptRequired ? 'payment_review' : status,
    total,
    subtotal,
    shipping_fee: shippingFee,
    discount_amount: discountAmount,
    coupon_code: couponCode,
    member_id: parsed.data.memberId || null,
    payment_method: paymentMethod,
    phone: normalizePhone(parsed.data.phone),
    receipt_url: receiptUrl,
    invoice_number: invoiceNumber,
    items,
    shipping_address: shippingAddress,
  }

  const supabase = user ? await createClient() : await createServiceClient()
  const { data: order, error } = await supabase
    .from('orders')
    .insert(orderPayload as never)
    .select()
    .single()

  if (error) return { success: false, error: friendlyErrorMessage(error, 'Order could not be placed.') }

  const lowStockAlerts = await applyStockChangesForOrder(order.id, items)

  if (couponCode) {
    const couponClient = await createClient()
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
      .select('id, user_id, access_token')
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

    const receiptUrl = await uploadOrderReceipt(receiptFile, order.user_id ?? `guest-${order.id}`)
    const { error: updateError } = await serviceSupabase
      .from('orders')
      .update({
        receipt_url: receiptUrl,
        payment_method: paymentMethod,
        status: 'payment_review',
      } as never)
      .eq('id', order.id)

    if (updateError) {
      return { success: false, error: friendlyErrorMessage(updateError, 'Receipt was uploaded, but the order could not be updated.') }
    }

    revalidatePath('/checkout/success')
    revalidatePath('/admin/orders')
    return { success: true }
  } catch (err) {
    return { success: false, error: friendlyErrorMessage(err, 'Receipt upload failed.') }
  }
}

export async function confirmOrderPaymentAction(orderId: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'processing',
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
