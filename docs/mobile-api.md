# Phonics Club Mobile API

Base path: `/api/mobile/v1`

All privileged mobile routes use Supabase bearer tokens:

```http
Authorization: Bearer <supabase-access-token>
```

Responses use one JSON shape:

```json
{ "success": true, "data": {} }
```

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Safe user-facing message",
    "requestId": "optional-request-id"
  }
}
```

## Endpoints

Public/safe:

- `GET /api/mobile/v1/config`
- `POST /api/mobile/v1/newsletter/subscribe`
- `POST /api/mobile/v1/newsletter/unsubscribe`
- `POST /api/mobile/v1/trainings/[trainingId]/register`

Authenticated:

- `GET /api/mobile/v1/auth/me`
- `POST /api/mobile/v1/orders/checkout`
- `GET /api/mobile/v1/orders`
- `GET /api/mobile/v1/orders/[orderId]`
- `POST /api/mobile/v1/orders/[orderId]/receipt`
- `GET /api/mobile/v1/orders/[orderId]/invoice`
- `POST /api/mobile/v1/course-payments/checkout`
- `GET /api/mobile/v1/course-payments`
- `GET /api/mobile/v1/course-payments/[paymentId]`
- `POST /api/mobile/v1/course-payments/[paymentId]/receipt`
- `GET /api/mobile/v1/learning/courses`
- `GET /api/mobile/v1/learning/courses/[courseId]`
- `POST /api/mobile/v1/learning/resources/[resourceId]/access`
- `GET /api/mobile/v1/quizzes/[quizId]`
- `POST /api/mobile/v1/quizzes/[quizId]/submit`
- `POST /api/mobile/v1/learning/sessions/start`
- `POST /api/mobile/v1/learning/sessions/[sessionId]/heartbeat`
- `POST /api/mobile/v1/learning/sessions/[sessionId]/finish`
- `POST /api/mobile/v1/learning/lessons/[lessonId]/complete`
- `GET /api/mobile/v1/certificates`
- `GET /api/mobile/v1/certificates/[certificateId]`
- `POST /api/mobile/v1/certificates/[certificateId]/download`
- `POST /api/mobile/v1/devices/register`
- `DELETE /api/mobile/v1/devices/[deviceId]`
- `GET /api/mobile/v1/support/issues`
- `POST /api/mobile/v1/support/issues`
- `GET /api/mobile/v1/support/issues/[ticketId]`
- `POST /api/mobile/v1/support/issues/[ticketId]/reply`
- `GET /api/mobile/v1/children`
- `POST /api/mobile/v1/children`
- `GET /api/mobile/v1/children/[childId]`
- `PATCH /api/mobile/v1/children/[childId]`
- `DELETE /api/mobile/v1/children/[childId]`
- `GET /api/mobile/v1/account-deletion/status`
- `POST /api/mobile/v1/account-deletion/request`
- `POST /api/mobile/v1/account-deletion/restore`
- `POST /api/mobile/v1/reviews`

Mobile admin:

- `GET /api/mobile/v1/admin/overview`
- `GET /api/mobile/v1/admin/products`
- `GET /api/mobile/v1/admin/products/[productId]`
- `POST /api/mobile/v1/admin/products/[productId]/price`
- `POST /api/mobile/v1/admin/products/[productId]/inventory`
- `GET /api/mobile/v1/admin/reviews`
- `PATCH /api/mobile/v1/admin/reviews/[reviewId]`

Admin endpoints require a bearer token for a profile with a privileged role and a matching row in
`mobile_admin_role_permissions`. The app may use the returned role to show or hide navigation, but
every privileged endpoint must remain independently authorized by the backend.

## Checkout

`POST /api/mobile/v1/orders/checkout`

The app must send product IDs, quantities, address, selected payment method, display currency, and an idempotency key. The server loads product prices, stock, coupons, delivery fee, currency settings, and invoice number. Client totals are ignored.

```json
{
  "items": [{ "productId": "uuid", "quantity": 1 }],
  "deliveryAddress": {
    "fullName": "Customer Name",
    "email": "customer@example.com",
    "phone": "03008079480",
    "address": "Street address",
    "city": "Lahore",
    "zip": "",
    "country": "Pakistan"
  },
  "paymentMethodId": "bank_transfer",
  "voucherCode": "OPTIONAL",
  "customerNotes": "Optional",
  "selectedDisplayCurrency": "PKR",
  "idempotencyKey": "mobile-generated-unique-key"
}
```

The same user and idempotency key return the existing order instead of creating a duplicate.

## File Uploads

Receipt routes accept `multipart/form-data` with:

- `receipt`: PDF, JPG, PNG, or WebP depending on route
- `transactionReference`: optional text

Receipt files are stored in private buckets with randomized paths. The app must not send a user ID or storage path.

## Direct Supabase Reads

The mobile app may use the Supabase anon client directly for safe RLS-protected reads:

- published products
- product images from public product image buckets
- published course catalog rows
- course tracks/categories that are public
- published blog posts
- safe public instructor view: `public_instructor_profiles`
- the signed-in user's cart/wishlist rows, if existing RLS is used

Use API endpoints for operations that need server authority:

- shop checkout
- order receipt upload
- order invoice retrieval
- course payment checkout
- course payment receipt upload
- protected course resources
- quiz fetch/submit
- learning heartbeat/progress credit
- certificate download
- push-token registration
- newsletter persistence
- training registration
- support ticket creation, replies, and admin/internal notes
- child profile management
- account deletion requests and restoration
- product review submission and moderation
- mobile admin dashboard, price changes, and inventory adjustments
- admin/instructor privileged operations

## Mobile Admin

Roles supported by the backend are:

- `user`
- `customer`
- `student`
- `parent`
- `instructor`
- `admin`
- `super_admin`

Normal signups still receive `user`. Admin-capable mobile routes additionally check a permission
string such as `products.price.write`, `products.inventory.write`, `support.write`, or
`reviews.write`.

Price and inventory changes use transactional SQL functions:

- `mobile_admin_change_product_price`
- `mobile_admin_adjust_product_inventory`

The mobile app must not update product prices, stock, payment status, order ownership, or user roles
directly through Supabase.

## Support Tickets

Create issue:

```json
{
  "subject": "Payment receipt question",
  "category": "payment",
  "priority": "normal",
  "message": "I uploaded the receipt but it still shows pending.",
  "orderId": "optional-order-uuid"
}
```

Customer replies always use `visibility: "user"`. Internal notes require `support.write`.

## Child Profiles

Child profiles are parent-managed records and do not create separate Supabase auth users.

```json
{
  "displayName": "Aisha",
  "ageRange": "5_7",
  "preferences": {}
}
```

The backend derives `parent_user_id` from the access token.

## Account Deletion

The public account deletion information page is `/account-deletion`.

Request body:

```json
{
  "selectedReason": "No longer using the app",
  "additionalDetails": "Optional"
}
```

Deletion requests are idempotent while a pending request exists. Users can call
`POST /api/mobile/v1/account-deletion/restore` during the five-day recovery period.

## Deep Links

Production Supabase Auth redirect URL:

```text
phonicsclub://auth/callback
```

Expo development URLs may also be added while developing, for example:

```text
exp://127.0.0.1:8081/--/auth/callback
```

Do not remove the existing website callback URLs.

## Mobile Env Names

For the separate Expo project:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_APP_SCHEME
```

`EXPO_PUBLIC_API_BASE_URL` should be the website origin, for example
`https://www.phonicsclub.com`. The Expo client appends `/api/mobile/v1`.

Never include server secrets in the Expo app.
