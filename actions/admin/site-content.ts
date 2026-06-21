'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import type { ActionResult } from '@/types'

export async function saveSiteContentAction(key: string, content: unknown): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('site_content')
    .upsert({ key, content, updated_at: new Date().toISOString() } as never, { onConflict: 'key' })

  if (error) return { success: false, error: error.message }
  revalidatePath('/')
  revalidatePath('/admin/content')
  return { success: true }
}

export async function saveSiteContentFormAction(formData: FormData): Promise<void> {
  const key = String(formData.get('key'))
  const json = String(formData.get('content'))
  let content: unknown
  try {
    content = JSON.parse(json)
  } catch {
    throw new Error('Invalid JSON')
  }
  const result = await saveSiteContentAction(key, content)
  if (!result.success) throw new Error(result.error)
}
