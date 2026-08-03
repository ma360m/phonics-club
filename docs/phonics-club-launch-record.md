# Phonics Club Launch Record

Updated: 2026-08-03

## Current project

This repository is the public Phonics Club website, shop, checkout, customer dashboard, LMS, and admin system built with Next.js and Supabase.

Main areas included:

- Public website pages: Home, Shop, Online Courses, Training, Newsletters, About, Research, FAQs, Contact, policies, sitemap, and robots.
- Commerce: product catalog, wishlist, cart, checkout, order invoices, customer order editing/cancellation window, payment receipt handling, coupons, currency display, and order emails.
- LMS: course browsing, enrollments, learning dashboard, lesson player, quizzes, progress tracking, certificates, course resources, instructor help pricing, and admin previews.
- Admin: products, quick stock/price/ISBN update, inline product quick edit, orders, courses, course builder, certificates, site content, payment methods, appearance/accessibility, trainings, customers, and mobile API support.
- Mobile backend/API: learner, commerce, admin, support, certificate, training, and privacy endpoints documented in `docs/mobile-api.md`.

## Work completed in this pass

- Added ISBN editing to the Admin Fast Update table.
- Added inline Quick Edit on the Admin Products page so a product can be expanded, edited, saved, and collapsed without opening the product page.
- Added a searchable Admin Site Content editor list for quick access to bank details, invoice template, policies, FAQs, gallery, videos, and other content blocks.
- Fixed LMS drawer active tabs so hash links like Orders and Trainings no longer all stay blue at the same time.
- Made dashboard My Courses and Recent Orders expandable/collapsible.
- Improved mobile checkout and cart wrapping so long product names, quantities, totals, and delete buttons do not force horizontal overflow.
- Reduced and staggered floating assistant/cart/WhatsApp/accessibility buttons on mobile so they do not cover checkout fields.
- Started the course orbit animation on mobile automatically and when the course hero enters the viewport, not only on desktop hover.
- Added global horizontal overflow protection for public pages.

## WordPress LearnPress migration status

Migration batch: `learnpress-2026-08-01T15-31-44-674Z`

Final report:
`tmp/wpress-analysis/final-migration-report-learnpress-2026-08-01T15-31-44-674Z.md`

Rollback SQL:
`tmp/wpress-analysis/rollback-learnpress-2026-08-01T15-31-44-674Z.sql`

Validated totals:

- Courses: 7
- Modules: 21
- Lessons: 241
- Quizzes: 13
- Questions: 80
- Course resources: 104
- Storage-backed assets: 104
- Warnings: 0

Cleanup completed before import:

- Duplicate lessons removed: 0
- Empty lessons skipped: 0
- Orphaned records skipped: 0
- Revisions/autosaves skipped: 0
- Unused archive media excluded: 21,918

Recovered missing hierarchy:

- Kindergarten 1 recovered 1 module and 5 items from the old course body plus linked page.
- Kindergarten 2 recovered 1 module and 7 items from the old course body plus linked page.
- Complete Course recovered 3 modules and 60 items from the Pre K hierarchy plus Complete Course body.

Important: imported courses were saved for admin review, so they do not show on the public Courses page until published. Most imported courses are Draft + Hidden; the free Jolly Phonics course is currently Draft, which also keeps it off the public site.

Post-import content repair on 2026-08-03:

- Fixed the admin course resource upload form crash caused by setting `encType` on a React server-action form.
- Fixed the course Publish action so publishing clears `unlisted`, sets `visibility_status` to `published`, and publishes linked lessons/quizzes.
- Repaired 60 LearnPress shortcode lessons in Supabase.
- Converted 44 `[embedyt]` lessons into playable LMS video lessons with `video_url`.
- Marked 16 `[h5p]` lessons as imported interactive WordPress activities so they are visible/editable instead of raw shortcodes.
- Verified the Teaching of English through Jolly Phonics Free Version course has 3 lessons, 1 quiz, and 10 quiz questions after repair.
- New repair report: `tmp/wpress-analysis/learnpress-content-repair-report-2026-08-03T10-14-41-231Z.md`
- New rollback SQL: `tmp/wpress-analysis/rollback-learnpress-content-repair-2026-08-03T10-14-41-231Z.sql`

