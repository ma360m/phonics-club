import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export type AdminFastInvoiceCoupon = {
  code: string
  active?: boolean | null
  discount_percent?: number | null
  discount_amount?: number | null
}

export type AdminFastInvoiceMemberDiscount = {
  member_id: string
  active?: boolean | null
  discount_percent?: number | null
  free_shipping_enabled?: boolean | null
}

/**
 * These are read-only page loaders rather than Server Actions. Keeping them
 * outside `actions/` avoids invoking a module-level `use server` export while
 * a Server Component is rendering the admin-only Fast Invoice page.
 */
export async function getAdminFastInvoiceOptions(): Promise<{
  coupons: AdminFastInvoiceCoupon[]
  memberDiscounts: AdminFastInvoiceMemberDiscount[]
}> {
  await requireAdmin()
  const supabase = await createClient()

  const [couponsResult, memberDiscountsResult] = await Promise.all([
    supabase.from('coupons').select('code, active, discount_percent, discount_amount').order('created_at', { ascending: false }),
    supabase
      .from('member_discounts')
      .select('member_id, active, discount_percent, free_shipping_enabled')
      .order('created_at', { ascending: false }),
  ])

  if (couponsResult.error) {
    console.error('[Fast invoice] Failed to load coupon options:', couponsResult.error)
  }
  if (memberDiscountsResult.error) {
    console.error('[Fast invoice] Failed to load member discount options:', memberDiscountsResult.error)
  }

  return {
    coupons: (couponsResult.data ?? []) as AdminFastInvoiceCoupon[],
    memberDiscounts: (memberDiscountsResult.data ?? []) as AdminFastInvoiceMemberDiscount[],
  }
}
