import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(filePath) {
  return readFile(filePath, 'utf8')
    .then((text) => {
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        const equalsAt = trimmed.indexOf('=')
        if (equalsAt === -1) continue

        const key = trimmed.slice(0, equalsAt).trim()
        let value = trimmed.slice(equalsAt + 1).trim()
        value = value.replace(/^['"]|['"]$/g, '')

        if (!process.env[key]) process.env[key] = value
      }
    })
    .catch(() => undefined)
}

const replaceCatalog = process.argv.includes('--replace')
const dryRun = process.argv.includes('--dry-run')

await loadEnvFile('.env.local')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local')
}

const catalog = JSON.parse(await readFile('lib/data/product-catalog.json', 'utf8'))
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { count: beforeCount, error: countError } = await supabase
  .from('products')
  .select('id', { count: 'exact', head: true })

if (countError) throw new Error(countError.message)

if (dryRun) {
  console.log(`Dry run: ${beforeCount ?? 0} products currently in Supabase.`)
  console.log(`Dry run: ${catalog.length} catalog products ready to import.`)
} else {
  let deleted = 0
  if (replaceCatalog) {
    const { count, error } = await supabase
      .from('products')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) throw new Error(error.message)
    deleted = count ?? 0
  }

  const payloads = catalog.map((row) => ({
    ...row,
    metadata: {
      currency: 'PKR',
      source: 'phonics-club-products-2026-06-21-newest.csv',
    },
  }))

  const { error: upsertError } = await supabase
    .from('products')
    .upsert(payloads, { onConflict: 'isbn' })

  if (upsertError) throw new Error(upsertError.message)

  const { count: afterCount, error: afterCountError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })

  if (afterCountError) throw new Error(afterCountError.message)

  console.log(
    `Imported ${catalog.length} products. Deleted ${deleted}. Supabase now has ${afterCount ?? 0} products.`
  )
}
