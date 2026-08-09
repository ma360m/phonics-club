# Phonics Club Legacy URL Redirect Audit

Date: 2026-08-08

Build verification: `npm.cmd run build` passed after redirect, metadata, favicon, and social image changes.

Canonical domain used for SEO metadata, sitemap, robots, schema, and social image URLs: `https://www.phonicsclub.com`.

## Current Next.js Route Inventory

- Page routes inspected: 70
- Route handlers inspected: 66
- Admin, API, checkout, dashboard, auth callback, and private LMS player routes were treated as non-indexable/private destinations unless a legacy login/account URL needed them.

<details>
<summary>Page routes</summary>

- `/about`
- `/account-deletion`
- `/admin`
- `/admin/blog`
- `/admin/blog/[id]`
- `/admin/blog/new`
- `/admin/catalogs`
- `/admin/certificates`
- `/admin/content`
- `/admin/coupons`
- `/admin/course-cancellations`
- `/admin/course-payments`
- `/admin/courses`
- `/admin/courses/[id]`
- `/admin/courses/[id]/builder`
- `/admin/courses/new`
- `/admin/customers`
- `/admin/developer-mode`
- `/admin/fast-invoices`
- `/admin/fast-update`
- `/admin/lms-reports`
- `/admin/manual`
- `/admin/newsletters`
- `/admin/orders`
- `/admin/products`
- `/admin/products/[id]`
- `/admin/products/new`
- `/admin/settings/appearance`
- `/admin/settings/currency`
- `/admin/settings/payment-methods`
- `/admin/trainers`
- `/admin/trainings`
- `/admin/upload`
- `/admin/users`
- `/auth/forgot-password`
- `/auth/login`
- `/auth/reset-password`
- `/auth/signup`
- `/blog`
- `/blog/[slug]`
- `/cart`
- `/certificates/verify/[code]`
- `/certified-trainers`
- `/certified-trainers/[slug]`
- `/checkout`
- `/checkout/success`
- `/consultancy`
- `/contact`
- `/cookies`
- `/course/[id]/certificate`
- `/course/[id]/learn`
- `/course/[id]/quiz`
- `/courses`
- `/courses/[slug]`
- `/dashboard`
- `/dashboard/my-courses`
- `/dashboard/profile`
- `/faqs`
- `/fast-invoice/[token]`
- `/instructors/[slug]`
- `/newsletters`
- `/privacy`
- `/refunds`
- `/research`
- `/shipping`
- `/shop`
- `/shop/[slug]`
- `/terms`
- `/trainings`
- `/wishlist`

</details>

<details>
<summary>Route handlers</summary>

- `/api/admin/blog/gallery/upload`
- `/api/admin/course-expiry-reminders`
- `/api/admin/customers/export`
- `/api/admin/products/export`
- `/api/admin/products/import`
- `/api/admin/products/status`
- `/api/admin/products/upload-image`
- `/api/admin/site-media/upload`
- `/api/assistant`
- `/api/auth/me`
- `/api/auth/session`
- `/api/cart/count`
- `/api/cart/guest`
- `/api/cart/items`
- `/api/coupons/preview`
- `/api/mobile/v1/account-deletion/request`
- `/api/mobile/v1/account-deletion/restore`
- `/api/mobile/v1/account-deletion/status`
- `/api/mobile/v1/admin/overview`
- `/api/mobile/v1/admin/products`
- `/api/mobile/v1/admin/products/[productId]`
- `/api/mobile/v1/admin/products/[productId]/inventory`
- `/api/mobile/v1/admin/products/[productId]/price`
- `/api/mobile/v1/admin/reviews`
- `/api/mobile/v1/admin/reviews/[reviewId]`
- `/api/mobile/v1/auth/me`
- `/api/mobile/v1/certificates`
- `/api/mobile/v1/certificates/[certificateId]`
- `/api/mobile/v1/certificates/[certificateId]/download`
- `/api/mobile/v1/children`
- `/api/mobile/v1/children/[childId]`
- `/api/mobile/v1/config`
- `/api/mobile/v1/course-payments`
- `/api/mobile/v1/course-payments/[paymentId]`
- `/api/mobile/v1/course-payments/[paymentId]/receipt`
- `/api/mobile/v1/course-payments/checkout`
- `/api/mobile/v1/devices/[deviceId]`
- `/api/mobile/v1/devices/register`
- `/api/mobile/v1/learning/courses`
- `/api/mobile/v1/learning/courses/[courseId]`
- `/api/mobile/v1/learning/lessons/[lessonId]/complete`
- `/api/mobile/v1/learning/resources/[resourceId]/access`
- `/api/mobile/v1/learning/sessions/[sessionId]/finish`
- `/api/mobile/v1/learning/sessions/[sessionId]/heartbeat`
- `/api/mobile/v1/learning/sessions/start`
- `/api/mobile/v1/newsletter/subscribe`
- `/api/mobile/v1/newsletter/unsubscribe`
- `/api/mobile/v1/orders`
- `/api/mobile/v1/orders/[orderId]`
- `/api/mobile/v1/orders/[orderId]/invoice`
- `/api/mobile/v1/orders/[orderId]/receipt`
- `/api/mobile/v1/orders/checkout`
- `/api/mobile/v1/quizzes/[quizId]`
- `/api/mobile/v1/quizzes/[quizId]/submit`
- `/api/mobile/v1/reviews`
- `/api/mobile/v1/support/issues`
- `/api/mobile/v1/support/issues/[ticketId]`
- `/api/mobile/v1/support/issues/[ticketId]/reply`
- `/api/mobile/v1/trainings/[trainingId]/register`
- `/api/orders/[id]/invoice`
- `/api/orders/[id]/receipt`
- `/api/shop/catalogs`
- `/api/site/announcements`
- `/api/upload`
- `/auth/callback`
- `/courses/[slug]/enroll`

</details>

## Redirect Counts By Category

| Category | Redirects |
| --- | ---: |
| General pages | 64 |
| Consultancy | 16 |
| Blog/content | 31 |
| Training | 12 |
| Courses | 65 |
| Shop/products | 196 |
| NOC/documentation | 8 |
| Login/account | 22 |
| Other legacy WordPress URLs | 83 |
| Total | 497 |

## Full Redirect Table

