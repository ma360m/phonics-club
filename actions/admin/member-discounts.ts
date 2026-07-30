'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { normalizeMemberId } from '@/lib/discounts/member-discounts'
import type { ActionResult } from '@/types'

const memberDiscountBaseSchema = z.object({
  member_id: z.string().min(3).max(40).transform(normalizeMemberId),
  discount_percent: z.coerce.number().int().min(1, 'Discount percent must be at least 1.').max(100, 'Discount percent cannot be more than 100.'),
  max_uses: z.coerce.number().int().min(1).optional(),
  used_count: z.coerce.number().int().min(0).default(0),
  expires_at: z.string().optional().nullable(),
  active: z.coerce.boolean().default(true),
})

const memberDiscountSchema = memberDiscountBaseSchema.refine((value) => /^[A-Z0-9_-]{3,40}$/.test(value.member_id), {
  message: 'Member ID may only contain letters, numbers, underscores, and hyphens.',
  path: ['member_id'],
})

function normalizeExpiry(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function memberDiscountTableError(error: { message?: string; code?: string } | null | undefined) {
  if (!error) return null
  const message = error.message ?? ''
  if (error.code === '42P01' || /member_discounts|schema cache/i.test(message)) {
    return 'Member ID discounts need database migrations 028 and 029 applied in Supabase, then the schema cache refreshed.'
  }
  return message || 'Member ID discount could not be saved.'
}

export async function upsertMemberDiscountAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin()
  const parsed = memberDiscountSchema.safeParse({
    member_id: formData.get('member_id'),
    discount_percent: formData.get('discount_percent'),
    max_uses: formData.get('max_uses') || undefined,
    used_count: formData.get('used_count') || 0,
    expires_at: formData.get('expires_at') || null,
    active: formData.get('active') === 'on',
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const supabase = await createClient()
  const { error } = await supabase.from('member_discounts').upsert({
    member_id: parsed.data.member_id,
    discount_amount: 0,
    discount_percent: parsed.data.discount_percent,
    max_uses: parsed.data.max_uses ?? null,
    used_count: parsed.data.used_count,
    expires_at: normalizeExpiry(parsed.data.expires_at),
    active: parsed.data.active,
    created_by: admin.id,
  } as never, { onConflict: 'member_id' })

  if (error) return { success: false, error: memberDiscountTableError(error) ?? error.message }
  revalidatePath('/admin/coupons')
  return { success: true }
}

export async function updateMemberDiscountAction(id: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const idParsed = z.string().uuid().safeParse(id)
  const parsed = memberDiscountBaseSchema.omit({ member_id: true }).safeParse({
    discount_percent: formData.get('discount_percent'),
    max_uses: formData.get('max_uses') || undefined,
    used_count: formData.get('used_count') || 0,
    expires_at: formData.get('expires_at') || null,
    active: formData.get('active') === 'on',
  })
  if (!idParsed.success || !parsed.success) return

  const supabase = await createClient()
  await supabase
    .from('member_discounts')
    .update({
      discount_amount: 0,
      discount_percent: parsed.data.discount_percent,
      max_uses: parsed.data.max_uses ?? null,
      used_count: parsed.data.used_count,
      expires_at: normalizeExpiry(parsed.data.expires_at),
      active: parsed.data.active,
    } as never)
    .eq('id', idParsed.data)

  revalidatePath('/admin/coupons')
}

export async function deleteMemberDiscountAction(id: string): Promise<void> {
  await requireAdmin()
  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) return

  const supabase = await createClient()
  await supabase.from('member_discounts').delete().eq('id', idParsed.data)
  revalidatePath('/admin/coupons')
}

export async function getAdminMemberDiscounts() {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('member_discounts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[Member discounts] Failed to load:', memberDiscountTableError(error))
    return []
  }
  return data ?? []
}
