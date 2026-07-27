import { updateCurrencySettingsAction } from '@/actions/admin/settings'
import { getCurrencySettings } from '@/lib/currency-settings'
import { formatDisplayCurrency, formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CurrencyConverter } from '@/components/admin/currency-converter'

const previewAmounts = [
  { label: 'Product', amount: 5500 },
  { label: 'Course', amount: 18000 },
  { label: 'Delivery', amount: 550 },
]

export default async function AdminCurrencySettingsPage() {
  const settings = await getCurrencySettings()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Settings</p>
        <h1 className="mt-1 text-3xl font-bold">Currency Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          PKR remains the store, accounting, order-processing and payment currency. USD is shown as a display conversion.
        </p>
      </header>

      <form action={updateCurrencySettingsAction} className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="default_currency">Default Currency</Label>
            <select
              id="default_currency"
              name="default_currency"
              defaultValue={settings.defaultCurrency}
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <label className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3 text-sm font-medium">
            <input type="checkbox" name="usd_enabled" defaultChecked={settings.usdEnabled} />
            Enable USD display
          </label>
          <div className="space-y-2">
            <Label htmlFor="usd_to_pkr_rate">USD-to-PKR Exchange Rate</Label>
            <Input
              id="usd_to_pkr_rate"
              name="usd_to_pkr_rate"
              type="number"
              step="0.01"
              min="100"
              max="600"
              defaultValue={settings.usdToPkrRate}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">Example: 1 USD = 280.50 PKR</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate_mode">Rate Update Mode</Label>
            <select
              id="rate_mode"
              name="rate_mode"
              defaultValue={settings.rateMode}
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
            >
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
            <p className="text-xs text-muted-foreground">Automatic mode is ready for a server-side rate API when configured.</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border bg-muted/40 p-4 text-sm">
          <p className="font-semibold">Last Updated</p>
          <p className="mt-1 text-muted-foreground">{new Date(settings.lastUpdatedAt).toLocaleString('en-PK')}</p>
        </div>

        <Button type="submit" className="mt-5 rounded-xl bg-[#1D4ED8]">
          Update Rate
        </Button>
      </form>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold">Preview Prices</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {previewAmounts.map((item) => (
            <div key={item.label} className="rounded-xl border bg-background p-4">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-xl font-bold text-[#1D4ED8]">{formatCurrency(item.amount, 'PKR')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDisplayCurrency(item.amount, 'USD', settings.usdToPkrRate)} · ≈ {formatCurrency(item.amount, 'PKR', { useCode: true })}
              </p>
            </div>
          ))}
        </div>
      </section>

      <CurrencyConverter rate={settings.usdToPkrRate} lastUpdatedAt={settings.lastUpdatedAt} />
    </div>
  )
}
