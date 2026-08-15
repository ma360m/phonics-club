import { COMPANY } from '@/lib/company'

export interface ContactSettings {
  phone: string
  phoneDisplay: string
  phoneIntl: string
  phoneAlt: string
  phoneAltDisplay: string
  phoneAltIntl: string
  whatsapp: string
  whatsappMessage: string
}

export interface ContactPhoneLink {
  display: string
  href: string
}

export const DEFAULT_WHATSAPP_MESSAGE = 'Hello Phonics Club, I need help with...'

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  phone: COMPANY.phone,
  phoneDisplay: COMPANY.phoneDisplay,
  phoneIntl: COMPANY.phoneIntl,
  phoneAlt: COMPANY.phoneAlt,
  phoneAltDisplay: COMPANY.phoneAltDisplay,
  phoneAltIntl: COMPANY.phoneAltIntl,
  whatsapp: COMPANY.whatsapp,
  whatsappMessage: DEFAULT_WHATSAPP_MESSAGE,
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function firstText(...values: unknown[]): string {
  return values.map(asTrimmedString).find(Boolean) ?? ''
}

export function normalizePhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('00')) return normalizePhoneDigits(digits.slice(2))
  if (digits.startsWith('92')) return digits
  if (/^3\d{9}$/.test(digits)) return `92${digits}`
  if (digits.startsWith('0')) return `92${digits.slice(1)}`
  return digits
}

export function phoneToTelHref(value: string): string {
  const digits = normalizePhoneDigits(value)
  return digits ? `tel:+${digits}` : ''
}

export function buildWhatsAppUrl(settings: ContactSettings = DEFAULT_CONTACT_SETTINGS): string {
  const number = normalizePhoneDigits(settings.whatsapp || settings.phoneIntl || settings.phone || settings.phoneDisplay)
  const fallbackNumber = normalizePhoneDigits(DEFAULT_CONTACT_SETTINGS.whatsapp)
  const message = settings.whatsappMessage || DEFAULT_WHATSAPP_MESSAGE
  return `https://wa.me/${number || fallbackNumber}?text=${encodeURIComponent(message)}`
}

export function getContactPhoneLinks(settings: ContactSettings): ContactPhoneLink[] {
  const entries = [
    {
      display: settings.phoneDisplay || settings.phone,
      href: phoneToTelHref(settings.phoneIntl || settings.phone || settings.phoneDisplay),
    },
    {
      display: settings.phoneAltDisplay || settings.phoneAlt,
      href: phoneToTelHref(settings.phoneAltIntl || settings.phoneAlt || settings.phoneAltDisplay),
    },
  ]

  const seen = new Set<string>()
  return entries.filter((entry) => {
    if (!entry.display || !entry.href || seen.has(entry.href)) return false
    seen.add(entry.href)
    return true
  })
}

export function normalizeContactSettings(value: unknown): ContactSettings {
  const data = value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

  const phone = firstText(data.phone, data.phoneDisplay, data.phoneIntl, DEFAULT_CONTACT_SETTINGS.phone)
  const phoneDisplay = firstText(data.phoneDisplay, data.phone, DEFAULT_CONTACT_SETTINGS.phoneDisplay)
  const phoneIntl = phoneToTelHref(firstText(data.phoneIntl, phone)).replace(/^tel:/, '')

  const phoneAlt = firstText(data.phoneAlt, data.phoneAltDisplay, data.phoneAltIntl)
  const phoneAltDisplay = firstText(data.phoneAltDisplay, data.phoneAlt)
  const phoneAltIntl = phoneToTelHref(firstText(data.phoneAltIntl, phoneAlt)).replace(/^tel:/, '')

  const whatsappSource = firstText(data.whatsapp, data.whatsappNumber, data.phone, data.phoneIntl, data.phoneDisplay, phone)
  const whatsapp = normalizePhoneDigits(whatsappSource) || DEFAULT_CONTACT_SETTINGS.whatsapp

  return {
    phone,
    phoneDisplay,
    phoneIntl: phoneIntl || DEFAULT_CONTACT_SETTINGS.phoneIntl,
    phoneAlt,
    phoneAltDisplay,
    phoneAltIntl,
    whatsapp,
    whatsappMessage: firstText(data.whatsappMessage, DEFAULT_WHATSAPP_MESSAGE),
  }
}
