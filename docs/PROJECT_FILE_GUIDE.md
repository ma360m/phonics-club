# Phonics Club Project File Guide

Generated: 2026-08-31  
Project root: `C:\Users\DELL\Downloads\education-ecommerce-ui`

This guide explains what the project folder contains, where the website pages are located, and what role the main files play in making the Phonics Club website work.

The project is a full-stack Next.js website. That means the same project contains the visible website pages, admin panel, API endpoints, database connection code, email logic, invoices, cart/checkout logic, course/LMS logic, and static images/files.

## 1. How The Website Is Put Together

When someone opens the website, the flow usually looks like this:

1. The browser opens a URL, for example `/shop` or `/admin/orders`.
2. Next.js looks inside the `app` folder for a matching route.
3. The matching `page.tsx` file renders the visible page.
4. That page imports reusable UI pieces from `components`.
5. Buttons, forms, tables, cards, and page sections are built with React JSX. JSX looks like HTML inside TypeScript files and becomes real HTML in the browser.
6. Styling is mostly Tailwind CSS classes inside `className`, with global design rules in `app/globals.css`.
7. When a user submits a form, clicks an admin action, enrolls in a course, updates cart quantity, uploads a receipt, or edits an order, the page usually calls a Server Action from `actions`.
8. Server Actions use helper functions from `lib` to talk to Supabase, generate invoices, send emails, validate data, manage stock, and load site content.
9. Supabase stores the real database records. Its schema and migrations live in `supabase`.
10. Images, logos, PDFs, audio files, and product/training photos are served from `public`.

In short:

```text
URL
  -> app route page
  -> components render the screen
  -> actions process form/button submissions
  -> lib contains business logic
  -> Supabase stores data
  -> public serves images, PDFs, icons, and downloads
```

## 2. Next.js File Rules Used In This Project

These file names have special meanings:

| File pattern | What it means |
| --- | --- |
| `app/page.tsx` | Homepage at `/`. |
| `app/shop/page.tsx` | Page for `/shop`. |
| `app/shop/[slug]/page.tsx` | Dynamic product page like `/shop/jolly-phonics-pupil-book-1`. |
| `app/course/[id]/learn/page.tsx` | Dynamic course learning page where `[id]` changes per course. |
| `app/fast-invoice/[token]/page.tsx` | Customer-facing fast invoice page where `[token]` changes per invoice link. |
| `app/api/.../route.ts` | API endpoint, not a visible page. Used by forms, mobile app, uploads, invoices, exports, etc. |
| `app/layout.tsx` | Global wrapper around the whole website. Adds fonts, providers, SEO JSON-LD, assistant, WhatsApp button, floating cart, and analytics. |
| `app/admin/layout.tsx` | Wrapper for admin pages. Adds the admin shell/sidebar around admin screens. |
| `loading.tsx` | Loading placeholder for slow pages. |
| `not-found.tsx` | Custom 404 page. |
| `error.tsx` | Error boundary for page crashes. |

Folders in square brackets are URL variables:

| Folder | Meaning |
| --- | --- |
| `[slug]` | Human-readable URL key, usually product/blog/course slug. |
| `[id]` | Database ID or record ID. |
| `[token]` | Secure public token, used for fast invoice links. |
| `[code]` | Verification code, used for certificate verification. |

## 3. Top-Level Folder Map

| Path | Role |
| --- | --- |
| `app` | All website pages, admin pages, API routes, global layout, sitemap, robots, manifest, and global CSS. |
| `components` | Reusable React UI components used by pages: navbar, footer, product cards, checkout forms, admin tables, course player, invoice tools, etc. |
| `actions` | Server Actions. These are backend functions called by forms/buttons without making a separate API route manually. |
| `lib` | Shared business logic: Supabase clients, auth helpers, invoices, email sending, product catalog logic, LMS logic, order stock logic, currency, bank details, validations, seed data. |
| `public` | Static files served directly by the website: logos, favicons, product images, course images, training photos, PDFs, audio ZIP, placeholders. |
| `supabase` | Database schema, SQL migrations, seed data, and Supabase setup scripts. |
| `scripts` | Local maintenance scripts: generate image manifests, build/import catalogs, migrate old content, run static checks. |
| `types` | Shared TypeScript database/type definitions. |
| `utils` | Utility helpers for formatting, SEO, and slug generation. |
| `hooks` | Reusable React hooks used by client components. |
| `styles` | Extra/global stylesheet location. Main active global CSS is in `app/globals.css`. |
| `docs` | Human-readable project documentation and audit reports. This file lives here. |
| `.env.local` | Local secrets and environment variables. Do not commit real secrets. |
| `.env.example` | Template showing which environment variables are needed. Safe to commit. |
| `.next` | Generated Next.js build/dev cache. Do not manually edit. |
| `.open-next` | Generated deployment/build output. Do not manually edit. |
| `.wrangler` | Cloudflare/Wrangler local generated state. Do not manually edit. |
| `node_modules` | Installed npm packages. Do not manually edit. |
| `tmp` | Temporary working files. Usually not part of source logic. |
| `temp-large-assets` | Temporary large asset storage. Usually not part of app source logic. |
| `.agents` | Codex/agent working metadata. Do not treat as website source. |
| `.cursor` | Cursor editor metadata/configuration. |

At the time this guide was written, the main source areas contained about:

| Area | Count |
| --- | ---: |
| `app` files | 168 |
| `components` files | 182 |
| `lib` files | 99 |
| `actions` files | 26 |
| `public` static files | 612 |
| Supabase migrations | 42 |

## 4. Root Config Files

| File | Role |
| --- | --- |
| `package.json` | Project name, dependencies, and npm scripts. Important scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, `npm run generate:event-image-manifest`, `npm run test:mobile-backend`. |
| `package-lock.json` | npm dependency lockfile. Keeps package versions repeatable for npm installs. |
| `pnpm-lock.yaml` | pnpm dependency lockfile. Present in the repo, but be careful mixing package managers. |
| `pnpm-workspace.yaml` | pnpm workspace configuration. |
| `next.config.mjs` | Next.js config. Handles legacy redirects, allows Cloudinary/Supabase image hosts, and raises Server Action body size limit to 50 MB for uploads. |
| `tsconfig.json` | TypeScript config. Enables strict checks and the `@/*` import alias. |
| `postcss.config.mjs` | PostCSS/Tailwind processing config. |
| `components.json` | shadcn/ui config. Says UI components live in `components/ui`, Tailwind CSS is `app/globals.css`, and icons use Lucide. |
| `middleware.ts` | Route protection and URL normalization. Protects `/dashboard`, `/wishlist`, `/admin`, and `/course`, redirects non-admin users away from admin pages, and redirects signed-in users away from login/signup. |
| `next-env.d.ts` | Generated Next.js TypeScript declarations. Do not edit manually. |
| `vercel.json` | Vercel deployment/runtime configuration. |
| `.gitignore` | Files/folders Git should ignore. |
| `README.md` | Short setup and feature overview. |
| `PROJECT-OVERVIEW.md` | Broad project reference with features/pages/admin summary. |

## 5. The `app` Folder: Pages, Layouts, API Routes

The `app` folder is the heart of the website routing system.

### Global App Files

| File | Role |
| --- | --- |
| `app/layout.tsx` | Global HTML wrapper. Loads fonts, site providers, JSON-LD SEO, analytics in production, floating cart button, WhatsApp button, shop popup, and AI assistant. |
| `app/page.tsx` | Homepage at `/`. Pulls together homepage sections such as hero, products, courses, trust badges, social proof, newsletters, etc. |
| `app/globals.css` | Main global CSS and Tailwind CSS theme/design tokens. This is where broad styling rules live. |
| `app/error.tsx` | Global error UI when a route crashes. |
| `app/not-found.tsx` | Custom 404 page. |
| `app/manifest.ts` | Generates the web app manifest with icons/logo metadata for browsers and mobile install prompts. |
| `app/robots.ts` | Generates `/robots.txt` for search engines. |
| `app/sitemap.ts` | Generates `/sitemap.xml` for search engines. |

