import { getAdminProducts } from '@/actions/admin/products'
import { FastUpdateTable } from '@/components/admin/fast-update-table'
import type { Product } from '@/types/database'

export default async function AdminFastUpdatePage() {
  const products = (await getAdminProducts().catch(() => [])) as Product[]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Fast Update</p>
        <h1 className="mt-2 text-3xl font-bold">Quick Stock and Price Updates</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Update price, stock, published state, and featured state in a simple table format.
          Product descriptions, images, SEO, and category edits remain in the full product editor.
        </p>
      </div>
      <FastUpdateTable products={products} />
    </div>
  )
}
