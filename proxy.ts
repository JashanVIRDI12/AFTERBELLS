import { NextResponse, type NextRequest } from 'next/server'
import { adminConfigured, checkAdmin } from '@/lib/admin-auth'

/** Prompts for the admin password. The admin page and export route re-check it themselves. */
export function proxy(req: NextRequest) {
  if (!adminConfigured()) return new NextResponse('Not found', { status: 404 })
  if (checkAdmin(req.headers.get('authorization'))) return NextResponse.next()
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="After Bells admin", charset="UTF-8"' },
  })
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
