import { deleteCouponAction, getAdminCoupons, updateCouponAction } from '@/actions/admin/coupons'
import { deleteMemberDiscountAction, getAdminMemberDiscounts, updateMemberDiscountAction } from '@/actions/admin/member-discounts'
import { CouponForm } from '@/components/admin/coupon-form'
import { MemberDiscountForm } from '@/components/admin/member-discount-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAllOrders } from '@/lib/data/queries'
import { formatPrice } from '@/utils/format'
import { ChevronDown, Download, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'

type AdminCoupon = {
  id: string
  code: string
  description?: string | null
  discount_percent?: number | null
  discount_amount?: number | null
  max_uses?: number | null
  active?: boolean | null
  used_count?: number | null
  expires_at?: string | null
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

type AdminOrder = Awaited<ReturnType<typeof getAllOrders>>[number]

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
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Coupons</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {coupons.length} coupon code{coupons.length === 1 ? '' : 's'} and {memberDiscounts.length} Member ID discount{memberDiscounts.length === 1 ? '' : 's'}.
            </p>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-xl">
            <Link href="/api/admin/coupons/export?type=all" target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" />
              Export CSV
            </Link>
          </Button>
        </div>

        <CouponForm />

        <div className="space-y-3">
          {coupons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No coupons yet. Run supabase/migrations/002_trainings_coupons.sql</p>
          ) : (
            coupons.map((coupon: AdminCoupon) => (
              <CouponRow
                key={coupon.id}
                coupon={coupon}
                orders={ordersByCoupon.get(coupon.code.toUpperCase()) ?? []}
              />
            ))
          )}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Member ID Discounts</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These work like coupon discounts during checkout, but are assigned to a specific ID.
            </p>
          </div>
          <Button asChild variant="outline" className="w-fit rounded-xl">
            <Link href="/api/admin/coupons/export?type=member-discounts" target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" />
              Export Member IDs
            </Link>
          </Button>
        </div>

        <MemberDiscountForm />

        <div className="space-y-3">
          {memberDiscounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Member IDs have been created yet.</p>
          ) : (
            memberDiscounts.map((memberDiscount: AdminMemberDiscount) => (
              <MemberDiscountRow
                key={memberDiscount.id}
                memberDiscount={memberDiscount}
                orders={ordersByMemberId.get(memberDiscount.member_id.toUpperCase()) ?? []}
              />
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function CouponRow({ coupon, orders }: { coupon: AdminCoupon; orders: AdminOrder[] }) {
  const usedCount = coupon.used_count ?? 0
  const discountLabel = getDiscountLabel(coupon)
  const maxUsesLabel = coupon.max_uses ? `of ${coupon.max_uses}` : 'unlimited'
  const expiresDate = toDateInputValue(coupon.expires_at)

  return (
    <details className="group rounded-xl border bg-card p-4">
      <summary className="flex cursor-pointer list-none flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="break-all font-mono text-lg font-bold">{coupon.code}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {discountLabel} | Used {usedCount} {maxUsesLabel} | {coupon.active === false ? 'Inactive' : 'Active'} | {formatExpiry(coupon.expires_at)}
          </p>
          <InvoicePreview orders={orders} />
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 transition-colors group-open:bg-[#EFF6FF] group-open:text-[#1D4ED8]">
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
          <span className="group-open:hidden">Expand</span>
          <span className="hidden group-open:inline">Collapse</span>
        </span>
      </summary>

      <div className="mt-4 border-t pt-4">
        <InvoiceLinks orders={orders} />
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <form
            action={updateCouponAction.bind(null, coupon.id)}
            className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1.2fr)_110px_130px_100px_120px_150px_auto]"
          >
            <label className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Description</span>
              <Input name="description" defaultValue={coupon.description ?? ''} className="h-9 rounded-lg" />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Discount %</span>
              <Input name="discount_percent" type="number" min={0} max={100} defaultValue={coupon.discount_percent ?? ''} className="h-9 rounded-lg" />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Amount off</span>
              <Input name="discount_amount" type="number" min={0} defaultValue={coupon.discount_amount ?? ''} className="h-9 rounded-lg" />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Used</span>
              <Input name="used_count" type="number" min={0} defaultValue={usedCount} className="h-9 rounded-lg" />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Max uses</span>
              <Input name="max_uses" type="number" min={1} defaultValue={coupon.max_uses ?? ''} className="h-9 rounded-lg" />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Expires</span>
              <Input name="expires_at" type="date" defaultValue={expiresDate} className="h-9 rounded-lg" />
            </label>
            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-muted/30 px-3 text-sm">
                <input type="checkbox" name="active" defaultChecked={coupon.active !== false} />
                Active
              </label>
              <Button type="submit" size="sm" variant="outline" className="h-9 rounded-lg">
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save
              </Button>
            </div>
          </form>
          <form action={deleteCouponAction.bind(null, coupon.id)}>
            <Button type="submit" size="sm" variant="destructive" className="h-9 rounded-lg">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </details>
  )
}

function MemberDiscountRow({ memberDiscount, orders }: { memberDiscount: AdminMemberDiscount; orders: AdminOrder[] }) {
  const usedCount = memberDiscount.used_count ?? 0
  const maxUsesLabel = memberDiscount.max_uses ? `of ${memberDiscount.max_uses}` : 'unlimited'
  const expiresDate = toDateInputValue(memberDiscount.expires_at)

  return (
    <details className="group rounded-xl border bg-card p-4">
      <summary className="flex cursor-pointer list-none flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:ring-offset-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="break-all font-mono text-lg font-bold">{memberDiscount.member_id}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {Number(memberDiscount.discount_percent ?? 0)}% off
            {memberDiscount.free_shipping_enabled ? ' + shipping waived' : ''}
            {' | '}Used {usedCount} {maxUsesLabel} | {memberDiscount.active === false ? 'Inactive' : 'Active'} | {formatExpiry(memberDiscount.expires_at)}
          </p>
          <InvoicePreview orders={orders} />
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 transition-colors group-open:bg-[#EFF6FF] group-open:text-[#1D4ED8]">
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
          <span className="group-open:hidden">Expand</span>
          <span className="hidden group-open:inline">Collapse</span>
        </span>
      </summary>

      <div className="mt-4 border-t pt-4">
        <InvoiceLinks orders={orders} />
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <form
            action={updateMemberDiscountAction.bind(null, memberDiscount.id)}
            className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-[140px_120px_120px_150px_170px_auto]"
          >
            <label className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Discount %</span>
              <Input name="discount_percent" type="number" min={1} max={100} defaultValue={Number(memberDiscount.discount_percent ?? 0)} className="h-9 rounded-lg" />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Used</span>
              <Input name="used_count" type="number" min={0} defaultValue={usedCount} className="h-9 rounded-lg" />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Max uses</span>
              <Input name="max_uses" type="number" min={1} defaultValue={memberDiscount.max_uses ?? ''} className="h-9 rounded-lg" />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Expires</span>
              <Input name="expires_at" type="date" defaultValue={expiresDate} className="h-9 rounded-lg" />
            </label>
            <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-muted/30 px-3 text-sm">
              <input type="checkbox" name="free_shipping_enabled" defaultChecked={Boolean(memberDiscount.free_shipping_enabled)} />
              Waive shipping
            </label>
            <div className="flex flex-wrap items-center gap-3 xl:justify-end">
              <label className="flex h-9 items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={memberDiscount.active !== false} />
                Active
              </label>
              <Button type="submit" size="sm" variant="outline" className="h-9 rounded-lg">
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save
              </Button>
            </div>
          </form>
          <form action={deleteMemberDiscountAction.bind(null, memberDiscount.id)}>
            <Button type="submit" size="sm" variant="destructive" className="h-9 rounded-lg">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </details>
  )
}

function getDiscountLabel(discount: { discount_percent?: number | null; discount_amount?: number | null }) {
  const discountPercent = Number(discount.discount_percent ?? 0)
  const discountAmount = Number(discount.discount_amount ?? 0)
  if (discountPercent > 0) return `${discountPercent}% off`
  if (discountAmount > 0) return `${formatPrice(discountAmount)} off`
  return 'No discount set'
}

function toDateInputValue(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function formatExpiry(value?: string | null) {
  const dateInput = toDateInputValue(value)
  return dateInput ? `Expires ${dateInput}` : 'No expiry'
}

function InvoicePreview({ orders }: { orders: AdminOrder[] }) {
  if (!orders.length) {
    return <p className="mt-2 text-xs text-muted-foreground">No invoices recorded for this discount yet.</p>
  }

  const invoices = orders.slice(0, 4).map((order) => order.invoice_number ?? order.id.slice(0, 8))
  return (
    <p className="mt-2 break-words text-xs text-muted-foreground">
      Invoices: <span className="font-mono font-semibold text-[#1D4ED8]">{invoices.join(' ')}</span>
      {orders.length > invoices.length ? ` +${orders.length - invoices.length} more` : ''}
    </p>
  )
}

function InvoiceLinks({ orders }: { orders: AdminOrder[] }) {
  if (!orders.length) {
    return <p className="text-xs text-muted-foreground">No invoices recorded for this discount yet.</p>
  }

  return (
    <p className="flex flex-wrap gap-1 text-xs text-muted-foreground">
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
