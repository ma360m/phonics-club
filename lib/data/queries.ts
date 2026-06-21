import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/auth'
import { SEED_PRODUCTS, SEED_COURSES, SEED_BLOG_POSTS } from './seed'
import type { Product, Course, BlogPost, Profile, Order } from '@/types/database'

function normalizeProduct(p: Product): Product {
  return {
    ...p,
    isbn: p.isbn ?? (p.metadata?.isbn as string) ?? null,
    price: Number(p.price),
  }
}

export async function getProducts(options?: {
  category?: string
  featured?: boolean
  limit?: number
}): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    let items = [...SEED_PRODUCTS]
    if (options?.category) items = items.filter((p) => p.category === options.category)
    if (options?.featured) items = items.filter((p) => p.featured)
    if (options?.limit) items = items.slice(0, options.limit)
    return items
  }

  const supabase = await createClient()
  let query = supabase.from('products').select('*').eq('published', true)

  if (options?.category) query = query.eq('category', options.category)
  if (options?.featured) query = query.eq('featured', true)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query.order('name', { ascending: true })

  if (error || !data?.length) {
    let items = [...SEED_PRODUCTS]
    if (options?.category) items = items.filter((p) => p.category === options.category)
    if (options?.featured) items = items.filter((p) => p.featured)
    if (options?.limit) items = items.slice(0, options.limit)
    return items
  }

  return (data as Product[]).map(normalizeProduct)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return SEED_PRODUCTS.find((p) => p.slug === slug) ?? null
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  return data ? normalizeProduct(data as Product) : null
}

export async function getCourses(options?: {
  category?: string
  featured?: boolean
  limit?: number
}): Promise<Course[]> {
  if (!isSupabaseConfigured()) {
    let items = [...SEED_COURSES]
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

  const { data } = await query.order('created_at', { ascending: false })
  return (data as Course[]) ?? []
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  if (!isSupabaseConfigured()) {
    return SEED_COURSES.find((c) => c.slug === slug) ?? SEED_COURSES[0] ?? null
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  return data as Course | null
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
