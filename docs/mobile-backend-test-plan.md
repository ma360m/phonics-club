# Mobile Backend Test Plan

Run these against a Supabase project with migrations through `026` applied and seeded admin/instructor/user accounts.

## Required Database/RLS Tests

- Sign up with `raw_user_meta_data.role = admin`; profile role must be `user`.
- Sign up with `raw_user_meta_data.role = instructor`; profile role must be `user`.
- Existing admin and instructor profile rows must remain unchanged after migration.
- Anonymous users cannot select all rows from `profiles`.
- Authenticated users can read their own complete profile.
- Authenticated users cannot update `profiles.role`.
- Admins can manage profiles through trusted backend/admin flows.
- Public instructor data comes from `public_instructor_profiles` and does not expose private emails.
- `order-receipts` bucket is private.
- Public users cannot list or retrieve receipt objects.
- Mobile device tokens cannot be listed publicly.
- Newsletter subscribers cannot be listed publicly.

## Required API Tests

- `GET /api/mobile/v1/auth/me` rejects missing, invalid, and expired bearer tokens.
- `GET /api/mobile/v1/auth/me` returns only the authenticated user's profile.
- `POST /api/mobile/v1/orders/checkout` ignores client prices, discounts, delivery fees, totals, stock values, and roles.
- Checkout rejects inactive products and invalid stock.
- Checkout idempotency prevents duplicate orders.
- `GET /api/mobile/v1/orders` returns only the authenticated user's orders.
- `GET /api/mobile/v1/orders/[orderId]` rejects another user's order.
- `POST /api/mobile/v1/orders/[orderId]/receipt` rejects another user's order and never marks paid.
- `GET /api/mobile/v1/orders/[orderId]/invoice` rejects another user's invoice.
- Course payment checkout ignores client totals.
- Course payment receipt upload never activates enrollment.
- Protected resource access requires active enrollment or preview access.
- Expired enrollments cannot access protected resources.
- Free preview resources remain accessible where configured.
- Quiz fetch does not include correctness fields.
- Quiz submit grades on the server and rejects unknown question IDs.
- Duplicate quiz `attemptId` is rejected.
- Learning heartbeat caps excessive gaps and rejects duplicate heartbeat IDs.
- Lesson completion does not accept client-submitted completion percentages.
- Certificate download rejects another user's certificate.
- Training registration prevents duplicate registration.
- Newsletter subscription prevents duplicates and can resubscribe after unsubscribe.
- Push token register/unregister derives `user_id` from the bearer token.

## Local Checks

Run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Do not treat this checklist as a replacement for real Supabase integration tests. Several items require Supabase Auth, Storage, RLS, and seeded course/order data.
