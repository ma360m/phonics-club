import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/auth'
import { SEED_PRODUCTS, SEED_COURSES, SEED_BLOG_POSTS } from './seed'
import { filterProductsByCollection } from '@/lib/product-collections'
import { normalizeMediaUrl } from '@/lib/media-url'
import type { Product, Course, BlogPost, Profile, Order } from '@/types/database'

function normalizeProduct(p: Product): Product {
  const compareAtPrice = Number(p.compare_at_price ?? 0)
  return {
    ...p,
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
    let items = SEED_COURSES.map(normalizeCourse)
    if (options?.category) items = items.filter((c) => c.category === options.category)
    if (options?.featured) items = items.filter((c) => c.featured)
    if (options?.limit) items = items.slice(0, options.limit)
    return items
  }

  const supabase = await createClient()
  let query = supabase.from('courses').select('*').eq('published', true)

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
  return ((data as Course[]) ?? []).map(normalizeCourse)
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  if (!isSupabaseConfigured()) {
    const course = SEED_COURSES.find((c) => c.slug === slug) ?? SEED_COURSES[0] ?? null
    return course ? normalizeCourse(course) : null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (error) {
    const course = SEED_COURSES.find((c) => c.slug === slug) ?? SEED_COURSES[0] ?? null
    return course ? normalizeCourse(course) : null
  }

  const fallback = SEED_COURSES.find((c) => c.slug === slug) ?? SEED_COURSES[0] ?? null
  return data ? normalizeCourse(data as Course) : (fallback ? normalizeCourse(fallback) : null)
}

export async function getBlogPosts(options?: {
  category?: string
  limit?: number
}): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) {
    let items = [...SEED_BLOG_POSTS]
    if (options?.category) items = items.filter((p) => p.category === options.category)
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
  return (data as BlogPost[]) ?? []
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!isSupabaseConfigured()) {
    return SEED_BLOG_POSTS.find((p) => p.slug === slug) ?? SEED_BLOG_POSTS[0] ?? null
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*, profiles(full_name, avatar_url)')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  return data as BlogPost | null
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