### Public Website Pages

| URL | File | Role |
| --- | --- | --- |
| `/` | `app/page.tsx` | Homepage and main marketing/content entry point. |
| `/about` | `app/about/page.tsx` | Company/about page. |
| `/account-deletion` | `app/account-deletion/page.tsx` | Account deletion information/request page. |
| `/blog` | `app/blog/page.tsx` | Blog list with posts and filters/search. |
| `/blog/[slug]` | `app/blog/[slug]/page.tsx` | Individual blog article page. Also displays event/training gallery content when configured. |
| `/cart` | `app/cart/page.tsx` | Shopping cart page. Uses cart components to show line items, serial numbers, quantities, totals, and checkout link. |
| `/certificates/verify/[code]` | `app/certificates/verify/[code]/page.tsx` | Public certificate verification by code. |
| `/certified-trainers` | `app/certified-trainers/page.tsx` | Certified trainer listing. |
| `/certified-trainers/[slug]` | `app/certified-trainers/[slug]/page.tsx` | Individual trainer profile page. |
| `/checkout` | `app/checkout/page.tsx` | Checkout page. Renders shipping/customer/payment form and order submission flow. |
| `/checkout/success` | `app/checkout/success/page.tsx` | Order success page after checkout. |
| `/consultancy` | `app/consultancy/page.tsx` | Consultancy/service information page. |
| `/contact` | `app/contact/page.tsx` | Contact details and contact form. |
| `/cookies` | `app/cookies/page.tsx` | Cookie policy page. |
| `/faqs` | `app/faqs/page.tsx` | Frequently asked questions. |
| `/fast-invoice/[token]` | `app/fast-invoice/[token]/page.tsx` | Customer-editable fast invoice link page. |
| `/instructor` | `app/instructor/page.tsx` | Instructor landing/profile page. |
| `/instructors/[slug]` | `app/instructors/[slug]/page.tsx` | Individual instructor profile page. |
| `/newsletter` | `app/newsletter/page.tsx` | Newsletter landing/listing page. |
| `/newsletter/[slug]` | `app/newsletter/[slug]/page.tsx` | Individual newsletter issue/article. |
| `/newsletters` | `app/newsletters/page.tsx` | Alternate newsletter listing/admin-facing public view. |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy page. |
| `/refunds` | `app/refunds/page.tsx` | Refund policy page. |
| `/research` | `app/research/page.tsx` | Research/content page. |
| `/shipping` | `app/shipping/page.tsx` | Shipping policy/info page. |
| `/shop` | `app/shop/page.tsx` | Product catalog/shop listing. |
| `/shop/[slug]` | `app/shop/[slug]/page.tsx` | Product detail page. |
| `/terms` | `app/terms/page.tsx` | Terms of service page. |
| `/trainings` | `app/trainings/page.tsx` | Public training sessions and registration page. |
| `/wishlist` | `app/wishlist/page.tsx` | User wishlist page. Protected by middleware. |

### Auth Pages

| URL | File | Role |
| --- | --- | --- |
| `/auth/login` | `app/auth/login/page.tsx` | Login page. |
| `/auth/signup` | `app/auth/signup/page.tsx` | Signup page. |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | Password reset request page. |
| `/auth/reset-password` | `app/auth/reset-password/page.tsx` | Set new password page. |
| `/auth/callback` | `app/auth/callback/route.ts` | Supabase auth callback endpoint. Not a visible page. |

### Customer Dashboard And LMS Pages

| URL | File | Role |
| --- | --- | --- |
| `/dashboard` | `app/dashboard/page.tsx` | Customer dashboard with account/order/course overview. |
| `/dashboard/loading` | `app/dashboard/loading.tsx` | Dashboard loading UI. |
| `/dashboard/my-courses` | `app/dashboard/my-courses/page.tsx` | Customer's enrolled courses. |
| `/dashboard/my-courses/loading` | `app/dashboard/my-courses/loading.tsx` | My courses loading UI. |
| `/dashboard/profile` | `app/dashboard/profile/page.tsx` | Customer profile settings. |
| `/courses` | `app/courses/page.tsx` | Course listing page. |
| `/courses/loading` | `app/courses/loading.tsx` | Course listing loading UI. |
| `/courses/catalogue` | `app/courses/catalogue/page.tsx` | Course catalogue experience page. |
| `/courses/[slug]` | `app/courses/[slug]/page.tsx` | Course detail/sales page. |
| `/courses/[slug]/payment` | `app/courses/[slug]/payment/page.tsx` | Course payment page. |
| `/courses/[slug]/enroll` | `app/courses/[slug]/enroll/route.ts` | Course enrollment route/action endpoint. |
| `/course/[id]/learn` | `app/course/[id]/learn/page.tsx` | Course learning player. |
| `/course/[id]/learn/loading` | `app/course/[id]/learn/loading.tsx` | Course player loading UI. |
| `/course/[id]/quiz` | `app/course/[id]/quiz/page.tsx` | Course quiz/evaluation page. |
| `/course/[id]/quiz/loading` | `app/course/[id]/quiz/loading.tsx` | Quiz loading UI. |
| `/course/[id]/certificate` | `app/course/[id]/certificate/page.tsx` | Certificate request/download page. |
| `/course/[id]/certificate/loading` | `app/course/[id]/certificate/loading.tsx` | Certificate loading UI. |

### Admin Panel Pages

All admin pages are protected by `middleware.ts` and require an admin role in Supabase.

