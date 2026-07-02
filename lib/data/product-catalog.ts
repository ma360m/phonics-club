import type { Product } from '@/types/database'
import catalogRows from './product-catalog.json'

type ProductCatalogRow = {
  isbn: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  category: string
  stock: number
  featured: boolean
  published: boolean
  images: string[]
}

export const PRODUCT_CATALOG_ROWS = catalogRows as ProductCatalogRow[]

export function buildProductCatalog(): Product[] {
  const now = new Date().toISOString()

  return PRODUCT_CATALOG_ROWS.map((row, index) => ({
    id: `catalog-${index + 1}`,
    ...row,
    metadata: {
      currency: 'PKR',
      source: 'phonics-club-products-2026-06-21-newest.csv',
    },
    created_at: now,
    updated_at: now,
  }))
}

export const PRODUCT_CATALOG_PRODUCTS = buildProductCatalog()
