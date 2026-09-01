'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { COMPANY_BANK_DETAILS } from '@/lib/company'
import { DEFAULT_COURSE_BANK_DETAILS, normalizeBankDetails, normalizeShopBankDetails } from '@/lib/bank-details'
import { normalizeContactSettings } from '@/lib/contact-settings'
import type { ActionResult } from '@/types'

export async function saveSiteContentAction(key: string, content: unknown): Promise<ActionResult> {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase
    .from('site_content')
    .upsert({ key, content, updated_at: new Date().toISOString() } as never, { onConflict: 'key' })

  if (error) return { success: false, error: error.message }
  revalidateTag('site-content')
  revalidatePath('/')
  revalidatePath('/', 'layout')
  revalidatePath('/trainings')
  revalidatePath('/consultancy')
  revalidatePath('/contact')
  revalidatePath('/dashboard')
  revalidatePath('/admin/content')
  revalidatePath('/about')
  revalidatePath('/research')
  revalidatePath('/faqs')
  revalidatePath('/privacy')
  revalidatePath('/terms')
  revalidatePath('/refunds')
  revalidatePath('/cookies')
  revalidatePath('/checkout')
  revalidatePath('/courses')
  revalidatePath('/courses/catalogue')
  revalidatePath('/courses/[slug]/payment', 'page')
  revalidatePath('/course/[id]/certificate', 'page')
  revalidatePath('/dashboard/my-courses')
  return { success: true }
}

export async function saveCourseBankDetailsFormAction(formData: FormData): Promise<void> {
  const content = normalizeBankDetails({
    bankName: formData.get('bankName'),
    accountTitle: formData.get('accountTitle'),
    accountNumber: formData.get('accountNumber'),
    iban: formData.get('iban'),
    instructions: formData.get('instructions'),
  }, DEFAULT_COURSE_BANK_DETAILS)
  const result = await saveSiteContentAction('course_bank_details', content)
  if (!result.success) throw new Error(result.error)
}

export async function saveContactSettingsFormAction(formData: FormData): Promise<void> {
  const phoneDisplay = formData.get('phoneDisplay')
  const phoneAltDisplay = formData.get('phoneAltDisplay')
  const content = normalizeContactSettings({
    phone: phoneDisplay,
    phoneDisplay,
    phoneAlt: phoneAltDisplay,
    phoneAltDisplay,
    whatsapp: formData.get('whatsapp'),
    whatsappMessage: formData.get('whatsappMessage'),
  })
  const result = await saveSiteContentAction('contact_settings', content)
  if (!result.success) throw new Error(result.error)
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
  if (key === 'bank_details') {
    content = normalizeShopBankDetails(content)
  }
  if (key === 'invoice_template' && content && typeof content === 'object' && !Array.isArray(content)) {
    content = { ...(content as Record<string, unknown>), bankDetails: COMPANY_BANK_DETAILS }
  }
  const result = await saveSiteContentAction(key, content)
  if (!result.success) throw new Error(result.error)
}
