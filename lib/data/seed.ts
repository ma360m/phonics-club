import type { BlogPost } from '@/types/database'
import { IMAGE_CATALOG_PRODUCTS } from './catalog-from-images'
import { PHONICS_COURSES } from './phonics-courses'

export const SEED_PRODUCTS = IMAGE_CATALOG_PRODUCTS
export { PHONICS_COURSES as SEED_COURSES }

const now = new Date().toISOString()

export const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'NOC of Jolly Learning Books — PCTB Approved',
    slug: 'noc-jolly-learning-books-pctb',
    excerpt: 'Almost all books are now PCTB approved. Buy only from authorized Phonics Club dealers.',
    content: `<p>Almost all the books are now approved from PCTB and Phonics Club has acquired NOCs of relevant textbooks and SRM.</p>`,
    category: 'news',
    tags: ['PCTB', 'NOC'],
    cover_image: '/logo.png',
    author_id: null,
    published: true,
    seo_title: 'NOC of Jolly Learning Books',
    seo_description: 'PCTB approved Jolly Learning books',
    created_at: now,
    updated_at: now,
  },
]
