import { notFound } from 'next/navigation'
import { getAdminProduct } from '@/actions/admin/products'
import { ProductForm } from '@/components/admin/product-form'
import { IMAGE_CATALOG_PRODUCTS } from '@/lib/data/catalog-from-images'
import { isSupabaseConfigured } from '@/lib/auth'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let product = null
  if (id.startsWith('img-')) {
    product = IMAGE_CATALOG_PRODUCTS.find((p) => p.id === id) ?? null
  } else if (isSupabaseConfigured()) {
    product = await getAdminProduct(id)
  }
  if (!product) notFound()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Product</h1>
      <ProductForm product={product} />
    </div>
  )
}
