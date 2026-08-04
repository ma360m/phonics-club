import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/home/:path*', destination: '/', permanent: true },
      { source: '/our-shop', destination: '/shop', permanent: true },
      { source: '/our-shop/:path*', destination: '/shop', permanent: true },
      { source: '/shop-now', destination: '/shop', permanent: true },
      { source: '/shop-now/:path*', destination: '/shop', permanent: true },
      { source: '/contact-us', destination: '/contact', permanent: true },
      { source: '/contact-us/:path*', destination: '/contact', permanent: true },
      { source: '/about-us', destination: '/about', permanent: true },
      { source: '/about-us/:path*', destination: '/about', permanent: true },
      { source: '/online-courses', destination: '/courses', permanent: true },
      { source: '/online-courses/:path*', destination: '/courses', permanent: true },
      { source: '/courses-online', destination: '/courses', permanent: true },
      { source: '/courses-online/:path*', destination: '/courses', permanent: true },
      { source: '/training', destination: '/trainings', permanent: true },
      { source: '/training/:path*', destination: '/trainings', permanent: true },
      { source: '/trainings-events', destination: '/trainings', permanent: true },
      { source: '/trainings-events/:path*', destination: '/trainings', permanent: true },
      { source: '/login-register', destination: '/auth/login', permanent: true },
      { source: '/login-register/:path*', destination: '/auth/login', permanent: true },
      { source: '/my-account', destination: '/dashboard', permanent: true },
      { source: '/my-account/:path*', destination: '/dashboard', permanent: true },
      { source: '/faq', destination: '/faqs', permanent: true },
      { source: '/privacy-policy', destination: '/privacy', permanent: true },
      { source: '/terms-and-conditions', destination: '/terms', permanent: true },
      { source: '/refund-policy', destination: '/refunds', permanent: true },
      { source: '/shipping-policy', destination: '/shipping', permanent: true },
      { source: '/noc-of-jolly-learning-books', destination: '/about', permanent: true },
      { source: '/noc-of-jolly-learning-books/:path*', destination: '/about', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

export default nextConfig
