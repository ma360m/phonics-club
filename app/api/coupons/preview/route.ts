import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeMemberId, validateMemberDiscount } from '@/lib/discounts/member-discounts'

const previewCouponSchema = z.object({
  code: z.string().trim().optional().nullable(),
  memberId: z.string().trim().optional().nullable(),
  subtotal: z.coerce.number().min(0),
  shipping: z.coerce.number().min(0).optional().default(0),
}).refine((value) => Boolean(value.code || value.memberId), {
  message: 'Enter a coupon code or Member ID.',
}).refine((value) => !(value.code && value.memberId), {
  message: 'Use either a coupon code or Member ID, not both.',
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = previewCouponSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ valid: false, error: parsed.error.issues[0]?.message ?? 'Enter a valid discount code.' }, { status: 400 })
  }

  const code = parsed.data.code?.trim().toUpperCase() || null
  const memberId = normalizeMemberId(parsed.data.memberId)
  const subtotal = parsed.data.subtotal
  const shipping = parsed.data.shipping
  let couponDiscount = 0
  let memberDiscount = 0
  let couponDiscountPercent = 0
  let memberDiscountPercent = 0
  let freeShipping = false
  let shippingDiscount = 0

  if (code) {
    if (code.length < 3) return NextResponse.json({ valid: false, error: 'Enter a valid coupon code.' }, { status: 400 })
    const supabase = await createServiceClient()
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('code, discount_percent, discount_amount, expires_at, max_uses, used_count')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle()

    if (error) {
      console.error('[Coupon preview] Failed to load coupon:', error.message)
      return NextResponse.json({ valid: false, error: 'Coupon could not be checked right now.' }, { status: 500 })
    }

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Invalid coupon code.' })
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Coupon has expired.' })
    }

    if (coupon.max_uses && (coupon.used_count ?? 0) >= coupon.max_uses) {
      return NextResponse.json({ valid: false, error: 'Coupon usage limit reached.' })
    }

    const percentDiscount = Number(coupon.discount_percent ?? 0)
    const fixedDiscount = Number(coupon.discount_amount ?? 0)
    const rawDiscount = percentDiscount > 0 ? Math.round(subtotal * (percentDiscount / 100)) : fixedDiscount
    couponDiscount = Math.min(Math.max(0, rawDiscount), subtotal)
    couponDiscountPercent = subtotal > 0 ? Number(((couponDiscount / subtotal) * 100).toFixed(2)) : 0
  }

  if (memberId) {
    const memberResult = await validateMemberDiscount(memberId, Math.max(0, subtotal - couponDiscount))
    if (memberResult.error) return NextResponse.json({ valid: false, error: memberResult.error })
    memberDiscount = memberResult.discount
    memberDiscountPercent = Number(memberResult.discountPercent ?? 0)
    freeShipping = Boolean(memberResult.freeShippingEnabled)
    shippingDiscount = freeShipping ? shipping : 0
  }

  const discount = Math.min(subtotal, couponDiscount + memberDiscount)
  const totalDiscount = discount + shippingDiscount

  return NextResponse.json({
    valid: true,
    code,
    memberId: memberId || null,
    discount,
    totalDiscount,
    couponDiscount,
    memberDiscount,
    couponDiscountPercent,
    memberDiscountPercent,
    freeShipping,
    shippingDiscount,
    discountPercent: subtotal > 0 ? Number(((discount / subtotal) * 100).toFixed(2)) : 0,
    subtotalAfterDiscount: Math.max(0, subtotal - discount),
  })
}
