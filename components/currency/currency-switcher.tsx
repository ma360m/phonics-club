'use client'

import { useCurrency } from '@/components/currency/currency-provider'
import { cn } from '@/lib/utils'
import type { CurrencyCode } from '@/lib/currency'

const options: Array<{ value: CurrencyCode; label: string }> = [
  { value: 'PKR', label: '₨ PKR' },
  { value: 'USD', label: '$ USD' },
]

export function CurrencySwitcher({ className }: { className?: string }) {
  const { currency, setCurrency, settings } = useCurrency()
  const visibleOptions = settings.usdEnabled ? options : options.filter((option) => option.value === 'PKR')

  return (
    <div
      className={cn('inline-flex rounded-full border border-[#1D4ED8]/20 bg-white/80 p-1 shadow-sm backdrop-blur', className)}
      role="group"
      aria-label="Choose display currency"
    >
      {visibleOptions.map((option) => {
        const selected = currency === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => setCurrency(option.value)}
            className={cn(
              'min-h-9 rounded-full px-3 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 motion-reduce:transition-none',
              selected
                ? 'bg-[#1D4ED8] text-white shadow-sm'
                : 'text-[#1D4ED8] hover:bg-[#EFF6FF]',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
