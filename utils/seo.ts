import type { Metadata } from 'next'
import { APP_NAME, APP_URL, APP_DESCRIPTION } from '@/lib/constants'
import { COMPANY } from '@/lib/company'
import type { Product, Course, BlogPost } from '@/types/database'

const DEFAULT_KEYWORDS = [
  'Phonics Club',
  'Jolly Phonics Pakistan',
  'Synthetic Phonics',
  'Jolly Grammar',
  'phonics books',
  'teacher training Pakistan',
  'reading courses',
]

function cleanSeoText(value: string | null | undefined): string {
  return String(value || APP_DESCRIPTION)
    .replace(/â€”/g, '-')
    .replace(/\uFFFD/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function absoluteUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return `${APP_URL}/og-default.png`
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${APP_URL}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`
}

export function buildMetadata({
  title,
  description = APP_DESCRIPTION,
  path = '',
  image,
  type = 'website',
  keywords = [],
}: {
  title?: string
  description?: string
  path?: string
  image?: string
  type?: 'website' | 'article'
  keywords?: string[]
}): Metadata {
  const fullTitle = title ? `${title} | ${APP_NAME}` : `${APP_NAME} | Official Phonics Courses, Books & Training`
  const cleanDescription = cleanSeoText(description)
  const url = `${APP_URL}${path}`
  const ogImage = absoluteUrl(image)

  return {
    title: fullTitle,
    description: cleanDescription,
    metadataBase: new URL(APP_URL),
    applicationName: APP_NAME,
    creator: COMPANY.name,
    publisher: COMPANY.name,
    category: 'education',
    keywords: [...DEFAULT_KEYWORDS, ...keywords],
    alternates: { canonical: url },
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
      description: cleanDescription,
      url,
      siteName: APP_NAME,
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: cleanDescription,
      images: [ogImage],
    },
  }
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: APP_NAME,
    legalName: COMPANY.legalName,
    url: APP_URL,
    logo: `${APP_URL}/icon.svg`,
    description: cleanSeoText(COMPANY.description),
    foundingDate: String(COMPANY.founded),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'PK',
      addressLocality: 'Lahore',
      streetAddress: COMPANY.address,
    },
    contactPoint: [{
      '@type': 'ContactPoint',
      telephone: COMPANY.phoneDisplay,
      email: COMPANY.email,
      contactType: 'customer support',
      areaServed: 'PK',
      availableLanguage: ['English', 'Urdu'],
    }],
    sameAs: [
      COMPANY.social.instagram,
      COMPANY.social.facebook,
      COMPANY.social.youtube,
    ],
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP_NAME,
    url: APP_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${APP_URL}/shop?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function productJsonLd(product: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: cleanSeoText(product.description),
    image: product.images.map(absoluteUrl),
    sku: product.sku ?? product.product_number ?? product.id,
    gtin: product.isbn ?? undefined,
    offers: {
      '@type': 'Offer',
      price: product.price,
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
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: cleanSeoText(course.description || course.excerpt),
    provider: { '@type': 'EducationalOrganization', name: APP_NAME, url: APP_URL },
    offers: {
      '@type': 'Offer',
      price: course.discounted_price ?? course.price,
      priceCurrency: course.currency ?? 'PKR',
      availability: course.published ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${APP_URL}/courses/${course.slug}`,
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
    description: cleanSeoText(post.excerpt || post.seo_description),
    image: absoluteUrl(post.cover_image),
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
