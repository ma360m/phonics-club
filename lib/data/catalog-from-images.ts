import type { Product } from '@/types/database'
import { slugify } from '@/utils/slug'
import { toImageUrl } from './image-path'
import { CATALOG_MANIFEST } from './catalog-manifest'

export const PRODUCT_CATEGORIES_FROM_IMAGES = [
  { slug: 'activity-books', label: 'Activity Books' },
  { slug: 'pupil-books', label: 'Pupil Books' },
  { slug: 'workbooks', label: 'Jolly Phonics Workbooks' },
  { slug: 'grammar-workbooks', label: 'Grammar Workbooks' },
  { slug: 'grammar-pupil-books', label: 'Grammar & Spelling Pupil Books' },
  { slug: 'teachers-books', label: "Teacher's Books" },
  { slug: 'comprehension', label: 'Comprehension & Creative Writing' },
  { slug: 'readers', label: 'Jolly Phonics Readers' },
  { slug: 'teacher-resources', label: 'Teacher Resources' },
  { slug: 'kits', label: 'Kits & Classroom Sets' },
] as const

function makeIsbn(suffix: string, index: number): string {
  const code = suffix.replace(/[^A-Z0-9]/gi, '').toUpperCase().padEnd(5, '0').slice(0, 5)
  return `978-969-${String(100000 + index).slice(-6)}-${code.slice(0, 1)}`
}

export function buildCatalogFromImages(): Product[] {
  const now = new Date().toISOString()
  const slugCounts = new Map<string, number>()
  const products: Product[] = []

  CATALOG_MANIFEST.forEach(([imagePath, name, price, category, isbnSuffix, featured], index) => {
    const baseSlug = slugify(name)
    const count = slugCounts.get(baseSlug) ?? 0
    const slug = count > 0 ? `${baseSlug}-${count}` : baseSlug
    slugCounts.set(baseSlug, count + 1)

    const isbn = isbnSuffix ? makeIsbn(isbnSuffix, index) : makeIsbn(`PC${index}`, index)

    products.push({
      id: `img-${index}`,
      name,
      slug,
      description: `Official Jolly Learning product — ${name}. Price in PKR.`,
      price,
      compare_at_price: null,
      category,
      isbn,
      images: [toImageUrl(imagePath)],
      stock: 100,
      featured: featured ?? false,
      published: true,
      metadata: { currency: 'PKR', imageFile: imagePath },
      created_at: now,
      updated_at: now,
    })
  })

  return products
}

export const IMAGE_CATALOG_PRODUCTS = buildCatalogFromImages()
