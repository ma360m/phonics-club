'use client'

import { Accessibility, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDisplayPreferences } from './display-preferences-provider'
import { cn } from '@/lib/utils'

export function AppearanceAccessibilityButton({ className }: { className?: string }) {
  const { setOpen, settings } = useDisplayPreferences()

  if (!settings.accessibilityControlsEnabled) return null

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      onClick={() => setOpen(true)}
      title="Open appearance and accessibility settings"
      aria-label="Open appearance and accessibility settings"
      className={cn(
        'fixed bottom-44 right-4 z-40 h-12 w-12 rounded-full border-[#BFDBFE] bg-white text-[#1D4ED8] shadow-xl transition-transform hover:scale-105 hover:bg-[#EFF6FF] focus-visible:ring-4 focus-visible:ring-[#60A5FA]/40 md:bottom-40',
        className,
      )}
    >
      <span className="relative">
        <Accessibility className="h-5 w-5" />
        <Palette className="absolute -right-2 -top-2 h-3.5 w-3.5 text-[#D30000]" />
      </span>
    </Button>
  )
}
