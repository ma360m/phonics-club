import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/auth'

export async function GET() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const configured = isSupabaseConfigured()
  let dbConnected = false
  let productCount = 0

  if (configured) {
    try {
      const supabase = await createClient()
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      dbConnected = !error
      productCount = count ?? 0
    } catch {
      dbConnected = false
    }
  }

  return NextResponse.json({
    configured,
    dbConnected,
    productCount,
    storageBucket: 'product-images',
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  })
}
