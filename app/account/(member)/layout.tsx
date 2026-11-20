import AccountNav from '@/components/account/AccountNav'
import styles from '@/components/account/Account.module.css'

/** The signed-in pages share their tabs. Each page checks the session itself. */
export default function MemberLayout({ children }: LayoutProps<'/account'>) {
  return (
    <section className={styles.page} data-header="light">
      <div className={styles.shell}>
        <AccountNav />
        {children}
      </div>
    </section>
  )
}
