import { getAdminCoupons, deleteCouponAction } from '@/actions/admin/coupons'
import { CouponForm } from '@/components/admin/coupon-form'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

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
          coupons.map((c: { id: string; code: string; discount_percent?: number; active: boolean; used_count: number }) => (
            <div key={c.id} className="flex justify-between items-center bg-card rounded-xl border p-4">
              <div>
                <p className="font-mono font-bold">{c.code}</p>
                <p className="text-sm text-muted-foreground">
                  {c.discount_percent ? `${c.discount_percent}% off` : 'Fixed discount'} · Used {c.used_count}×
                </p>
              </div>
              <form action={deleteCouponAction.bind(null, c.id)}>
                <Button type="submit" size="sm" variant="destructive" className="rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