| URL | File | Role |
| --- | --- | --- |
| `/admin` | `app/admin/page.tsx` | Admin dashboard and quick links. |
| `/admin/layout` | `app/admin/layout.tsx` | Shared admin layout/sidebar wrapper. |
| `/admin/activity-logs` | `app/admin/activity-logs/page.tsx` | Admin activity, access, mobile audit, order/payment, enrollment, and event logs. |
| `/admin/blog` | `app/admin/blog/page.tsx` | Blog post list/admin management. |
| `/admin/blog/new` | `app/admin/blog/new/page.tsx` | Create blog post page. |
| `/admin/blog/[id]` | `app/admin/blog/[id]/page.tsx` | Edit blog post page. |
| `/admin/catalogs` | `app/admin/catalogs/page.tsx` | Manage downloadable/shop catalog PDFs. |
| `/admin/certificates` | `app/admin/certificates/page.tsx` | Certificate admin tools/templates/records. |
| `/admin/content` | `app/admin/content/page.tsx` | Site content editor for JSON-managed content, bank details, invoice templates, pages, media, FAQs, etc. |
| `/admin/coupons` | `app/admin/coupons/page.tsx` | Coupon creation and management. |
| `/admin/course-cancellations` | `app/admin/course-cancellations/page.tsx` | Course cancellation/refund/admin review area. |
| `/admin/course-payments` | `app/admin/course-payments/page.tsx` | Course payment review and management. |
| `/admin/course-payments/loading` | `app/admin/course-payments/loading.tsx` | Course payments loading UI. |
| `/admin/courses` | `app/admin/courses/page.tsx` | Course list/admin management. |
| `/admin/courses/loading` | `app/admin/courses/loading.tsx` | Course list loading UI. |
| `/admin/courses/new` | `app/admin/courses/new/page.tsx` | Create course page. |
| `/admin/courses/[id]` | `app/admin/courses/[id]/page.tsx` | Edit course page. |
| `/admin/courses/[id]/builder` | `app/admin/courses/[id]/builder/page.tsx` | Curriculum/module/lesson builder. |
| `/admin/customers` | `app/admin/customers/page.tsx` | Customer list and customer activity/order visibility. |
| `/admin/developer-mode` | `app/admin/developer-mode/page.tsx` | Developer/admin diagnostics area. |
| `/admin/enrollments` | `app/admin/enrollments/page.tsx` | Course enrollments visibility: enrolled users, course names, progress, completion, payment state. |
| `/admin/fast-invoices` | `app/admin/fast-invoices/page.tsx` | Fast invoice creation/listing page. |
| `/admin/fast-update` | `app/admin/fast-update/page.tsx` | Quick product/course update table. |
| `/admin/lms-reports` | `app/admin/lms-reports/page.tsx` | LMS reporting dashboard. |
| `/admin/lms-reports/loading` | `app/admin/lms-reports/loading.tsx` | LMS reports loading UI. |
| `/admin/manual` | `app/admin/manual/page.tsx` | Admin manual/help page. |
| `/admin/newsletters` | `app/admin/newsletters/page.tsx` | Newsletter admin area. |
| `/admin/orders` | `app/admin/orders/page.tsx` | Order management. Edit items, prices, dates, customer details, payment status, stock, invoices. |
| `/admin/orders/invoice-numbering` | `app/admin/orders/invoice-numbering/page.tsx` | Invoice number management/settings. |
| `/admin/products` | `app/admin/products/page.tsx` | Product list, search, bulk actions, import/export, stock and pricing management. |
| `/admin/products/new` | `app/admin/products/new/page.tsx` | Create product page. |
| `/admin/products/[id]` | `app/admin/products/[id]/page.tsx` | Edit product page. |
| `/admin/settings/appearance` | `app/admin/settings/appearance/page.tsx` | Appearance/accessibility settings. |
| `/admin/settings/currency` | `app/admin/settings/currency/page.tsx` | Currency settings and conversion. |
| `/admin/settings/payment-methods` | `app/admin/settings/payment-methods/page.tsx` | Payment method settings. |
| `/admin/trainers` | `app/admin/trainers/page.tsx` | Certified trainer admin management. |
| `/admin/training-sessions` | `app/admin/training-sessions/page.tsx` | Upcoming training session visibility and management. |
| `/admin/trainings` | `app/admin/trainings/page.tsx` | Training registrations/submissions. |
| `/admin/upload` | `app/admin/upload/page.tsx` | General upload page. |
| `/admin/users` | `app/admin/users/page.tsx` | User list/admin visibility. |

### API Routes

API routes live in `app/api`. They return JSON/files or process uploads. They are not page screens.

| Route/file | Role |
| --- | --- |
| `app/api/assistant/route.ts` | AI assistant endpoint. |
| `app/api/auth/me/route.ts` | Returns current logged-in user/profile information. |
| `app/api/auth/session/route.ts` | Session helper endpoint. |
| `app/api/cart/count/route.ts` | Cart badge count endpoint. |
| `app/api/cart/items/route.ts` | Cart item API. |
| `app/api/cart/guest/route.ts` | Guest cart syncing API. |
| `app/api/coupons/preview/route.ts` | Preview coupon discount before checkout. |
| `app/api/orders/[id]/invoice/route.ts` | Generates/downloads HTML/PDF invoice content for an order. |
| `app/api/orders/[id]/receipt/route.ts` | Receipt access/upload handling for an order. |
| `app/api/shop/catalogs/route.ts` | Shop catalog data/PDF endpoint. |
| `app/api/site/announcements/route.ts` | Announcement bar content endpoint. |
| `app/api/upload/route.ts` | General upload endpoint, often Cloudinary/media related. |
| `app/api/admin/products/export/route.ts` | Product export endpoint. |
| `app/api/admin/products/import/route.ts` | Product import endpoint. |
| `app/api/admin/products/status/route.ts` | Product/Supabase health/status endpoint. |
| `app/api/admin/products/upload-image/route.ts` | Product image upload endpoint. |
| `app/api/admin/orders/export/route.ts` | Orders export endpoint. |
| `app/api/admin/customers/export/route.ts` | Customers export endpoint. |
| `app/api/admin/students/export/route.ts` | Student export endpoint. |
| `app/api/admin/coupons/export/route.ts` | Coupon export endpoint. |
| `app/api/admin/blog/gallery/upload/route.ts` | Blog gallery image upload endpoint. |
| `app/api/admin/site-media/upload/route.ts` | Site media upload endpoint. |
| `app/api/admin/course-expiry-reminders/route.ts` | Course expiry reminder job/endpoint. |
| `app/api/admin/course-payment-pending-reminders/route.ts` | Pending course payment reminder job/endpoint. |

Mobile app backend endpoints live under `app/api/mobile/v1`. They mirror website features for a mobile client:

| Folder | Role |
| --- | --- |
| `app/api/mobile/v1/auth` | Mobile auth/current user endpoints. |
| `app/api/mobile/v1/config` | Mobile app configuration endpoint. |
| `app/api/mobile/v1/orders` | Mobile order list, checkout, invoice, receipt upload/access. |
| `app/api/mobile/v1/course-payments` | Mobile course payment checkout, status, receipt upload. |
| `app/api/mobile/v1/learning` | Mobile courses, course detail, lessons, resources, sessions, completion tracking. |
| `app/api/mobile/v1/quizzes` | Mobile quiz load and submit endpoints. |
| `app/api/mobile/v1/certificates` | Mobile certificate list, detail, and download endpoints. |
| `app/api/mobile/v1/trainings` | Mobile training registration endpoint. |
| `app/api/mobile/v1/support` | Support tickets and replies. |
| `app/api/mobile/v1/devices` | Device registration and device management. |
| `app/api/mobile/v1/children` | Child profile endpoints. |
| `app/api/mobile/v1/newsletter` | Newsletter subscribe/unsubscribe endpoints. |
| `app/api/mobile/v1/account-deletion` | Account deletion request/status/restore endpoints. |
| `app/api/mobile/v1/admin` | Mobile admin overview, products, inventory, pricing, and reviews. |

## 6. The `components` Folder: Reusable UI Pieces

Pages in `app` should stay readable. Most repeated UI is moved into `components`.

### Important Component Rule

Components are `.tsx` files. They generate HTML by returning JSX. Styling is mostly in Tailwind classes such as `className="rounded-md border p-4"`. Shared buttons, inputs, cards, selects, dialogs, tables, and tabs come from `components/ui`.

### Layout Components

| File | Role |
| --- | --- |
| `components/layout/navbar.tsx` | Main site navigation shell. |
| `components/layout/navbar-client.tsx` | Client-side interactive navbar behavior. |
| `components/layout/footer.tsx` | Website footer. |
| `components/layout/site-logo.tsx` | Reusable logo display. |
| `components/layout/header-search-dialog.tsx` | Search dialog in header. |
| `components/layout/announcement-bar.tsx` | Top announcement ticker/bar. |
| `components/layout/cart-badge.tsx` | Cart count badge. |
| `components/layout/floating-cart-button.tsx` | Floating cart shortcut. |
| `components/layout/wishlist-nav-link.tsx` | Wishlist navigation link. |
| `components/layout/whatsapp-button.tsx` | Floating WhatsApp contact button. |
| `components/layout/shop-now-popup.tsx` | Shop popup/CTA behavior. |
| `components/layout/back-button.tsx` | Reusable back navigation button. |

### Homepage Sections

