import type { Product } from '@/types/database'
import { slugify } from '@/utils/slug'

type ProductInput = {
  name: string
  price: number
  category: string
  description?: string
  compare_at_price?: number
  featured?: boolean
  stock?: number
}

function img(slug: string) {
  return [`/images/${slug}.jpg`]
}

function toProduct(item: ProductInput, index: number): Product {
  const slug = slugify(item.name)
  const now = new Date().toISOString()
  return {
    id: `jolly-${index}`,
    name: item.name,
    slug,
    description: item.description ?? `Official Jolly Learning product — ${item.name}. Prices in PKR.`,
    price: item.price,
    compare_at_price: item.compare_at_price ?? null,
    category: item.category,
    images: img(slug),
    stock: item.stock ?? 100,
    featured: item.featured ?? false,
    published: true,
    metadata: { currency: 'PKR' },
    created_at: now,
    updated_at: now,
  }
}

const CATALOG: ProductInput[] = [
  // JOLLY PHONICS AND FUN PHONICS
  { name: "Teacher's Book (Coloured)", price: 1800, category: 'jolly-phonics', featured: true },
  { name: 'JP Pupil Book 1 (Colour) Books 1-3', price: 700, category: 'jolly-phonics' },
  { name: 'Fun Phonics Pack 1 (Group 1-3 Sounds)', price: 500, category: 'jolly-phonics', featured: true, description: 'Discounted price for group 1-3 letter sounds.' },
  { name: 'Fun Phonics Pack 2 (Group 4-7 Sounds)', price: 500, category: 'jolly-phonics' },
  { name: 'JP Pupil Book 1 (Black & White)', price: 600, category: 'jolly-phonics' },
  { name: 'JP Pupil Book 2 (Black & White)', price: 600, category: 'jolly-phonics' },
  { name: "Teacher's Book (Black & White)", price: 1000, category: 'jolly-phonics' },
  { name: 'JP Workbooks Set 1-7', price: 3500, category: 'jolly-phonics', featured: true },
  { name: 'JP Workbook 1 (Single)', price: 600, category: 'jolly-phonics' },
  { name: 'JP Workbook 2 (Single)', price: 600, category: 'jolly-phonics' },
  { name: 'JP Workbook 3 (Single)', price: 600, category: 'jolly-phonics' },
  { name: 'JP Workbook 4 (Single)', price: 600, category: 'jolly-phonics' },
  { name: 'JP Workbook 5 (Single)', price: 600, category: 'jolly-phonics' },
  { name: 'JP Workbook 6 (Single)', price: 600, category: 'jolly-phonics' },
  { name: 'JP Workbook 7 (Single)', price: 600, category: 'jolly-phonics' },
  { name: 'Finger Phonics Books 1-7 Set (Hardback)', price: 23800, category: 'jolly-phonics' },
  { name: 'Finger Phonics Big Books 1-7 Set', price: 32000, category: 'jolly-phonics' },
  { name: 'Activity Books 1-7 Set (Old Version)', price: 10400, category: 'jolly-phonics' },
  { name: 'Activity Book 1 (Old Version, Single)', price: 1490, category: 'jolly-phonics' },
  { name: 'Activity Books 1-7 Set (New Version)', price: 22050, category: 'jolly-phonics', description: 'PKR 3,150 per book. Complete set of 7.' },
  { name: 'Activity Book 1 (New Version, Single)', price: 3150, category: 'jolly-phonics' },
  { name: 'Jolly Literacy: Comprehension Pupil Book 1', price: 1295, category: 'jolly-phonics' },
  { name: 'Jolly Literacy: Creative Writing Workbook 1', price: 1695, category: 'jolly-phonics' },
  { name: "Jolly Literacy: Comprehension & Creative Writing Teacher's Book 1", price: 2995, category: 'jolly-phonics' },

  // JOLLY PHONICS READERS
  { name: 'Read and See Pack 1 & 2 (12 Titles)', price: 8085, category: 'jolly-readers' },
  { name: 'Little Word Books Complete Set (14 Books)', price: 5000, category: 'jolly-readers', featured: true },
  { name: 'Orange Level Set 1-7 (Pack of 3)', price: 1050, category: 'jolly-readers' },
  { name: 'Orange Level Complete Set (Pack of 21)', price: 7350, category: 'jolly-readers' },
  { name: 'Level 1 Folk Tale Readers (Pack of 6)', price: 2200, category: 'jolly-readers' },
  { name: 'Level 1 Inky and Friends (Pack of 6)', price: 1800, category: 'jolly-readers' },
  { name: 'Level 2 Folk Tale Readers (Pack of 6)', price: 2400, category: 'jolly-readers' },
  { name: 'Level 2 Inky and Friends & Non-Fiction (Pack of 6)', price: 2000, category: 'jolly-readers' },
  { name: 'Level 3 Folk Tale Readers (Pack of 6)', price: 2600, category: 'jolly-readers' },
  { name: 'Level 3 Inky and Friends, Non-Fiction & General Fiction (Pack of 6)', price: 2200, category: 'jolly-readers' },
  { name: 'Level 4 Folk Tale Readers (Pack of 6)', price: 2600, category: 'jolly-readers' },
  { name: 'Level 4 Inky and Friends, Non-Fiction & General Fiction (Pack of 6)', price: 2200, category: 'jolly-readers' },
  { name: 'Level 5 Folk Tale Readers (Pack of 6)', price: 2800, category: 'jolly-readers' },
  { name: 'Level 5 Non-Fiction (Pack of 6)', price: 2200, category: 'jolly-readers' },

  // JOLLY GRAMMAR
  { name: 'The Grammar Handbook 1-6', price: 4500, category: 'jolly-grammar', featured: true },
  { name: 'Jolly Grammar Big Book 1', price: 14500, category: 'jolly-grammar' },
  { name: 'Jolly Grammar Big Book 2', price: 14500, category: 'jolly-grammar' },
  { name: 'Jolly Grammar Big Books 1 & 2 Set', price: 25000, category: 'jolly-grammar' },
  { name: "Jolly Literacy: Spelling, Grammar & Punctuation Teacher's Book 1-6", price: 1700, category: 'jolly-grammar' },
  { name: 'Grammar 1 Workbooks', price: 3000, category: 'jolly-grammar' },
  { name: 'Jolly Literacy: Spelling, Grammar & Punctuation Pupil Book 1-6', price: 1300, category: 'jolly-grammar' },
  { name: 'Grammar Pupil Book 1-6', price: 1200, category: 'jolly-grammar' },

  // TEACHER RESOURCE MATERIALS
  { name: 'Jolly Dictionary', price: 5500, category: 'teacher-resources', featured: true },
  { name: 'Letter Sound Strip (Single)', price: 200, category: 'teacher-resources' },
  { name: 'Letter Sound Strips (Pack of 30)', price: 5500, category: 'teacher-resources' },
  { name: 'Cards (Set of 4 Boxes)', price: 21000, category: 'teacher-resources' },
  { name: 'Picture Flash Cards', price: 6500, category: 'teacher-resources' },
  { name: 'Wall Frieze (Pack of 7 Strips)', price: 5500, category: 'teacher-resources' },
  { name: 'Letter Sound Poster, Wall Chart & Tricky Words Poster', price: 2800, category: 'teacher-resources' },
  { name: 'JP Alternative Spelling & Alphabet Posters', price: 5500, category: 'teacher-resources' },
  { name: 'Starter Kit Revised (No DVD)', price: 150000, category: 'teacher-resources', featured: true },
  { name: 'The Phonics Handbook', price: 7500, category: 'teacher-resources', featured: true },
  { name: 'Word Book', price: 1750, category: 'teacher-resources' },
  { name: 'Jolly Stories', price: 15000, category: 'teacher-resources' },
  { name: 'Magnetic Letters (Tub of 106)', price: 12500, category: 'teacher-resources' },
  { name: 'Blends Wheel (Single)', price: 750, category: 'teacher-resources' },
  { name: 'Blends Wheels (Pack of 10)', price: 7500, category: 'teacher-resources' },
  { name: 'Tricky Word Wall Flowers', price: 8000, category: 'teacher-resources' },
  { name: 'Jolly Plays', price: 12000, category: 'teacher-resources' },
  { name: 'Puppets Set of All 3', price: 36000, category: 'teacher-resources' },
  { name: 'Reading Assessment', price: 33000, category: 'teacher-resources' },
  { name: 'Resources CD', price: 4500, category: 'teacher-resources' },
  { name: 'Sounds Like Fun DVD', price: 5300, category: 'teacher-resources' },
  { name: 'Grammar Songs (Book and CD)', price: 2700, category: 'teacher-resources' },
  { name: 'Bumper Book', price: 17000, category: 'teacher-resources' },
  { name: 'Grammar Games CD (Single User)', price: 7250, category: 'teacher-resources' },
]

export const JOLLY_PRODUCTS: Product[] = CATALOG.map(toProduct)

export const JOLLY_PRODUCT_CATEGORIES = [
  { slug: 'jolly-phonics', label: 'Jolly Phonics & Fun Phonics' },
  { slug: 'jolly-readers', label: 'Jolly Phonics Readers' },
  { slug: 'jolly-grammar', label: 'Jolly Grammar' },
  { slug: 'teacher-resources', label: 'Teacher Resources' },
] as const
