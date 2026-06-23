# PHONICS CLUB — Complete Project Reference

> **One-page guide** for developers, admins, and stakeholders to understand what this platform is, every page, and every major feature.

---

## 1. What Is This Project?

**PHONICS CLUB** is a full-stack **education e-commerce + LMS (Learning Management System)** web application for **Phonics Club Pvt Ltd** — the official Jolly Phonics & Grammar distributor in Pakistan.

It combines:

| Pillar | Purpose |
|--------|---------|
| **E-commerce shop** | Sell ~112 Jolly Phonics books, kits, and teacher resources (PKR pricing, ISBN catalog) |
| **LMS / courses** | Online teacher training (Jolly Phonics, Preschool Professional, etc.) with curriculum & progress |
| **Training & consultancy** | Onsite/webinar registration, certified trainers, company info |
| **Blog & content** | News, phonics tips, PCTB/NOC updates |
| **Admin CMS** | Full back-office for products, orders, courses, content, and site settings |
| **AI assistant** | Floating chatbot for courses, products, pricing, and support |

**Company:** Phonics Club Pvt Ltd · Pakistan, LHR  
**Contact:** phonicscclub@gmail.com · +92 300 8079480 · +92 3022220448  
**Social:** [Instagram](https://www.instagram.com/phonics.club/) · [Facebook](https://www.facebook.com/phonicsclub/) · [YouTube](https://youtu.be/8Tjs_Z1I0cM)

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 15** (App Router, Server Components, Server Actions) |
| UI | **React 19**, **TypeScript**, **Tailwind CSS v4**, **Framer Motion** |
| Components | **shadcn/ui** (57 UI components) |
| Backend / DB | **Supabase** (PostgreSQL, Auth, Storage, RLS) |
| Images (optional) | **Cloudinary** + **Supabase Storage** (`product-images`, `course-images`, `order-receipts`) |
| Excel import/export | **xlsx** package |
| Email (optional) | **Resend** API for order confirmations |
| Package name | `phonics-club` |

**Demo mode:** If Supabase env vars are missing, the app runs with in-code seed data (products, courses, blog).

---

## 3. User Roles

| Role | Access |
|------|--------|
| **Guest** | Browse shop, courses, blog, contact, FAQs; use AI assistant |
| **Registered user** | Cart, wishlist, checkout, dashboard, course enrollment, learning player |
| **Admin** | Full `/admin` panel — products, orders, courses, CMS, trainers, coupons, etc. |

Roles are stored in Supabase `profiles.role` (`user` | `admin`). Middleware protects routes.

---

## 4. All Public Pages

### Homepage — `/`
- Hero, featured products & courses, school partner logos (“Tested at schools throughout Pakistan”)
- **Vortex Learning** partnership section
- Testimonials, stats, blog preview, newsletter, social reels (Instagram @phonics.club)
- Admin-editable announcement ticker at top

### Shop — `/shop`
- Full Jolly Phonics product catalog (~112 items with images)
- Filter by category (Activity Books, Pupil Books, Workbooks, Readers, Kits, etc.)
- Each card: **+ / − quantity**, **Add to cart**, **Wishlist**
- Prices in **PKR**, ISBN shown

### Product detail — `/shop/[slug]`
- Image, description, price, stock, ISBN
- Quantity selector, add to cart, wishlist
- **Related products** in same category
- **Back button** to previous page

### Courses listing — `/courses`
- Browse published courses by category (teacher-courses, phonics, reading, preschool)
- Featured courses, pricing, instructor, duration

### Course detail — `/courses/[slug]`
- Udemy-style layout: hero, thumbnail, instructor, rating, curriculum accordion
- Learning outcomes, requirements, instructor profile, related courses
- **Enroll** button (free or paid)

### Blog — `/blog`
- Article listing with category filters
- **Search** by title, excerpt, tags

### Blog article — `/blog/[slug]`
- Full post content, SEO metadata, author info

### About — `/about`
- Company story, mission, synthetic phonics focus

### Contact — `/contact`
- Email, phone, address, WhatsApp, contact form

### FAQs — `/faqs`
- Common questions (orders, NOC, training, returns)

### Trainings — `/trainings`
- 2025 training calendar (Jolly Phonics, Jolly Grammar)
- Online webinar registration + onsite request forms

### Consultancy — `/consultancy`
- Consulting services for schools and institutions

### Certified trainers — `/certified-trainers`
- Grid of certified Jolly Phonics trainers (admin-managed)

### Legal pages
| Page | URL | Content |
|------|-----|---------|
| Privacy Policy | `/privacy` | Data collection & usage |
| Terms of Service | `/terms` | Orders, payment, IP, shipping |
| Refund Policy | `/refunds` | Returns, cancellations, training refunds |
| Cookie Policy | `/cookies` | Cookie types & preferences |

### Auth
| Page | URL | Purpose |
|------|-----|---------|
| Login | `/auth/login` | Email/password sign in |
| Sign up | `/auth/signup` | Create account |
| Callback | `/auth/callback` | Supabase OAuth/email verification handler |

---

## 5. Student / Customer Pages (Login Required)

| Page | URL | What it does |
|------|-----|--------------|
| **Dashboard** | `/dashboard` | Overview: enrolled courses, progress, recent orders, quick links |
| **My courses** | `/dashboard/my-courses` | All enrollments with progress % and “Continue learning” |
| **Course player** | `/course/[id]/learn` | Lesson curriculum, mark complete, progress tracking |
| **Cart** | `/cart` | Line items, quantity controls, subtotal, link to checkout |
| **Wishlist** | `/wishlist` | Saved products |
| **Checkout** | `/checkout` | Shipping form, coupon/member ID, COD or bank transfer, receipt upload |
| **Order success** | `/checkout/success?order=...` | Confirmation + **download invoice** link |

### Checkout features
- **Email validation** + **Pakistan mobile validation** (03xx / +92 3xx)
- **Fixed shipping:** PKR **5,500** (with disclaimer that fees may vary by quantity/distance)
- **Coupon code** discount
- **Member ID** field + “Contact us” if unknown
- **Cash on Delivery** → order status `pending`
- **Bank transfer** → shows bank details, requires receipt upload → status `payment_review` until admin confirms

### Cart badge
- Red number on cart icon in navbar showing total item quantity

---

## 6. Admin Panel — `/admin`

All admin pages require `profiles.role = 'admin'`.

| Page | URL | Features |
|------|-----|----------|
| **Dashboard** | `/admin` | Stats: students, courses, enrollments, products, revenue, orders; quick actions |
| **Products** | `/admin/products` | List, search, bulk select |
| ↳ Import/Export | (toolbar) | **CSV & Excel** import/export; upsert by **ISBN** |
| ↳ Bulk update | (dialog) | Stock, price, price %, category, publish/feature |
| ↳ Bulk delete | (toolbar) | Delete selected products |
| ↳ Image upload | (dialog) | Supabase Storage; attach to product by ISBN |
| ↳ Import catalog | (button) | Seed ~112 Jolly Phonics products from image catalog |
| **New product** | `/admin/products/new` | Create product (ISBN required, unique key) |
| **Edit product** | `/admin/products/[id]` | Update product + Supabase image upload |
| **Courses** | `/admin/courses` | List all courses |
| **New course** | `/admin/courses/new` | Title, slug, price, curriculum builder (modules + lessons), objectives, SEO |
| **Edit course** | `/admin/courses/[id]` | Full LMS course editor |
| **Blog** | `/admin/blog` | List posts |
| **New / edit blog** | `/admin/blog/new`, `/admin/blog/[id]` | Title, content, tags, cover image, SEO, publish |
| **Orders** | `/admin/orders` | View all orders, line items, payment method, receipt |
| ↳ Confirm payment | (button) | For bank transfer orders → moves to processing |
| ↳ Update status | (dropdown) | pending → processing → shipped → delivered, etc. |
| ↳ Invoice | (link) | Download HTML invoice |
| **Site content** | `/admin/content` | Edit JSON for: announcements, testimonials, social reels, Vortex Learning, invoice template, bank details |
| **Trainers** | `/admin/trainers` | Add/remove certified trainers |
| **Users** | `/admin/users` | View registered users |
| **Coupons** | `/admin/coupons` | Create discount codes (% or fixed), max uses, expiry |
| **Certificates** | `/admin/certificates` | Certificate template management |
| **Training registrations** | `/admin/trainings` | View webinar/onsite registration submissions |
| **Upload** | `/admin/upload` | General Cloudinary image upload tool |

---

## 7. API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/cart/count` | Cart item count for navbar badge |
| POST | `/api/assistant` | AI chatbot replies (courses, products, FAQs) |
| GET | `/api/site/announcements` | Active announcement ticker content |
| GET | `/api/orders/[id]/invoice` | Download order invoice (HTML) |
| POST | `/api/upload` | Cloudinary image upload |
| GET | `/api/admin/products/export?format=csv\|xlsx` | Export product catalog |
| POST | `/api/admin/products/import` | Import CSV/Excel (ISBN upsert) |
| POST | `/api/admin/products/upload-image` | Product image → Supabase Storage |
| GET | `/api/admin/products/status` | Supabase connection health |
| GET | `/sitemap.xml` | SEO sitemap |
| GET | `/robots.txt` | SEO robots |

---

## 8. Product Catalog System

### Categories (10)
Activity Books · Pupil Books · Workbooks · Grammar Workbooks · Grammar Pupil Books · Teacher's Books · Comprehension · Readers · Teacher Resources · Kits

### Import / export
- **Unique key:** ISBN (update if exists, create if new)
- **Columns:** isbn, name, slug, description, price, compare_at_price, category, stock, featured, published, images
- **Formats:** `.csv`, `.xlsx`
- **Images:** Local paths (`/images/...`) or Supabase Storage URLs

### Catalog source files
- `lib/data/catalog-manifest.ts` — master product list
- `lib/data/catalog-from-images.ts` — builds catalog from `public/images/` folders
- `public/images/` — ~112 product images organized by category folders

---

## 9. LMS (Learning Management System)

### Course features
- Categories, levels, duration, instructor, thumbnail
- Objectives, requirements, SEO fields
- **Curriculum builder:** Module → Lessons (title, duration)
- Publish/unpublish, featured flag
- Free or paid pricing

### Student learning
- Enroll from course detail page
- Progress % tracked per enrollment
- **Learning player** at `/course/[id]/learn` — curriculum sidebar, mark lesson complete
- Certificate mention at 100% progress (templates in admin)

### Course detail page (public)
Hero, pricing, enroll, curriculum accordion, outcomes, requirements, instructor, related courses

---

## 10. Order & Payment Flow

```
Customer adds to cart → Checkout → Place order
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
            Cash on Delivery                  Bank Transfer
            status: pending                   status: awaiting_payment
            │                               Upload receipt → payment_review
            │                               Admin confirms → processing
                    └───────────────┬───────────────┘
                                    ▼
                            Email + invoice sent
                            Admin dispatches → shipped → delivered
```

### Order fields (Supabase)
- `subtotal`, `shipping_fee` (5500), `discount_amount`, `coupon_code`, `member_id`
- `payment_method` (cod | credit), `receipt_url`, `invoice_number`
- `phone`, `shipping_address` (JSON)

### Invoice
- HTML invoice with company header, line items, shipping disclaimer
- Admin can customize template via **Site Content → invoice_template**
- Customer downloads from success page or email link

---

## 11. AI Assistant (Chatbot)

**Floating button** bottom-right on every page.

| Capability | Examples |
|------------|----------|
| Course advisor | “What courses do you offer?”, “Recommend for beginners” |
| Product guide | “Show pupil books”, “How much is…?” |
| Pricing & payment | JazzCash, EasyPaisa, bank transfer info |
| Training dates | 2025 calendar, webinar registration |
| Personalized (logged in) | “My enrolled courses”, progress |
| Support | Contact info, NOC/PCTB, returns |

**Starter buttons:** Find a course · Browse products · Training dates · Contact support · Payment methods

Powered by `/api/assistant` + live data from courses, products, blog.

---

## 12. Homepage CMS (Admin-editable)

Managed at **`/admin/content`** (JSON editor):

| Key | Controls |
|-----|----------|
| `announcements` | Top ticker / flyer messages, links, coupon codes |
| `testimonials` | “What schools & teachers say” cards |
| `social_reels` | Instagram-style grid: thumbnail, video URL, title (play on hover/click) |
| `vortex_learning` | Partnership section: title, description, course cards |
| `invoice_template` | Invoice header, tagline, footer/shipping disclaimer |
| `bank_details` | Bank name, account, IBAN shown at checkout for credit orders |

---

## 13. School Partners Section

Homepage **Trust Badges** section:
- Heading: **“Tested at schools throughout Pakistan”**
- Logo carousel from `public/images/schools/partners-strip-1.png` and `partners-strip-2.png`
- Includes: Quixotic Academy, LGS, Froebel's, Ayan Montessori, Beaconhouse, RWIS, Dynamic International, Academus, ALDA, Horizon, etc.

---

## 14. Global UI Features

| Feature | Where |
|---------|-------|
| **Back button** | Shop, product detail, checkout, trainers, course pages |
| **Cart badge** | Navbar — red count on cart icon |
| **WhatsApp floating** | Bottom-left — quick contact |
| **Announcement bar** | Top of every page — admin-editable |
| **SEO** | Metadata, JSON-LD, sitemap, robots.txt per page |
| **Responsive design** | Mobile-first Tailwind layout |
| **Dark/light** | Theme support via next-themes |

---

## 15. Database (Supabase)

### Core tables
`profiles` · `products` · `courses` · `blog_posts` · `orders` · `cart_items` · `wishlist_items` · `enrollments`

### LMS tables
`course_modules` · `course_lessons` · `lesson_progress` · `course_reviews` · `certificates` · `course_categories`

### E-commerce extras
`coupons` · `training_registrations` · `certificate_templates` · `training_packages`

### CMS tables
`site_content` · `trainers` · `chatbot_knowledge` · `chat_sessions` · `blog_comments`

### Storage buckets
`product-images` · `course-videos` · `course-materials` · `course-images` · `order-receipts`

### Migrations (run in order)
1. `supabase/schema.sql`
2. `supabase/migrations/002_trainings_coupons.sql`
3. `supabase/migrations/003_product_isbn.sql`
4. `supabase/migrations/004_isbn_unique_storage.sql`
5. `supabase/migrations/005_lms_system.sql`
6. `supabase/migrations/006_orders_cms.sql`

---

## 16. Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=PHONICS CLUB
ADMIN_EMAIL=phonicscclub@gmail.com

# Supabase (required for production)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=product-images

# Cloudinary (optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Order emails (optional)
RESEND_API_KEY=
ORDER_EMAIL_FROM=orders@phonicsclub.com
```

---

## 17. Quick Start

```bash
npm install
cp .env.example .env.local   # fill Supabase keys
npm run dev                    # http://localhost:3000
```

**Make yourself admin** (after signup, in Supabase SQL):
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

**Seed products:** Admin → Products → **Import Catalog**

---

## 18. Page Map (Visual)

```
PHONICS CLUB
│
├── PUBLIC
│   ├── / ........................ Homepage
│   ├── /shop .................... Product catalog
│   ├── /shop/[slug] ............... Product detail
│   ├── /courses ................... Course listing
│   ├── /courses/[slug] ............ Course detail (LMS)
│   ├── /blog / /blog/[slug] ....... Blog
│   ├── /about / /contact / /faqs .. Info pages
│   ├── /trainings / /consultancy .. Services
│   ├── /certified-trainers ........ Trainer profiles
│   ├── /privacy / /terms / /refunds / /cookies
│   └── /auth/login / /auth/signup . Authentication
│
├── CUSTOMER (login required)
│   ├── /dashboard ................. Student home
│   ├── /dashboard/my-courses ...... Enrollments
│   ├── /course/[id]/learn ......... Lesson player
│   ├── /cart / /wishlist .......... Shopping
│   └── /checkout / /checkout/success
│
├── ADMIN (admin role)
│   └── /admin/*
│       ├── products (+ import/export/bulk)
│       ├── courses (+ curriculum builder)
│       ├── blog / orders / users
│       ├── content / trainers / coupons
│       └── certificates / trainings / upload
│
└── GLOBAL
    ├── AI Assistant (chatbot)
    ├── WhatsApp button
    └── Announcement ticker
```

---

## 19. Feature Checklist Summary

| Area | Status |
|------|--------|
| Product shop with 112+ Jolly items | ✅ |
| Cart + wishlist + quantity controls | ✅ |
| Checkout COD + bank transfer | ✅ |
| Coupon & member ID | ✅ |
| Invoice email + download | ✅ |
| Product import/export (ISBN upsert) | ✅ |
| Supabase Storage for images | ✅ |
| LMS courses + curriculum + player | ✅ |
| Student dashboard + progress | ✅ |
| Blog CMS | ✅ |
| Admin orders + payment confirm | ✅ |
| Homepage CMS (testimonials, reels, ticker) | ✅ |
| Vortex Learning section | ✅ |
| School partner logos | ✅ |
| Certified trainers admin | ✅ |
| AI assistant | ✅ |
| Legal pages | ✅ |
| SEO (sitemap, JSON-LD) | ✅ |
| Payment gateway (Stripe/JazzCash live) | 🔜 Prepared |
| PDF certificates auto-generate | 🔜 Templates ready |
| Video upload to course-videos bucket | 🔜 Schema ready |

---

*Last updated: May 2026 · Phonics Club Pvt Ltd*
