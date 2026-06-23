'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getSession, requireAdmin } from '@/lib/auth'
import { checkoutSchema, normalizePhone } from '@/lib/validations/checkout'
import { SHIPPING_FEE_PKR } from '@/lib/commerce'
import { generateInvoiceNumber, buildInvoiceHtml } from '@/lib/invoice'
import { buildInvoicePdf, generateOrderAccessToken } from '@/lib/invoice-pdf'
import { getInvoiceTemplate } from '@/lib/site-content'
import { sendOrderConfirmationEmail } from '@/lib/email/send-order-email'
import { uploadOrderReceipt } from '@/lib/orders/receipt-upload'
import { resolveCartForCheckout, cartItemsToOrderItems } from '@/lib/cart/resolve'
import { GUEST_CART_COOKIE } from '@/lib/cart/guest'
import type { ActionResult, OrderItem } from '@/types'

async function validateCoupon(code: string, subtotal: number) {
  const supabase = await createClient()
  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .single()

  if (!coupon) return { discount: 0, error: 'Invalid coupon code' }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { discount: 0, error: 'Coupon has expired' }
  }
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return { discount: 0, error: 'Coupon usage limit reached' }
  }

  let discount = 0
  if (coupon.discount_percent) discount = Math.round(subtotal * (coupon.discount_percent / 100))
  else if (coupon.discount_amount) discount = Number(coupon.discount_amount)

  return { discount: Math.min(discount, subtotal), coupon }
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
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid form data' }
  }

  const items: OrderItem[] = cartItemsToOrderItems(resolvedCart)

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const shippingFee = SHIPPING_FEE_PKR
  let discountAmount = 0
  let couponCode: string | null = null

  if (parsed.data.couponCode?.trim()) {
    const couponResult = await validateCoupon(parsed.data.couponCode.trim(), subtotal)
    if (couponResult.error) return { success: false, error: couponResult.error }
    discountAmount = couponResult.discount
    couponCode = parsed.data.couponCode.trim().toUpperCase()
  }

  const total = subtotal + shippingFee - discountAmount
  const paymentMethod = parsed.data.paymentMethod
  const status = paymentMethod === 'credit' ? 'awaiting_payment' : 'pending'

  const accessToken = user ? null : generateOrderAccessToken()
  const invoiceNumber = generateInvoiceNumber()
  const orderIdForReceipt = user?.id ?? `guest-${Date.now()}`

  let receiptUrl: string | null = null
  const receiptFile = formData.get('receipt') as File | null
  if (paymentMethod === 'credit' && receiptFile && receiptFile.size > 0) {
    try {
      receiptUrl = await uploadOrderReceipt(receiptFile, orderIdForReceipt)
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Receipt upload failed' }
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
    status: receiptUrl && paymentMethod === 'credit' ? 'payment_review' : status,
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

  if (error) return { success: false, error: error.message }

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

  revalidatePath('/dashboard')
  revalidatePath('/cart')

  const tokenQuery = accessToken ? `&token=${accessToken}` : ''
  redirect(`/checkout/success?order=${order.id}${tokenQuery}`)
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

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/orders')
  return { success: true }
}

export async function updateOrderStatusAction(orderId: string, status: string): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('orders').update({ status } as never).eq('id', orderId)
  if (error) return { success: false, error: error.message }
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

export async function deleteOrderAction(orderId: string): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.from('orders').delete().eq('id', orderId)
  if (error) return { success: false, error: error.message }
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
