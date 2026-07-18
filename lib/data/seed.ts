import type { BlogPost } from '@/types/database'
import { PRODUCT_CATALOG_PRODUCTS } from './product-catalog'
import { PHONICS_COURSES } from './phonics-courses'

export const SEED_PRODUCTS = PRODUCT_CATALOG_PRODUCTS
export { PHONICS_COURSES as SEED_COURSES }

const now = new Date().toISOString()
const blog2017Date = '2017-04-15T00:00:00.000Z'

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
  {
    id: '2',
    title: 'Jolly Phonics 2017 Training Video',
    slug: 'jolly-phonics-2017-training-video',
    excerpt: 'A 2017 Phonics Club video resource highlighting Jolly Phonics training and literacy work.',
    content: `<p>This 2017 video shares Phonics Club training and classroom literacy work using Jolly Phonics.</p><p><a href="https://youtu.be/F8Rfx7Bn-I4?si=rSB5jssgwYR8uQ_T" target="_blank" rel="noopener noreferrer">Watch on YouTube</a></p><div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin-top:16px"><iframe src="https://www.youtube.com/embed/F8Rfx7Bn-I4" title="Jolly Phonics 2017 Training Video" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`,
    category: 'news',
    tags: ['Jolly Phonics', '2017', 'Training Video'],
    cover_image: '/logo.png',
    author_id: null,
    published: true,
    seo_title: 'Jolly Phonics 2017 Training Video',
    seo_description: 'Watch the 2017 Phonics Club Jolly Phonics training video.',
    created_at: blog2017Date,
    updated_at: now,
  },
]
