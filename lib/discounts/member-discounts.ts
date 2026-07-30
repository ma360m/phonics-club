import { createServiceClient } from '@/lib/supabase/server'

export function normalizeMemberId(value: unknown) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

function isMissingMemberDiscountTable(error: { message?: string; code?: string } | null | undefined) {
  return Boolean(error?.code === '42P01' || /member_discounts|schema cache/i.test(error?.message ?? ''))
}

export async function validateMemberDiscount(input: unknown, subtotal: number) {
  const memberId = normalizeMemberId(input)
  if (!memberId) return { discount: 0, memberId: null as string | null }
  if (!/^[A-Z0-9_-]{3,40}$/.test(memberId)) {
    return { discount: 0, memberId, error: 'Enter a valid Member ID.' }
  }

  const supabase = await createServiceClient()
  const { data: member, error } = await supabase
    .from('member_discounts')
    .select('id, member_id, discount_percent, free_shipping_enabled, max_uses, used_count, active, expires_at')
    .eq('member_id', memberId)
    .maybeSingle()

  if (error) {
    return {
      discount: 0,
      memberId,
      error: isMissingMemberDiscountTable(error)
        ? 'Member ID discounts are not enabled yet. Please ask the admin to apply the latest database migrations.'
        : 'Member ID could not be checked right now.',
    }
  }
  if (!member || member.active === false) return { discount: 0, memberId, error: 'Invalid Member ID.' }
  if (member.expires_at && new Date(member.expires_at) < new Date()) {
    return { discount: 0, memberId, error: 'This Member ID has expired.' }
  }
  if (member.max_uses && Number(member.used_count ?? 0) >= Number(member.max_uses)) {
    return { discount: 0, memberId, error: 'This Member ID usage limit has been reached.' }
  }

  const availableSubtotal = Math.max(0, Number(subtotal) || 0)
  const discountPercent = Math.min(100, Math.max(0, Number(member.discount_percent ?? 0)))
  const freeShippingEnabled = Boolean(member.free_shipping_enabled)
  if (discountPercent <= 0 && !freeShippingEnabled) {
    return { discount: 0, memberId, error: 'This Member ID has no active discount.' }
  }

  const discount = Math.min(Math.round(availableSubtotal * (discountPercent / 100)), availableSubtotal)
  return {
    discount,
    discountPercent,
    freeShippingEnabled,
    memberId: member.member_id as string,
    member,
  }
}

export async function incrementMemberDiscountUsage(memberId: string) {
  const normalized = normalizeMemberId(memberId)
  if (!normalized) return

  const supabase = await createServiceClient()
  const { data: member } = await supabase
    .from('member_discounts')
    .select('id, used_count')
    .eq('member_id', normalized)
    .maybeSingle()

  if (!member) return

  await supabase
    .from('member_discounts')
    .update({ used_count: Number(member.used_count ?? 0) + 1 } as never)
    .eq('id', member.id)
}
