import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/024_mobile_auth_profile_privacy.sql',
  'supabase/migrations/025_mobile_storage_tables_and_order_function.sql',
  'supabase/migrations/026_mobile_lms_quiz_and_registration_safety.sql',
  'lib/mobile-api/auth.ts',
  'lib/mobile-api/response.ts',
  'lib/mobile-api/schemas.ts',
  'app/api/mobile/v1/auth/me/route.ts',
  'app/api/mobile/v1/orders/checkout/route.ts',
  'app/api/mobile/v1/quizzes/[quizId]/route.ts',
  'app/api/mobile/v1/quizzes/[quizId]/submit/route.ts',
  'docs/mobile-api.md',
  'docs/mobile-backend-security.md',
]

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `Missing required file: ${file}`)
}

const migration024 = read('supabase/migrations/024_mobile_auth_profile_privacy.sql')
assert(!migration024.includes("raw_user_meta_data->>'role'"), 'Signup trigger must not read raw_user_meta_data.role')
assert(migration024.includes("'user'::user_role"), 'Signup trigger must default new profiles to user role')
assert(migration024.includes('prevent_unprivileged_profile_role_update'), 'Profile role update trigger is missing')
assert(migration024.includes('public_instructor_profiles'), 'Safe public instructor view is missing')

const migration025 = read('supabase/migrations/025_mobile_storage_tables_and_order_function.sql')
assert(/SET\s+public\s*=\s*FALSE/i.test(migration025), 'order-receipts bucket must be made private')
assert(migration025.includes('create_mobile_order'), 'Transactional mobile order function is missing')
assert(migration025.includes('mobile_idempotency_key'), 'Mobile checkout idempotency key is missing')
assert(migration025.includes('newsletter_subscribers'), 'Newsletter subscriber table is missing')
assert(migration025.includes('mobile_devices'), 'Mobile device table is missing')

const quizFetchRoute = read('app/api/mobile/v1/quizzes/[quizId]/route.ts')
assert(!quizFetchRoute.includes('correct_option'), 'Quiz fetch route must not select correct_option')
assert(!quizFetchRoute.includes('correct_options'), 'Quiz fetch route must not select correct_options')
assert(!quizFetchRoute.includes('acceptable_answers'), 'Quiz fetch route must not select acceptable_answers')

const mobileApiFiles = requiredFiles
  .filter((file) => file.startsWith('app/api/mobile') || file.startsWith('lib/mobile-api'))
  .map(read)
  .join('\n')
assert(!mobileApiFiles.includes('SUPABASE_SERVICE_ROLE_KEY'), 'Mobile API code must use server helpers, not expose service key literals')

console.log('Mobile backend static checks passed.')
