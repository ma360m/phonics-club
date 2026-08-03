import { readFileSync } from 'node:fs'

const CHILD_COURSE_SLUGS = [
  'jolly-phonics-sounds-groups-1-3',
  'jolly-phonics-sounds-groups-4-7',
]

function loadEnv() {
  const env = { ...process.env }
  try {
    const raw = readFileSync('.env.local', 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const index = trimmed.indexOf('=')
      if (index <= 0) continue
      const key = trimmed.slice(0, index).trim()
      const value = trimmed.slice(index + 1).trim().replace(/^"|"$/g, '')
      env[key] = value
    }
  } catch {
    // CI/Vercel can provide env vars without a local file.
  }
  return env
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}

async function supabaseRequest(path, init = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} failed: ${response.status} ${await response.text()}`)
  }
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

const rows = await supabaseRequest(
  `/rest/v1/courses?select=id,slug,metadata&slug=in.(${CHILD_COURSE_SLUGS.join(',')})`,
)

for (const row of rows) {
  const coursePart = row.slug.endsWith('1-3') ? 'Groups%201-3' : 'Groups%204-7'
  const metadata = {
    ...(row.metadata ?? {}),
    instructorHelpEnabled: true,
    instructorHelpTotalPrice: 5000,
    instructorHelpLabel: 'Course + instructor help',
    instructorHelpNote: 'Includes guided instructor support alongside course access.',
    instructorHelpContactUrl: `/contact?subject=Instructor%20help%20for%20${coursePart}`,
  }

  await supabaseRequest(`/rest/v1/courses?id=eq.${row.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      price: 2500,
      discounted_price: null,
      is_free: false,
      currency: 'PKR',
      metadata,
    }),
  })
}

console.log(`Updated ${rows.length} children courses.`)
