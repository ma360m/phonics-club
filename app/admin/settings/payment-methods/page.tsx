import { updatePaymentMethodsAction } from '@/actions/admin/settings'
import { getPaymentMethodSettings } from '@/lib/payment-method-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default async function AdminPaymentMethodsPage() {
  const methods = await getPaymentMethodSettings()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Settings</p>
        <h1 className="mt-1 text-3xl font-bold">Payment Methods</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Only enabled methods appear at checkout. Availability is also checked on the server when orders are submitted.
        </p>
      </header>

      <form action={updatePaymentMethodsAction} className="space-y-4">
        {methods.map((method) => (
          <section key={method.method} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-bold">{method.displayName}</h2>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{method.method}</p>
              </div>
              <label className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3 text-sm font-medium">
                <input type="checkbox" name={`${method.method}_enabled`} defaultChecked={method.enabled} />
                Enabled
              </label>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${method.method}_display`}>Display Name</Label>
                <Input id={`${method.method}_display`} name={`${method.method}_display`} defaultValue={method.displayName} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${method.method}_sort`}>Sort Order</Label>
                <Input id={`${method.method}_sort`} name={`${method.method}_sort`} type="number" defaultValue={method.sortOrder} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${method.method}_min`}>Minimum Order Amount</Label>
                <Input id={`${method.method}_min`} name={`${method.method}_min`} type="number" min="0" defaultValue={method.minOrderAmount ?? ''} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${method.method}_max`}>Maximum Order Amount</Label>
                <Input id={`${method.method}_max`} name={`${method.method}_max`} type="number" min="0" defaultValue={method.maxOrderAmount ?? ''} className="rounded-xl" />
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${method.method}_customer`}>Customer Instructions</Label>
                <Textarea id={`${method.method}_customer`} name={`${method.method}_customer`} defaultValue={method.customerInstructions} className="rounded-xl" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${method.method}_admin`}>Admin Instructions</Label>
                <Textarea id={`${method.method}_admin`} name={`${method.method}_admin`} defaultValue={method.adminInstructions} className="rounded-xl" rows={3} />
              </div>
            </div>

            <label className="mt-4 flex items-center gap-3 text-sm">
              <input type="checkbox" name={`${method.method}_proof`} defaultChecked={method.proofUploadRequired} />
              Require payment-proof upload
            </label>
          </section>
        ))}

        <Button type="submit" className="rounded-xl bg-[#1D4ED8]">
          Save Payment Methods
        </Button>
      </form>
    </div>
  )
}