| OLD URL | NEW URL | REDIRECT TYPE | REASON |
| --- | --- | --- | --- |
| https://www.phonicsclub.com/home | https://www.phonicsclub.com/ | 301 permanent | Old WordPress home page now resolves to the Next.js homepage |
| https://www.phonicsclub.com/home/:path* | https://www.phonicsclub.com/ | 301 permanent | Old WordPress home page now resolves to the Next.js homepage; collapses old WordPress child paths |
| https://www.phonicsclub.com/phonics-club | https://www.phonicsclub.com/ | 301 permanent | Old homepage slug maps to the canonical homepage |
| https://www.phonicsclub.com/phonics-club.html | https://www.phonicsclub.com/ | 301 permanent | Old homepage slug maps to the canonical homepage; handles old .html URL variant |
| https://www.phonicsclub.com/main | https://www.phonicsclub.com/ | 301 permanent | Old Elementor main page maps to the canonical homepage |
| https://www.phonicsclub.com/main.html | https://www.phonicsclub.com/ | 301 permanent | Old Elementor main page maps to the canonical homepage; handles old .html URL variant |
| https://www.phonicsclub.com/sample-page | https://www.phonicsclub.com/ | 301 permanent | Default WordPress sample page should not remain indexed |
| https://www.phonicsclub.com/sample-page.html | https://www.phonicsclub.com/ | 301 permanent | Default WordPress sample page should not remain indexed; handles old .html URL variant |
| https://www.phonicsclub.com/about-us | https://www.phonicsclub.com/about | 301 permanent | Old About Us page maps to current About page |
| https://www.phonicsclub.com/about-us.html | https://www.phonicsclub.com/about | 301 permanent | Old About Us page maps to current About page; handles old .html URL variant |
| https://www.phonicsclub.com/our-team | https://www.phonicsclub.com/about | 301 permanent | Old team page content belongs with About |
| https://www.phonicsclub.com/our-team.html | https://www.phonicsclub.com/about | 301 permanent | Old team page content belongs with About; handles old .html URL variant |
| https://www.phonicsclub.com/team | https://www.phonicsclub.com/about | 301 permanent | Old team page content belongs with About |
| https://www.phonicsclub.com/team.html | https://www.phonicsclub.com/about | 301 permanent | Old team page content belongs with About; handles old .html URL variant |
| https://www.phonicsclub.com/history | https://www.phonicsclub.com/about | 301 permanent | Old history page maps to current About page |
| https://www.phonicsclub.com/history.html | https://www.phonicsclub.com/about | 301 permanent | Old history page maps to current About page; handles old .html URL variant |
| https://www.phonicsclub.com/what-we-do | https://www.phonicsclub.com/consultancy | 301 permanent | Old services explainer maps to consultancy support |
| https://www.phonicsclub.com/what-we-do.html | https://www.phonicsclub.com/consultancy | 301 permanent | Old services explainer maps to consultancy support; handles old .html URL variant |
| https://www.phonicsclub.com/services | https://www.phonicsclub.com/consultancy | 301 permanent | Old services page maps to consultancy |
| https://www.phonicsclub.com/services.html | https://www.phonicsclub.com/consultancy | 301 permanent | Old services page maps to consultancy; handles old .html URL variant |
| https://www.phonicsclub.com/our-services | https://www.phonicsclub.com/consultancy | 301 permanent | Old services page maps to consultancy |
| https://www.phonicsclub.com/our-services.html | https://www.phonicsclub.com/consultancy | 301 permanent | Old services page maps to consultancy; handles old .html URL variant |
| https://www.phonicsclub.com/contact-us | https://www.phonicsclub.com/contact | 301 permanent | Old Contact Us page maps to current Contact page |
| https://www.phonicsclub.com/contact-us.html | https://www.phonicsclub.com/contact | 301 permanent | Old Contact Us page maps to current Contact page; handles old .html URL variant |
| https://www.phonicsclub.com/faq | https://www.phonicsclub.com/faqs | 301 permanent | Old FAQ slug maps to current FAQs page |
| https://www.phonicsclub.com/faq.html | https://www.phonicsclub.com/faqs | 301 permanent | Old FAQ slug maps to current FAQs page; handles old .html URL variant |
| https://www.phonicsclub.com/privacy-policy | https://www.phonicsclub.com/privacy | 301 permanent | Old privacy policy slug maps to current Privacy page |
| https://www.phonicsclub.com/privacy-policy.html | https://www.phonicsclub.com/privacy | 301 permanent | Old privacy policy slug maps to current Privacy page; handles old .html URL variant |
| https://www.phonicsclub.com/privacy-policy-of-phonicsclub-app | https://www.phonicsclub.com/privacy | 301 permanent | Old app privacy policy maps to current Privacy page |
| https://www.phonicsclub.com/privacy-policy-of-phonicsclub-app.html | https://www.phonicsclub.com/privacy | 301 permanent | Old app privacy policy maps to current Privacy page; handles old .html URL variant |
| https://www.phonicsclub.com/terms-and-conditions | https://www.phonicsclub.com/terms | 301 permanent | Old terms slug maps to current Terms page |
| https://www.phonicsclub.com/terms-and-conditions.html | https://www.phonicsclub.com/terms | 301 permanent | Old terms slug maps to current Terms page; handles old .html URL variant |
| https://www.phonicsclub.com/refund-policy | https://www.phonicsclub.com/refunds | 301 permanent | Old refund policy slug maps to current Refunds page |
| https://www.phonicsclub.com/refund-policy.html | https://www.phonicsclub.com/refunds | 301 permanent | Old refund policy slug maps to current Refunds page; handles old .html URL variant |
| https://www.phonicsclub.com/shipping-policy | https://www.phonicsclub.com/shipping | 301 permanent | Old shipping policy slug maps to current Shipping page |
| https://www.phonicsclub.com/shipping-policy.html | https://www.phonicsclub.com/shipping | 301 permanent | Old shipping policy slug maps to current Shipping page; handles old .html URL variant |
| https://www.phonicsclub.com/cookies-policy | https://www.phonicsclub.com/cookies | 301 permanent | Old cookie policy slug maps to current Cookie Policy page |
| https://www.phonicsclub.com/cookies-policy.html | https://www.phonicsclub.com/cookies | 301 permanent | Old cookie policy slug maps to current Cookie Policy page; handles old .html URL variant |
| https://www.phonicsclub.com/feedback | https://www.phonicsclub.com/contact | 301 permanent | Old feedback page maps to Contact |
| https://www.phonicsclub.com/feedback.html | https://www.phonicsclub.com/contact | 301 permanent | Old feedback page maps to Contact; handles old .html URL variant |
| https://www.phonicsclub.com/testimonials | https://www.phonicsclub.com/about | 301 permanent | Old testimonials page maps to About |
| https://www.phonicsclub.com/testimonials.html | https://www.phonicsclub.com/about | 301 permanent | Old testimonials page maps to About; handles old .html URL variant |
| https://www.phonicsclub.com/gallery | https://www.phonicsclub.com/about | 301 permanent | Old gallery page maps to About because no standalone gallery route exists |
| https://www.phonicsclub.com/gallery.html | https://www.phonicsclub.com/about | 301 permanent | Old gallery page maps to About because no standalone gallery route exists; handles old .html URL variant |
| https://www.phonicsclub.com/phonics-club-gallery | https://www.phonicsclub.com/about | 301 permanent | Old gallery page maps to About |
| https://www.phonicsclub.com/phonics-club-gallery.html | https://www.phonicsclub.com/about | 301 permanent | Old gallery page maps to About; handles old .html URL variant |
| https://www.phonicsclub.com/videos | https://www.phonicsclub.com/blog/jolly-phonics-2017-training-video | 301 permanent | Old videos page maps to the retained training video content |
| https://www.phonicsclub.com/videos.html | https://www.phonicsclub.com/blog/jolly-phonics-2017-training-video | 301 permanent | Old videos page maps to the retained training video content; handles old .html URL variant |
| https://www.phonicsclub.com/research-in-pakistan | https://www.phonicsclub.com/research | 301 permanent | Old research page maps to current Research page |
| https://www.phonicsclub.com/research-in-pakistan.html | https://www.phonicsclub.com/research | 301 permanent | Old research page maps to current Research page; handles old .html URL variant |
| https://www.phonicsclub.com/pilot-study-1 | https://www.phonicsclub.com/research | 301 permanent | Old pilot study page maps to Research |
| https://www.phonicsclub.com/pilot-study-1.html | https://www.phonicsclub.com/research | 301 permanent | Old pilot study page maps to Research; handles old .html URL variant |
| https://www.phonicsclub.com/pilot-study-2 | https://www.phonicsclub.com/research | 301 permanent | Old pilot study page maps to Research |
| https://www.phonicsclub.com/pilot-study-2.html | https://www.phonicsclub.com/research | 301 permanent | Old pilot study page maps to Research; handles old .html URL variant |
| https://www.phonicsclub.com/pilot-study-3 | https://www.phonicsclub.com/research | 301 permanent | Old pilot study page maps to Research |
| https://www.phonicsclub.com/pilot-study-3.html | https://www.phonicsclub.com/research | 301 permanent | Old pilot study page maps to Research; handles old .html URL variant |
| https://www.phonicsclub.com/pilot-study-4 | https://www.phonicsclub.com/research | 301 permanent | Old pilot study page maps to Research |
| https://www.phonicsclub.com/pilot-study-4.html | https://www.phonicsclub.com/research | 301 permanent | Old pilot study page maps to Research; handles old .html URL variant |
| https://www.phonicsclub.com/education-for-all | https://www.phonicsclub.com/research | 301 permanent | Old education project page maps to Research |
| https://www.phonicsclub.com/education-for-all.html | https://www.phonicsclub.com/research | 301 permanent | Old education project page maps to Research; handles old .html URL variant |
| https://www.phonicsclub.com/classroom-strategies | https://www.phonicsclub.com/research | 301 permanent | Old classroom strategy content maps to Research |
| https://www.phonicsclub.com/classroom-strategies.html | https://www.phonicsclub.com/research | 301 permanent | Old classroom strategy content maps to Research; handles old .html URL variant |
| https://www.phonicsclub.com/language-lab | https://www.phonicsclub.com/research | 301 permanent | Old language lab content maps to Research |
| https://www.phonicsclub.com/language-lab.html | https://www.phonicsclub.com/research | 301 permanent | Old language lab content maps to Research; handles old .html URL variant |
| https://www.phonicsclub.com/training-sessions-gallery | https://www.phonicsclub.com/trainings | 301 permanent | Old training gallery maps to Trainings |
| https://www.phonicsclub.com/training-sessions-gallery.html | https://www.phonicsclub.com/trainings | 301 permanent | Old training gallery maps to Trainings; handles old .html URL variant |
| https://www.phonicsclub.com/student-assessment-gallery | https://www.phonicsclub.com/research | 301 permanent | Old assessment gallery maps to Research |
| https://www.phonicsclub.com/student-assessment-gallery.html | https://www.phonicsclub.com/research | 301 permanent | Old assessment gallery maps to Research; handles old .html URL variant |
| https://www.phonicsclub.com/roshni-maktab-gallery | https://www.phonicsclub.com/research | 301 permanent | Old project gallery maps to Research |
| https://www.phonicsclub.com/roshni-maktab-gallery.html | https://www.phonicsclub.com/research | 301 permanent | Old project gallery maps to Research; handles old .html URL variant |
| https://www.phonicsclub.com/pilot-study-1-gallery | https://www.phonicsclub.com/research | 301 permanent | Old pilot gallery maps to Research |
| https://www.phonicsclub.com/pilot-study-1-gallery.html | https://www.phonicsclub.com/research | 301 permanent | Old pilot gallery maps to Research; handles old .html URL variant |
| https://www.phonicsclub.com/pilot-study-4-gallery | https://www.phonicsclub.com/research | 301 permanent | Old pilot gallery maps to Research |
| https://www.phonicsclub.com/pilot-study-4-gallery.html | https://www.phonicsclub.com/research | 301 permanent | Old pilot gallery maps to Research; handles old .html URL variant |
| https://www.phonicsclub.com/training | https://www.phonicsclub.com/trainings | 301 permanent | Old singular training URL maps to current Trainings route |
| https://www.phonicsclub.com/training/:path* | https://www.phonicsclub.com/trainings | 301 permanent | Old singular training URL maps to current Trainings route; collapses old WordPress child paths |
| https://www.phonicsclub.com/trainings-events | https://www.phonicsclub.com/trainings | 301 permanent | Old trainings/events URL maps to current Trainings route |
| https://www.phonicsclub.com/trainings-events/:path* | https://www.phonicsclub.com/trainings | 301 permanent | Old trainings/events URL maps to current Trainings route; collapses old WordPress child paths |
| https://www.phonicsclub.com/workshops | https://www.phonicsclub.com/trainings | 301 permanent | Old workshops page maps to current Trainings route |
| https://www.phonicsclub.com/workshops.html | https://www.phonicsclub.com/trainings | 301 permanent | Old workshops page maps to current Trainings route; handles old .html URL variant |
| https://www.phonicsclub.com/learn-english-through-jolly-phonics-workshop | https://www.phonicsclub.com/trainings | 301 permanent | Old workshop post maps to Trainings |
| https://www.phonicsclub.com/learn-english-through-jolly-phonics-workshop.html | https://www.phonicsclub.com/trainings | 301 permanent | Old workshop post maps to Trainings; handles old .html URL variant |
| https://www.phonicsclub.com/jolly-phonics-certified-trainers | https://www.phonicsclub.com/certified-trainers | 301 permanent | Old certified trainers page maps to current trainer directory |
| https://www.phonicsclub.com/jolly-phonics-certified-trainers.html | https://www.phonicsclub.com/certified-trainers | 301 permanent | Old certified trainers page maps to current trainer directory; handles old .html URL variant |
| https://www.phonicsclub.com/affiliation | https://www.phonicsclub.com/consultancy | 301 permanent | Old affiliation page maps to Consultancy |
| https://www.phonicsclub.com/affiliation.html | https://www.phonicsclub.com/consultancy | 301 permanent | Old affiliation page maps to Consultancy; handles old .html URL variant |
| https://www.phonicsclub.com/campus-affiliation | https://www.phonicsclub.com/consultancy | 301 permanent | Old campus affiliation page maps to Consultancy |
| https://www.phonicsclub.com/campus-affiliation.html | https://www.phonicsclub.com/consultancy | 301 permanent | Old campus affiliation page maps to Consultancy; handles old .html URL variant |
| https://www.phonicsclub.com/individual-affiliation | https://www.phonicsclub.com/consultancy | 301 permanent | Old individual affiliation page maps to Consultancy |
| https://www.phonicsclub.com/individual-affiliation.html | https://www.phonicsclub.com/consultancy | 301 permanent | Old individual affiliation page maps to Consultancy; handles old .html URL variant |
| https://www.phonicsclub.com/school-zone | https://www.phonicsclub.com/consultancy | 301 permanent | Old school support page maps to Consultancy |
| https://www.phonicsclub.com/school-zone.html | https://www.phonicsclub.com/consultancy | 301 permanent | Old school support page maps to Consultancy; handles old .html URL variant |
| https://www.phonicsclub.com/education-zone | https://www.phonicsclub.com/consultancy | 301 permanent | Old education support page maps to Consultancy |
| https://www.phonicsclub.com/education-zone.html | https://www.phonicsclub.com/consultancy | 301 permanent | Old education support page maps to Consultancy; handles old .html URL variant |
| https://www.phonicsclub.com/course | https://www.phonicsclub.com/courses | 301 permanent | Old course archive maps to current Courses page |
| https://www.phonicsclub.com/course.html | https://www.phonicsclub.com/courses | 301 permanent | Old course archive maps to current Courses page; handles old .html URL variant |
| https://www.phonicsclub.com/online-courses | https://www.phonicsclub.com/courses | 301 permanent | Old online courses page maps to current Courses page |
| https://www.phonicsclub.com/online-courses.html | https://www.phonicsclub.com/courses | 301 permanent | Old online courses page maps to current Courses page; handles old .html URL variant |
| https://www.phonicsclub.com/courses-online | https://www.phonicsclub.com/courses | 301 permanent | Old courses-online page maps to current Courses page |
| https://www.phonicsclub.com/courses-online.html | https://www.phonicsclub.com/courses | 301 permanent | Old courses-online page maps to current Courses page; handles old .html URL variant |
| https://www.phonicsclub.com/lp-courses | https://www.phonicsclub.com/courses | 301 permanent | Old LearnPress all courses page maps to current Courses page |
| https://www.phonicsclub.com/lp-courses.html | https://www.phonicsclub.com/courses | 301 permanent | Old LearnPress all courses page maps to current Courses page; handles old .html URL variant |
| https://www.phonicsclub.com/lp-become-a-teacher | https://www.phonicsclub.com/courses?category=teacher-courses | 301 permanent | Old LearnPress teacher page maps to teacher courses |
| https://www.phonicsclub.com/lp-become-a-teacher.html | https://www.phonicsclub.com/courses?category=teacher-courses | 301 permanent | Old LearnPress teacher page maps to teacher courses; handles old .html URL variant |
| https://www.phonicsclub.com/children-courses | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old children courses page maps to children course category |
| https://www.phonicsclub.com/children-courses.html | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old children courses page maps to children course category; handles old .html URL variant |
| https://www.phonicsclub.com/how-to-register-or-enroll-in-a-course | https://www.phonicsclub.com/courses | 301 permanent | Old enrollment guide maps to Courses |
| https://www.phonicsclub.com/how-to-register-or-enroll-in-a-course.html | https://www.phonicsclub.com/courses | 301 permanent | Old enrollment guide maps to Courses; handles old .html URL variant |
| https://www.phonicsclub.com/payment-method-details | https://www.phonicsclub.com/courses | 301 permanent | Old course payment guide maps to Courses |
| https://www.phonicsclub.com/payment-method-details.html | https://www.phonicsclub.com/courses | 301 permanent | Old course payment guide maps to Courses; handles old .html URL variant |
| https://www.phonicsclub.com/learn-page | https://www.phonicsclub.com/dashboard/my-courses | 301 permanent | Old private LearnPress learn page maps to the learner dashboard |
| https://www.phonicsclub.com/learn-page.html | https://www.phonicsclub.com/dashboard/my-courses | 301 permanent | Old private LearnPress learn page maps to the learner dashboard; handles old .html URL variant |
| https://www.phonicsclub.com/pre-k | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old Pre K page maps to children courses |
| https://www.phonicsclub.com/pre-k.html | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old Pre K page maps to children courses; handles old .html URL variant |
| https://www.phonicsclub.com/kindergarten-1 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old Kindergarten 1 page maps to children courses |
| https://www.phonicsclub.com/kindergarten-1.html | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old Kindergarten 1 page maps to children courses; handles old .html URL variant |
| https://www.phonicsclub.com/kindergarten-2 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old Kindergarten 2 page maps to children courses |
| https://www.phonicsclub.com/kindergarten-2.html | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old Kindergarten 2 page maps to children courses; handles old .html URL variant |
| https://www.phonicsclub.com/k1-group1-stage1-lesson1 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old lesson landing page maps to children courses |
| https://www.phonicsclub.com/k1-group1-stage1-lesson1.html | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old lesson landing page maps to children courses; handles old .html URL variant |
| https://www.phonicsclub.com/k2-stage4-lesson1 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old lesson landing page maps to children courses |
| https://www.phonicsclub.com/k2-stage4-lesson1.html | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old lesson landing page maps to children courses; handles old .html URL variant |
| https://www.phonicsclub.com/k2-stage4-lesson2 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old lesson landing page maps to children courses |
| https://www.phonicsclub.com/k2-stage4-lesson2.html | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old lesson landing page maps to children courses; handles old .html URL variant |
| https://www.phonicsclub.com/letter-s | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old lesson page maps to children courses |
| https://www.phonicsclub.com/letter-s.html | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old lesson page maps to children courses; handles old .html URL variant |
| https://www.phonicsclub.com/sounds-in-a-park | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old lesson page maps to children courses |
| https://www.phonicsclub.com/sounds-in-a-park.html | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old lesson page maps to children courses; handles old .html URL variant |
| https://www.phonicsclub.com/course/jolly-phonics-intensive-course | https://www.phonicsclub.com/courses/teaching-english-jolly-phonics | 301 permanent | Old LearnPress /course/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/courses/jolly-phonics-intensive-course | https://www.phonicsclub.com/courses/teaching-english-jolly-phonics | 301 permanent | Old LearnPress /courses/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/course/teaching-of-english-through-jolly-phonics | https://www.phonicsclub.com/courses/teaching-english-jolly-phonics | 301 permanent | Old LearnPress /course/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/courses/teaching-of-english-through-jolly-phonics | https://www.phonicsclub.com/courses/teaching-english-jolly-phonics | 301 permanent | Old LearnPress /courses/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/course/teaching-of-english-through-jolly-phonics-free-version | https://www.phonicsclub.com/courses/teaching-english-through-jolly-phonics-free-version | 301 permanent | Old LearnPress /course/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/courses/teaching-of-english-through-jolly-phonics-free-version | https://www.phonicsclub.com/courses/teaching-english-through-jolly-phonics-free-version | 301 permanent | Old LearnPress /courses/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/course/preschool-professional | https://www.phonicsclub.com/courses/preschool-professional | 301 permanent | Old LearnPress /course/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/course/pre-k-crash-course | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old LearnPress /course/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/courses/pre-k-crash-course | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old LearnPress /courses/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/course/kindergarten-1-crash-course-age-4-to-5-6-months-or-24-weeks | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old LearnPress /course/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/courses/kindergarten-1-crash-course-age-4-to-5-6-months-or-24-weeks | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old LearnPress /courses/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/course/kindergarten-2-crash-course-age-5-to-6-6-months-or-24-weeks | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old LearnPress /course/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/courses/kindergarten-2-crash-course-age-5-to-6-6-months-or-24-weeks | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old LearnPress /courses/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/course/complete-course-3-years | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old LearnPress /course/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/courses/complete-course-3-years | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old LearnPress /courses/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/course/ecce-and-montessori-course | https://www.phonicsclub.com/courses?category=teacher-courses | 301 permanent | Old LearnPress /course/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/courses/ecce-and-montessori-course | https://www.phonicsclub.com/courses?category=teacher-courses | 301 permanent | Old LearnPress /courses/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/course/stem-and-steam-for-teachers | https://www.phonicsclub.com/courses?category=teacher-courses | 301 permanent | Old LearnPress /course/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/courses/stem-and-steam-for-teachers | https://www.phonicsclub.com/courses?category=teacher-courses | 301 permanent | Old LearnPress /courses/ permalink maps to the closest current course route |
| https://www.phonicsclub.com/courses/biology | https://www.phonicsclub.com/courses | 301 permanent | Old demo course URL maps to current Courses page |
| https://www.phonicsclub.com/courses/informatic-course | https://www.phonicsclub.com/courses | 301 permanent | Old demo course URL maps to current Courses page |
| https://www.phonicsclub.com/courses/swimming | https://www.phonicsclub.com/courses | 301 permanent | Old demo course URL maps to current Courses page |
| https://www.phonicsclub.com/courses/tennis-practice | https://www.phonicsclub.com/courses | 301 permanent | Old demo course URL maps to current Courses page |
| https://www.phonicsclub.com/our-shop | https://www.phonicsclub.com/shop | 301 permanent | Old shop page maps to current Shop |
| https://www.phonicsclub.com/our-shop/:path* | https://www.phonicsclub.com/shop | 301 permanent | Old shop page maps to current Shop; collapses old WordPress child paths |
| https://www.phonicsclub.com/shop-now | https://www.phonicsclub.com/shop | 301 permanent | Old shop CTA page maps to current Shop |
| https://www.phonicsclub.com/shop-now/:path* | https://www.phonicsclub.com/shop | 301 permanent | Old shop CTA page maps to current Shop; collapses old WordPress child paths |
| https://www.phonicsclub.com/school-shop | https://www.phonicsclub.com/shop | 301 permanent | Old school shop page maps to current Shop |
| https://www.phonicsclub.com/school-shop.html | https://www.phonicsclub.com/shop | 301 permanent | Old school shop page maps to current Shop; handles old .html URL variant |
| https://www.phonicsclub.com/product/jolly-phonics-blends-wheels | https://www.phonicsclub.com/shop/blends-wheels-pack-of-10 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-blends-wheel-single-unit | https://www.phonicsclub.com/shop/blends-wheels-single-unit | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics | https://www.phonicsclub.com/shop/finger-phonics-books-1-7-set-hardback | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-big-books | https://www.phonicsclub.com/shop/finger-phonics-big-books-1-7-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-big-book-1 | https://www.phonicsclub.com/shop/finger-phonics-big-books-1-7-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-big-book-2 | https://www.phonicsclub.com/shop/finger-phonics-big-books-1-7-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-big-book-3 | https://www.phonicsclub.com/shop/finger-phonics-big-books-1-7-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-big-book-4 | https://www.phonicsclub.com/shop/finger-phonics-big-books-1-7-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-big-book-5 | https://www.phonicsclub.com/shop/finger-phonics-big-books-1-7-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-big-book-6 | https://www.phonicsclub.com/shop/finger-phonics-big-books-1-7-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-big-book-7 | https://www.phonicsclub.com/shop/finger-phonics-big-books-1-7-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-book-1 | https://www.phonicsclub.com/shop/finger-phonics-book-1 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-book-2 | https://www.phonicsclub.com/shop/finger-phonics-book-2 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-book-3 | https://www.phonicsclub.com/shop/finger-phonics-book-3 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-book-4 | https://www.phonicsclub.com/shop/finger-phonics-book-4 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-book-5 | https://www.phonicsclub.com/shop/finger-phonics-book-5 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-book-6 | https://www.phonicsclub.com/shop/finger-phonics-book-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/finger-phonics-book-7 | https://www.phonicsclub.com/shop/finger-phonics-book-7 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-teachers-book | https://www.phonicsclub.com/shop/jolly-phonics-teachers-book-coloured | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-teachers-book-black-white-edition | https://www.phonicsclub.com/shop/jolly-phonics-teachers-book-black-white | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-pupil-book-1 | https://www.phonicsclub.com/shop/jp-pupil-book-1-colour | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-pupil-book-2 | https://www.phonicsclub.com/shop/jp-pupil-book-2-colour | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-pupil-book-3 | https://www.phonicsclub.com/shop/jp-pupil-book-3-colour | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-pupil-book-1-black-white-edition | https://www.phonicsclub.com/shop/jp-pupil-book-1-black-white | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-pupil-book-2-black-white-edition | https://www.phonicsclub.com/shop/jp-pupil-book-2-black-white | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-workbooks | https://www.phonicsclub.com/shop/jp-workbooks-set-1-7 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-workbook-1 | https://www.phonicsclub.com/shop/jp-workbook-1 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-workbook-2 | https://www.phonicsclub.com/shop/jp-workbook-2 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-workbook-3 | https://www.phonicsclub.com/shop/jp-workbook-3 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-workbook-4 | https://www.phonicsclub.com/shop/jp-workbook-4 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-workbook-5 | https://www.phonicsclub.com/shop/jp-workbook-5 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-workbook-6 | https://www.phonicsclub.com/shop/jp-workbook-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-workbook-7 | https://www.phonicsclub.com/shop/jp-workbook-7 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-activity-books | https://www.phonicsclub.com/shop/jolly-phonics-activity-books-1-7-complete-set-new | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-activity-book-1 | https://www.phonicsclub.com/shop/jolly-phonics-activity-book-1 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-activity-book-2 | https://www.phonicsclub.com/shop/jolly-phonics-activity-book-2 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-activity-book-3 | https://www.phonicsclub.com/shop/jolly-phonics-activity-book-3-new | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-activity-book-4 | https://www.phonicsclub.com/shop/jolly-phonics-activity-book-4-new | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-activity-book-5 | https://www.phonicsclub.com/shop/jolly-phonics-activity-book-5-new | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-activity-book-6 | https://www.phonicsclub.com/shop/jolly-phonics-activity-book-6-new | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-activity-book-7 | https://www.phonicsclub.com/shop/jolly-phonics-activity-book-7-new | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/the-phonics-handbook | https://www.phonicsclub.com/shop/the-phonics-handbook | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-handbook | https://www.phonicsclub.com/shop/the-phonics-handbook | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-word-book | https://www.phonicsclub.com/shop/word-book | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/my-word-book | https://www.phonicsclub.com/shop/word-book | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-songs-book-and-cd | https://www.phonicsclub.com/shop/jolly-songs | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-songs-big-book-and-cd | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-wall-frieze | https://www.phonicsclub.com/shop/wall-frieze-pack-of-7-strips | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-wall-poster | https://www.phonicsclub.com/shop/letter-sound-poster-wall-chart-tricky-words-poster | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-letter-sound-poster | https://www.phonicsclub.com/shop/letter-sound-poster-wall-chart-tricky-words-poster | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-tricky-words-poster | https://www.phonicsclub.com/shop/letter-sound-poster-wall-chart-tricky-words-poster | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-tricky-words-wall-flowers | https://www.phonicsclub.com/shop/jolly-phonics-tricky-word-wall-flowers | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-alternative-spelling-and-alphabet-posters | https://www.phonicsclub.com/shop/jp-alternative-spelling-alphabet-posters | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-cards | https://www.phonicsclub.com/shop/jolly-phonics-cards-set-of-4-boxes | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-letter-sound-strips | https://www.phonicsclub.com/shop/letter-sound-strips-pack-of-30 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-letter-sound-strip | https://www.phonicsclub.com/shop/letter-sound-strip-single-unit | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-picture-flash-cards | https://www.phonicsclub.com/shop/picture-flash-cards | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-reading-assessment | https://www.phonicsclub.com/shop/reading-assessment | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-read-and-see-pack-1 | https://www.phonicsclub.com/shop/read-and-see-pack-1-12-titles | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-read-and-see-pack-2 | https://www.phonicsclub.com/shop/read-and-see-pack-2-12-titles | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-bumper-book | https://www.phonicsclub.com/shop/bumper-book | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-starter-kit-with-dvd-extended | https://www.phonicsclub.com/shop/starter-kit-revised-no-dvd | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-classroom-kit | https://www.phonicsclub.com/shop/jolly-phonics-classroom-kit | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-classroom-kit-plus | https://www.phonicsclub.com/shop/jolly-phonics-classroom-kit | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/phonics-class-set | https://www.phonicsclub.com/shop/phonics-class-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-stories | https://www.phonicsclub.com/shop/jolly-stories | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-plays | https://www.phonicsclub.com/shop/jolly-plays | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/my-first-letter-sounds | https://www.phonicsclub.com/shop/my-first-letter-sounds | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-dictionary | https://www.phonicsclub.com/shop/jolly-dictionary | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-songs-book-and-cd | https://www.phonicsclub.com/shop/grammar-songs-book-and-cd | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-1-workbooks | https://www.phonicsclub.com/shop/grammar-1-workbooks-set-1-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-1-workbook-3 | https://www.phonicsclub.com/shop/grammar-1-workbooks-set-1-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-1-pupil-book | https://www.phonicsclub.com/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-1 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-2-pupil-book | https://www.phonicsclub.com/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-2 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-3-pupil-book | https://www.phonicsclub.com/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-3 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-4-pupil-book | https://www.phonicsclub.com/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-4 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-5-pupil-book | https://www.phonicsclub.com/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-5 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-6-pupil-book | https://www.phonicsclub.com/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-1-teachers-book | https://www.phonicsclub.com/shop/jolly-literacy-teachers-book-1-spelling-grammar-punctuation | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-2-teachers-book | https://www.phonicsclub.com/shop/jolly-literacy-teachers-book-2-spelling-grammar-punctuation | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-3-teachers-book | https://www.phonicsclub.com/shop/jolly-literacy-teachers-book-3-spelling-grammar-punctuation | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-4-teachers-book | https://www.phonicsclub.com/shop/jolly-literacy-teachers-book-4-spelling-grammar-punctuation | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-5-teachers-book | https://www.phonicsclub.com/shop/jolly-literacy-teachers-book-5-spelling-grammar-punctuation | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/grammar-6-teachers-book | https://www.phonicsclub.com/shop/jolly-literacy-teachers-book-6-spelling-grammar-punctuation | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacy-comprehension-and-creative-writing-teachers-book1 | https://www.phonicsclub.com/shop/jolly-literacy-comprehension-creative-writing-teachers-book-1 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacycomprehension-pupil-book-1 | https://www.phonicsclub.com/shop/jolly-literacy-comprehension-pupil-book-1 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacy-creative-writing-workbook-1 | https://www.phonicsclub.com/shop/jolly-literacy-creative-writing-workbook-1 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacy-spelling-grammar-and-punctuation-pupils-book1 | https://www.phonicsclub.com/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-1 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-2-precursive-letters | https://www.phonicsclub.com/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-2 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-3-precursive-letters | https://www.phonicsclub.com/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-3 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-4-precursive-letters | https://www.phonicsclub.com/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-4 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-5-precursive-letters | https://www.phonicsclub.com/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-5 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacy-spelling-grammar-punctuation-pupil-book-6-precursive-letters | https://www.phonicsclub.com/shop/jolly-literacy-spelling-grammar-punctuation-pupil-book-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-1-precursive-letters | https://www.phonicsclub.com/shop/jolly-literacy-teachers-book-1-spelling-grammar-punctuation | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-2-precursive-letters | https://www.phonicsclub.com/shop/jolly-literacy-teachers-book-2-spelling-grammar-punctuation | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-3-precursive-letters | https://www.phonicsclub.com/shop/jolly-literacy-teachers-book-3-spelling-grammar-punctuation | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-4-precursive-letters | https://www.phonicsclub.com/shop/jolly-literacy-teachers-book-4-spelling-grammar-punctuation | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-5-precursive-letters | https://www.phonicsclub.com/shop/jolly-literacy-teachers-book-5-spelling-grammar-punctuation | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-literacy-spelling-grammar-punctuation-teachers-book-6-precursive-letters | https://www.phonicsclub.com/shop/jolly-literacy-teachers-book-6-spelling-grammar-punctuation | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-nonfiction-red-level-pack-of-6 | https://www.phonicsclub.com/shop/level-1-non-fiction-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-general-fiction-red-level-pack-of-6 | https://www.phonicsclub.com/shop/level-1-general-fiction-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-inky-friends-red-level-pack-of-6 | https://www.phonicsclub.com/shop/level-1-inky-and-friends-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-nonfiction-yellow-level-pack-of-6 | https://www.phonicsclub.com/shop/level-2-non-fiction-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-general-fiction-yellow-level-pack-of-6 | https://www.phonicsclub.com/shop/level-2-general-fiction-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-inky-friends-yellow-level-pack-of-6 | https://www.phonicsclub.com/shop/level-2-inky-and-friends-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-nonfiction-green-level-pack-of-6 | https://www.phonicsclub.com/shop/level-3-non-fiction-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-general-fiction-green-level-pack-of-6 | https://www.phonicsclub.com/shop/level-3-general-fiction-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-inky-friends-green-level-pack-of-6 | https://www.phonicsclub.com/shop/level-3-inky-and-friends-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-nonfiction-blue-level-pack-of-6 | https://www.phonicsclub.com/shop/level-4-non-fiction-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-general-fiction-blue-level-pack-of-6 | https://www.phonicsclub.com/shop/level-4-general-fiction-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-inky-friends-blue-level-pack-of-6 | https://www.phonicsclub.com/shop/level-4-inky-and-friends-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-readers-inky-friends-level-1-complete-18 | https://www.phonicsclub.com/shop/level-1-red-readers-complete-set-pack-of-18 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-readers-level-2-complete-set-pack-of-18 | https://www.phonicsclub.com/shop/level-2-yellow-readers-complete-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-readers-level-3-complete-set-pack-of-18 | https://www.phonicsclub.com/shop/level-3-green-readers-complete-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-readers-level-4-complete-set-pack-of-18 | https://www.phonicsclub.com/shop/level-4-blue-readers-complete-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-orange-level-set-1-pack-of-3 | https://www.phonicsclub.com/shop/orange-level-readers-set-1-pack-of-3 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-orange-level-set-2-pack-of-3 | https://www.phonicsclub.com/shop/orange-level-readers-set-2-pack-of-3 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-orange-level-set-3-pack-of-3 | https://www.phonicsclub.com/shop/orange-level-readers-set-3-pack-of-3 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-orange-level-set-4-pack-of-3 | https://www.phonicsclub.com/shop/orange-level-readers-set-4-pack-of-3 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-orange-level-set-5-pack-of-3 | https://www.phonicsclub.com/shop/orange-level-readers-set-5-pack-of-3 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-orange-level-set-6-pack-of-3 | https://www.phonicsclub.com/shop/orange-level-readers-set-6-pack-of-3 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-orange-level-set-7-pack-of-3 | https://www.phonicsclub.com/shop/orange-level-readers-set-7-pack-of-3 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-readers-orange-level-complete-set-pack-of-21 | https://www.phonicsclub.com/shop/orange-level-complete-set-pack-of-21 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/little-word-books | https://www.phonicsclub.com/shop/little-word-books-complete-set-14-books | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/little-word-books-3 | https://www.phonicsclub.com/shop/little-word-books-complete-set-14-books | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/our-world-readers | https://www.phonicsclub.com/shop/our-world-purple-readers-complete-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/our-world-readers-blue-level-4 | https://www.phonicsclub.com/shop/our-world-blue-readers-complete-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/our-world-readers-green-level-3 | https://www.phonicsclub.com/shop/our-world-green-readers-complete-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-our-world-readers-yellow-level-2-6-books | https://www.phonicsclub.com/shop/our-world-yellow-readers-complete-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/jolly-phonics-our-world-readers-red-level-1-6-books | https://www.phonicsclub.com/shop/our-world-red-readers-complete-set | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/folktales-readers-level-1-complete-set-6-books | https://www.phonicsclub.com/shop/level-1-folk-tale-readers-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/folktales-readers-level-2-complete-set-6-books | https://www.phonicsclub.com/shop/level-2-folk-tale-readers-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/folktales-readers-level-3-complete-set-6-books | https://www.phonicsclub.com/shop/level-3-folk-tale-readers-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/folktales-readers-level-4-complete-set-6-books | https://www.phonicsclub.com/shop/level-4-folk-tale-readers-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/folktales-readers-level-5-complete-set-6-books | https://www.phonicsclub.com/shop/level-5-folk-tale-readers-pack-of-6 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/fun-phonics | https://www.phonicsclub.com/shop/fun-phonics-pack | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/fun-phonics-pack-2 | https://www.phonicsclub.com/shop/fun-phonics-pack-2 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/fun-phonics-pack-1-edition-2025 | https://www.phonicsclub.com/shop/fun-phonics-pack-edition-2025 | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/fun-phonics-yellow-readers-pack-of-three | https://www.phonicsclub.com/shop/fun-phonics-yellow-readers-pack-of-three | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/fun-phonics-orange-readers-pack-of-three | https://www.phonicsclub.com/shop/fun-phonics-orange-readers-pack-of-three | 301 permanent | Old WooCommerce product slug maps to matched current product |
| https://www.phonicsclub.com/product/sounds-like-fun-dvd | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-phonics-for-the-whiteboard | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-phonics-for-the-whiteboard-site-license-in-print-letters | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-phonics-games-cd | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-phonics-games-cd-site-licence | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-phonics-dvd-pal | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-phonics-resources-cd | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-phonics-puppets | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-phonics-tricky-word-hat | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-phonics-magnetic-letters | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-phonics-extra | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-phonics-extra-personal-edition | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/my-jolly-phonics-home-kit | https://www.phonicsclub.com/shop?collection=jolly-learning&category=kits | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/the-grammar-1-handbook | https://www.phonicsclub.com/shop?collection=jolly-learning&q=grammar | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/the-grammar-2-handbook | https://www.phonicsclub.com/shop?collection=jolly-learning&q=grammar | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/the-grammar-3-handbook | https://www.phonicsclub.com/shop?collection=jolly-learning&q=grammar | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/the-grammar-4-handbook | https://www.phonicsclub.com/shop?collection=jolly-learning&q=grammar | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/the-grammar-5-handbook | https://www.phonicsclub.com/shop?collection=jolly-learning&q=grammar | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/the-grammar-6-handbook | https://www.phonicsclub.com/shop?collection=jolly-learning&q=grammar | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-grammar-big-book-1 | https://www.phonicsclub.com/shop?collection=jolly-learning&q=grammar | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-grammar-big-book-2 | https://www.phonicsclub.com/shop?collection=jolly-learning&q=grammar | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/grammar-games-cd-single-user | https://www.phonicsclub.com/shop?collection=jolly-learning&q=grammar | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-jingles-book-and-cd | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/jolly-phonics-pupil-book-teachers-book | https://www.phonicsclub.com/shop?collection=jolly-learning&category=pupil-books | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/fun-phonics-readers | https://www.phonicsclub.com/shop?collection=phonics-club&category=readers | 301 permanent | Old WooCommerce product is discontinued or merged; maps to closest shop category/search |
| https://www.phonicsclub.com/product/:slug.html | https://www.phonicsclub.com/shop | 301 permanent | Unknown old .html product URL maps to the shop rather than homepage |
| https://www.phonicsclub.com/product/:path* | https://www.phonicsclub.com/shop | 301 permanent | Unknown old WooCommerce product permalink maps to the shop rather than homepage |
| https://www.phonicsclub.com/product-category/jolly-phonics/:path* | https://www.phonicsclub.com/shop?collection=jolly-learning | 301 permanent | Old WooCommerce Jolly Phonics category maps to Jolly Learning shop collection |
| https://www.phonicsclub.com/product-category/jolly-grammar/:path* | https://www.phonicsclub.com/shop?collection=jolly-learning&q=grammar | 301 permanent | Old WooCommerce Jolly Grammar category maps to grammar shop search |
| https://www.phonicsclub.com/product-category/readers/:path* | https://www.phonicsclub.com/shop?collection=jolly-learning&category=readers | 301 permanent | Old WooCommerce readers category maps to readers shop category |
| https://www.phonicsclub.com/product-category/school-packs/:path* | https://www.phonicsclub.com/shop?collection=jolly-learning&category=kits | 301 permanent | Old school packs category maps to kits shop category |
| https://www.phonicsclub.com/product-category/classroom-kits-and-sets | https://www.phonicsclub.com/shop?collection=jolly-learning&category=kits | 301 permanent | Old classroom kits category maps to kits shop category |
| https://www.phonicsclub.com/product-category/pupil-books-coloured | https://www.phonicsclub.com/shop?collection=jolly-learning&category=pupil-books | 301 permanent | Old pupil books category maps to current pupil books category |
| https://www.phonicsclub.com/product-category/pupil-books-black-and-white | https://www.phonicsclub.com/shop?collection=jolly-learning&category=pupil-books | 301 permanent | Old pupil books category maps to current pupil books category |
| https://www.phonicsclub.com/product-category/jolly-phonics/jolly-phonic-workbooks | https://www.phonicsclub.com/shop?collection=jolly-learning&category=workbooks | 301 permanent | Old workbook category maps to current workbooks category |
| https://www.phonicsclub.com/product-category/jolly-phonics/jolly-phonics-activity-books-with-sticker-sheets | https://www.phonicsclub.com/shop?collection=jolly-learning&category=activity-books | 301 permanent | Old activity books category maps to current activity books category |
| https://www.phonicsclub.com/product-category/jolly-phonics/teachers-resource-materials | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old teacher resources category maps to current teacher resources category |
| https://www.phonicsclub.com/product-category/teachers-resource-materials | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teacher-resources | 301 permanent | Old teacher resources category maps to current teacher resources category |
| https://www.phonicsclub.com/product-category/grammar-pupil-book | https://www.phonicsclub.com/shop?collection=jolly-learning&category=grammar-pupil-books | 301 permanent | Old grammar pupil book category maps to current grammar pupil books category |
| https://www.phonicsclub.com/product-category/grammar-teachers-book | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teachers-books | 301 permanent | Old grammar teacher book category maps to current teacher books category |
| https://www.phonicsclub.com/product-category/jolly-grammar/grammar-pupil-book | https://www.phonicsclub.com/shop?collection=jolly-learning&category=grammar-pupil-books | 301 permanent | Old grammar pupil book category maps to current grammar pupil books category |
| https://www.phonicsclub.com/product-category/jolly-grammar/grammar-teachers-book | https://www.phonicsclub.com/shop?collection=jolly-learning&category=teachers-books | 301 permanent | Old grammar teacher book category maps to current teacher books category |
| https://www.phonicsclub.com/product-category/jolly-grammar/grammar-workbooks-set | https://www.phonicsclub.com/shop?collection=jolly-learning&category=grammar-workbooks | 301 permanent | Old grammar workbooks category maps to current grammar workbooks category |
| https://www.phonicsclub.com/product-category/jolly-grammar/jolly-literacy | https://www.phonicsclub.com/shop?collection=jolly-learning&category=grammar-pupil-books | 301 permanent | Old Jolly Literacy category maps to grammar pupil books |
| https://www.phonicsclub.com/product-category/jolly-grammar/jolly-grammar-big-book | https://www.phonicsclub.com/shop?collection=jolly-learning&q=grammar | 301 permanent | Old Jolly Grammar big book category maps to grammar shop search |
| https://www.phonicsclub.com/product-category/jolly-grammar/the-grammar-handbook | https://www.phonicsclub.com/shop?collection=jolly-learning&q=grammar | 301 permanent | Old grammar handbook category maps to grammar shop search |
| https://www.phonicsclub.com/product-category/our-world-readers-2 | https://www.phonicsclub.com/shop?collection=jolly-learning&category=readers | 301 permanent | Old Our World category maps to readers |
| https://www.phonicsclub.com/product-category/jolly-dictionary | https://www.phonicsclub.com/shop/jolly-dictionary | 301 permanent | Old Jolly Dictionary category maps to product page |
| https://www.phonicsclub.com/product-category/:path* | https://www.phonicsclub.com/shop?collection=jolly-learning | 301 permanent | Unknown old WooCommerce category maps to Jolly Learning shop collection |
| https://www.phonicsclub.com/noc | https://www.phonicsclub.com/blog/noc-jolly-learning-books-pctb | 301 permanent | Old NOC route maps to retained NOC documentation blog page |
| https://www.phonicsclub.com/noc/:path* | https://www.phonicsclub.com/blog/noc-jolly-learning-books-pctb | 301 permanent | Old NOC route maps to retained NOC documentation blog page; collapses old WordPress child paths |
| https://www.phonicsclub.com/noc-of-jolly-learning-books | https://www.phonicsclub.com/blog/noc-jolly-learning-books-pctb | 301 permanent | Old NOC route maps to retained NOC documentation blog page |
| https://www.phonicsclub.com/noc-of-jolly-learning-books/:path* | https://www.phonicsclub.com/blog/noc-jolly-learning-books-pctb | 301 permanent | Old NOC route maps to retained NOC documentation blog page; collapses old WordPress child paths |
| https://www.phonicsclub.com/noc-jolly-learning-books-pctb | https://www.phonicsclub.com/blog/noc-jolly-learning-books-pctb | 301 permanent | Old NOC slug maps to retained NOC documentation blog page |
| https://www.phonicsclub.com/noc-jolly-learning-books-pctb.html | https://www.phonicsclub.com/blog/noc-jolly-learning-books-pctb | 301 permanent | Old NOC slug maps to retained NOC documentation blog page; handles old .html URL variant |
| https://www.phonicsclub.com/free-resources | https://www.phonicsclub.com/blog/noc-jolly-learning-books-pctb | 301 permanent | Old resources page maps to retained NOC/documentation content |
| https://www.phonicsclub.com/free-resources.html | https://www.phonicsclub.com/blog/noc-jolly-learning-books-pctb | 301 permanent | Old resources page maps to retained NOC/documentation content; handles old .html URL variant |
| https://www.phonicsclub.com/login-register | https://www.phonicsclub.com/auth/login | 301 permanent | Old login/register route maps to current sign-in page |
| https://www.phonicsclub.com/login-register/:path* | https://www.phonicsclub.com/auth/login | 301 permanent | Old login/register route maps to current sign-in page; collapses old WordPress child paths |
| https://www.phonicsclub.com/login | https://www.phonicsclub.com/auth/login | 301 permanent | Old login route maps to current sign-in page |
| https://www.phonicsclub.com/login.html | https://www.phonicsclub.com/auth/login | 301 permanent | Old login route maps to current sign-in page; handles old .html URL variant |
| https://www.phonicsclub.com/register | https://www.phonicsclub.com/auth/signup | 301 permanent | Old register route maps to current sign-up page |
| https://www.phonicsclub.com/register.html | https://www.phonicsclub.com/auth/signup | 301 permanent | Old register route maps to current sign-up page; handles old .html URL variant |
| https://www.phonicsclub.com/my-account | https://www.phonicsclub.com/dashboard | 301 permanent | Old WooCommerce account route maps to current dashboard |
| https://www.phonicsclub.com/my-account/:path* | https://www.phonicsclub.com/dashboard | 301 permanent | Old WooCommerce account route maps to current dashboard; collapses old WordPress child paths |
| https://www.phonicsclub.com/lp-profile | https://www.phonicsclub.com/dashboard | 301 permanent | Old LearnPress profile maps to current dashboard |
| https://www.phonicsclub.com/lp-profile.html | https://www.phonicsclub.com/dashboard | 301 permanent | Old LearnPress profile maps to current dashboard; handles old .html URL variant |
| https://www.phonicsclub.com/dashboard.html | https://www.phonicsclub.com/dashboard | 301 permanent | Old .html dashboard URL maps to current dashboard |
| https://www.phonicsclub.com/student-registration | https://www.phonicsclub.com/auth/signup | 301 permanent | Old student registration maps to sign-up |
| https://www.phonicsclub.com/student-registration.html | https://www.phonicsclub.com/auth/signup | 301 permanent | Old student registration maps to sign-up; handles old .html URL variant |
| https://www.phonicsclub.com/instructor-registration | https://www.phonicsclub.com/auth/signup | 301 permanent | Old instructor registration maps to sign-up |
| https://www.phonicsclub.com/instructor-registration.html | https://www.phonicsclub.com/auth/signup | 301 permanent | Old instructor registration maps to sign-up; handles old .html URL variant |
| https://www.phonicsclub.com/password-reset | https://www.phonicsclub.com/auth/forgot-password | 301 permanent | Old password reset route maps to current reset flow |
| https://www.phonicsclub.com/password-reset.html | https://www.phonicsclub.com/auth/forgot-password | 301 permanent | Old password reset route maps to current reset flow; handles old .html URL variant |
| https://www.phonicsclub.com/lp-checkout | https://www.phonicsclub.com/checkout | 301 permanent | Old LearnPress checkout maps to current checkout |
| https://www.phonicsclub.com/lp-checkout.html | https://www.phonicsclub.com/checkout | 301 permanent | Old LearnPress checkout maps to current checkout; handles old .html URL variant |
| https://www.phonicsclub.com/wp-login.php | https://www.phonicsclub.com/auth/login | 301 permanent | Old WordPress login maps to current sign-in page |
| https://www.phonicsclub.com/wp-admin | https://www.phonicsclub.com/auth/login | 301 permanent | Old WordPress admin path maps to current sign-in page |
| https://www.phonicsclub.com/wp-admin/:path* | https://www.phonicsclub.com/auth/login | 301 permanent | Old WordPress admin child path maps to current sign-in page |
| https://www.phonicsclub.com/blog-1 | https://www.phonicsclub.com/blog | 301 permanent | Old blog sample page maps to current Blog |
| https://www.phonicsclub.com/blog-1.html | https://www.phonicsclub.com/blog | 301 permanent | Old blog sample page maps to current Blog; handles old .html URL variant |
| https://www.phonicsclub.com/blog-2 | https://www.phonicsclub.com/blog | 301 permanent | Old blog sample page maps to current Blog |
| https://www.phonicsclub.com/blog-2.html | https://www.phonicsclub.com/blog | 301 permanent | Old blog sample page maps to current Blog; handles old .html URL variant |
| https://www.phonicsclub.com/blog-3 | https://www.phonicsclub.com/blog | 301 permanent | Old blog sample page maps to current Blog |
| https://www.phonicsclub.com/blog-3.html | https://www.phonicsclub.com/blog | 301 permanent | Old blog sample page maps to current Blog; handles old .html URL variant |
| https://www.phonicsclub.com/blog-4 | https://www.phonicsclub.com/blog | 301 permanent | Old blog sample page maps to current Blog |
| https://www.phonicsclub.com/blog-4.html | https://www.phonicsclub.com/blog | 301 permanent | Old blog sample page maps to current Blog; handles old .html URL variant |
| https://www.phonicsclub.com/teaching-children-to-read-or-a-fight-against-illiteracy | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress post maps to current Blog archive |
| https://www.phonicsclub.com/teaching-children-to-read-or-a-fight-against-illiteracy.html | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress post maps to current Blog archive; handles old .html URL variant |
| https://www.phonicsclub.com/teaching-of-urdu-as-a-second-language | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress post maps to current Blog archive |
| https://www.phonicsclub.com/teaching-of-urdu-as-a-second-language.html | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress post maps to current Blog archive; handles old .html URL variant |
| https://www.phonicsclub.com/learn-english-online | https://www.phonicsclub.com/courses | 301 permanent | Old learning post maps to Courses |
| https://www.phonicsclub.com/learn-english-online.html | https://www.phonicsclub.com/courses | 301 permanent | Old learning post maps to Courses; handles old .html URL variant |
| https://www.phonicsclub.com/reading-and-writing-through-synthetic-phonics | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress post maps to current Blog archive |
| https://www.phonicsclub.com/reading-and-writing-through-synthetic-phonics.html | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress post maps to current Blog archive; handles old .html URL variant |
| https://www.phonicsclub.com/reading-and-writing-problems | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress post maps to current Blog archive |
| https://www.phonicsclub.com/reading-and-writing-problems.html | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress post maps to current Blog archive; handles old .html URL variant |
| https://www.phonicsclub.com/category/workshop/:path* | https://www.phonicsclub.com/trainings | 301 permanent | Old WordPress workshop category maps to Trainings |
| https://www.phonicsclub.com/category/:path* | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress category archive maps to Blog |
| https://www.phonicsclub.com/tag/:path* | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress tag archive maps to Blog |
| https://www.phonicsclub.com/:year(\d{4})/:month(\d{1,2})/:day(\d{1,2})/:slug | https://www.phonicsclub.com/blog | 301 permanent | Old dated WordPress permalink maps to Blog |
| https://www.phonicsclub.com/:year(\d{4})/:month(\d{1,2})/:slug | https://www.phonicsclub.com/blog | 301 permanent | Old dated WordPress permalink maps to Blog |
| https://www.phonicsclub.com/jumping-for-jolly | https://www.phonicsclub.com/about | 301 permanent | Old campaign page maps to About |
| https://www.phonicsclub.com/jumping-for-jolly.html | https://www.phonicsclub.com/about | 301 permanent | Old campaign page maps to About; handles old .html URL variant |
| https://www.phonicsclub.com/parents-corner | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old parent content maps to children courses |
| https://www.phonicsclub.com/parents-corner.html | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old parent content maps to children courses; handles old .html URL variant |
| https://www.phonicsclub.com/post-a-job | https://www.phonicsclub.com/contact | 301 permanent | Old jobs page maps to Contact |
| https://www.phonicsclub.com/post-a-job.html | https://www.phonicsclub.com/contact | 301 permanent | Old jobs page maps to Contact; handles old .html URL variant |
| https://www.phonicsclub.com/job-dashboard | https://www.phonicsclub.com/contact | 301 permanent | Old jobs dashboard maps to Contact |
| https://www.phonicsclub.com/job-dashboard.html | https://www.phonicsclub.com/contact | 301 permanent | Old jobs dashboard maps to Contact; handles old .html URL variant |
| https://www.phonicsclub.com/jobs | https://www.phonicsclub.com/contact | 301 permanent | Old jobs archive maps to Contact |
| https://www.phonicsclub.com/jobs.html | https://www.phonicsclub.com/contact | 301 permanent | Old jobs archive maps to Contact; handles old .html URL variant |
| https://www.phonicsclub.com/questions | https://www.phonicsclub.com/faqs | 301 permanent | Old questions route maps to FAQs |
| https://www.phonicsclub.com/questions.html | https://www.phonicsclub.com/faqs | 301 permanent | Old questions route maps to FAQs; handles old .html URL variant |
| https://www.phonicsclub.com/questions/:path* | https://www.phonicsclub.com/faqs | 301 permanent | Old questions child route maps to FAQs |
| https://www.phonicsclub.com/forums/:path* | https://www.phonicsclub.com/faqs | 301 permanent | Old forum route maps to FAQs |
| https://www.phonicsclub.com/forum/:path* | https://www.phonicsclub.com/faqs | 301 permanent | Old forum route maps to FAQs |
| https://www.phonicsclub.com/?page_id=2 | https://www.phonicsclub.com/ | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=13 | https://www.phonicsclub.com/ | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=244 | https://www.phonicsclub.com/contact | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=386 | https://www.phonicsclub.com/ | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=444 | https://www.phonicsclub.com/contact | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=492 | https://www.phonicsclub.com/courses | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=550 | https://www.phonicsclub.com/trainings | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=612 | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=632 | https://www.phonicsclub.com/faqs | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2824 | https://www.phonicsclub.com/faqs | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2838 | https://www.phonicsclub.com/about | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2852 | https://www.phonicsclub.com/about | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2861 | https://www.phonicsclub.com/about | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2871 | https://www.phonicsclub.com/shop | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2883 | https://www.phonicsclub.com/trainings | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2897 | https://www.phonicsclub.com/research | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2906 | https://www.phonicsclub.com/research | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2928 | https://www.phonicsclub.com/research | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2935 | https://www.phonicsclub.com/research | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2941 | https://www.phonicsclub.com/research | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2956 | https://www.phonicsclub.com/consultancy | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2960 | https://www.phonicsclub.com/consultancy | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2973 | https://www.phonicsclub.com/consultancy | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2985 | https://www.phonicsclub.com/consultancy | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=2994 | https://www.phonicsclub.com/trainings | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3014 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3020 | https://www.phonicsclub.com/research | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3028 | https://www.phonicsclub.com/about | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3036 | https://www.phonicsclub.com/research | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3058 | https://www.phonicsclub.com/about | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3107 | https://www.phonicsclub.com/trainings | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3120 | https://www.phonicsclub.com/research | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3123 | https://www.phonicsclub.com/about | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3127 | https://www.phonicsclub.com/research | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3133 | https://www.phonicsclub.com/research | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3138 | https://www.phonicsclub.com/research | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3253 | https://www.phonicsclub.com/blog/jolly-phonics-2017-training-video | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3265 | https://www.phonicsclub.com/consultancy | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3274 | https://www.phonicsclub.com/about | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3319 | https://www.phonicsclub.com/contact | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3374 | https://www.phonicsclub.com/research | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3400 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3413 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3739 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3760 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=3843 | https://www.phonicsclub.com/terms | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=4016 | https://www.phonicsclub.com/blog/noc-jolly-learning-books-pctb | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=4391 | https://www.phonicsclub.com/privacy | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=35649 | https://www.phonicsclub.com/refunds | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=35769 | https://www.phonicsclub.com/shop | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=35868 | https://www.phonicsclub.com/certified-trainers | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=37753 | https://www.phonicsclub.com/checkout | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=37754 | https://www.phonicsclub.com/dashboard | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=37755 | https://www.phonicsclub.com/courses | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=37756 | https://www.phonicsclub.com/courses?category=teacher-courses | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=37757 | https://www.phonicsclub.com/terms | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=37968 | https://www.phonicsclub.com/dashboard | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=37969 | https://www.phonicsclub.com/auth/signup | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=37970 | https://www.phonicsclub.com/auth/signup | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=39093 | https://www.phonicsclub.com/wishlist | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=39726 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=39748 | https://www.phonicsclub.com/courses | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=39754 | https://www.phonicsclub.com/courses | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=40227 | https://www.phonicsclub.com/certified-trainers | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=40228 | https://www.phonicsclub.com/certified-trainers | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=40593 | https://www.phonicsclub.com/courses | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=40594 | https://www.phonicsclub.com/auth/forgot-password | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?page_id=40595 | https://www.phonicsclub.com/dashboard/my-courses | 301 permanent | Old WordPress ?page_id= URL maps to the closest current route |
| https://www.phonicsclub.com/?post_type=lp_course&p=37938 | https://www.phonicsclub.com/courses/teaching-english-jolly-phonics | 301 permanent | Old LearnPress query permalink maps to the closest current course route |
| https://www.phonicsclub.com/?post_type=lp_course&p=38375 | https://www.phonicsclub.com/courses/teaching-english-through-jolly-phonics-free-version | 301 permanent | Old LearnPress query permalink maps to the closest current course route |
| https://www.phonicsclub.com/?post_type=lp_course&p=38554 | https://www.phonicsclub.com/courses/preschool-professional | 301 permanent | Old LearnPress query permalink maps to the closest current course route |
| https://www.phonicsclub.com/?post_type=lp_course&p=39801 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old LearnPress query permalink maps to the closest current course route |
| https://www.phonicsclub.com/?post_type=lp_course&p=39802 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old LearnPress query permalink maps to the closest current course route |
| https://www.phonicsclub.com/?post_type=lp_course&p=39803 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old LearnPress query permalink maps to the closest current course route |
| https://www.phonicsclub.com/?post_type=lp_course&p=39807 | https://www.phonicsclub.com/courses?category=children-courses | 301 permanent | Old LearnPress query permalink maps to the closest current course route |
| https://www.phonicsclub.com/?p=3641 | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress post query permalink maps to current content area |
| https://www.phonicsclub.com/?p=3787 | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress post query permalink maps to current content area |
| https://www.phonicsclub.com/?p=4337 | https://www.phonicsclub.com/courses | 301 permanent | Old WordPress post query permalink maps to current content area |
| https://www.phonicsclub.com/?p=4380 | https://www.phonicsclub.com/trainings | 301 permanent | Old WordPress post query permalink maps to current content area |
| https://www.phonicsclub.com/?p=35633 | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress post query permalink maps to current content area |
| https://www.phonicsclub.com/?p=35883 | https://www.phonicsclub.com/blog | 301 permanent | Old WordPress post query permalink maps to current content area |
| https://www.phonicsclub.com/?post_type=product | https://www.phonicsclub.com/shop | 301 permanent | Old WooCommerce query permalink maps to current Shop |
| https://www.phonicsclub.com/?post_type=lp_course | https://www.phonicsclub.com/courses | 301 permanent | Old LearnPress query permalink maps to current Courses |
