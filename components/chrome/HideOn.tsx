'use client'

import { usePathname } from 'next/navigation'

/** Renders children everywhere except under the given path prefix(es) (e.g. a focused checkout, the admin). */
export default function HideOn({ prefix, children }: { prefix: string | string[]; children: React.ReactNode }) {
  const pathname = usePathname()
  const prefixes = Array.isArray(prefix) ? prefix : [prefix]
  if (prefixes.some((p) => pathname.startsWith(p))) return null
  return <>{children}</>
}
