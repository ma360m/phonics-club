import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import {
  HeroSection,
  TrustBadges,
  Testimonials,
  StatsSection,
  Newsletter,
  SocialProof,
} from '@/components/sections'
import { VortexLearningSection } from '@/components/sections/vortex-learning'
import { FeaturedProductsGrid } from '@/components/sections/featured-products-grid'
import { FeaturedCoursesGrid } from '@/components/sections/featured-courses-grid'
import { BlogPreviewGrid } from '@/components/sections/blog-preview-grid'
import { JsonLd } from '@/components/seo/json-ld'
import { organizationJsonLd } from '@/utils/seo'
import { getProducts, getCourses, getBlogPosts } from '@/lib/data/queries'
import { getTestimonials, getSocialReels, getVortexLearning } from '@/lib/site-content'

export default async function HomePage() {
  const [products, courses, posts, testimonials, reels, vortex] = await Promise.all([
    getProducts({ featured: true, limit: 3 }),
    getCourses({ featured: true, limit: 3 }),
    getBlogPosts({ limit: 3 }),
    getTestimonials(),
    getSocialReels(),
    getVortexLearning(),
  ])

  return (
    <main>
      <JsonLd data={organizationJsonLd()} />
      <AnnouncementBar />
      <Navbar />
      <HeroSection />
      <TrustBadges />
      <VortexLearningSection data={vortex} />
      <FeaturedProductsGrid products={products} />
      <FeaturedCoursesGrid courses={courses} />
      <Testimonials items={testimonials} />
      <StatsSection />
      <BlogPreviewGrid posts={posts} />
      <Newsletter />
      <SocialProof reels={reels} />
      <Footer />
    </main>
  )
}
