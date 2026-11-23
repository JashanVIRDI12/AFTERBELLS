import { NextResponse, type NextRequest } from 'next/server'
import { adminConfigured, checkAdmin } from '@/lib/admin-auth'
import { PREVIEW_COOKIE, openWhileLocked, siteLocked, validPreview } from '@/lib/prelaunch'

/**
 * 1. /admin and its exports ask for the admin password (the pages re-check it themselves).
 * 2. Before opening (lib/prelaunch.ts), every other page leads to the waitlist, unless the visitor
 *    is the owner and holds the preview cookie.
 */
export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (path === '/admin' || path.startsWith('/admin/') || path.startsWith('/api/admin')) {
    if (!adminConfigured()) return new NextResponse('Not found', { status: 404 })
    if (checkAdmin(req.headers.get('authorization'))) return NextResponse.next()
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="After Bells admin", charset="UTF-8"' },
    })
  }

  if (!siteLocked() || openWhileLocked(path) || validPreview(req.cookies.get(PREVIEW_COOKIE)?.value)) {
    return NextResponse.next()
  }

  // the shop's own calls (bag, checkout, stock…) are closed too
  if (path.startsWith('/api/')) {
    return NextResponse.json({ error: 'The house opens soon. Join the waitlist at /waitlist.' }, { status: 403 })
  }
  const url = req.nextUrl.clone()
  url.pathname = '/waitlist'
  url.search = ''
  return NextResponse.redirect(url, 307)
}

export const config = {
  // every request except Next's own files and public assets (anything with a file extension)
  matcher: ['/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)'],
}
