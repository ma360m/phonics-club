export type UserRole = 'user' | 'admin'
export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'payment_review'
  | 'processing'
  | 'ready_to_dispatch'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  category: string
  isbn?: string | null
  images: string[]
  stock: number
  featured: boolean
  published: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  excerpt: string | null
  price: number
  category: string
  level: string
  duration: string | null
  instructor: string | null
  instructor_bio?: string | null
  instructor_avatar?: string | null
  image_url: string | null
  curriculum: CurriculumModule[]
  objectives?: string[]
  requirements?: string[]
  seo_title?: string | null
  seo_description?: string | null
  rating?: number
  students_count?: number
  is_free?: boolean
  featured: boolean
  published: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CurriculumModule {
  title: string
  lessons: { title: string; duration?: string }[]
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  category: string
  tags: string[]
  cover_image: string | null
  author_id: string | null
  published: boolean
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'full_name' | 'avatar_url'> | null
}

export interface Order {
  id: string
  user_id: string | null
  guest_email?: string | null
  access_token?: string | null
  status: OrderStatus
  total: number
  subtotal?: number
  shipping_fee?: number
  discount_amount?: number
  coupon_code?: string | null
  member_id?: string | null
  payment_method?: string
  phone?: string | null
  receipt_url?: string | null
  invoice_number?: string | null
  items: OrderItem[]
  shipping_address: Record<string, string> | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  product_id: string
  name: string
  price: number
  quantity: number
  image?: string
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  products?: Product
}

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
  products?: Product
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  progress: number
  enrolled_at: string
  courses?: Course
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> }
      courses: { Row: Course; Insert: Partial<Course>; Update: Partial<Course> }
      blog_posts: { Row: BlogPost; Insert: Partial<BlogPost>; Update: Partial<BlogPost> }
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> }
      cart_items: { Row: CartItem; Insert: Partial<CartItem>; Update: Partial<CartItem> }
      wishlist_items: { Row: WishlistItem; Insert: Partial<WishlistItem>; Update: Partial<WishlistItem> }
      enrollments: { Row: Enrollment; Insert: Partial<Enrollment>; Update: Partial<Enrollment> }
    }
  }
}
