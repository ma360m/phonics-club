'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { z } from 'zod'
import type { ActionResult } from '@/types'

const couponSchema = z.object({
  code: z.string().min(3).toUpperCase(),
  description: z.string().optional(),
  discount_percent: z.coerce.number().min(0).max(100).optional(),
  discount_amount: z.coerce.number().min(0).optional(),
  max_uses: z.coerce.number().int().min(1).optional(),
  active: z.coerce.boolean().default(true),
})

export async function createCouponAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin()
  const parsed = couponSchema.safeParse({
    code: formData.get('code'),
    description: formData.get('description'),
    discount_percent: formData.get('discount_percent') || undefined,
    discount_amount: formData.get('discount_amount') || undefined,
    max_uses: formData.get('max_uses') || undefined,
    active: formData.get('active') === 'on',
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const supabase = await createClient()
  const { error } = await supabase.from('coupons').insert(parsed.data as never)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/coupons')
  return { success: true }
}

export async function deleteCouponAction(id: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('coupons').delete().eq('id', id)
  revalidatePath('/admin/coupons')
}

export async function getAdminCoupons() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  return data ?? []
}