| File | Role |
| --- | --- |
| `components/sections/hero-section.tsx` | Homepage hero area. |
| `components/sections/featured-products.tsx` | Featured product section. |
| `components/sections/featured-products-grid.tsx` | Grid layout for featured products. |
| `components/sections/featured-courses.tsx` | Featured course section. |
| `components/sections/featured-courses-grid.tsx` | Grid layout for featured courses. |
| `components/sections/featured-categories.tsx` | Category highlights. |
| `components/sections/blog-preview.tsx` | Homepage blog preview section. |
| `components/sections/blog-preview-grid.tsx` | Blog preview grid. |
| `components/sections/newsletter.tsx` | Newsletter signup/display section. |
| `components/sections/public-gallery.tsx` | Public gallery/media section. |
| `components/sections/reading-success-video.tsx` | Video section. |
| `components/sections/social-proof.tsx` | Social proof/reels/testimonials style area. |
| `components/sections/stats-section.tsx` | Stats counters/summary. |
| `components/sections/testimonials.tsx` | Testimonials. |
| `components/sections/trust-badges.tsx` | Trust/credibility badges. |
| `components/sections/vortex-learning.tsx` | Vortex Learning partnership/content section. |

### Shop, Cart, Checkout, Orders

| File | Role |
| --- | --- |
| `components/shop/product-card.tsx` | Product card in shop grids. |
| `components/shop/product-image.tsx` | Product image wrapper/handling. |
| `components/shop/product-gallery.tsx` | Product detail gallery. |
| `components/shop/product-shop-actions.tsx` | Add-to-cart/wishlist/product actions. |
| `components/shop/add-to-cart-button.tsx` | Add to cart button logic. |
| `components/shop/cart-item-controls.tsx` | Cart controls for signed-in cart items. |
| `components/shop/guest-cart-item-controls.tsx` | Cart controls for guest cart items. |
| `components/shop/quantity-stepper.tsx` | Plus/minus quantity selector. |
| `components/shop/category-filter.tsx` | Product category filters. |
| `components/shop/catalog-manager.tsx` | Shop catalog manager UI. |
| `components/cart/cart-page-client.tsx` | Interactive cart page UI, quantities, serial numbers, totals. |
| `components/checkout/checkout-form.tsx` | Checkout form: customer details, payment method, receipt upload, order submit. |
| `components/checkout/payment-receipt-upload-form.tsx` | Receipt upload after order/payment. |
| `components/checkout/clear-guest-cart-on-success.tsx` | Clears guest cart after successful checkout. |
| `components/orders/order-items-editor.tsx` | Admin editable order items/prices/custom invoice lines. |
| `components/orders/customer-order-controls.tsx` | Customer-side order controls. |
| `components/orders/order-status-timeline.tsx` | Order progress/status timeline. |
| `components/fast-invoice/fast-invoice-form.tsx` | Fast invoice creator/editor UI, including mobile-friendly item layout. |

### Courses And LMS Components

| File | Role |
| --- | --- |
| `components/courses/course-card.tsx` | Course card in course grids. |
| `components/courses/course-detail-view.tsx` | Course detail page UI. |
| `components/courses/course-catalogue-experience.tsx` | Course catalogue page experience. |
| `components/courses/course-filters.tsx` | Course filters. |
| `components/courses/course-image.tsx` | Course image display handling. |
| `components/courses/enroll-button.tsx` | Course enrollment button. |
| `components/courses/course-payment-forms.tsx` | Course payment forms and receipt flow. |
| `components/courses/course-learn-player.tsx` | Course lesson player UI. |
| `components/courses/course-quiz.tsx` | Course quiz/evaluation UI. |
| `components/courses/certificate-actions.tsx` | Certificate request/download/payment actions. |
| `components/courses/course-resource-access.tsx` | Course resource access/download handling. |
| `components/courses/course-wishlist-button.tsx` | Course wishlist button. |
| `components/courses/course-orbit-illustration.tsx` | Visual illustration used by course pages. |
| `components/lms/lms-shell.tsx` | Shared LMS layout shell. |
| `components/lms/lms-primitives.tsx` | Reusable LMS UI primitives. |
| `components/lms/lms-loading.tsx` | LMS loading UI. |

### Admin Components

| File | Role |
| --- | --- |
| `components/admin/admin-sidebar.tsx` | Admin navigation/sidebar. Add or remove admin tabs here. |
| `components/admin/admin-performance-dashboard.tsx` | Admin dashboard/performance card area. |
| `components/admin/admin-back-to-top.tsx` | Admin back-to-top helper. |
| `components/admin/product-form.tsx` | Product create/edit form. |
| `components/admin/products-manager.tsx` | Product list, search, bulk product management. |
| `components/admin/image-upload.tsx` | Admin image upload component. |
| `components/admin/order-actions.tsx` | Admin order status/payment actions. |
| `components/admin/order-bulk-invoice-selector.tsx` | Bulk invoice selection UI. |
| `components/admin/course-form.tsx` | Course create/edit form. |
| `components/admin/curriculum-builder.tsx` | Course module/lesson builder. |
| `components/admin/course-media-upload.tsx` | Course media upload tools. |
| `components/admin/course-bank-details-form.tsx` | Course payment bank detail editor. |
| `components/admin/certificate-form.tsx` | Certificate admin form. |
| `components/admin/blog-form.tsx` | Blog create/edit form. |
| `components/admin/about-gallery-manager.tsx` | About page gallery manager. |
| `components/admin/site-content-editor-list.tsx` | Site content JSON/editor list. |
| `components/admin/contact-settings-form.tsx` | Contact settings form. |
| `components/admin/appearance-settings-form.tsx` | Appearance/accessibility settings form. |
| `components/admin/currency-converter.tsx` | Currency conversion/settings UI. |
| `components/admin/member-discount-form.tsx` | Member discount settings form. |
| `components/admin/coupon-form.tsx` | Coupon create/edit form. |
| `components/admin/catalogs-manager.tsx` | Shop catalog PDF/admin manager. |
| `components/admin/fast-invoice-link-form.tsx` | Fast invoice link creation form. |
| `components/admin/fast-update-table.tsx` | Quick update table for admin. |
| `components/admin/faqs-manager.tsx` | FAQ manager. |
| `components/admin/rich-textarea.tsx` | Rich textarea/editor field. |
| `components/admin/rich-text-toolbar.tsx` | Toolbar for rich text editing. |
| `components/admin/school-logo-manager.tsx` | School logo manager. |
| `components/admin/social-reels-manager.tsx` | Social reels manager. |
| `components/admin/site-videos-manager.tsx` | Site video manager. |
| `components/admin/site-media-upload.tsx` | Site media upload component. |
| `components/admin/trainers-admin.tsx` | Certified trainers admin manager. |
| `components/admin/training-event-form.tsx` | Training session/event form. |
| `components/admin/training-registration-delete-button.tsx` | Delete training registration action button. |

### Other Component Areas

| Folder/file | Role |
| --- | --- |
| `components/auth/*` | Login, signup, forgot/reset password forms, password input. |
| `components/blog/*` | Blog thumbnails, event covers, share buttons, gallery lightbox. |
| `components/contact/contact-form.tsx` | Contact page form. |
| `components/currency/*` | Currency provider, switcher, price display. |
| `components/dashboard/profile-settings-form.tsx` | Customer profile settings form. |
| `components/display-preferences/*` | Theme/display/accessibility controls and provider UI. |
| `components/legal/*` | Shared legal page layout and policy content. |
| `components/seo/json-ld.tsx` | JSON-LD structured data component. |
| `components/training/*` | Training carousel, registration form, training video. |
| `components/assistant/phonics-assistant.tsx` | Floating AI assistant UI. |
| `components/providers.tsx` | App-wide React providers for themes, currency, display preferences, toasts, etc. |
| `components/theme-provider.tsx` | Theme provider wrapper. |
| `components/ui/*` | shadcn/Radix-style reusable UI primitives: button, input, card, table, dialog, tabs, select, tooltip, toast, etc. |

