'use client'

import { useDisplayPreferences } from './display-preferences-provider'
import { cn } from '@/lib/utils'

export function AppearanceAccessibilityLink({ className }: { className?: string }) {
  const { setOpen, settings } = useDisplayPreferences()

  if (!settings.accessibilityControlsEnabled) return null

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn('text-sm text-white/70 transition-colors hover:text-[#60A5FA] hover:underline', className)}
    >
      Appearance & Accessibility
    </button>
  )
}
