# Phonics Club Link Audit

Date: August 4, 2026

## Summary

Completed a project-wide launch link audit for internal navigation, redirects, sitemap entries, metadata helpers, email/mobile URL fallbacks, and documentation setup examples.

No hardcoded `http://`, `localhost`, temporary `vercel.app`, old WordPress export URL, or insecure internal production URL remains in the scanned app/code/docs paths.

## Broken Or Risky Links Fixed

| File | Old URL / Behavior | New URL / Behavior |
| --- | --- | --- |
| `actions/auth.ts` | Password reset fallback used `http://localhost:3000`; signup callback used `process.env.NEXT_PUBLIC_APP_URL` directly and could become `undefined/auth/callback` if env was missing. | Uses safe `APP_URL` fallback, defaulting to `https://www.phonicsclub.com`, for signup and reset callbacks. |
| `actions/admin/customers.ts` | Admin customer reset fallback used `http://localhost:3000`. | Uses `APP_URL` fallback, defaulting to `https://www.phonicsclub.com`. |
| `actions/lms.ts` | LMS-generated URLs could fall back to `http://localhost:3000`. | Uses `APP_URL` fallback, defaulting to `https://www.phonicsclub.com`. |
| `app/api/mobile/v1/config/route.ts` | Mobile API support URLs could fall back to `http://localhost:3000`. | Uses `APP_URL` fallback, defaulting to `https://www.phonicsclub.com`. |
| `app/api/admin/course-expiry-reminders/route.ts` | Reminder email course URLs could fall back to `http://localhost:3000`. | Uses `APP_URL` fallback, defaulting to `https://www.phonicsclub.com`. |
| `app/course/[id]/certificate/page.tsx` | Certificate verification links could fall back to `http://localhost:3000`. | Uses `APP_URL` fallback, defaulting to `https://www.phonicsclub.com`. |
| `lib/email/send-order-email.ts` | Order email base URL fallback used `http://localhost:3000`. | Uses `APP_URL`, defaulting to `https://www.phonicsclub.com`. |
| `lib/site-content.ts` | Two Research page external references used `http://` URLs. | Changed to HTTPS versions. |
| `next.config.mjs` | Google-indexed old WordPress routes such as `/home`, `/contact-us`, `/our-shop`, `/about-us`, `/online-courses`, `/training`, `/login-register`, `/my-account`, and legacy policy slugs could return 404 on the Next.js site. | Added permanent redirects to the matching current routes: `/`, `/contact`, `/shop`, `/about`, `/courses`, `/trainings`, `/auth/login`, `/dashboard`, `/privacy`, `/terms`, `/refunds`, and `/shipping`. |
| `utils/seo.ts` | Organization/article schema used the generic `/icon.svg`, and site navigation schema did not explicitly list the preferred public sitelinks. | Uses `/logo.png` for organization logo metadata and exposes preferred navigation order: Shop, Courses, Trainings, About Us, Contact Us. |
| `app/sitemap.ts` | Main public pages were valid, but the sitemap order did not match the preferred search sitelink order. | Reordered static sitemap routes to prioritize Shop, Courses, Trainings, About Us, and Contact Us after the homepage. |
| `app/manifest.ts` | No web app manifest was available to reinforce site name and icons. | Added a manifest with Phonics Club name, theme color, and logo icons. |
| `README.md` | Setup examples used `http://localhost:3000` for public app URL and Supabase callback. | Changed launch examples to `https://www.phonicsclub.com` and official callback. |
| `PROJECT-OVERVIEW.md` | Env example used `http://localhost:3000` and an incorrect admin email spelling. | Changed to `https://www.phonicsclub.com` and `phonicsclub@gmail.com`. |
| `docs/phonics-club-launch-record.md` | Redirect checklist included localhost callback in public launch checklist. | Removed localhost callback from launch checklist. |

## Missing Pages Created

| Route | Status |
| --- | --- |
| `/shipping` | Created `app/shipping/page.tsx`, added default `shipping_policy` content, added footer link, and added sitemap entry. |

## Navigation Verified

The following key routes exist in the Next.js app and are linked with relative internal URLs:

- `/`
- `/faqs`
- `/about`
- `/contact`
- `/courses`
- `/shop`
- `/blog`
- `/privacy`
- `/terms`
- `/refunds`
- `/shipping`
- `/cookies`
- `/dashboard`
- `/dashboard/my-courses`
- `/dashboard/profile`
- `/admin`
- `/admin/courses`
- `/trainings`

## Mobile Fixes Included

| Area | Fix |
| --- | --- |
| Homepage hero | Constrained hero/video containers to `max-w-full` and `min-w-0`. |
| Homepage video card | Added overflow protection so the video card cannot push beyond the viewport. |
| Homepage stats row | Changed mobile stats to a compact 3-column grid with smaller icons/text. |
| Global CSS | Changed horizontal overflow handling to `overflow-x: hidden` for broader mobile-browser compatibility. |
| Header search dialog | Added quick links below search: Shop, Courses, Trainings, About Us, Contact Us. |

## Remaining External HTTPS Links

Only intentional HTTPS external links remain, including YouTube, Facebook, Instagram, Resend API, schema.org, Vortex Learning, and press/research references.
