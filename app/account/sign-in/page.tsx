import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession, safeNext } from '@/lib/account'
import { Emblem } from '@/components/brand/Brand'
import SignInForm from '@/components/account/SignInForm'
import styles from '@/components/account/Account.module.css'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } }

export default async function SignInPage(props: PageProps<'/account/sign-in'>) {
  const sp = await props.searchParams
  const next = safeNext(typeof sp.next === 'string' ? sp.next : null)
  if (await getSession()) redirect(next)

  return (
    <section className={`${styles.page} ${styles.signPage}`} data-header="light">
      <div className={styles.card}>
        <Emblem className={styles.emblem} shine />
        <h1 className={styles.cardTitle}>Your account</h1>
        <SignInForm next={next} />
        <p className={styles.fine}>Your orders, delivery details and tracking, in one place.</p>
      </div>
    </section>
  )
}
