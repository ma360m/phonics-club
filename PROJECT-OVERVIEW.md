# PHONICS CLUB - Full Project Report

Generated: 2026-09-09
Project root: `C:\Users\DELL\Downloads\education-ecommerce-ui`

## Executive Summary

Phonics Club is a full-stack education e-commerce and LMS platform for Phonics Club Pvt Ltd. It combines a Jolly Phonics product shop, online course catalogue, customer dashboard, checkout and invoice system, admin back office, content management, training registrations, blog/news content, mobile API routes, and a floating assistant.

The project is built with Next.js App Router, React, TypeScript, Tailwind CSS, Supabase, PDF/email utilities, and a large static asset catalogue under `public`.

## Technology Stack

| Area | Technology |
| --- | --- |
| Web framework | Next.js 15 App Router |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Components | shadcn/ui style component set in `components/ui` |
| Backend | Next.js Server Actions and API routes |
| Database/auth/storage | Supabase |
| Invoices | HTML renderer and PDF renderer with `pdf-lib` |
| Email | Nodemailer-based order, payment, training, course, and certificate emails |
| Data import/export | `xlsx`, CSV helpers, Supabase product upserts |
| Deployment support | Vercel config, OpenNext/Cloudflare generated output present |

## Top-Level Structure

| Path | Purpose |
| --- | --- |
| `app` | All public pages, admin pages, API routes, global layout, sitemap, robots, manifest, and global CSS. |
| `components` | Reusable UI for layout, shop, cart, checkout, courses, LMS, admin screens, assistant, and display preferences. |
| `actions` | Server Actions for auth, cart, orders, fast invoices, LMS, trainings, admin product/course/content flows. |
| `lib` | Business logic: Supabase clients, invoices, order stock, product search, LMS, site content, currency, email, mobile API helpers. |
| `public` | Logos, favicons, product images, course images, blog/event galleries, audio, PDFs, placeholders. |
| `supabase` | Base schema, seed SQL, and numbered migrations. |
| `scripts` | Maintenance scripts for catalogue building/imports, event image manifest generation, LearnPress migration, and mobile backend checks. |
| `types` | Shared TypeScript interfaces for database rows and app results. |
| `docs` | Project documentation, audits, launch notes, API/security docs, and migration reports. |
| `tmp` | Temporary migration and dev-server artifacts. |

## Public Website

| Route | Purpose |
| --- | --- |
| `/` | Homepage with hero, featured shop items, featured courses, trust badges, testimonials, newsletter, blog preview, and content sections. |
| `/shop` | Product catalogue with search/filtering, ISBN-aware product cards, pricing, cart/wishlist actions. |
| `/shop/[slug]` | Product detail page with images, price, stock, ISBN, add-to-cart, wishlist, and related products. |
| `/cart` | Shopping cart with item quantities, totals, and checkout entry. |
| `/checkout` | Customer checkout for guest/user orders, shipping details, payment method, discounts, and receipt flow. |
| `/checkout/success` | Order confirmation page with invoice links and optional edit token support. |
| `/courses` | Course catalogue with filters, search, course cards, and personalized learning support panel. |
| `/courses/[slug]` | Course sales/detail page with curriculum, instructor, enrollment/payment entry. |
| `/courses/[slug]/payment` | Course payment workflow. |
| `/course/[id]/learn` | LMS learning player for enrolled students. |
| `/course/[id]/quiz` | Course quiz flow. |
| `/course/[id]/certificate` | Certificate request/download flow. |
| `/blog` and `/blog/[slug]` | Blog listing and article/event gallery pages. |
| `/trainings` | Training/webinar information and registration. |
| `/consultancy` | Consultancy service page. |
| `/contact` | Contact details and form. |
| `/about`, `/privacy`, `/terms`, `/refunds`, `/cookies`, `/account-deletion` | Company and policy pages. |
| `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password` | Authentication and password recovery pages. |

## Admin Back Office

Admin pages are protected by middleware and role checks.

| Route | Main Capabilities |
| --- | --- |
| `/admin` | Dashboard and operational overview. |
| `/admin/products` | Product search, import/export, bulk updates, image upload, stock/pricing/publish controls. |
| `/admin/products/new`, `/admin/products/[id]` | Product creation and editing, including ISBN fields. |
| `/admin/orders` | Order list, search, invoice links, invoice number updates, payment confirmation, status/shipping controls, customer/order edits, line item edits. |
| `/admin/orders/invoice-numbering` | Invoice number management. |
| `/admin/fast-invoices` | Private fast invoice link creation and link history. |
| `/admin/courses`, `/admin/courses/new`, `/admin/courses/[id]`, `/admin/courses/[id]/builder` | Course creation/editing and curriculum builder. |
| `/admin/course-payments` | Course payment review and workflow management. |
| `/admin/enrollments` | Student enrollment and progress visibility. |
| `/admin/lms-reports` | LMS reporting dashboard. |
| `/admin/content` | Site content, announcements, invoice template, bank details, homepage content, FAQs/media. |
| `/admin/blog`, `/admin/blog/new`, `/admin/blog/[id]` | Blog CMS. |
| `/admin/trainers` | Certified trainer management. |
| `/admin/trainings`, `/admin/training-sessions` | Training registrations and session visibility. |
| `/admin/certificates` | Certificate templates and records. |
| `/admin/coupons` | Discount codes and member-related discounts. |
| `/admin/customers`, `/admin/users`, `/admin/activity-logs` | Customer, user, and operational visibility. |
| `/admin/settings/appearance`, `/admin/settings/currency`, `/admin/settings/payment-methods` | Appearance/accessibility, currency, and payment settings. |

