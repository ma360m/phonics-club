import { deleteCouponAction, getAdminCoupons, updateCouponUsageAction } from '@/actions/admin/coupons'
import { deleteMemberDiscountAction, getAdminMemberDiscounts, updateMemberDiscountAction } from '@/actions/admin/member-discounts'
import { CouponForm } from '@/components/admin/coupon-form'
import { MemberDiscountForm } from '@/components/admin/member-discount-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAllOrders } from '@/lib/data/queries'
import { formatPrice } from '@/utils/format'
import { Save, Trash2 } from 'lucide-react'
import Link from 'next/link'

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
  free_shipping_enabled?: boolean | null
}

export default async function AdminCouponsPage() {
  const [coupons, memberDiscounts, orders] = await Promise.all([
    getAdminCoupons().catch(() => []),
    getAdminMemberDiscounts().catch(() => []),
    getAllOrders().catch(() => []),
  ])
  const ordersByCoupon = new Map<string, typeof orders>()
  const ordersByMemberId = new Map<string, typeof orders>()

  orders.forEach((order) => {
    const couponCode = order.coupon_code?.trim().toUpperCase()
    const memberId = order.member_id?.trim().toUpperCase()
    if (couponCode) ordersByCoupon.set(couponCode, [...(ordersByCoupon.get(couponCode) ?? []), order])
    if (memberId) ordersByMemberId.set(memberId, [...(ordersByMemberId.get(memberId) ?? []), order])
  })

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
            const appliedOrders = ordersByCoupon.get(c.code.toUpperCase()) ?? []

            return (
              <div key={c.id} className="flex flex-col gap-4 bg-card rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-mono font-bold">{c.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {discountLabel} | Used {usedCount} {maxUsesLabel} | {c.active === false ? 'Inactive' : 'Active'}
                  </p>
                  <InvoiceLinks orders={appliedOrders} />
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
              const appliedOrders = ordersByMemberId.get(m.member_id.toUpperCase()) ?? []

              return (
                <div key={m.id} className="rounded-xl border bg-card p-4">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-mono text-lg font-bold">{m.member_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {Number(m.discount_percent ?? 0)}% off
                      {m.free_shipping_enabled ? ' + shipping waived' : ''}
                      {' | '}Used {usedCount} {maxUsesLabel} | {m.active === false ? 'Inactive' : 'Active'}
                    </p>
                  </div>
                  <InvoiceLinks orders={appliedOrders} />
                  <div className="flex flex-wrap items-end gap-3">
                    <form action={updateMemberDiscountAction.bind(null, m.id)} className="grid flex-1 gap-3 md:grid-cols-[140px_120px_120px_150px_160px_auto] md:items-end">
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
                      <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-muted/30 px-3 py-2 text-sm">
                        <input type="checkbox" name="free_shipping_enabled" defaultChecked={Boolean(m.free_shipping_enabled)} />
                        Waive shipping
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

function InvoiceLinks({ orders }: { orders: Awaited<ReturnType<typeof getAllOrders>> }) {
  if (!orders.length) {
    return <p className="mt-2 text-xs text-muted-foreground">No invoices recorded for this discount yet.</p>
  }

  return (
    <p className="mt-2 flex flex-wrap gap-1 text-xs text-muted-foreground">
      <span>Invoices:</span>
      {orders.slice(0, 8).map((order) => (
        <Link key={order.id} href={`/admin/orders#order-${order.id}`} className="font-mono font-semibold text-[#1D4ED8] hover:underline">
          {order.invoice_number ?? order.id.slice(0, 8)}
        </Link>
      ))}
      {orders.length > 8 ? <span>+{orders.length - 8} more</span> : null}
    </p>
  )
}