## Imported course preview links

These previews require an admin/LMS manager account.

| Course | Status | Admin builder | Student preview |
|---|---|---|---|
| Teaching of English through Jolly Phonics | Draft, hidden | `/admin/courses/541801ee-c4aa-46e7-98e1-3ce23c95681c/builder` | `/course/541801ee-c4aa-46e7-98e1-3ce23c95681c/learn?preview=admin` |
| Teaching of English through Jolly Phonics Free Version | Draft, not public | `/admin/courses/bf1f7098-f3a5-4697-80c6-73784728ca69/builder` | `/course/bf1f7098-f3a5-4697-80c6-73784728ca69/learn?preview=admin` |
| Preschool Professional | Draft, hidden | `/admin/courses/a37095b8-2152-45cc-a5bb-e4b7725370f9/builder` | `/course/a37095b8-2152-45cc-a5bb-e4b7725370f9/learn?preview=admin` |
| Pre K Crash Course | Draft, hidden | `/admin/courses/c3a4ddca-e942-43b3-96a7-91023e15eec1/builder` | `/course/c3a4ddca-e942-43b3-96a7-91023e15eec1/learn?preview=admin` |
| Kindergarten 1 Crash Course (age 4 to 5) 6 months or 24 weeks | Draft, hidden | `/admin/courses/68c1113f-4e23-4c3c-a152-a32cd01a8072/builder` | `/course/68c1113f-4e23-4c3c-a152-a32cd01a8072/learn?preview=admin` |
| Kindergarten 2 Crash Course (age 5 to 6) 6 months or 24 weeks | Draft, hidden | `/admin/courses/6b964409-0549-4bef-a7ff-bc87f7cf4473/builder` | `/course/6b964409-0549-4bef-a7ff-bc87f7cf4473/learn?preview=admin` |
| Complete Course (3 years) | Draft, hidden | `/admin/courses/8c2a5c28-6b57-40f3-9c22-2e412ad862a8/builder` | `/course/8c2a5c28-6b57-40f3-9c22-2e412ad862a8/learn?preview=admin` |

To make a migrated course public: open Admin Courses, review the course in the builder, set it to Published, and turn off Hidden/Unlisted for the public Courses page.

## Course pricing note

The two child course pricing requirements are represented in the course admin work:

- Base children course price: Rs 2,500.
- Instructor Help tab/add-on: Rs 5,000 combined course plus instructor help.
- Admin can edit course price, mark a course free, and edit instructor/help fields from the course builder.

The related migration file is `supabase/migrations/034_children_course_pricing_instructor_help.sql`.

## Final launch checklist

Vercel environment variables required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
- `RESEND_API_KEY`
- `ORDER_EMAIL_FROM`
- `ORDER_ADMIN_EMAIL`
- `ADMIN_EMAIL`

Supabase Auth settings:

- Site URL: `https://www.phonicsclub.com`
- Redirect URLs:
  - `https://www.phonicsclub.com/auth/callback`
  - `https://phonicsclub.com/auth/callback`
  - The current Vercel preview/production URL callback if testing before DNS cutover
  - `http://localhost:3000/auth/callback` for local testing

DNS/domain:

- Point the official domain to the Vercel project as instructed by Vercel/Xoftmade Solutions.
- After DNS is live, test signup, login, forgot password, reset password, checkout email, invoice PDF, and admin preview on the official domain.

## Verification

Production build command:

`npm.cmd run build`

Result on 2026-08-03:

- Build compiled successfully.
- Type checking passed.
- Static/dynamic routes generated successfully.
- 97 app routes generated.
