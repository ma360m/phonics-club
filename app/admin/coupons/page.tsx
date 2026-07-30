import { deleteCouponAction, getAdminCoupons, updateCouponUsageAction } from '@/actions/admin/coupons'
import { deleteMemberDiscountAction, getAdminMemberDiscounts, updateMemberDiscountAction } from '@/actions/admin/member-discounts'
import { CouponForm } from '@/components/admin/coupon-form'
import { MemberDiscountForm } from '@/components/admin/member-discount-form'
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

type AdminMemberDiscount = {
  id: string
  member_id: string
  discount_percent?: number | null
  discount_amount?: number | null
  max_uses?: number | null
  used_count?: number | null
  active?: boolean | null
  expires_at?: string | null
}

export default async function AdminCouponsPage() {
  const coupons = await getAdminCoupons().catch(() => [])
  const memberDiscounts = await getAdminMemberDiscounts().catch(() => [])

  return (
    <div className="space-y-12">
      <section>
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
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold">Member ID Discounts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These work like coupon discounts during checkout, but are assigned to a specific ID.
          </p>
        </div>
        <MemberDiscountForm />
        <div className="space-y-3">
          {memberDiscounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Member IDs have been created yet.</p>
          ) : (
            memberDiscounts.map((m: AdminMemberDiscount) => {
              const usedCount = m.used_count ?? 0
              const maxUsesLabel = m.max_uses ? `of ${m.max_uses}` : 'unlimited'
              const expiresDate = m.expires_at ? new Date(m.expires_at).toISOString().slice(0, 10) : ''

              return (
                <div key={m.id} className="rounded-xl border bg-card p-4">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-mono text-lg font-bold">{m.member_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {Number(m.discount_percent ?? 0)}% off | Used {usedCount} {maxUsesLabel} | {m.active === false ? 'Inactive' : 'Active'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <form action={updateMemberDiscountAction.bind(null, m.id)} className="grid flex-1 gap-3 md:grid-cols-[140px_120px_120px_150px_auto] md:items-end">
                      <label className="space-y-1">
                        <span className="block text-xs font-medium text-muted-foreground">Discount %</span>
                        <Input name="discount_percent" type="number" min={1} max={100} defaultValue={Number(m.discount_percent ?? 0)} className="h-9 rounded-lg" />
                      </label>
                      <label className="space-y-1">
                        <span className="block text-xs font-medium text-muted-foreground">Used</span>
                        <Input name="used_count" type="number" min={0} defaultValue={usedCount} className="h-9 rounded-lg" />
                      </label>
                      <label className="space-y-1">
                        <span className="block text-xs font-medium text-muted-foreground">Max uses</span>
                        <Input name="max_uses" type="number" min={1} defaultValue={m.max_uses ?? ''} className="h-9 rounded-lg" />
                      </label>
                      <label className="space-y-1">
                        <span className="block text-xs font-medium text-muted-foreground">Expires</span>
                        <Input name="expires_at" type="date" defaultValue={expiresDate} className="h-9 rounded-lg" />
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="active" defaultChecked={m.active !== false} />
                          Active
                        </label>
                        <Button type="submit" size="sm" variant="outline" className="h-9 rounded-lg">
                          <Save className="mr-1.5 h-3.5 w-3.5" />
                          Save
                        </Button>
                      </div>
                    </form>
                    <form action={deleteMemberDiscountAction.bind(null, m.id)}>
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
      </section>
    </div>
  )
}
