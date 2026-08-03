'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

const fastUpdateRowSchema = z.object({
  id: z.string().uuid(),
  isbn: z.string().trim().optional(),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  sale_enabled: z.boolean(),
  sale_price: z.coerce.number().min(0).nullable(),
  sale_percentage: z.coerce.number().min(0).max(100).nullable(),
  published: z.boolean(),
  featured: z.boolean(),
})

const fastUpdateSchema = z.array(fastUpdateRowSchema).min(1, 'Choose at least one product to update.')

export type FastUpdateProductInput = z.infer<typeof fastUpdateRowSchema>

export async function fastUpdateProductsAction(
  updates: FastUpdateProductInput[],
): Promise<ActionResult<{ updated: number; failed: number }>> {
  await requireAdmin()
  const parsed = fastUpdateSchema.safeParse(updates)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const supabase = await createClient()
  let updated = 0
  let failed = 0

  for (const row of parsed.data) {
    const payload: Record<string, unknown> = {
      price: row.price,
      stock: row.stock,
      sale_enabled: row.sale_enabled,
      sale_price: row.sale_price,
      sale_percentage: row.sale_percentage,
      published: row.published,
      featured: row.featured,
    }
    if (row.isbn) payload.isbn = row.isbn

    const { error } = await supabase
      .from('products')
      .update(payload as never)
      .eq('id', row.id)

    if (error) failed += 1
    else updated += 1
  }

  revalidatePath('/admin/fast-update')
  revalidatePath('/admin/products')
  revalidatePath('/shop')

  return {
    success: failed === 0,
    data: { updated, failed },
    error: failed > 0 ? `${updated} products updated. ${failed} products failed.` : undefined,
  }
}