## 7. The `actions` Folder: Server Actions

Server Actions are backend functions that forms/buttons can call directly from React components.

| File | Role |
| --- | --- |
| `actions/auth.ts` | Login/signup/logout/password/account auth actions. |
| `actions/cart.ts` | Cart add/update/remove/clear actions. |
| `actions/orders.ts` | Checkout, order creation, order editing, invoice/customer edit, order status/payment workflows. |
| `actions/fast-invoice.ts` | Fast invoice create/update/share/customer edit actions. |
| `actions/lms.ts` | Course enrollment, progress, quiz/completion, certificate request, certificate payment screenshot actions. |
| `actions/enrollments.ts` | Enrollment-related actions. |
| `actions/profile.ts` | Customer profile update actions. |
| `actions/training.ts` | Training registration/session admin actions. |
| `actions/wishlist.ts` | Wishlist add/remove actions. |
| `actions/admin/products.ts` | Product create/edit/delete actions. |
| `actions/admin/products-bulk.ts` | Product bulk update/delete/import style actions. |
| `actions/admin/courses.ts` | Admin course CRUD actions. |
| `actions/admin/blog.ts` | Blog post CRUD actions. |
| `actions/admin/certificates.ts` | Certificate admin actions. |
| `actions/admin/coupons.ts` | Coupon admin actions. |
| `actions/admin/customers.ts` | Customer admin actions. |
| `actions/admin/fast-update.ts` | Fast update admin actions. |
| `actions/admin/lms.ts` | LMS admin actions. |
| `actions/admin/member-discounts.ts` | Member discount admin settings/actions. |
| `actions/admin/newsletters.ts` | Newsletter admin actions. |
| `actions/admin/settings.ts` | Admin settings actions. |
| `actions/admin/site-content.ts` | Site content/settings updates, including invoice template and bank detail normalization. |
| `actions/admin/trainers.ts` | Certified trainer admin actions. |
| `actions/admin/users.ts` | User admin actions. |
| `actions/admin/appearance-settings.ts` | Appearance/accessibility actions. |
| `actions/admin/course-cancellations.ts` | Course cancellation admin actions. |

## 8. The `lib` Folder: Shared Logic And Business Rules

The `lib` folder is where reusable business logic lives. Pages and actions import these files to keep logic consistent.

### Core Site And Commerce Helpers

| File | Role |
| --- | --- |
| `lib/company.ts` | Official company constants: names, contacts, and shop bank details. Product/shop invoices should use the company/shop bank details here. |
| `lib/constants.ts` | Shared constants. |
| `lib/commerce.ts` | General commerce helpers. |
| `lib/bank-details.ts` | Course payment bank details and bank detail normalization helpers. Course payments keep the consultancy account here. |
| `lib/payment-methods.ts` | Payment method definitions. |
| `lib/payment-method-settings.ts` | Payment method settings/content. |
| `lib/currency.ts` | Currency formatting/conversion helpers. |
| `lib/currency-settings.ts` | Site currency setting loader. |
| `lib/contact-settings.ts` | Contact settings helpers. |
| `lib/site-content.ts` | Reads/writes site content settings such as homepage sections, content blocks, contact details, invoice template, bank details. |
| `lib/friendly-error.ts` | Converts technical errors into friendlier messages. |
| `lib/media-url.ts` | Media URL normalization/handling. |
| `lib/utils.ts` | General utility functions, including className merging helpers. |

### Invoices, Orders, Stock

| File | Role |
| --- | --- |
| `lib/invoice.ts` | HTML invoice generation. Controls product invoice display, bank details, item rows, totals, notices. |
| `lib/invoice-pdf.ts` | PDF invoice generation. Controls PDF invoice layout. |
| `lib/invoice-summary.ts` | Invoice line summary, numbering, totals, final quantity total. |
| `lib/invoice-numbering.ts` | Invoice number settings/generation. |
| `lib/invoice-notices.ts` | Invoice stock/payment notice text and stock confirmation contact number. |
| `lib/order-status.ts` | Order status labels/logic. |
| `lib/orders/stock.ts` | Stock allocation/restoration checks for orders. |
| `lib/orders/receipt-upload.ts` | Receipt upload handling. |
| `lib/admin/orders.ts` | Admin order queries/formatting/helpers. |
| `lib/admin/customers.ts` | Admin customer queries/helpers. |
| `lib/admin/operational-visibility.ts` | Admin visibility for logs, enrollments, activities, training sessions, and events. |

### Products And Catalog

| File | Role |
| --- | --- |
| `lib/products/search.ts` | Product search/filter helpers. |
| `lib/products/inventory.ts` | Inventory/stock helpers. |
| `lib/products/import-export.ts` | CSV/XLSX import/export logic. |
| `lib/products/sale-pricing.ts` | Sale/discount pricing helpers. |
| `lib/products/upsert.ts` | Product upsert logic, usually by ISBN. |
| `lib/products/xlsx.ts` | Excel file parsing/writing helpers. |
| `lib/products/coming-soon.ts` | Coming-soon product logic. |
| `lib/product-collections.ts` | Product grouping/collection helpers. |
| `lib/shop-catalogs.ts` | Shop catalog PDF/data helpers. |
| `lib/shop-catalog-shared.ts` | Shared catalog helpers. |
| `lib/shop-catalog-upload.ts` | Shop catalog upload logic. |

### Course And LMS Logic

| File | Role |
| --- | --- |
| `lib/lms.ts` | LMS enrollment/progress/completion/certificate and course learning logic. |
| `lib/lms-storage.ts` | Course/LMS media storage helpers. |
| `lib/lms-hierarchy.ts` | Course/module/lesson hierarchy helpers. |
| `lib/course-payment-workflow.ts` | Course payment workflow logic. |
| `lib/course-format.ts` | Course formatting helpers. |
| `lib/course-catalogue-content.ts` | Course catalogue content helpers. |
| `lib/certificate-pdf.ts` | Certificate PDF generation. |
| `lib/admin/course-scope.ts` | Admin/instructor course scope helpers. |

### Auth, Supabase, Storage

| File | Role |
| --- | --- |
| `lib/auth.ts` | Auth/profile helpers used by pages/actions. |
| `lib/supabase/client.ts` | Browser/client Supabase client. |
| `lib/supabase/server.ts` | Server-side Supabase client. |
| `lib/supabase/middleware.ts` | Supabase session refresh used by `middleware.ts`. |
| `lib/supabase/auth-cookies.ts` | Auth cookie handling. |
| `lib/supabase/storage.ts` | Supabase Storage helpers. |
| `lib/cloudinary.ts` | Cloudinary upload/media helper. |
| `lib/rate-limit.ts` | General rate limiting helper. |

### Email

| File | Role |
| --- | --- |
| `lib/email/mailer.ts` | Shared email sending engine. Uses configured mail environment. |
| `lib/email/send-order-email.ts` | Customer/admin order confirmation emails. |
| `lib/email/send-payment-receipt-admin-email.ts` | Sends receipt upload notifications to admin. |
| `lib/email/send-training-registration-admin-email.ts` | Sends training registration notifications to admin. |
| `lib/email/send-course-enrollment-admin-email.ts` | Sends course enrollment and course completion notices to admin. |
| `lib/email/send-course-license-email.ts` | Sends course license/payment/customer course emails. |
| `lib/email/send-certificate-request-admin-email.ts` | Sends certificate request/payment screenshot emails to admin. |

### Data And Seed Content

