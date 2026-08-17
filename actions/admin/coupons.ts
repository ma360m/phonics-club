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
  expires_at: z.string().optional().nullable(),
  active: z.coerce.boolean().default(true),
})

const couponUpdateSchema = couponSchema.omit({ code: true }).extend({
  used_count: z.coerce.number().int().min(0).default(0),
})

function normalizeExpiry(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

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
    expires_at: formData.get('expires_at') || null,
    active: formData.get('active') === 'on',
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const supabase = await createClient()
  const { error } = await supabase.from('coupons').insert({
    ...parsed.data,
    expires_at: normalizeExpiry(parsed.data.expires_at),
  } as never)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/coupons')
  return { success: true }
}

export async function updateCouponAction(id: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const idParsed = z.string().uuid().safeParse(id)
  const parsed = couponUpdateSchema.safeParse({
    description: formData.get('description') || undefined,
    discount_percent: formData.get('discount_percent') || undefined,
    discount_amount: formData.get('discount_amount') || undefined,
    max_uses: formData.get('max_uses') || undefined,
    used_count: formData.get('used_count') || 0,
    expires_at: formData.get('expires_at') || null,
    active: formData.get('active') === 'on',
  })
  if (!idParsed.success || !parsed.success) return

  const supabase = await createClient()
  await supabase
    .from('coupons')
    .update({
      description: parsed.data.description ?? null,
      discount_percent: parsed.data.discount_percent ?? null,
      discount_amount: parsed.data.discount_amount ?? null,
      max_uses: parsed.data.max_uses ?? null,
      used_count: parsed.data.used_count,
      expires_at: normalizeExpiry(parsed.data.expires_at),
      active: parsed.data.active,
    } as never)
    .eq('id', idParsed.data)
  revalidatePath('/admin/coupons')
}

export async function updateCouponUsageAction(id: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const idParsed = z.string().uuid().safeParse(id)
  const usedCountParsed = z.coerce.number().int().min(0).safeParse(formData.get('used_count'))
  if (!idParsed.success || !usedCountParsed.success) return

  const supabase = await createClient()
  await supabase
    .from('coupons')
    .update({ used_count: usedCountParsed.data } as never)
    .eq('id', idParsed.data)
  revalidatePath('/admin/coupons')
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