## E-Commerce Flow

1. Customer browses `/shop`.
2. Product cards and product pages use product data from Supabase or seed fallback data.
3. Cart state is stored for logged-in users in Supabase and for guests via guest cart support.
4. Checkout validates customer details, payment method, discounts, and product stock.
5. Orders are stored in Supabase `orders` with JSON line items.
6. Invoices are generated through `lib/invoice.ts` for HTML and `lib/invoice-pdf.ts` for PDF.
7. Order emails are sent through `lib/email/send-order-email.ts`.
8. Admin manages orders through `/admin/orders`.

## Invoice System

| File | Role |
| --- | --- |
| `lib/invoice-summary.ts` | Calculates invoice lines, discounts, totals, shipping, and balance due. |
| `lib/invoice.ts` | Builds HTML invoices. |
| `lib/invoice-pdf.ts` | Builds downloadable PDF invoices. |
| `app/api/orders/[id]/invoice/route.ts` | Serves invoice HTML/PDF. |
| `actions/orders.ts` | Creates orders and processes admin/customer order edits. |
| `components/orders/order-items-editor.tsx` | Admin/customer item editor UI. |

Current invoice capabilities:

| Feature | Status |
| --- | --- |
| Invoice number generation and editing | Implemented |
| HTML invoice download | Implemented |
| PDF invoice download | Implemented |
| Product names, quantity, price, totals | Implemented |
| Discount and shipping breakdown | Implemented |
| Bank details and stock/payment notice | Implemented |
| Optional ISBN under product name in invoices | Implemented |
| Admin ISBN editing in order invoice item editor | Implemented |

## Fast Invoice Flow

Fast invoices allow admins to create private tokenized links for customers. Customers open `/fast-invoice/[token]`, select allowed products, enter customer/shipping/payment details, and create a normal order/invoice.

| File | Role |
| --- | --- |
| `app/admin/fast-invoices/page.tsx` | Admin fast invoice link page. |
| `components/admin/fast-invoice-link-form.tsx` | Link creation UI. |
| `app/fast-invoice/[token]/page.tsx` | Customer-facing private invoice page. |
| `components/fast-invoice/fast-invoice-form.tsx` | Product picker, customer form, preview, and payment choice. |
| `actions/fast-invoice.ts` | Validates token, loads products, creates order, sends invoice email. |

## Courses And LMS

The LMS supports public course discovery, enrollments, course payment workflows, lesson playback, quizzes, progress tracking, certificates, and admin reporting.

| File | Role |
| --- | --- |
| `app/courses/page.tsx` | Course catalogue page. |
| `app/courses/[slug]/page.tsx` | Public course details. |
| `components/courses/course-card.tsx` | Course card UI. |
| `components/courses/course-detail-view.tsx` | Course detail experience. |
| `components/courses/course-learn-player.tsx` | LMS learning player. |
| `lib/lms.ts` | LMS queries and business logic. |
| `actions/lms.ts` | LMS server actions. |

Recent content update:

The course catalogue support panel now uses the heading "Personalized Learning, Wherever You Are" and describes worldwide online classes, all subjects, all levels, global access, exam prep, specialized courses, and one-to-one tutoring.

## Product Catalogue

The product catalogue is ISBN-centered. Products include name, slug, description, price, sale pricing, category, product number, SKU/barcodes, ISBN, images, stock fields, and publish/feature flags.

| File | Role |
| --- | --- |
| `lib/data/catalog-manifest.ts` | Product image/name/price/category source manifest. |
| `lib/data/catalog-from-images.ts` | Builds product data from image catalogue metadata. |
| `lib/data/product-catalog.json` | Generated/static catalogue data. |
| `lib/products/search.ts` | Product search helpers, including ISBN search. |
| `lib/products/import-export.ts` | CSV/XLSX product import/export. |
| `actions/admin/products.ts` | Product create/update actions. |
| `components/admin/products-manager.tsx` | Product admin UI. |

## Content And SEO

