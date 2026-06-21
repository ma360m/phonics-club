import { getAdminProducts } from '@/actions/admin/products'
import { ProductsManager } from '@/components/admin/products-manager'
import { isSupabaseConfigured } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/types/database'

async function getSupabaseStatus() {
  if (!isSupabaseConfigured()) return { connected: false, products: [] as Product[] }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('products').select('id').limit(1)
    if (error) return { connected: false, products: [] as Product[] }

    const products = await getAdminProducts().catch(() => [])
    return { connected: true, products: products as Product[] }
  } catch {
    return { connected: false, products: [] as Product[] }
  }
}

export default async function AdminProductsPage() {
  const { connected, products } = await getSupabaseStatus()

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">Products ({products.length})</h1>
      </div>
      <ProductsManager products={products} supabaseConnected={connected} />
    </div>
  )
}
