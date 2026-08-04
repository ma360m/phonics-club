import type { Metadata } from 'next'
import { APP_NAME, APP_URL, APP_DESCRIPTION } from '@/lib/constants'
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
  return `${APP_URL}${value.startsWith('/') ? value : `/${value}`}`
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
  const fullTitle = title ? `${title} | ${APP_NAME}` : `${APP_NAME} | Premium Phonics Education`
  const url = `${APP_URL}${path}`
  const safeDescription = cleanSeoText(description)
  const ogImage = absoluteUrl(image) || `${APP_URL}/og-default.png`

  return {
    title: fullTitle,
    description: safeDescription,
    applicationName: APP_NAME,
    creator: APP_NAME,
    publisher: APP_NAME,
    category: 'education',
    keywords: DEFAULT_KEYWORDS,
    metadataBase: new URL(APP_URL),
    alternates: { canonical: url },
    icons: {
      icon: [
        { url: '/logo.png', type: 'image/png', sizes: '512x512' },
        { url: '/icon.svg', type: 'image/svg+xml' },
      ],
      apple: [{ url: '/apple-icon.png', type: 'image/png' }],
      shortcut: ['/logo.png'],
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
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${APP_URL}/#organization`,
    name: APP_NAME,
    alternateName: ['Phonics Club', 'Phonics Club Pakistan'],
    url: APP_URL,
    logo: `${APP_URL}/logo.png`,
    description: cleanSeoText(APP_DESCRIPTION),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        areaServed: 'PK',
        availableLanguage: ['English', 'Urdu'],
      },
    ],
    sameAs: [
      'https://www.instagram.com/phonics.club/',
      'https://www.facebook.com/phonicsclub/',
      'https://youtu.be/8Tjs_Z1I0cM',
    ],
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
      url: `${APP_URL}/shop/${product.slug}`,
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
    provider: { '@type': 'Organization', name: APP_NAME, url: APP_URL },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: course.currency ?? 'PKR',
      url: `${APP_URL}/courses/${course.slug}`,
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
      '@id': `${APP_URL}/#organization`,
      name: APP_NAME,
      logo: { '@type': 'ImageObject', url: `${APP_URL}/logo.png` },
    },
    url: `${APP_URL}/blog/${post.slug}`,
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${APP_URL}/#website`,
    name: APP_NAME,
    alternateName: ['Phonics Club', 'Phonics Club Pakistan'],
    url: APP_URL,
    inLanguage: 'en',
    publisher: { '@id': `${APP_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${APP_URL}/shop?q={search_term_string}`,
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
        url: `${APP_URL}${link.href}`,
      })),
    },
    hasPart: PRIMARY_SITE_LINKS.map((link, index) => ({
      '@type': 'SiteNavigationElement',
      position: index + 1,
      name: link.name,
      description: link.description,
      url: `${APP_URL}${link.href}`,
    })),
  }
}
