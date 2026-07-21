import { deleteCouponAction, getAdminCoupons, updateCouponUsageAction } from '@/actions/admin/coupons'
import { CouponForm } from '@/components/admin/coupon-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/utils/format'
import { Save, Trash2 } from 'lucide-react'

type AdminCoupon = {
  id: string
  code: string
  discount_percent?: number | null
  discount_amount?: number | null
  max_uses?: number | null
  active?: boolean | null
  used_count?: number | null
}

export default async function AdminCouponsPage() {
  const coupons = await getAdminCoupons().catch(() => [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Coupons</h1>
      <CouponForm />
      <div className="mt-10 space-y-3">
        {coupons.length === 0 ? (
          <p className="text-muted-foreground text-sm">No coupons yet. Run supabase/migrations/002_trainings_coupons.sql</p>
        ) : (
          coupons.map((c: AdminCoupon) => {
            const usedCount = c.used_count ?? 0
            const discountLabel = c.discount_percent
              ? `${c.discount_percent}% off`
              : c.discount_amount
                ? `${formatPrice(Number(c.discount_amount))} off`
                : 'No discount set'
            const maxUsesLabel = c.max_uses ? `of ${c.max_uses}` : 'unlimited'

            return (
              <div key={c.id} className="flex flex-col gap-4 bg-card rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-mono font-bold">{c.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {discountLabel} | Used {usedCount} {maxUsesLabel} | {c.active === false ? 'Inactive' : 'Active'}
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <form action={updateCouponUsageAction.bind(null, c.id)} className="flex items-end gap-2">
                    <label className="space-y-1">
                      <span className="block text-xs font-medium text-muted-foreground">Used count</span>
                      <Input
                        name="used_count"
                        type="number"
                        min={0}
                        defaultValue={usedCount}
                        className="h-9 w-28 rounded-lg"
                      />
                    </label>
                    <Button type="submit" size="sm" variant="outline" className="h-9 rounded-lg">
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      Save
                    </Button>
                  </form>
                  <form action={deleteCouponAction.bind(null, c.id)}>
                    <Button type="submit" size="sm" variant="destructive" className="h-9 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
