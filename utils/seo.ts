import type { Metadata } from 'next'
import { APP_NAME, APP_URL, APP_DESCRIPTION } from '@/lib/constants'
import type { Product, Course, BlogPost } from '@/types/database'

export function buildMetadata({
  title,
  description = APP_DESCRIPTION,
  path = '',
  image,
  type = 'website',
}: {
  title?: string
  description?: string
  path?: string
  image?: string
  type?: 'website' | 'article'
}): Metadata {
  const fullTitle = title ? `${title} | ${APP_NAME}` : `${APP_NAME} | Premium Phonics Education`
  const url = `${APP_URL}${path}`
  const ogImage = image || `${APP_URL}/og-default.png`

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(APP_URL),
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: APP_NAME,
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
  }
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    url: APP_URL,
    logo: `${APP_URL}/icon.svg`,
    description: APP_DESCRIPTION,
    sameAs: [
      'https://www.instagram.com/phonics.club/',
      'https://www.facebook.com/phonicsclub/',
      'https://youtu.be/8Tjs_Z1I0cM',
    ],
  }
}

export function productJsonLd(product: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images[0],
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `${APP_URL}/shop/${product.slug}`,
    },
  }
}

export function courseJsonLd(course: Course) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description || course.excerpt,
    provider: { '@type': 'Organization', name: APP_NAME, url: APP_URL },
    offers: {
      '@type': 'Offer',
      price: course.price,
      priceCurrency: 'USD',
      url: `${APP_URL}/courses/${course.slug}`,
    },
    educationalLevel: course.level,
    image: course.image_url,
  }
}

export function articleJsonLd(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.seo_description,
    image: post.cover_image,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.profiles?.full_name || APP_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: APP_NAME,
      logo: { '@type': 'ImageObject', url: `${APP_URL}/icon.svg` },
    },
    url: `${APP_URL}/blog/${post.slug}`,
  }
}
