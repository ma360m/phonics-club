'use client'

import { MessageCircle } from 'lucide-react'
import {
  buildWhatsAppUrl,
  DEFAULT_CONTACT_SETTINGS,
  type ContactSettings,
} from '@/lib/contact-settings'

type WhatsAppButtonProps = {
  className?: string
  contactSettings?: ContactSettings
}

export function WhatsAppButton({ className = '', contactSettings }: WhatsAppButtonProps) {
  const whatsAppUrl = buildWhatsAppUrl(contactSettings ?? DEFAULT_CONTACT_SETTINGS)
  return (
    <a
      href={whatsAppUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium px-5 py-2.5 rounded-xl transition-colors shadow-lg ${className}`}
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-5 h-5" />
      WhatsApp Us
    </a>
  )
}

export function WhatsAppFloating({ contactSettings }: { contactSettings?: ContactSettings }) {
  const whatsAppUrl = buildWhatsAppUrl(contactSettings ?? DEFAULT_CONTACT_SETTINGS)
  return (
    <a
      href={whatsAppUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-3 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-transform hover:scale-105 hover:bg-[#20bd5a] sm:bottom-24 sm:right-4 sm:h-14 sm:w-14"
      aria-label="WhatsApp"
    >
      <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
    </a>
  )
}
