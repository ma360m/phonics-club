import type { Product } from '@/types/database'

export const PRODUCT_COLLECTIONS = [
  {
    slug: 'jolly-learning',
    label: 'Jolly Learning Products',
    shortLabel: 'Jolly Learning',
  },
  {
    slug: 'phonics-club',
    label: 'Phonics Club Products',
    shortLabel: 'Phonics Club',
  },
] as const

export type ProductCollection = (typeof PRODUCT_COLLECTIONS)[number]['slug']

export function isProductCollection(value?: string | null): value is ProductCollection {
  return PRODUCT_COLLECTIONS.some((collection) => collection.slug === value)
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function getProductCollection(product: Product): ProductCollection {
  const metadataCollection = product.metadata?.collection
  if (metadataCollection === 'jolly-learning' || metadataCollection === 'phonics-club') {
    return metadataCollection
  }

  const name = normalize(product.name)
  const category = normalize(product.category)
  const description = normalize(product.description ?? '')
  const searchable = `${name} ${category} ${description}`

  if (
    searchable.includes('fun phonics') ||
    searchable.includes('ao urdu') ||
    searchable.includes('a o urdu') ||
    searchable.includes('urdu') ||
    searchable.includes('maths') ||
    searchable.includes('math ') ||
    searchable.includes('number book')
  ) {
    return 'phonics-club'
  }

  return 'jolly-learning'
}

export function filterProductsByCollection(
  products: Product[],
  collection?: string | null
): Product[] {
  if (!isProductCollection(collection)) return products
  return products.filter((product) => getProductCollection(product) === collection)
}
