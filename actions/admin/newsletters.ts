'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import {
  NEWSLETTER_MAX_FILE_SIZE_BYTES,
  NEWSLETTER_MAX_FILE_SIZE_MB,
  deleteNewsletterIssue,
  uploadNewsletterIssue,
} from '@/lib/newsletters'
import type { ActionResult } from '@/types'

function parseMonth(value: FormDataEntryValue | null): number {
  const month = Number(value)
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('Choose a valid month')
  }
  return month
}

function parseYear(value: FormDataEntryValue | null): number {
  const year = Number(value)
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error('Choose a valid year')
  }
  return year
}

export async function uploadNewsletterFormAction(formData: FormData): Promise<void> {
  await requireAdmin()

  const file = formData.get('file')
  if (!file || typeof file === 'string' || !file.name) {
    throw new Error('Choose a PDF newsletter file')
  }
  if (file.size > NEWSLETTER_MAX_FILE_SIZE_BYTES) {
    throw new Error(`Newsletter PDFs must be ${NEWSLETTER_MAX_FILE_SIZE_MB}MB or smaller`)
  }

  const title = String(formData.get('title') ?? '').trim() || file.name.replace(/\.[^.]+$/, '')
  await uploadNewsletterIssue({
    file,
    title,
    month: parseMonth(formData.get('month')),
    year: parseYear(formData.get('year')),
    published: formData.get('published') === 'on',
  })

  revalidatePath('/admin/newsletters')
  revalidatePath('/newsletters')
}

export async function deleteNewsletterAction(id: string): Promise<ActionResult> {
  await requireAdmin()
  await deleteNewsletterIssue(id)
  revalidatePath('/admin/newsletters')
  revalidatePath('/newsletters')
  return { success: true }
}

export async function deleteNewsletterFormAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) throw new Error('Missing newsletter id')
  await deleteNewsletterAction(id)
}
