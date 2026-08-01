'use server'

import { COMPANY } from '@/lib/company'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import type { ActionResult } from '@/types'

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  subject: z.string().trim().optional(),
  message: z.string().trim().min(10, 'Enter a short message so we can help you.'),
  recoveryMode: z.boolean(),
})

export async function submitContactAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject') || undefined,
    message: formData.get('message'),
    recoveryMode: formData.get('recovery_mode') === 'true',
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message }
  }

  const rl = rateLimit(`contact:${parsed.data.email}`, 5, 300_000)
  if (!rl.success) return { success: false, error: 'Too many requests. Try again later.' }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.ORDER_EMAIL_FROM?.trim() || 'Phonics Club <onboarding@resend.dev>'
  const adminEmail = process.env.ORDER_ADMIN_EMAIL?.trim() || COMPANY.adminEmail

  if (!apiKey) {
    return {
      success: false,
      error: `Online contact form is not connected yet. Please email ${COMPANY.adminEmail} or WhatsApp ${COMPANY.phoneDisplay}.`,
    }
  }

  const subject = parsed.data.subject || (parsed.data.recoveryMode ? 'Account recovery request' : 'Website contact request')
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [adminEmail],
      reply_to: parsed.data.email,
      subject: `${parsed.data.recoveryMode ? '[Account Recovery]' : '[Website Contact]'} ${subject}`,
      html: buildContactEmailHtml(parsed.data),
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error('Contact email failed', detail)
    return {
      success: false,
      error: `Message could not be sent online. Please email ${COMPANY.adminEmail} or WhatsApp ${COMPANY.phoneDisplay}.`,
    }
  }

  return { success: true }
}

function buildContactEmailHtml({
  name,
  email,
  subject,
  message,
  recoveryMode,
}: z.infer<typeof contactSchema>): string {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin:0 0 12px">${recoveryMode ? 'Account recovery request' : 'Website contact request'}</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject || 'Website contact request')}</p>
      <p><strong>Account protection:</strong> ${recoveryMode ? 'Verify user before issuing new username and password.' : 'No'}</p>
      <div style="margin-top:16px;padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc">
        ${escapeHtml(message).replace(/\n/g, '<br />')}
      </div>
    </div>
  `
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[char] ?? char
  })
}
