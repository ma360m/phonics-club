# Mobile Backend Security Notes

## Signup Role Escalation Fix

The original `handle_new_user()` trigger copied `raw_user_meta_data.role` into `profiles.role`. A malicious client could sign up with metadata such as `{ "role": "admin" }` or `{ "role": "instructor" }`.

Migration `024_mobile_auth_profile_privacy.sql` replaces that trigger. Normal signups always receive `role = 'user'`. Admin and instructor roles must be assigned only by a secured admin server action, secured API endpoint, trusted SQL administration process, or another privileged backend operation.

The same migration adds a `prevent_unprivileged_profile_role_update()` trigger so users cannot update their own role through profile updates.

Migration `027_mobile_admin_support_parent_deletion.sql` extends the role enum with `customer`,
`student`, `parent`, and `super_admin` without changing existing users. It also updates
`is_admin()` so existing website admin checks continue to work for `admin` and `super_admin`.

## Mobile Admin Permissions

Mobile admin APIs do not trust a client-submitted role. They authenticate the Supabase access token,
load the profile server-side, and check `mobile_admin_role_permissions`.

Seeded permissions include:

- `admin.overview.read`
- `products.read`
- `products.price.write`
- `products.inventory.write`
- `support.read`
- `support.write`
- `children.read`
- `children.write`
- `deletion.read`
- `deletion.write`
- `reviews.read`
- `reviews.write`
- `reports.read`
- `settings.write`
- `notifications.write`

`super_admin` receives `*`. Product price and inventory changes are only exposed through
service-role RPC calls invoked after bearer-token admin authorization.

## Profile Privacy

Migration `024_mobile_auth_profile_privacy.sql` removes public `profiles` reads and replaces them with scoped policies:

- users can read their own profile
- users can update their own profile, but not their role
- admins can manage profiles
- public instructor/team display data is exposed through `public_instructor_profiles`, which excludes private emails and administrative fields
- instructors can obtain limited student display data for assigned courses through `get_course_student_public_profiles(course_id)`

## Receipt Storage

Migration `025_mobile_storage_tables_and_order_function.sql` sets `order-receipts` to private. New website and mobile receipt uploads store:

- bucket
- randomized path
- filename
- MIME type
- size
- upload timestamp

Permanent public receipt URLs are no longer created. Existing legacy Supabase public receipt URLs are handled by `/api/orders/[id]/receipt`, which parses the stored object path and redirects to a short-lived signed URL after authorization.

## Rate Limiting

Mobile routes use a shared wrapper around the existing `lib/rate-limit.ts` helper. This is an in-memory limiter and is suitable for development or single-instance hosting. For production serverless deployments, replace it with a shared store such as Upstash Redis, Vercel KV, Supabase-backed counters, or an edge/provider rate limit.

## Audit Events

Mobile-sensitive events are written to `mobile_audit_events` when the service role key is configured. Events avoid tokens, passwords, service keys, full payment secrets, and file contents.

Recorded event types include:

- mobile order created
- order receipt uploaded
- course payment created
- course receipt uploaded
- resource signed URL created
- quiz submitted
- certificate downloaded
- learning session started/finished
- lesson completed
- push token registered/disabled
- training registration created
- unauthorized access attempts
- mobile admin product price changes
- mobile admin product inventory changes
- support ticket creation and replies
- child profile creation, updates, and removal
- account deletion request and restoration
- product review submission and moderation

## Parent and Child Profiles

`child_profiles` are owned by `parent_user_id`, which the mobile API derives from the authenticated
Supabase token. Clients must never send another user's id as child-profile ownership proof. Child
profiles do not receive passwords or direct Supabase auth identities.

## Five-Day Account Deletion

`account_deletion_requests` stores private deletion reasons and status. The request and restore
functions require `p_user_id = auth.uid()` and return the existing active request when called more
than once. Deletion execution remains a privileged backend/admin process after the recovery period.

Public deletion instructions are available at `/account-deletion` for app-store compliance.

## Mobile Auth Redirects

Add this Supabase Auth redirect URL for the production mobile app:

```text
phonicsclub://auth/callback
```

Expo development redirect URLs should be added separately during development and removed or restricted before production. Keep all existing website callback URLs.

## Forbidden Mobile Secrets

Never put these values in the Expo app:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- Cloudinary API secret
- cron secret
- database password
- payment-provider secrets