| File | Role |
| --- | --- |
| `lib/data/seed.ts` | Fallback seed data when Supabase is not configured. |
| `lib/data/queries.ts` | Data fetching helpers. |
| `lib/data/product-catalog.ts` | Product catalog data helpers. |
| `lib/data/catalog-manifest.ts` | Product catalog manifest. |
| `lib/data/catalog-from-images.ts` | Builds product catalog from image folders. |
| `lib/data/jolly-products.ts` | Jolly product data. |
| `lib/data/phonics-courses.ts` | Course seed/content data. |
| `lib/data/children-phonics-courses.ts` | Children phonics course content. |
| `lib/data/children-phonics-install.ts` | Children phonics course install/helper data. |
| `lib/data/jolly-phonics-sound-data.ts` | Jolly phonics sound/audio data. |
| `lib/data/image-path.ts` | Image path helper. |
| `lib/data/training-events-blog.ts` | Training/blog event entries, including gallery folder mapping. |
| `lib/data/event-image-manifest.ts` | Generated manifest of images in training/gallery folders. Usually regenerated by script instead of edited manually. |
| `lib/data/training-event-newsletter-details.ts` | Extra details for training event newsletters. |

### Validations

| File | Role |
| --- | --- |
| `lib/validations/auth.ts` | Auth form validation schemas. |
| `lib/validations/blog.ts` | Blog form validation schemas. |
| `lib/validations/checkout.ts` | Checkout form validation schemas. |
| `lib/validations/course.ts` | Course form validation schemas. |
| `lib/validations/product.ts` | Product form/import validation schemas. |

### Mobile API Helpers

| File | Role |
| --- | --- |
| `lib/mobile-api/auth.ts` | Mobile auth helpers. |
| `lib/mobile-api/audit.ts` | Mobile audit/access/event logging helpers. |
| `lib/mobile-api/orders.ts` | Mobile order helper logic. |
| `lib/mobile-api/rate-limit.ts` | Mobile API rate limiting. |
| `lib/mobile-api/response.ts` | Standard mobile API response helpers. |
| `lib/mobile-api/schemas.ts` | Mobile API validation schemas. |
| `lib/mobile-api/storage.ts` | Mobile upload/storage helpers. |

### Other Lib Areas

| File/folder | Role |
| --- | --- |
| `lib/assistant/engine.ts` | AI assistant response logic. |
| `lib/discounts/member-discounts.ts` | Member discount helpers. |
| `lib/display-preferences/*` | Display preference types and initial script. |
| `lib/newsletters.ts` | Newsletter data/logic. |
| `lib/newsletter-pdf.ts` | Newsletter PDF generation. |
| `lib/seo/legacy-redirects.mjs` | Old URL to new URL redirect list used by `next.config.mjs`. |
| `lib/primary-site-links.ts` | Main site links/navigation data. |
| `lib/trainer-display.ts` | Trainer display helpers. |
| `lib/trainer-images.ts` | Trainer image helpers. |
| `lib/guest-cart-client.ts` | Guest cart browser/client helper. |

## 9. The `public` Folder: Images, Logos, PDFs, Downloads

Everything in `public` is served directly from the site root. For example:

| File/folder | Public URL example | Role |
| --- | --- | --- |
| `public/logo.png` | `/logo.png` | Main bitmap logo. |
| `public/logo.svg` | `/logo.svg` | Main vector logo. |
| `public/favicon.ico` | `/favicon.ico` | Browser favicon. |
| `public/favicon-48x48.png` | `/favicon-48x48.png` | Google Search favicon size. |
| `public/icon-192x192.png` | `/icon-192x192.png` | App/mobile icon. |
| `public/icon-512x512.png` | `/icon-512x512.png` | App/mobile icon. |
| `public/og-default.png` | `/og-default.png` | Default social preview image. |
| `public/placeholder*.png/svg/jpg` | `/placeholder.jpg` | Placeholder images. |
| `public/Jolly_Phonics_42_Sound_Clips.zip` | `/Jolly_Phonics_42_Sound_Clips.zip` | Downloadable audio/sound clips ZIP. |
| `public/catalogs/Phonics_Club_Catalogue.pdf` | `/catalogs/Phonics_Club_Catalogue.pdf` | Downloadable catalog PDF. |

Major image folders:

| Folder | Role |
| --- | --- |
| `public/images/Activity Books` | Product images for activity books. |
| `public/images/Pupilbooks` | Product images for pupil books. |
| `public/images/SLG pupil books` | Product images for spelling/grammar/pupil book area. |
| `public/images/workbooks` | Product images for workbooks. |
| `public/images/COMPREHENSION` | Product images for comprehension books. |
| `public/images/Readers` | Product images for readers. |
| `public/images/KITS` | Product images for kits. |
| `public/images/TEACHERS BOOK` | Product images for teacher books. |
| `public/images/resources` | Resource/product/supporting images. |
| `public/images/courses` | Course thumbnails/media. |
| `public/images/blog` | Blog images. |
| `public/images/gallery` | General gallery images. |
| `public/images/logos` | Logo assets. |
| `public/images/schools` | School logos/images. |
| `public/images/trainers` | Trainer profile images. |
| `public/images/letters` | Letter/sound assets. |
| `public/images/photos` | Event/training photo folders used by blog galleries. |

Training/event gallery folders inside `public/images/photos` include:

| Folder | Role |
| --- | --- |
| `Bright vision school` | Bright Vision School gallery images. |
| `chakwal training alfatah school` | Al-Fatah Chakwal training gallery images. |
| `avalon school wapda town lahore` | Avalon/Wapda Town Lahore event gallery. |
| `Gujranwala pilot project training session` | Gujranwala training gallery. |
| `Gujranwala refresher training jan 2026` | Gujranwala refresher gallery. |
| `KIPS school training lake city branch training summer 2026` | KIPS Lake City training gallery. |
| `karachi pilot project training` | Karachi training gallery. |
| `Lahore spring 2026 training starfish` | Lahore/Starfish training gallery. |
| `Soar stem school system` | SOAR STEM gallery. |
| Other folders in `public/images/photos` | Additional event galleries used by blog/training/newsletter content. |

Gallery connection flow:

```text
public/images/photos/<folder>
  -> scripts/generate-event-image-manifest.mjs
  -> lib/data/event-image-manifest.ts
  -> lib/data/training-events-blog.ts
  -> app/blog/[slug]/page.tsx
  -> components/blog/blog-gallery-lightbox.tsx
```

## 10. The `supabase` Folder: Database Setup

Supabase stores users, profiles, products, orders, courses, enrollments, payments, certificates, site content, training sessions, logs, and many other records.

| File/folder | Role |
| --- | --- |
| `supabase/schema.sql` | Main/base database schema. |
| `supabase/seed-products.sql` | Product seed SQL. |
| `supabase/newsletters.sql` | Newsletter-related SQL. |
| `supabase/school-logos.sql` | School logo SQL. |
| `supabase/migrations/*.sql` | Incremental database changes. Apply in order when setting up/updating Supabase. |

Important migration themes:

| Migration range | Role |
| --- | --- |
| `002` to `004` | Trainings, coupons, product ISBN/storage uniqueness. |
| `005` to `014` | LMS/course foundation and premium hierarchy. |
| `015` to `023` | Site pages, trainers, media, payment statuses, currency/payment/shop content. |
| `024` to `027` | Mobile backend auth, storage, LMS quiz, admin, support, deletion. |
| `028` to `034` | Appearance, accessibility, member/gallery, FAQs, homepage media, child course pricing. |
| `035` to `042` | Fast invoices, course payments, curriculum resources, reminders, quizzes, certificate payment settings. |

## 11. The `scripts` Folder: Maintenance Tools

