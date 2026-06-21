import type { MetadataRoute } from 'next'
import { APP_URL } from '@/lib/constants'
import { getProducts, getCourses, getBlogPosts } from '@/lib/data/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/courses',
    '/shop',
    '/blog',
    '/auth/login',
    '/auth/signup',
  ].map((path) => ({
    url: `${APP_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }))

  const [products, courses, posts] = await Promise.all([
    getProducts(),
    getCourses(),
    getBlogPosts(),
  ])

  const productRoutes = products.map((p) => ({
    url: `${APP_URL}/shop/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const courseRoutes = courses.map((c) => ({
    url: `${APP_URL}/courses/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const blogRoutes = posts.map((p) => ({
    url: `${APP_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...productRoutes, ...courseRoutes, ...blogRoutes]
}