| Area | Files |
| --- | --- |
| Metadata and favicons | `utils/seo.ts`, `app/manifest.ts`, `public/favicon-*`, `public/icon.svg`, `public/logo.png` |
| Sitemap and robots | `app/sitemap.ts`, `app/robots.ts` |
| Organization and website structured data | `utils/seo.ts` |
| CMS content loading | `lib/site-content.ts` |
| Admin content editing | `actions/admin/site-content.ts`, `app/admin/content/page.tsx` |

The browser/search icon configuration now points at the Phonics Club logo assets and the stale generic `public/icon.svg` has been replaced with the Phonics Club `P` mark.

## Mobile API

The app includes mobile backend endpoints under `app/api/mobile/v1`, with helpers in `lib/mobile-api`.

| Area | Example Routes |
| --- | --- |
| Auth/current user | `/api/mobile/v1/auth/me` |
| Config | `/api/mobile/v1/config` |
| Orders | `/api/mobile/v1/orders`, `/api/mobile/v1/orders/[orderId]`, invoice/receipt endpoints |
| Course payments | `/api/mobile/v1/course-payments` |
| Learning | `/api/mobile/v1/learning/courses`, lessons, sessions, resources |
| Certificates | `/api/mobile/v1/certificates` |
| Support | `/api/mobile/v1/support/issues` |
| Admin products/reviews/overview | `/api/mobile/v1/admin/*` |

## Database And Migrations

Supabase stores profiles, products, orders, courses, course modules/lessons, enrollments, progress, reviews, payments, certificates, site content, trainers, discounts, training events, mobile-related records, display preferences, and operational data.

| File/Folder | Role |
| --- | --- |
| `supabase/schema.sql` | Base schema. |
| `supabase/seed-products.sql` | Product seed data. |
| `supabase/newsletters.sql` | Newsletter schema/data helpers. |
| `supabase/migrations/*.sql` | Incremental schema changes. |

| Range | Theme |
| --- | --- |
| `002`-`004` | Trainings, coupons, product ISBN and storage uniqueness. |
| `005`-`014` | LMS foundation and premium hierarchy. |
| `015`-`023` | Site pages, trainers, media, payment statuses, currency/payment/shop content. |
| `024`-`027` | Mobile auth, storage, orders, admin, support, deletion. |
| `028`-`034` | Appearance/accessibility, discounts, homepage media, child course pricing. |
| `035`-`043` | Fast invoice/customer edit improvements, course payment licences/reminders, invoice numbering reliability. |

## Assets

Static assets live in `public`.

| Asset Area | Notes |
| --- | --- |
| Logos/icons | `logo.png`, `logo.svg`, `icon.svg`, favicon PNG/ICO files, app icons. |
| Product images | Organized by product category folders such as Activity Books, Readers, Pupilbooks, KITS, workbooks, resources, and teacher books. |
| Course images | `public/images/courses`. |
| Blog/event galleries | `public/images/blog`, `public/images/photos`, `public/images/gallery`. |
| Audio | Jolly Phonics 42 sounds and group audio under `public/audio`. |
| Catalog PDFs | `public/catalogs/Phonics_Club_Catalogue.pdf`. |

## Environment Variables

Key variables are documented in `.env.example`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public site URL. |
| `NEXT_PUBLIC_APP_NAME` | App/site name. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase browser anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase service key. |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Default product image bucket. |
| `CLOUDINARY_*` | Optional Cloudinary upload support. |
| `ORDER_EMAIL_FROM` | Order email sender. |

## Development Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies. |
| `npm run dev` | Start local dev server after regenerating event image manifest. |
| `npm run build` | Production build check. |
| `npm run start` | Start built app. |
| `npm run lint` | Runs ESLint if the binary is installed. |
| `npm run test:mobile-backend` | Runs mobile backend static checks. |
| `npm run generate:event-image-manifest` | Regenerates event/gallery image manifest. |

## Recent Changes In This Report Pass

| Area | Change |
| --- | --- |
| Invoices | Optional ISBN now appears below item/product names in a smaller font on HTML and PDF invoices. |
| Admin orders | The order item editor now includes an editable ISBN field under each invoice item in the customer invoice edit area. |
| Order data | `OrderItem` supports optional `isbn`; checkout, customer edits, admin edits, and fast invoice creation preserve ISBN where available. |
| Fast invoices | Product search/selection and invoice preview show ISBNs when products have them. |
| Courses page | Personalized support copy was replaced with the new personalized global online learning message. |
| SEO/icon | Search/browser icon metadata now includes the Phonics Club logo asset, and `public/icon.svg` no longer contains the generic framework icon. |

## Verification

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | Passed. |
| `npm run lint` | Could not run because `eslint` is not installed or not available in this checkout. |

## Maintenance Notes

Use `docs/PROJECT_FILE_GUIDE.md` for a more detailed file-by-file guide. Use this report as the high-level project overview for stakeholders and future development work.
