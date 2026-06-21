import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getCartTotalQuantity } from '@/actions/cart'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ count: 0 })
  const count = await getCartTotalQuantity(user.id)
  return NextResponse.json({ count })
}