| File | Role |
| --- | --- |
| `scripts/generate-event-image-manifest.mjs` | Scans event/gallery photo folders and regenerates `lib/data/event-image-manifest.ts`. Runs before dev/build through `package.json`. |
| `scripts/build-product-catalog.mjs` | Builds product catalog data from images/catalog source. |
| `scripts/import-product-catalog-to-supabase.mjs` | Imports product catalog data into Supabase. |
| `scripts/apply-child-course-pricing.mjs` | Applies child course pricing updates. |
| `scripts/migrate-learnpress-to-supabase.mjs` | Migration helper for old LearnPress content. |
| `scripts/repair-learnpress-migrated-content.mjs` | Repair helper for migrated course content. |
| `scripts/mobile-backend-static-checks.mjs` | Static checks for mobile backend/API setup. |

## 12. Types, Utils, Hooks, Styles

| Path | Role |
| --- | --- |
| `types/database.ts` | Supabase/database TypeScript types. Helps autocomplete and type-check database rows. |
| `types/index.ts` | Shared app-level TypeScript types. |
| `utils/format.ts` | Formatting helpers. |
| `utils/seo.ts` | SEO metadata, favicon/icon metadata, organization/website schema helpers. |
| `utils/slug.ts` | Slug generation helpers for clean URLs. |
| `hooks/use-currency.ts` | Client hook for currency state/display. |
| `hooks/use-mobile.ts` | Client hook for mobile breakpoint detection. |
| `hooks/use-toast.ts` | Client hook for toast notifications. |
| `styles/globals.css` | Extra/global CSS file. Main active global CSS is `app/globals.css`. |

## 13. Major Website Flows And Where Their Files Are

### A. Homepage Flow

```text
app/page.tsx
  -> components/layout/navbar.tsx and footer through layouts
  -> components/sections/hero-section.tsx
  -> components/sections/featured-products.tsx
  -> components/sections/featured-courses.tsx
  -> components/sections/blog-preview.tsx
  -> components/sections/newsletter.tsx
  -> lib/site-content.ts
  -> lib/data/seed.ts or Supabase data
```

Edit homepage layout in `app/page.tsx`. Edit reusable homepage blocks in `components/sections`. Edit admin-managed content loading in `lib/site-content.ts`.

### B. Shop And Product Flow

```text
app/shop/page.tsx
  -> components/shop/product-card.tsx
  -> components/shop/category-filter.tsx
  -> lib/products/search.ts
  -> Supabase products table or lib/data fallback catalog

app/shop/[slug]/page.tsx
  -> components/shop/product-gallery.tsx
  -> components/shop/product-shop-actions.tsx
  -> actions/cart.ts
  -> actions/wishlist.ts
```

Product images live mostly under `public/images/<product category folder>`. Product admin lives under `app/admin/products` and `components/admin/products-manager.tsx`.

### C. Cart And Checkout Flow

```text
components/shop/add-to-cart-button.tsx
  -> actions/cart.ts
  -> cart storage/user cart
  -> app/cart/page.tsx
  -> components/cart/cart-page-client.tsx
  -> app/checkout/page.tsx
  -> components/checkout/checkout-form.tsx
  -> actions/orders.ts
  -> lib/orders/stock.ts
  -> lib/invoice.ts and lib/invoice-pdf.ts
  -> lib/email/send-order-email.ts
  -> app/checkout/success/page.tsx
```

Cart, checkout, and invoices show serial numbering and final quantity totals through the cart UI and invoice summary helpers.

### D. Product Invoice Flow

```text
actions/orders.ts
  -> lib/invoice-summary.ts
  -> lib/invoice.ts
  -> lib/invoice-pdf.ts
  -> lib/company.ts
  -> lib/invoice-notices.ts
  -> app/api/orders/[id]/invoice/route.ts
```

Product/shop invoice bank details must use the Phonics Club Pvt Ltd shop/company account from `lib/company.ts`. The consultancy account is for course payments only and is kept in `lib/bank-details.ts`.

### E. Fast Invoice Flow

```text
app/admin/fast-invoices/page.tsx
  -> components/admin/fast-invoice-link-form.tsx
  -> components/fast-invoice/fast-invoice-form.tsx
  -> actions/fast-invoice.ts
  -> lib/fast-invoice.ts
  -> app/fast-invoice/[token]/page.tsx
  -> customer edits/adds/removes allowed invoice items
```

Fast invoice customer pages use `[token]` so a customer can open a specific invoice link without needing the admin URL.

### F. Admin Order Editing Flow

```text
app/admin/orders/page.tsx
  -> components/orders/order-items-editor.tsx
  -> components/admin/order-actions.tsx
  -> actions/orders.ts
  -> lib/admin/orders.ts
  -> lib/orders/stock.ts
  -> lib/invoice-summary.ts
```

This is where admin can edit order dates, customer contact/details, product prices, quantities, add custom invoice lines, remove lines, and regenerate invoices.

### G. Courses, LMS, Certificate Flow

```text
app/courses/page.tsx
  -> components/courses/course-card.tsx

app/courses/[slug]/page.tsx
  -> components/courses/course-detail-view.tsx
  -> components/courses/enroll-button.tsx
  -> actions/lms.ts

app/course/[id]/learn/page.tsx
  -> components/courses/course-learn-player.tsx
  -> lib/lms.ts

app/course/[id]/quiz/page.tsx
  -> components/courses/course-quiz.tsx
  -> actions/lms.ts

app/course/[id]/certificate/page.tsx
  -> components/courses/certificate-actions.tsx
  -> actions/lms.ts
  -> lib/email/send-certificate-request-admin-email.ts
```

Admin course pages live under `app/admin/courses`. Course payment review lives under `app/admin/course-payments`. Enrollment visibility lives under `app/admin/enrollments`.

### H. Course Payment Flow

```text
app/courses/[slug]/payment/page.tsx
  -> components/courses/course-payment-forms.tsx
  -> actions/lms.ts
  -> lib/course-payment-workflow.ts
  -> lib/bank-details.ts
  -> lib/email/send-course-license-email.ts
  -> app/admin/course-payments/page.tsx
```

Course payment bank details are separate from product/shop invoice bank details.

### I. Blog And Gallery Flow

```text
app/blog/page.tsx
  -> blog list/search/filter

app/blog/[slug]/page.tsx
  -> lib/data/training-events-blog.ts
  -> lib/data/event-image-manifest.ts
  -> components/blog/event-cover.tsx
  -> components/blog/blog-gallery-lightbox.tsx
```

To add photos for a training/event blog:

1. Put the images in `public/images/photos/<exact folder name>`.
2. Connect that folder to the matching blog/event in `lib/data/training-events-blog.ts`.
3. Run `npm run generate:event-image-manifest` or let `npm run dev`/`npm run build` run it automatically.

### J. Training Session Flow

```text
app/trainings/page.tsx
  -> components/training/webinar-carousel.tsx
  -> components/training/training-registration-form.tsx
  -> actions/training.ts
  -> lib/email/send-training-registration-admin-email.ts
  -> app/admin/trainings/page.tsx
  -> app/admin/training-sessions/page.tsx
```

Public users register on `/trainings`. Admin reviews registrations in `/admin/trainings` and upcoming sessions in `/admin/training-sessions`.

### K. Admin Logs And Visibility Flow

```text
app/admin/activity-logs/page.tsx
  -> lib/admin/operational-visibility.ts
  -> Supabase activity/audit/order/payment/enrollment tables

app/admin/enrollments/page.tsx
  -> lib/admin/operational-visibility.ts

app/admin/training-sessions/page.tsx
  -> lib/admin/operational-visibility.ts
```

These pages are built for admin visibility into activity, access logs, events, course enrollments, course completion, and upcoming sessions.

### L. Email Flow

