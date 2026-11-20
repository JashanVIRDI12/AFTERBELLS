import { NextResponse } from 'next/server'
import { getPublicStock } from '@/lib/stock'

export const dynamic = 'force-dynamic'

export async function GET() {
  const stock = await getPublicStock()
  return NextResponse.json(stock, { headers: { 'cache-control': 'no-store' } })
}
