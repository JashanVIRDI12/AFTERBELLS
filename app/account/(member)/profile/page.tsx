import type { Metadata } from 'next'
import { detailsOf, memberData, requireMember } from '@/lib/account'
import { getStore } from '@/lib/db'
import ProfileForm from '@/components/account/ProfileForm'
import styles from '@/components/account/Account.module.css'

export const metadata: Metadata = { title: 'Your profile', robots: { index: false } }

export default async function ProfilePage() {
  const email = await requireMember('/account/profile')
  const [{ profile, fallback }, subscribers] = await Promise.all([memberData(email), (await getStore()).listSubscribers()])

  return (
    <>
      <header className={styles.hello}>
        <p className={`t-eyebrow ${styles.kicker}`}>Your account</p>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.lead}>Your delivery details. Checkout fills them in for you.</p>
      </header>

      <section className={styles.panel}>
        <ProfileForm
          email={email}
          initial={detailsOf(profile ?? fallback)}
          fromOrder={!profile && !!fallback}
          subscribed={subscribers.some((s) => s.email.toLowerCase() === email)}
        />
      </section>
    </>
  )
}
