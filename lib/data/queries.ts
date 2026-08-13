import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/auth'
import { SEED_PRODUCTS, SEED_COURSES, SEED_BLOG_POSTS } from './seed'
import { CHILDREN_PHONICS_COURSES, mergeMissingChildrenPhonicsCourses, withChildrenPhonicsCourseUpdates } from './children-phonics-courses'
import { getTrainingEventBlogPosts, getTrainingEventBySlug, trainingEventToBlogPost } from './training-events-blog'
import { filterProductsByCollection } from '@/lib/product-collections'
import { normalizeMediaUrl } from '@/lib/media-url'
import type { Product, Course, BlogPost, Profile, Order } from '@/types/database'

const PRODUCT_IMAGE_PATH_FIXES = new Map([
  [
    '/images/Readers/OurWorld/L3-Green-Our-World-Readers-Complete-Set',
    '/images/Readers/OurWorld/L3-Green-Our-World-Readers-Complete-Set.jpg',
  ],
])

function normalizeProductImage(src: string) {
  return PRODUCT_IMAGE_PATH_FIXES.get(src) ?? src
}

function normalizeProduct(p: Product): Product {
  const compareAtPrice = Number(p.compare_at_price ?? 0)
  return {
    ...p,
    images: Array.isArray(p.images) ? p.images.map(normalizeProductImage) : [],
    isbn: p.isbn ?? (p.metadata?.isbn as string) ?? null,
    price: Number(p.price),
    compare_at_price: compareAtPrice > 0 ? compareAtPrice : null,
  }
}

function normalizeCourse(c: Course): Course {
  return {
    ...c,
    image_url: normalizeMediaUrl(c.image_url),
    thumbnail_url: normalizeMediaUrl(c.thumbnail_url),
    banner_url: normalizeMediaUrl(c.banner_url),
    instructor_image_url: normalizeMediaUrl(c.instructor_image_url),
    instructor_avatar: normalizeMediaUrl(c.instructor_avatar),
    certificate_background_url: normalizeMediaUrl(c.certificate_background_url),
    hero_video_url: normalizeMediaUrl(c.hero_video_url),
  }
}

export async function getProducts(options?: {
  category?: string
  collection?: string
  featured?: boolean
  limit?: number
}): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    let items = SEED_PRODUCTS.map(normalizeProduct)
    if (options?.category) items = items.filter((p) => p.category === options.category)
    items = filterProductsByCollection(items, options?.collection)
    if (options?.featured) items = items.filter((p) => p.featured)
    if (options?.limit) items = items.slice(0, options.limit)
    return items
  }

  const supabase = await createClient()
  let query = supabase.from('products').select('*').eq('published', true)

  if (options?.category) query = query.eq('category', options.category)
  if (options?.featured) query = query.eq('featured', true)

  const { data, error } = await query.order('name', { ascending: true })

  if (error || !data?.length) {
    let items = SEED_PRODUCTS.map(normalizeProduct)
    if (options?.category) items = items.filter((p) => p.category === options.category)
    items = filterProductsByCollection(items, options?.collection)
    if (options?.featured) items = items.filter((p) => p.featured)
    if (options?.limit) items = items.slice(0, options.limit)
    return items
  }

  let items = (data as Product[]).map(normalizeProduct)
  items = filterProductsByCollection(items, options?.collection)
  if (options?.limit) items = items.slice(0, options.limit)
  return items
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    const product = SEED_PRODUCTS.find((p) => p.slug === slug)
    return product ? normalizeProduct(product) : null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (error) {
    const product = SEED_PRODUCTS.find((p) => p.slug === slug)
    return product ? normalizeProduct(product) : null
  }

  const fallback = SEED_PRODUCTS.find((p) => p.slug === slug)
  return data ? normalizeProduct(data as Product) : (fallback ? normalizeProduct(fallback) : null)
}

