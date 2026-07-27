'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/currency'

export function CurrencyConverter({
  rate,
  lastUpdatedAt,
}: {
  rate: number
  lastUpdatedAt: string
}) {
  const [pkr, setPkr] = useState('5500')
  const [usd, setUsd] = useState('')

  const pkrPreview = useMemo(() => {
    const amount = Number(pkr)
    return Number.isFinite(amount) ? formatCurrency(amount / rate, 'USD', { freeLabel: false }) : '--'
  }, [pkr, rate])

  const usdPreview = useMemo(() => {
    const amount = Number(usd)
    return Number.isFinite(amount) && usd ? formatCurrency(amount * rate, 'PKR', { freeLabel: false, useCode: true }) : '--'
  }, [usd, rate])

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-bold">Price Converter</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Reference only. This does not change product or course prices.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="converter-pkr">PKR amount</Label>
          <Input
            id="converter-pkr"
            type="number"
            min="0"
            step="1"
            value={pkr}
            onChange={(event) => setPkr(event.target.value)}
            className="rounded-xl"
          />
          <p className="text-sm font-semibold text-[#1D4ED8]">{pkrPreview}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="converter-usd">USD amount</Label>
          <Input
            id="converter-usd"
            type="number"
            min="0"
            step="0.01"
            value={usd}
            onChange={(event) => setUsd(event.target.value)}
            className="rounded-xl"
          />
          <p className="text-sm font-semibold text-[#1D4ED8]">{usdPreview}</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Exchange rate used: 1 USD = {rate.toLocaleString('en-PK')} PKR. Last update: {new Date(lastUpdatedAt).toLocaleString('en-PK')}.
      </p>
    </section>
  )
}
