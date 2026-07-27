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
  const showSecondaryPrice = currency === 'USD' && showApproxPkr && amount > 0

  return (
    <span className="inline-flex flex-col leading-tight">
      <span suppressHydrationWarning className={className}>
        {format(amount, { freeLabel, useCode })}
      </span>
      <span
        suppressHydrationWarning
        aria-hidden={!showSecondaryPrice}
        className={cn(
          'mt-1 text-xs font-medium text-muted-foreground',
          !showSecondaryPrice && 'hidden',
          secondaryClassName,
        )}
      >
        {showSecondaryPrice ? (
          <>
            {'\u2248 '}
            {formatCurrency(amount, 'PKR', { freeLabel: false, useCode })}
          </>
        ) : null}
      </span>
    </span>
  )
}

export function CurrencyDisplayNotice({ className }: { className?: string }) {
  const { currency } = useCurrency()
  const visible = currency === 'USD'

  return (
    <p
      suppressHydrationWarning
      aria-hidden={!visible}
      className={cn('text-xs text-muted-foreground', !visible && 'hidden', className)}
    >
      Displayed in USD. Final payment will be processed in PKR.
    </p>
  )
}
