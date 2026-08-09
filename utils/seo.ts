import type { Metadata } from 'next'
import { APP_NAME, APP_DESCRIPTION, CANONICAL_URL } from '@/lib/constants'
import { COMPANY } from '@/lib/company'
import { PRIMARY_SITE_LINKS } from '@/lib/primary-site-links'
import { getProductPricing } from '@/lib/products/sale-pricing'
import type { Product, Course, BlogPost } from '@/types/database'

const DEFAULT_KEYWORDS = [
  'Phonics Club',
  'Jolly Phonics Pakistan',
  'synthetic phonics training',
  'Jolly Grammar',
  'phonics courses',
  'phonics books Pakistan',
  'teacher training Pakistan',
  'early years literacy',
]

function cleanSeoText(value: string) {
  return value
    .replace(/\u00e2\u20ac\u201d/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function absoluteUrl(value?: string | null) {
  if (!value) return undefined
  if (/^https?:\/\//i.test(value)) return value
  return `${CANONICAL_URL}${value.startsWith('/') ? value : `/${value}`}`
}

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
  const fullTitle = title
    ? `${title} | ${APP_NAME}`
    : 'Phonics Club Pakistan | Jolly Phonics Training, Books & Literacy Courses'
  const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : ''
  const url = `${CANONICAL_URL}${normalizedPath}`
  const safeDescription = cleanSeoText(description)
  const ogImage = absoluteUrl(image) || `${CANONICAL_URL}/og-default.png`

  return {
    title: fullTitle,
    description: safeDescription,
    applicationName: APP_NAME,
    creator: APP_NAME,
    publisher: APP_NAME,
    category: 'education',
    keywords: DEFAULT_KEYWORDS,
    metadataBase: new URL(CANONICAL_URL),
    alternates: { canonical: url },
    icons: {
      icon: [
        { url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' },
        { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
        { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
        { url: '/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      ],
      shortcut: [{ url: '/favicon.ico', type: 'image/x-icon' }],
      apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title: fullTitle,
      description: safeDescription,
      url,
      siteName: APP_NAME,
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: safeDescription,
      images: [ogImage],
    },
  }
}

export function organizationJsonLd() {
  const sameAs = [COMPANY.social.instagram, COMPANY.social.facebook, COMPANY.social.youtube].filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${CANONICAL_URL}/#organization`,
    name: APP_NAME,
    legalName: COMPANY.legalName,
    alternateName: ['Phonics Club', 'Phonics Club Pakistan'],
    url: CANONICAL_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${CANONICAL_URL}/logo.png`,
      width: 373,
      height: 291,
    },
    image: `${CANONICAL_URL}/og-default.png`,
    description: cleanSeoText(APP_DESCRIPTION),
    foundingDate: String(COMPANY.founded),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        areaServed: 'PK',
        availableLanguage: ['English', 'Urdu'],
      },
    ],
    sameAs,
  }
}

export function productJsonLd(product: Product) {
  const pricing = getProductPricing(product)
  const image = absoluteUrl(product.images[0])
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: image ? [image] : undefined,
    sku: product.sku ?? product.product_number ?? product.id,
    gtin: product.isbn ?? undefined,
    offers: {
      '@type': 'Offer',
      price: pricing.displayPrice,
      priceCurrency: 'PKR',
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `${CANONICAL_URL}/shop/${product.slug}`,
    },
  }
}

export function courseJsonLd(course: Course) {
  const price = Number(course.discounted_price ?? course.price ?? 0)
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description || course.excerpt,
    provider: { '@type': 'Organization', name: APP_NAME, url: CANONICAL_URL },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: course.currency ?? 'PKR',
      url: `${CANONICAL_URL}/courses/${course.slug}`,
      availability: course.published ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
    },
    educationalLevel: course.level,
    image: absoluteUrl(course.image_url ?? course.thumbnail_url),
  }
}

export function articleJsonLd(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.seo_description,
    image: absoluteUrl(post.cover_image),
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.profiles?.full_name || APP_NAME,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${CANONICAL_URL}/#organization`,
      name: APP_NAME,
      logo: { '@type': 'ImageObject', url: `${CANONICAL_URL}/logo.png`, width: 373, height: 291 },
    },
    url: `${CANONICAL_URL}/blog/${post.slug}`,
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${CANONICAL_URL}/#website`,
    name: APP_NAME,
    alternateName: ['Phonics Club', 'Phonics Club Pakistan'],
    url: CANONICAL_URL,
    inLanguage: 'en',
    publisher: { '@id': `${CANONICAL_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${CANONICAL_URL}/shop?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Primary Phonics Club navigation',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: PRIMARY_SITE_LINKS.map((link, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: link.name,
        url: `${CANONICAL_URL}${link.href}`,
      })),
    },
    hasPart: PRIMARY_SITE_LINKS.map((link, index) => ({
      '@type': 'SiteNavigationElement',
      position: index + 1,
      name: link.name,
      description: link.description,
      url: `${CANONICAL_URL}${link.href}`,
    })),
  }
}
