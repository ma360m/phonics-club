# PHONICS CLUB

Production-ready full-stack education e-commerce platform built with Next.js 15, Supabase, and Cloudinary.

## Tech Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **TypeScript** + **Tailwind CSS v4**
- **Framer Motion** animations
- **Supabase** (PostgreSQL, Auth, RLS)
- **Cloudinary** (image CDN, WebP optimization)
- **Vercel** deployment ready

## Features

- Email/password authentication with httpOnly cookies
- Role-based access (Admin / User)
- E-commerce: products, cart, wishlist, checkout
- Education: courses, curriculum, enrollments
- Blog CMS with SEO metadata
- Admin dashboard (CRUD for products, courses, blog)
- Dynamic sitemap, robots.txt, JSON-LD schema
- Dark/light mode ready

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=PHONICS CLUB

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RESEND_API_KEY=your_resend_api_key
ORDER_EMAIL_FROM=orders@yourdomain.com
ORDER_ADMIN_EMAIL=admin@yourdomain.com
```

### 3. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Enable Email auth in Authentication → Providers
4. Set Site URL to `http://localhost:3000` and redirect URL to `http://localhost:3000/auth/callback`

### 4. Create admin user

Sign up via `/auth/signup`, then in SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** Without Supabase env vars, the app runs with seed data (read-only demo mode).

## Project Structure

```
app/
  admin/          # Admin dashboard CRUD
  auth/           # Login, signup, callback
  api/upload/     # Cloudinary upload endpoint
  shop/           # Product catalog
  courses/        # Course catalog
  blog/           # Blog CMS pages
  cart/ checkout/ wishlist/ dashboard/
actions/          # Server Actions
components/       # UI components
lib/              # Supabase, Cloudinary, auth, queries
types/            # TypeScript types
utils/            # SEO, formatting, slugs
supabase/         # Database schema
```

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add all environment variables from `.env.example`
4. Deploy

## Order confirmation emails

Orders send confirmation emails to both the customer and the admin through Resend.

1. Create a Resend account and verify the sending domain you want to use.
2. Add `RESEND_API_KEY` in `.env.local` and in Vercel project environment variables.
3. Set `ORDER_EMAIL_FROM` to an address on the verified domain, for example `orders@yourdomain.com`.
4. Set `ORDER_ADMIN_EMAIL` to the inbox that should receive new order notifications.
5. Set `NEXT_PUBLIC_APP_URL` to the live site URL so invoice links in emails open the deployed website.

Without `RESEND_API_KEY`, orders still save, invoices still generate, and the server logs which emails would have been sent.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