```text
actions/orders.ts or actions/lms.ts or actions/training.ts
  -> lib/email/<specific email file>.ts
  -> lib/email/mailer.ts
  -> configured mail service/environment
```

Main email templates/flows:

| File | Email flow |
| --- | --- |
| `lib/email/send-order-email.ts` | Order confirmation to customer/admin. |
| `lib/email/send-payment-receipt-admin-email.ts` | Receipt upload notice to admin. |
| `lib/email/send-training-registration-admin-email.ts` | Training registration notice to admin. |
| `lib/email/send-course-enrollment-admin-email.ts` | Course enrollment and completion notice to admin. |
| `lib/email/send-certificate-request-admin-email.ts` | Certificate request and screenshot notice to admin. |
| `lib/email/send-course-license-email.ts` | Course payment/license/customer course email. |

## 14. Where To Edit Common Things

| Need to change | Go here |
| --- | --- |
| Add a new public page | Create `app/<new-route>/page.tsx`. |
| Add a new admin tab/page | Create `app/admin/<new-tab>/page.tsx`, then add nav item in `components/admin/admin-sidebar.tsx`. |
| Change the homepage | `app/page.tsx` and `components/sections/*`. |
| Change header/nav/footer | `components/layout/navbar.tsx`, `components/layout/navbar-client.tsx`, `components/layout/footer.tsx`. |
| Change global colors/fonts/base styles | `app/globals.css`. |
| Change reusable button/input/table/card behavior | `components/ui/*`. |
| Change shop product cards | `components/shop/product-card.tsx`. |
| Change product detail page | `app/shop/[slug]/page.tsx` and `components/shop/*`. |
| Change cart page | `app/cart/page.tsx` and `components/cart/cart-page-client.tsx`. |
| Change checkout page | `app/checkout/page.tsx` and `components/checkout/checkout-form.tsx`. |
| Change order creation/editing | `actions/orders.ts`, `lib/admin/orders.ts`, `components/orders/order-items-editor.tsx`. |
| Change product/shop invoice layout | `lib/invoice.ts` and `lib/invoice-pdf.ts`. |
| Change product/shop invoice totals/numbering | `lib/invoice-summary.ts`. |
| Change product/shop bank details | `lib/company.ts`, and keep admin invoice template normalization in `actions/admin/site-content.ts` / `lib/site-content.ts`. |
| Change course payment bank details | `lib/bank-details.ts` and `components/admin/course-bank-details-form.tsx`. |
| Change invoice stock/payment warning | `lib/invoice-notices.ts`. |
| Change fast invoice UI | `components/fast-invoice/fast-invoice-form.tsx`. |
| Change fast invoice backend | `actions/fast-invoice.ts` and `lib/fast-invoice.ts`. |
| Change course listing/detail pages | `app/courses/page.tsx`, `app/courses/[slug]/page.tsx`, `components/courses/*`. |
| Change LMS learning player | `app/course/[id]/learn/page.tsx`, `components/courses/course-learn-player.tsx`, `lib/lms.ts`. |
| Change certificate request flow | `app/course/[id]/certificate/page.tsx`, `components/courses/certificate-actions.tsx`, `actions/lms.ts`, `lib/email/send-certificate-request-admin-email.ts`. |
| Change course enrollment/completion admin email | `actions/lms.ts`, `lib/lms.ts`, `lib/email/send-course-enrollment-admin-email.ts`. |
| Change admin enrollments visibility | `app/admin/enrollments/page.tsx`, `lib/admin/operational-visibility.ts`. |
| Change admin logs visibility | `app/admin/activity-logs/page.tsx`, `lib/admin/operational-visibility.ts`. |
| Change upcoming training sessions admin view | `app/admin/training-sessions/page.tsx`, `actions/training.ts`, `lib/admin/operational-visibility.ts`. |
| Change public training page | `app/trainings/page.tsx`, `components/training/*`, `actions/training.ts`. |
| Change blog list/article pages | `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `components/blog/*`. |
| Add/change blog event gallery folders | `public/images/photos/*`, `lib/data/training-events-blog.ts`, regenerate `lib/data/event-image-manifest.ts`. |
| Change email sending engine | `lib/email/mailer.ts`. |
| Change a specific email template | `lib/email/send-*.ts`. |
| Change SEO metadata/favicons/schema | `utils/seo.ts`, `app/manifest.ts`, `app/sitemap.ts`, `app/robots.ts`, `public/favicon-*.png`, `public/og-default.png`. |
| Change protected route rules | `middleware.ts`. |
| Change Supabase tables/policies | `supabase/schema.sql` and a new migration in `supabase/migrations`. |
| Change mobile API behavior | `app/api/mobile/v1/*` and `lib/mobile-api/*`. |

## 15. Files/Folders To Avoid Editing Casually

These are generated or dependency folders:

| Path | Why to avoid |
| --- | --- |
| `.next` | Generated by Next.js dev/build. Changes will be overwritten. |
| `.open-next` | Generated deployment/build output. |
| `.wrangler` | Generated Cloudflare/Wrangler local state. |
| `node_modules` | Installed packages. Change `package.json` instead. |
| `tsconfig.tsbuildinfo` | TypeScript incremental cache. |
| `next-env.d.ts` | Generated by Next.js. |
| `lib/data/event-image-manifest.ts` | Generated by `scripts/generate-event-image-manifest.mjs`; edit source photo folders and event mapping first. |
| `.env.local` | Contains local secrets. Edit only when changing local environment values, never commit real secrets. |

## 16. Development Commands

Run these from the project root:

| Command | Role |
| --- | --- |
| `npm install` | Install dependencies. |
| `npm run dev` | Start local development server. Before starting, it regenerates event image manifest. |
| `npm run build` | Production build check. Before building, it regenerates event image manifest. |
| `npm run start` | Start built production app. |
| `npm run lint` | Run lint checks. |
| `npm run generate:event-image-manifest` | Regenerate training/event gallery image manifest. |
| `npm run test:mobile-backend` | Run mobile backend static checks. |

## 17. Mental Model For Editing

Use this simple rule when trying to find something:

| What you see | Where to look |
| --- | --- |
| A whole page or URL | `app/<route>/page.tsx` |
| A button/form/table/card on that page | `components/<feature>/*.tsx` |
| What happens after submitting the form | `actions/*.ts` |
| Shared calculations/business rules | `lib/*.ts` |
| Database columns/tables/policies | `supabase/schema.sql` and `supabase/migrations/*.sql` |
| Static image/PDF/logo/audio | `public/*` |
| SEO/search appearance | `utils/seo.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, `public/favicon-*` |
| Mobile app backend route | `app/api/mobile/v1/*/route.ts` |

For example, if the invoice total looks wrong:

```text
Start at the visible invoice route:
app/api/orders/[id]/invoice/route.ts

Then check invoice generation:
lib/invoice.ts
lib/invoice-pdf.ts
lib/invoice-summary.ts

Then check order data/editing:
actions/orders.ts
lib/admin/orders.ts
components/orders/order-items-editor.tsx
```

If a shop button looks wrong:

```text
Start at:
app/shop/page.tsx or app/shop/[slug]/page.tsx

Then check:
components/shop/product-card.tsx
components/shop/product-shop-actions.tsx
components/shop/add-to-cart-button.tsx
actions/cart.ts
```

If an admin tab is missing:

```text
Create/check the page:
app/admin/<tab-name>/page.tsx

Then add it to:
components/admin/admin-sidebar.tsx
```

If a blog gallery does not show:

```text
Check folder:
public/images/photos/<gallery folder>

Check mapping:
lib/data/training-events-blog.ts

Regenerate:
npm run generate:event-image-manifest

Check generated manifest:
lib/data/event-image-manifest.ts
```

