'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/account/actions'
import styles from './Account.module.css'

const TABS = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/profile', label: 'Profile' },
]

export default function AccountNav() {
  const path = usePathname()
  return (
    <nav className={styles.tabs} aria-label="Your account">
      <ul>
        {TABS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className={styles.tab} aria-current={path === t.href ? 'page' : undefined}>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
      <form action={signOut}>
        <button className={styles.signOut}>Sign out</button>
      </form>
    </nav>
  )
}
