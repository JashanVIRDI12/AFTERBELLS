import { NextResponse } from 'next/server'
import { PREVIEW_COOKIE, PREVIEW_DAYS, passwordMatches, previewToken } from '@/lib/prelaunch'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/** The owner's way in while the house is closed: the password sets a 30-day cookie. */
export async function POST(req: Request) {
  const back = (q: string) => NextResponse.redirect(new URL(`/waitlist${q}`, req.url), 303)
  if (!rateLimit(req, 'preview', 8, 15 * 60_000)) return back('?owner=wait')
  const fd = await req.formData().catch(() => null)
  const given = String(fd?.get('password') ?? '')
  const token = previewToken()
  if (!token || !passwordMatches(given)) return back('?owner=wrong')
  const res = NextResponse.redirect(new URL('/', req.url), 303)
  res.cookies.set(PREVIEW_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: PREVIEW_DAYS * 24 * 3600,
  })
  return res
}

/** Leave the preview (see the site as a guest does). */
export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL('/waitlist', req.url), 303)
  res.cookies.delete(PREVIEW_COOKIE)
  return res
}
