'use client'

import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  className?: string
  buttonClassName?: string
  inputClassName?: string
}

function clampQuantity(value: number, min: number, max?: number) {
  const upper = max && max > 0 ? max : Number.POSITIVE_INFINITY
  return Math.min(Math.max(Math.round(value), min), upper)
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  className,
  buttonClassName,
  inputClassName,
}: QuantityStepperProps) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  function commit(raw: string) {
    const next = Number(raw)
    if (!Number.isFinite(next)) {
      const clamped = clampQuantity(value || min, min, max)
      setDraft(String(clamped))
      onChange(clamped)
      return
    }
    const clamped = clampQuantity(next, min, max)
    setDraft(String(clamped))
    onChange(clamped)
  }

  return (
    <div className={cn('inline-flex items-center overflow-hidden rounded-xl border bg-background', className)}>
      <button
        type="button"
        className={cn('flex h-9 w-9 items-center justify-center hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40', buttonClassName)}
        disabled={disabled || value <= min}
        onClick={() => onChange(clampQuantity(value - 1, min, max))}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value
          setDraft(next)
          if (next !== '') commit(next)
        }}
        onBlur={() => commit(draft)}
        className={cn('h-9 w-12 border-x bg-transparent px-1 text-center text-sm font-medium outline-none focus:bg-muted/50', inputClassName)}
        aria-label="Quantity"
      />
      <button
        type="button"
        className={cn('flex h-9 w-9 items-center justify-center hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40', buttonClassName)}
        disabled={disabled || Boolean(max && max > 0 && value >= max)}
        onClick={() => onChange(clampQuantity(value + 1, min, max))}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
