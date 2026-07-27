'use client'

import { useCurrency } from '@/components/currency/currency-provider'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

export function PriceDisplay({
  amountPkr,
  className,
  secondaryClassName,
  showApproxPkr = true,
  freeLabel = true,
  useCode = false,
}: {
  amountPkr: number
  className?: string
  secondaryClassName?: string
  showApproxPkr?: boolean
  freeLabel?: boolean
  useCode?: boolean
}) {
  const { currency, format } = useCurrency()
  const amount = Number(amountPkr) || 0

  return (
    <span className="inline-flex flex-col leading-tight">
      <span className={className}>{format(amount, { freeLabel, useCode })}</span>
      {currency === 'USD' && showApproxPkr && amount > 0 ? (
        <span className={cn('mt-1 text-xs font-medium text-muted-foreground', secondaryClassName)}>
          ≈ {formatCurrency(amount, 'PKR', { freeLabel: false, useCode })}
        </span>
      ) : null}
    </span>
  )
}

export function CurrencyDisplayNotice({ className }: { className?: string }) {
  const { currency } = useCurrency()
  if (currency !== 'USD') return null
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      Displayed in USD. Final payment will be processed in PKR.
    </p>
  )
}
