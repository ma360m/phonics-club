import type { MetadataRoute } from 'next'
import { CANONICAL_URL } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/api/', '/checkout/', '/cart/', '/wishlist/', '/auth/'],
    },
    sitemap: `${CANONICAL_URL}/sitemap.xml`,
  }
}
