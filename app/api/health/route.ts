import { NextResponse } from 'next/server'
import { getStore, storageDurable } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** For uptime monitors: 200 when storage answers. Reveals nothing secret. */
export async function GET() {
  try {
    const store = await getStore()
    await store.health()
    return NextResponse.json({ ok: true, storage: store.kind, durable: storageDurable() }, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false }, { status: 503, headers: { 'cache-control': 'no-store' } })
  }
}
