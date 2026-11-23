import 'server-only'
import { NextResponse } from 'next/server'
import type { Store } from './types'

export * from './types'

/**
 * Where data lives.
 *   DATABASE_URL set → Postgres (production; works on Vercel, Railway, Render, a VPS…)
 *   otherwise        → JSON files in /.data (local development, or a single server with a disk)
 */
export const usingPostgres = () => Boolean(process.env.DATABASE_URL)

/**
 * File storage does not survive on serverless hosts: their disks are temporary and not shared.
 * Checkout refuses to take money there rather than lose the order.
 */
export const storageDurable = () => usingPostgres() || !(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)

/**
 * For forms that collect a guest's details on a host with nowhere lasting to keep them (no DATABASE_URL):
 * say so to the guest rather than thank them for details that would quietly vanish.
 */
export function storageUnavailable(form: string) {
  console.error(`${form} refused: no DATABASE_URL on a serverless host, so the details would be lost`)
  return NextResponse.json({ error: 'We could not save that just now. Please try again shortly.' }, { status: 503 })
}

let store: Promise<Store> | null = null
export function getStore(): Promise<Store> {
  if (!store) {
    store = usingPostgres()
      ? import('./pg').then((m) => m.pgStore)
      : import('./file').then((m) => m.fileStore)
  }
  return store
}