export async function getCourses(options?: {
  category?: string
  featured?: boolean
  limit?: number
}): Promise<Course[]> {
  if (!isSupabaseConfigured()) {
    let items = mergeMissingChildrenPhonicsCourses(SEED_COURSES.map(normalizeCourse))
    if (options?.category) items = items.filter((c) => c.category === options.category)
    if (options?.featured) items = items.filter((c) => c.featured)
    if (options?.limit) items = items.slice(0, options.limit)
    return items
  }

  const supabase = await createClient()
  let query = supabase
    .from('courses')
    .select('*')
    .eq('published', true)
    .eq('visibility_status', 'published')
    .eq('unlisted', false)
    .eq('archived', false)

  if (options?.category) query = query.eq('category', options.category)
  if (options?.featured) query = query.eq('featured', true)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error || !data?.length) {
    let items = SEED_COURSES.map(normalizeCourse)
    if (options?.category) items = items.filter((c) => c.category === options.category)
    if (options?.featured) items = items.filter((c) => c.featured)
    if (options?.limit) items = items.slice(0, options.limit)
    return items
  }
  let items = mergeMissingChildrenPhonicsCourses(((data as Course[]) ?? []).map(normalizeCourse))
  if (options?.category) items = items.filter((c) => c.category === options.category)
  if (options?.featured) items = items.filter((c) => c.featured)
  if (options?.limit) items = items.slice(0, options.limit)
  return items
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  if (!isSupabaseConfigured()) {
    const course = mergeMissingChildrenPhonicsCourses(SEED_COURSES.map(normalizeCourse)).find((c) => c.slug === slug) ?? null
    return course ? normalizeCourse(course) : null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .in('visibility_status', ['published', 'unlisted'])
    .eq('archived', false)
    .maybeSingle()

  if (error) {
    const course = SEED_COURSES.find((c) => c.slug === slug) ?? null
    return course ? normalizeCourse(course) : null
  }

  const fallback = CHILDREN_PHONICS_COURSES.find((c) => c.slug === slug) ?? SEED_COURSES.find((c) => c.slug === slug) ?? null
  return data ? withChildrenPhonicsCourseUpdates(normalizeCourse(data as Course)) : (fallback ? normalizeCourse(fallback) : null)
}

export async function getBlogPosts(options?: {
  category?: string
  limit?: number
}): Promise<BlogPost[]> {
  const eventPosts = getTrainingEventBlogPosts({ category: options?.category })

  if (!isSupabaseConfigured()) {
    let items = [...eventPosts, ...SEED_BLOG_POSTS]
    if (options?.category) items = items.filter((p) => p.category === options.category)
    items = items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (options?.limit) items = items.slice(0, options.limit)
    return items
  }

  const supabase = await createClient()
  let query = supabase
    .from('blog_posts')
    .select('*, profiles(full_name, avatar_url)')
    .eq('published', true)

  if (options?.category) query = query.eq('category', options.category)
  if (options?.limit) query = query.limit(options.limit)

  const { data } = await query.order('created_at', { ascending: false })
  const databasePosts = (data as BlogPost[]) ?? []
  const databaseSlugs = new Set(databasePosts.map((post) => post.slug))
  const seedPosts = SEED_BLOG_POSTS.filter((post) => (!options?.category || post.category === options.category) && !databaseSlugs.has(post.slug))
  const merged = [
    ...eventPosts.filter((post) => !databaseSlugs.has(post.slug)),
    ...seedPosts,
    ...databasePosts,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return options?.limit ? merged.slice(0, options.limit) : merged
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!isSupabaseConfigured()) {
    const event = getTrainingEventBySlug(slug)
    return event ? trainingEventToBlogPost(event) : SEED_BLOG_POSTS.find((p) => p.slug === slug) ?? null
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*, profiles(full_name, avatar_url)')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (data) return data as BlogPost

  const event = getTrainingEventBySlug(slug)
  if (event) return trainingEventToBlogPost(event)
  return SEED_BLOG_POSTS.find((post) => post.published && post.slug === slug) ?? null
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  return (data as Profile[]) ?? []
}

export async function getAllOrders(): Promise<Order[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
  return (data as Order[]) ?? []
}

export async function getCartCount(userId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0
  const { getCartTotalQuantity } = await import('@/actions/cart')
  return getCartTotalQuantity(userId)
}
